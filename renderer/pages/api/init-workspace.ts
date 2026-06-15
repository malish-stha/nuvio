import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { db } from '../../lib/db'

// Helper to authenticate request using Authorization header token
async function authenticate(req: NextApiRequest) {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null
    }
    const token = authHeader.split(' ')[1]
    try {
        // Fallback for developer mock testing when Clerk keys are not configured
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
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }

    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = (auth as any).sub

    try {
        // Ensure user exists in our database (fallback if webhook hasn't run)
        let dbUser = await db.user.findUnique({
            where: { id: userId }
        })

        if (!dbUser) {
            dbUser = await db.user.create({
                data: {
                    id: userId,
                    email: userId === 'mock-user-12345' ? 'admin@nuvio.dev' : `user_${userId}@placeholder.com`,
                    fullName: userId === 'mock-user-12345' ? 'Admin User' : 'Nuvio User',
                    imageUrl: userId === 'mock-user-12345' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80' : '',
                }
            })
        }

        // Check if there are any servers for this user
        let member = await db.member.findFirst({
            where: { userId },
            include: {
                server: {
                    include: {
                        channels: true
                    }
                }
            }
        })

        let server
        if (!member) {
            // Create a default server
            server = await db.server.create({
                data: {
                    name: 'Nuvio Server',
                    inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
                    ownerId: userId,
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
                                userId,
                                role: 'OWNER'
                            }
                        ]
                    }
                },
                include: {
                    channels: true
                }
            })
        } else {
            server = member.server
        }

        return res.status(200).json({
            server,
            channels: server.channels,
        })
    } catch (error: any) {
        console.error('API Init Workspace error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
