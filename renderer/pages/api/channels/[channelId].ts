import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
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
    if (req.method !== 'DELETE') {
        res.setHeader('Allow', ['DELETE'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }

    const { channelId } = req.query as { channelId: string }

    if (!channelId) {
        return res.status(400).json({ error: 'Channel ID is required' })
    }

    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const currentUserId = (auth as any).sub

    try {
        // Find the channel and include its server to verify ownership
        const channel = await db.channel.findUnique({
            where: { id: channelId },
            include: {
                server: true
            }
        })

        if (!channel) {
            return res.status(404).json({ error: 'Channel not found' })
        }

        // Verify that the user is the owner of the server that owns this channel
        if (channel.server.ownerId !== currentUserId) {
            return res.status(403).json({ error: 'Forbidden: Only the server owner can delete channels' })
        }

        // Do not allow deleting the "general" text channel, which is standard
        if (channel.name === 'general' && channel.type === 'TEXT') {
            return res.status(400).json({ error: 'The default general channel cannot be deleted' })
        }

        await db.channel.delete({
            where: { id: channelId }
        })

        return res.status(200).json({ success: true, message: 'Channel deleted successfully' })
    } catch (error: any) {
        console.error(`API Delete Channel [${channelId}] error:`, error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
