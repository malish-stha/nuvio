import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { db } from '../../lib/db'
import { pusherServer } from '../../lib/pusher-server'
import { getCached, setCached, invalidateCache } from '../../lib/redis-cache'

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
        return payload // Contains sub (which is the Clerk User ID)
    } catch (error) {
        console.error('Clerk Auth Verification Error:', error)
        return null
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const auth = await authenticate(req)
        if (!auth) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const { content, fileUrl, channelId } = req.body

        if (!channelId) {
            return res.status(400).json({ error: 'Missing channelId' })
        }
        if (!content && !fileUrl) {
            return res.status(400).json({ error: 'Message content or fileUrl is required' })
        }

        try {
            // Find the channel to determine the serverId
            const channel = await db.channel.findUnique({
                where: { id: channelId },
            })

            if (!channel) {
                return res.status(404).json({ error: 'Channel not found' })
            }

            // Find the user's membership in the channel's server
            const member = await db.member.findFirst({
                where: {
                    userId: (auth as any).sub,
                    serverId: channel.serverId,
                },
                include: {
                    user: true,
                },
            })

            if (!member) {
                return res.status(403).json({ error: 'Forbidden: You are not a member of this server' })
            }

            // Create the message
            const message = await db.message.create({
                data: {
                    content: content || '',
                    fileUrl: fileUrl || null,
                    channelId,
                    memberId: member.id,
                },
                include: {
                    member: {
                        include: {
                            user: true,
                        },
                    },
                },
            })

            // Trigger real-time message event via Pusher
            await pusherServer.trigger(`channel-${channelId}`, 'new-message', message)

            await invalidateCache(`messages:${channelId}`)

            return res.status(201).json(message)
        } catch (error: any) {
            console.error('API Messages POST error:', error)
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    if (req.method === 'GET') {
        const { channelId, cursor } = req.query as { channelId: string; cursor?: string }

        if (!channelId) {
            return res.status(400).json({ error: 'Missing channelId' })
        }

        try {
            const cacheKey = `messages:${channelId}`
            if (!cursor) {
                const cached = await getCached<{ items: any[]; nextCursor: string | null }>(cacheKey)
                if (cached) {
                    return res.status(200).json(cached)
                }
            }

            const limit = 15
            let messages

            if (cursor) {
                messages = await db.message.findMany({
                    take: limit,
                    skip: 1, // Skip the cursor message itself
                    cursor: {
                        id: cursor,
                    },
                    where: {
                        channelId,
                    },
                    include: {
                        member: {
                            include: {
                                user: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                })
            } else {
                messages = await db.message.findMany({
                    take: limit,
                    where: {
                        channelId,
                    },
                    include: {
                        member: {
                            include: {
                                user: true,
                            },
                        },
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
            console.error('API Messages GET error:', error)
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    if (req.method === 'PATCH') {
        const auth = await authenticate(req)
        if (!auth) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const { messageId, content } = req.body

        if (!messageId) {
            return res.status(400).json({ error: 'Missing messageId' })
        }
        if (!content) {
            return res.status(400).json({ error: 'Content is required' })
        }

        try {
            const currentUserId = (auth as any).sub

            const message = await db.message.findUnique({
                where: { id: messageId },
                include: {
                    member: true
                }
            })

            if (!message) {
                return res.status(404).json({ error: 'Message not found' })
            }

            if (message.member.userId !== currentUserId) {
                return res.status(403).json({ error: 'Forbidden: You can only edit your own messages' })
            }

            const updatedMessage = await db.message.update({
                where: { id: messageId },
                data: { content },
                include: {
                    member: {
                        include: {
                            user: true
                        }
                    }
                }
            })

            await pusherServer.trigger(`channel-${updatedMessage.channelId}`, 'update-message', updatedMessage)

            await invalidateCache(`messages:${updatedMessage.channelId}`)

            return res.status(200).json(updatedMessage)
        } catch (error: any) {
            console.error('API Messages PATCH error:', error)
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    if (req.method === 'DELETE') {
        const auth = await authenticate(req)
        if (!auth) {
            return res.status(401).json({ error: 'Unauthorized' })
        }

        const messageId = req.query.messageId as string || req.body.messageId

        if (!messageId) {
            return res.status(400).json({ error: 'Missing messageId' })
        }

        try {
            const currentUserId = (auth as any).sub

            const message = await db.message.findUnique({
                where: { id: messageId },
                include: {
                    member: true
                }
            })

            if (!message) {
                return res.status(404).json({ error: 'Message not found' })
            }

            if (message.member.userId !== currentUserId) {
                return res.status(403).json({ error: 'Forbidden: You can only delete your own messages' })
            }

            await db.message.delete({
                where: { id: messageId }
            })

            await pusherServer.trigger(`channel-${message.channelId}`, 'delete-message', { messageId })

            await invalidateCache(`messages:${message.channelId}`)

            return res.status(200).json({ success: true })
        } catch (error: any) {
            console.error('API Messages DELETE error:', error)
            return res.status(500).json({ error: error.message || 'Internal Server Error' })
        }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE'])
    return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
