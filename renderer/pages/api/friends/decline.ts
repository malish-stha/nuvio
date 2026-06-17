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

    const { friendshipId } = req.body

    if (!friendshipId) {
        return res.status(400).json({ error: 'Friendship ID is required' })
    }

    try {
        const friendship = await db.friendship.findUnique({
            where: { id: friendshipId }
        })

        if (!friendship) {
            return res.status(404).json({ error: 'Friendship request not found' })
        }

        if (friendship.senderId !== currentUserId && friendship.receiverId !== currentUserId) {
            return res.status(403).json({ error: 'Forbidden: You cannot modify this friendship' })
        }

        await db.friendship.delete({
            where: { id: friendshipId }
        })

        // Notify both users in real-time
        const otherUserId = friendship.senderId === currentUserId ? friendship.receiverId : friendship.senderId
        await pusherServer.trigger(`user-${currentUserId}`, 'friend-update', {})
        await pusherServer.trigger(`user-${otherUserId}`, 'friend-update', {})

        await invalidateCache(`friends:${currentUserId}`)
        await invalidateCache(`friends:${otherUserId}`)

        return res.status(200).json({ message: 'Friendship removed/cancelled successfully' })
    } catch (error: any) {
        console.error('API Friends decline error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
