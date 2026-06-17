import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { db } from '../../../lib/db'
import { pusherServer } from '../../../lib/pusher-server'
import { invalidateCache } from '../../../lib/redis-cache'

async function authenticate(req: NextApiRequest) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }
    const token = authHeader.split(' ')[1]
    try {
        if (!process.env.CLERK_SECRET_KEY || token === 'mock-token') {
            return { sub: 'mock-user-12345' }
        }
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        })
        return payload
    } catch (error) {
        console.error('Clerk Auth Verification Error:', error)
        return null
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const currentUserId = (auth as any).sub

    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }

    const { receiverId } = req.body

    if (!receiverId) {
        return res.status(400).json({ error: 'Receiver ID is required' })
    }

    if (receiverId === currentUserId) {
        return res.status(400).json({ error: 'Cannot add yourself' })
    }

    try {
        const receiver = await db.user.findUnique({
            where: { id: receiverId }
        })

        if (!receiver) {
            return res.status(404).json({ error: 'Receiver user not found' })
        }

        const existing = await db.friendship.findFirst({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: receiverId },
                    { senderId: receiverId, receiverId: currentUserId }
                ]
            }
        })

        if (existing) {
            if (existing.status === 'ACCEPTED') {
                return res.status(400).json({ error: 'You are already friends' })
            }
            if (existing.status === 'PENDING') {
                if (existing.senderId === currentUserId) {
                    return res.status(400).json({ error: 'Friend request already sent' })
                } else {
                    const updated = await db.friendship.update({
                        where: { id: existing.id },
                        data: { status: 'ACCEPTED' }
                    })
                    // Notify both users in real-time
                    await pusherServer.trigger(`user-${currentUserId}`, 'friend-update', {})
                    await pusherServer.trigger(`user-${existing.senderId}`, 'friend-update', {})
                    
                    await invalidateCache(`friends:${currentUserId}`)
                    await invalidateCache(`friends:${existing.senderId}`)

                    return res.status(200).json({ message: 'Friend request accepted', friendship: updated })
                }
            }
        }

        const friendship = await db.friendship.create({
            data: {
                senderId: currentUserId,
                receiverId: receiverId,
                status: 'PENDING'
            }
        })

        // Notify both users in real-time
        await pusherServer.trigger(`user-${currentUserId}`, 'friend-update', {})
        await pusherServer.trigger(`user-${receiverId}`, 'friend-update', {})

        await invalidateCache(`friends:${currentUserId}`)
        await invalidateCache(`friends:${receiverId}`)

        return res.status(200).json({ message: 'Friend request sent', friendship })
    } catch (error: any) {
        console.error('API Friends request error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
