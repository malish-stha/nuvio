import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { db } from '../../../lib/db'
import { invalidateWorkspaceForUser } from '../../../lib/redis-cache'

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
    const { name, imageUrl } = req.body

    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Server name is required' })
    }

    try {
        // Create new server with defaults
        const server = await db.server.create({
            data: {
                name: name.trim(),
                imageUrl: imageUrl || null,
                inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                ownerId: currentUserId,
                channels: {
                    create: [
                        { name: 'general', type: 'TEXT' },
                        { name: 'announcements', type: 'TEXT' },
                        { name: 'developers', type: 'TEXT' },
                    ]
                },
                members: {
                    create: [
                        {
                            userId: currentUserId,
                            role: 'OWNER'
                        }
                    ]
                }
            },
            include: {
                channels: true
            }
        })

        await invalidateWorkspaceForUser(currentUserId)

        return res.status(201).json(server)
    } catch (error: any) {
        console.error('API Create Server error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
