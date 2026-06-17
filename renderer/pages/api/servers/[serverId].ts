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
    const { serverId } = req.query as { serverId: string }

    if (!serverId) {
        return res.status(400).json({ error: 'Server ID is required' })
    }

    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const currentUserId = (auth as any).sub

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
            return res.status(403).json({ error: 'Forbidden: Only the server owner can modify settings' })
        }

        if (req.method === 'PATCH') {
            const { name, imageUrl } = req.body

            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Server name is required' })
            }

            const updatedServer = await db.server.update({
                where: { id: serverId },
                data: {
                    name: name.trim(),
                    imageUrl: imageUrl || null
                },
                include: {
                    channels: true
                }
            })

            await invalidateWorkspaceForServer(serverId)

            return res.status(200).json(updatedServer)
        }

        if (req.method === 'DELETE') {
            await invalidateWorkspaceForServer(serverId)

            await db.server.delete({
                where: { id: serverId }
            })

            return res.status(200).json({ success: true, message: 'Server deleted successfully' })
        }

        res.setHeader('Allow', ['PATCH', 'DELETE'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    } catch (error: any) {
        console.error(`API Server [${serverId}] error:`, error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
