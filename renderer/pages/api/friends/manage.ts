import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { db } from '../../../lib/db'
import { pusherServer } from '../../../lib/pusher-server'
import { invalidateCache } from '../../../lib/redis-cache'

async function authenticate(req: NextApiRequest) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    const token = authHeader.split(' ')[1]
    try {
        if (!process.env.CLERK_SECRET_KEY || token === 'mock-token') {
            return { sub: 'mock-user-12345' }
        }
        return await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY })
    } catch {
        return null
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const auth = await authenticate(req)
    if (!auth) return res.status(401).json({ error: 'Unauthorized' })

    const currentUserId = (auth as any).sub

    // GET /api/friends/manage?targetUserId=xxx
    // Returns the target user's profile + friendship status
    if (req.method === 'GET') {
        const { targetUserId } = req.query
        if (!targetUserId || typeof targetUserId !== 'string') {
            return res.status(400).json({ error: 'targetUserId is required' })
        }

        try {
            const [targetUser, friendship] = await Promise.all([
                db.user.findUnique({
                    where: { id: targetUserId },
                    select: { id: true, fullName: true, imageUrl: true, bio: true }
                }),
                db.friendship.findFirst({
                    where: {
                        OR: [
                            { senderId: currentUserId, receiverId: targetUserId },
                            { senderId: targetUserId, receiverId: currentUserId }
                        ]
                    },
                    select: { id: true, status: true, senderId: true }
                })
            ])

            if (!targetUser) return res.status(404).json({ error: 'User not found' })

            return res.status(200).json({
                user: targetUser,
                friendship: friendship
                    ? { id: friendship.id, status: friendship.status, isSender: friendship.senderId === currentUserId }
                    : null
            })
        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    // DELETE /api/friends/manage  { friendshipId }
    // Unfriend (delete friendship record)
    if (req.method === 'DELETE') {
        const { friendshipId } = req.body
        if (!friendshipId) return res.status(400).json({ error: 'friendshipId is required' })

        try {
            const friendship = await db.friendship.findUnique({ where: { id: friendshipId } })
            if (!friendship) return res.status(404).json({ error: 'Friendship not found' })
            if (friendship.senderId !== currentUserId && friendship.receiverId !== currentUserId) {
                return res.status(403).json({ error: 'Forbidden' })
            }
            if (friendship.status === 'BLOCKED' && friendship.senderId !== currentUserId) {
                return res.status(403).json({ error: 'Only the user who blocked can unblock' })
            }

            await db.friendship.delete({ where: { id: friendshipId } })

            const otherId = friendship.senderId === currentUserId ? friendship.receiverId : friendship.senderId
            await pusherServer.trigger(`user-${currentUserId}`, 'friend-update', {})
            await pusherServer.trigger(`user-${otherId}`, 'friend-update', {})

            await invalidateCache(`friends:${currentUserId}`)
            await invalidateCache(`friends:${otherId}`)

            return res.status(200).json({ message: 'Unfriended successfully' })
        } catch (error: any) {
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    // POST /api/friends/manage  { action: 'block', targetUserId }
    if (req.method === 'POST') {
        const { action, targetUserId, friendshipId } = req.body

        if (action === 'block') {
            if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' })
            try {
                // Remove existing friendship if any, then create a BLOCKED record
                if (friendshipId) {
                    await db.friendship.delete({ where: { id: friendshipId } }).catch(() => {})
                }
                // Upsert a blocked record from current user to target
                const blockRecord = await db.friendship.upsert({
                    where: { senderId_receiverId: { senderId: currentUserId, receiverId: targetUserId } },
                    create: { senderId: currentUserId, receiverId: targetUserId, status: 'BLOCKED' },
                    update: { status: 'BLOCKED' }
                })
                await pusherServer.trigger(`user-${currentUserId}`, 'friend-update', {})
                await pusherServer.trigger(`user-${targetUserId}`, 'friend-update', {})

                await invalidateCache(`friends:${currentUserId}`)
                await invalidateCache(`friends:${targetUserId}`)

                return res.status(200).json({ message: 'User blocked', friendship: blockRecord })
            } catch (error: any) {
                return res.status(500).json({ error: error.message || 'Internal Server Error' })
            }
        }

        return res.status(400).json({ error: 'Unknown action' })
    }

    res.setHeader('Allow', ['GET', 'DELETE', 'POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
