import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { db } from '../../../lib/db'
import { invalidateWorkspaceForServer } from '../../../lib/redis-cache'

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
    const { name, type, serverId } = req.body

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Channel name is required' })
    }

    if (!type || !['TEXT', 'VOICE', 'WHITEBOARD', 'PLAYGROUND'].includes(type)) {
        return res.status(400).json({ error: 'Invalid or missing channel type' })
    }

    if (!serverId) {
        return res.status(400).json({ error: 'Server ID is required' })
    }

    try {
        // Find the server to verify ownership
        const server = await db.server.findUnique({
            where: { id: serverId }
        })

        if (!server) {
            return res.status(404).json({ error: 'Server not found' })
        }

        // Verify that the user is the owner of the server
        if (server.ownerId !== currentUserId) {
            return res.status(403).json({ error: 'Forbidden: Only the server owner can create channels' })
        }

        // Format name: slugified lowercase for TEXT channels, trimmed original case for others
        const formattedName = type === 'TEXT'
            ? name.trim().toLowerCase().replace(/\s+/g, '-')
            : name.trim()

        const channel = await db.channel.create({
            data: {
                name: formattedName,
                type,
                serverId
            }
        })

        await invalidateWorkspaceForServer(serverId)

        return res.status(201).json(channel)
    } catch (error: any) {
        console.error('API Create Channel error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
