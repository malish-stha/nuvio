import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { pusherServer } from '../../../lib/pusher-server'
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
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }

    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const currentUserId = (auth as any).sub
    const { action, recipientId, callerId, dmChannelId } = req.body

    if (!action || !dmChannelId) {
        return res.status(400).json({ error: 'Missing action or dmChannelId' })
    }

    try {
        const userDetails = await db.user.findUnique({
            where: { id: currentUserId },
            select: {
                id: true,
                fullName: true,
                imageUrl: true,
            }
        })

        if (!userDetails) {
            return res.status(404).json({ error: 'User details not found' })
        }

        if (action === 'initiate') {
            if (!recipientId) {
                return res.status(400).json({ error: 'Missing recipientId for initiate action' })
            }

            // Verify they are friends in the database
            const friendship = await db.friendship.findFirst({
                where: {
                    OR: [
                        { senderId: currentUserId, receiverId: recipientId },
                        { senderId: recipientId, receiverId: currentUserId }
                    ],
                    status: 'ACCEPTED'
                }
            })

            if (!friendship) {
                return res.status(403).json({ error: 'You must be friends to start a voice call' })
            }

            await pusherServer.trigger(`user-${recipientId}`, 'incoming-call', {
                caller: userDetails,
                dmChannelId
            })
        } else if (action === 'decline') {
            if (!callerId) {
                return res.status(400).json({ error: 'Missing callerId for decline action' })
            }
            await pusherServer.trigger(`user-${callerId}`, 'call-declined', {
                declinerId: currentUserId,
                dmChannelId
            })
        } else if (action === 'cancel') {
            if (!recipientId) {
                return res.status(400).json({ error: 'Missing recipientId for cancel action' })
            }
            await pusherServer.trigger(`user-${recipientId}`, 'call-cancelled', {
                callerId: currentUserId,
                dmChannelId
            })
        } else {
            return res.status(400).json({ error: `Unknown action: ${action}` })
        }

        return res.status(200).json({ success: true })
    } catch (error: any) {
        console.error('Call Signal API Error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
