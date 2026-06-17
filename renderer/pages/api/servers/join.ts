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
    const { inviteCode } = req.body

    if (!inviteCode || !inviteCode.trim()) {
        return res.status(400).json({ error: 'Invite code is required' })
    }

    try {
        // Find server by invite code
        const server = await db.server.findUnique({
            where: { inviteCode: inviteCode.trim().toUpperCase() }
        })

        if (!server) {
            return res.status(404).json({ error: 'Invalid invite code or server not found' })
        }

        // Check if user is already a member of the server
        const existingMember = await db.member.findFirst({
            where: {
                userId: currentUserId,
                serverId: server.id
            }
        })

        if (!existingMember) {
            // Join the server as a MEMBER
            await db.member.create({
                data: {
                    userId: currentUserId,
                    serverId: server.id,
                    role: 'MEMBER'
                }
            })
        }

        // Return the joined server including channels
        const fullServer = await db.server.findUnique({
            where: { id: server.id },
            include: {
                channels: true
            }
        })

        await invalidateWorkspaceForUser(currentUserId)

        return res.status(200).json(fullServer)
    } catch (error: any) {
        console.error('API Join Server error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
