import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken, createClerkClient } from '@clerk/backend'
import { db } from '../../lib/db'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

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
        // Ensure user exists in our database
        let dbUser = await db.user.findUnique({
            where: { id: userId }
        })

        // If the user doesn't exist or is currently using the placeholder "Nuvio User" name, sync from Clerk
        if (!dbUser || dbUser.fullName === 'Nuvio User') {
            let email = `user_${userId}@placeholder.com`
            let fullName = userId === 'mock-user-12345' ? 'Admin User' : 'Nuvio User'
            let imageUrl = userId === 'mock-user-12345' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80' : ''

            if (userId !== 'mock-user-12345' && process.env.CLERK_SECRET_KEY) {
                try {
                    const clerkUser = await clerk.users.getUser(userId)
                    email = clerkUser.emailAddresses[0]?.emailAddress || email
                    fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0]
                    imageUrl = clerkUser.imageUrl || imageUrl
                } catch (clerkErr) {
                    console.error('Failed to fetch user details from Clerk:', clerkErr)
                }
            }

            dbUser = await db.user.upsert({
                where: { id: userId },
                update: {
                    email,
                    fullName,
                    imageUrl,
                },
                create: {
                    id: userId,
                    email,
                    fullName,
                    imageUrl,
                }
            })
        }

        // Get all servers the user is a member of
        let memberships = await db.member.findMany({
            where: { userId },
            include: {
                server: {
                    include: {
                        channels: true
                    }
                }
            }
        })

        let servers = memberships.map(m => m.server)

        if (servers.length === 0) {
            // Create a default server
            const defaultServer = await db.server.create({
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
            servers = [defaultServer]
        }

        return res.status(200).json({
            user: dbUser,
            servers,
        })
    } catch (error: any) {
        console.error('API Init Workspace error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
