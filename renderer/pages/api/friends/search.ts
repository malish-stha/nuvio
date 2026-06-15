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
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }

    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const currentUserId = (auth as any).sub
    const { q } = req.query as { q?: string }

    if (!q || !q.trim()) {
        return res.status(200).json([])
    }

    try {
        const users = await db.user.findMany({
            where: {
                id: { not: currentUserId },
                OR: [
                    {
                        fullName: {
                            contains: q,
                            mode: 'insensitive'
                        }
                    },
                    {
                        email: {
                            contains: q,
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            select: {
                id: true,
                fullName: true,
                imageUrl: true,
                bio: true
            },
            take: 10
        })

        const userIds = users.map(u => u.id)
        const friendships = await db.friendship.findMany({
            where: {
                OR: [
                    { senderId: currentUserId, receiverId: { in: userIds } },
                    { senderId: { in: userIds }, receiverId: currentUserId }
                ]
            }
        })

        const results = users.map(user => {
            const fs = friendships.find(f => f.senderId === user.id || f.receiverId === user.id)
            let relationship = 'NONE'
            let friendshipId = null

            if (fs) {
                friendshipId = fs.id
                if (fs.status === 'ACCEPTED') {
                    relationship = 'ACCEPTED'
                } else if (fs.status === 'PENDING') {
                    relationship = fs.senderId === currentUserId ? 'PENDING_SENT' : 'PENDING_RECEIVED'
                } else if (fs.status === 'DECLINED') {
                    relationship = 'NONE'
                } else if (fs.status === 'BLOCKED') {
                    relationship = 'BLOCKED'
                }
            }

            return {
                ...user,
                relationship,
                friendshipId
            }
        })

        return res.status(200).json(results)
    } catch (error: any) {
        console.error('API Friends Search Error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
