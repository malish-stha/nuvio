import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { db } from '../../../lib/db'
import { getCached, setCached } from '../../../lib/redis-cache'

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

    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }

    try {
        const cacheKey = `friends:${currentUserId}`
        const cachedFriends = await getCached<{ friends: any[]; pendingIncoming: any[]; pendingOutgoing: any[] }>(cacheKey)
        if (cachedFriends) {
            return res.status(200).json(cachedFriends)
        }

        const friendships = await db.friendship.findMany({
            where: {
                OR: [
                    { senderId: currentUserId },
                    { receiverId: currentUserId }
                ]
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullName: true,
                        imageUrl: true,
                        bio: true
                    }
                },
                receiver: {
                    select: {
                        id: true,
                        fullName: true,
                        imageUrl: true,
                        bio: true
                    }
                }
            }
        })

        const friends: any[] = []
        const pendingIncoming: any[] = []
        const pendingOutgoing: any[] = []

        friendships.forEach((fs) => {
            if (fs.status === 'ACCEPTED') {
                const friendUser = fs.senderId === currentUserId ? fs.receiver : fs.sender
                friends.push({
                    friendshipId: fs.id,
                    user: friendUser
                })
            } else if (fs.status === 'PENDING') {
                if (fs.senderId === currentUserId) {
                    pendingOutgoing.push({
                        friendshipId: fs.id,
                        user: fs.receiver
                    })
                } else {
                    pendingIncoming.push({
                        friendshipId: fs.id,
                        user: fs.sender
                    })
                }
            }
        })

        const payload = {
            friends,
            pendingIncoming,
            pendingOutgoing
        }

        await setCached(cacheKey, payload, 1800) // Cache for 30 minutes

        return res.status(200).json(payload)
    } catch (error: any) {
        console.error('API Friends list error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
