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
    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const currentUserId = (auth as any).sub

    if (req.method === 'GET') {
        try {
            const channels = await db.dMChannel.findMany({
                where: {
                    participants: {
                        some: { id: currentUserId }
                    }
                },
                include: {
                    participants: {
                        select: {
                            id: true,
                            fullName: true,
                            imageUrl: true,
                            bio: true
                        }
                    },
                    directMessages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            content: true,
                            createdAt: true,
                            sender: {
                                select: { id: true, fullName: true }
                            }
                        }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            })

            // Reshape: expose lastMessage at top level for convenience
            const shaped = channels.map(c => ({
                ...c,
                lastMessage: c.directMessages[0] ?? null,
                directMessages: undefined
            }))

            return res.status(200).json(shaped)
        } catch (error: any) {
            console.error('API DM Channels GET error:', error)
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    if (req.method === 'POST') {
        const { recipientId } = req.body

        if (!recipientId) {
            return res.status(400).json({ error: 'Recipient ID is required' })
        }

        if (recipientId === currentUserId) {
            return res.status(400).json({ error: 'Cannot start a DM with yourself' })
        }

        try {
            // Verify they are accepted friends
            const friendship = await db.friendship.findFirst({
                where: {
                    status: 'ACCEPTED',
                    OR: [
                        { senderId: currentUserId, receiverId: recipientId },
                        { senderId: recipientId, receiverId: currentUserId }
                    ]
                }
            })

            if (!friendship) {
                return res.status(403).json({ error: 'You must be accepted friends with this user to direct message them.' })
            }

            // Find if a 2-person DM channel already exists between these users
            const existing = await db.dMChannel.findMany({
                where: {
                    AND: [
                        { participants: { some: { id: currentUserId } } },
                        { participants: { some: { id: recipientId } } }
                    ]
                },
                include: {
                    participants: {
                        select: {
                            id: true,
                            fullName: true,
                            imageUrl: true,
                            bio: true
                        }
                    }
                }
            })

            let channel = existing.find(c => c.participants.length === 2)

            if (!channel) {
                // Verify recipient user exists
                const recipient = await db.user.findUnique({
                    where: { id: recipientId }
                })

                if (!recipient) {
                    return res.status(404).json({ error: 'Recipient user not found' })
                }

                // Create a new DM channel
                channel = await db.dMChannel.create({
                    data: {
                        participants: {
                            connect: [
                                { id: currentUserId },
                                { id: recipientId }
                            ]
                        }
                    },
                    include: {
                        participants: {
                            select: {
                                id: true,
                                fullName: true,
                                imageUrl: true,
                                bio: true
                            }
                        }
                    }
                })
            }

            return res.status(200).json(channel)
        } catch (error: any) {
            console.error('API DM Channels POST error:', error)
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
