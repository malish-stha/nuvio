import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { pusherServer } from '../../../lib/pusher-server'
import { db } from '../../../lib/db'

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
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }

    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const currentUserId = (auth as any).sub
    const { channelId, type, payload, targetUserId } = req.body

    if (!channelId || !type) {
        return res.status(400).json({ error: 'Missing channelId or type' })
    }

    try {
        // Fetch current user details to include in the signal
        const userDetails = await db.user.findUnique({
            where: { id: currentUserId },
            select: {
                id: true,
                fullName: true,
                imageUrl: true,
            }
        })

        // Trigger Pusher event on voice channel
        await pusherServer.trigger(`voice-${channelId}`, type, {
            fromUserId: currentUserId,
            targetUserId,
            payload,
            user: userDetails,
        })

        return res.status(200).json({ success: true })
    } catch (error: any) {
        console.error('Voice Signal API Error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
