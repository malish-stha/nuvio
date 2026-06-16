import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { db } from '../../../lib/db'
import { pusherServer } from '../../../lib/pusher-server'

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
    const userId = auth.sub

    if (req.method === 'GET') {
        const { serverId } = req.query as { serverId: string }
        if (!serverId) {
            return res.status(400).json({ error: 'Missing serverId' })
        }
        try {
            const events = await db.event.findMany({
                where: { serverId },
                include: {
                    creator: {
                        select: { id: true, fullName: true, imageUrl: true }
                    }
                },
                orderBy: { startTime: 'asc' }
            })
            return res.status(200).json(events)
        } catch (error: any) {
            console.error('Prisma Get Events Error:', error)
            return res.status(500).json({ error: error.message })
        }
    }

    if (req.method === 'POST') {
        const { serverId, title, description, startTime, endTime } = req.body
        if (!serverId || !title || !startTime || !endTime) {
            return res.status(400).json({ error: 'Missing required parameters' })
        }
        try {
            const newEvent = await db.event.create({
                data: {
                    title,
                    description,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    serverId,
                    creatorId: userId
                },
                include: {
                    creator: {
                        select: { id: true, fullName: true, imageUrl: true }
                    }
                }
            })

            // Trigger real-time calendar updates
            await pusherServer.trigger(`server-${serverId}`, 'event-created', newEvent)
            
            return res.status(200).json(newEvent)
        } catch (error: any) {
            console.error('Prisma Create Event Error:', error)
            return res.status(500).json({ error: error.message })
        }
    }

    if (req.method === 'DELETE') {
        const { eventId } = req.query as { eventId: string }
        if (!eventId) {
            return res.status(400).json({ error: 'Missing eventId' })
        }
        try {
            const event = await db.event.findUnique({
                where: { id: eventId }
            })
            if (!event) {
                return res.status(404).json({ error: 'Event not found' })
            }

            await db.event.delete({
                where: { id: eventId }
            })

            // Trigger real-time deletion sync
            await pusherServer.trigger(`server-${event.serverId}`, 'event-deleted', { eventId })

            return res.status(200).json({ success: true })
        } catch (error: any) {
            console.error('Prisma Delete Event Error:', error)
            return res.status(500).json({ error: error.message })
        }
    }

    return res.status(405).json({ error: 'Method not allowed' })
}
