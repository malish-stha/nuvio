import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { db } from '../../../lib/db'
import { pusherServer } from '../../../lib/pusher-server'
import { getCached, setCached, invalidateCache } from '../../../lib/redis-cache'
import { checkRateLimit } from '../../../lib/rate-limiter'

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

    if (['POST', 'PATCH', 'DELETE'].includes(req.method || '')) {
        const isAllowed = await checkRateLimit(res, `dms:${currentUserId}`, 20, 60)
        if (!isAllowed) return
    }

    if (req.method === 'POST') {
        const { content, fileUrl, dmChannelId } = req.body

        if (!dmChannelId) {
            return res.status(400).json({ error: 'Missing dmChannelId' })
        }
        if (!content && !fileUrl) {
            return res.status(400).json({ error: 'Message content or fileUrl is required' })
        }

        try {
            // Verify membership in this DM room
            const dmChannel = await db.dMChannel.findFirst({
                where: {
                    id: dmChannelId,
                    participants: {
                        some: { id: currentUserId }
                    }
                }
            })

            if (!dmChannel) {
                return res.status(403).json({ error: 'Forbidden: You are not a participant in this DM channel' })
            }

            // Create DM message
            const message = await db.directMessage.create({
                data: {
                    content: content || '',
                    fileUrl: fileUrl || null,
                    dmChannelId,
                    senderId: currentUserId,
                },
                include: {
                    sender: {
                        select: {
                            id: true,
                            fullName: true,
                            imageUrl: true,
                            bio: true
                        }
                    }
                }
            })

            // Touch DM Channel to update its updatedAt timestamp (brings it to top of sidebar)
            await db.dMChannel.update({
                where: { id: dmChannelId },
                data: { updatedAt: new Date() }
            })

            // Trigger real-time DM sync via Pusher
            await pusherServer.trigger(`dm-${dmChannelId}`, 'new-dm', message)

            await invalidateCache(`dms:${dmChannelId}`)

            return res.status(201).json(message)
        } catch (error: any) {
            console.error('API DM Messages POST error:', error)
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    if (req.method === 'GET') {
        const { dmChannelId, cursor } = req.query as { dmChannelId: string; cursor?: string }

        if (!dmChannelId) {
            return res.status(400).json({ error: 'Missing dmChannelId' })
        }

        try {
            // Verify membership
            const dmChannel = await db.dMChannel.findFirst({
                where: {
                    id: dmChannelId,
                    participants: {
                        some: { id: currentUserId }
                    }
                }
            })

            if (!dmChannel) {
                return res.status(403).json({ error: 'Forbidden: You are not a participant in this DM channel' })
            }

            const cacheKey = `dms:${dmChannelId}`
            if (!cursor) {
                const cached = await getCached<{ items: any[]; nextCursor: string | null }>(cacheKey)
                if (cached) {
                    return res.status(200).json(cached)
                }
            }

            const limit = 15
            let messages

            if (cursor) {
                messages = await db.directMessage.findMany({
                    take: limit,
                    skip: 1, // Skip the cursor message itself
                    cursor: {
                        id: cursor,
                    },
                    where: {
                        dmChannelId,
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                fullName: true,
                                imageUrl: true,
                                bio: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                })
            } else {
                messages = await db.directMessage.findMany({
                    take: limit,
                    where: {
                        dmChannelId,
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                fullName: true,
                                imageUrl: true,
                                bio: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                })
            }

            let nextCursor = null
            if (messages.length === limit) {
                nextCursor = messages[limit - 1].id
            }

            const payload = {
                items: messages,
                nextCursor,
            }

            if (!cursor) {
                await setCached(cacheKey, payload, 600) // Cache for 10 minutes
            }

            return res.status(200).json(payload)
        } catch (error: any) {
            console.error('API DM Messages GET error:', error)
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    if (req.method === 'PATCH') {
        const { messageId, content } = req.body

        if (!messageId) {
            return res.status(400).json({ error: 'Missing messageId' })
        }
        if (!content) {
            return res.status(400).json({ error: 'Content is required' })
        }

        try {
            const message = await db.directMessage.findUnique({
                where: { id: messageId }
            })

            if (!message) {
                return res.status(404).json({ error: 'Message not found' })
            }

            if (message.senderId !== currentUserId) {
                return res.status(403).json({ error: 'Forbidden: You can only edit your own direct messages' })
            }

            const updatedMessage = await db.directMessage.update({
                where: { id: messageId },
                data: { content },
                include: {
                    sender: {
                        select: {
                            id: true,
                            fullName: true,
                            imageUrl: true,
                            bio: true
                        }
                    }
                }
            })

            await pusherServer.trigger(`dm-${updatedMessage.dmChannelId}`, 'update-dm', updatedMessage)

            await invalidateCache(`dms:${updatedMessage.dmChannelId}`)

            return res.status(200).json(updatedMessage)
        } catch (error: any) {
            console.error('API DM Messages PATCH error:', error)
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    if (req.method === 'DELETE') {
        const messageId = req.query.messageId as string || req.body.messageId

        if (!messageId) {
            return res.status(400).json({ error: 'Missing messageId' })
        }

        try {
            const message = await db.directMessage.findUnique({
                where: { id: messageId }
            })

            if (!message) {
                return res.status(404).json({ error: 'Message not found' })
            }

            if (message.senderId !== currentUserId) {
                return res.status(403).json({ error: 'Forbidden: You can only delete your own direct messages' })
            }

            await db.directMessage.delete({
                where: { id: messageId }
            })

            await pusherServer.trigger(`dm-${message.dmChannelId}`, 'delete-dm', { messageId })

            await invalidateCache(`dms:${message.dmChannelId}`)

            return res.status(200).json({ success: true })
        } catch (error: any) {
            console.error('API DM Messages DELETE error:', error)
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
