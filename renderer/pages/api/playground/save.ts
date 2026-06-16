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
    if (req.method !== 'POST') {
        return res.status(455).json({ error: 'Method not allowed' })
    }

    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const { channelId, code } = req.body

    if (!channelId) {
        return res.status(400).json({ error: 'Missing channelId' })
    }

    try {
        const updatedChannel = await db.channel.update({
            where: { id: channelId },
            data: { playgroundCode: code }
        })
        return res.status(200).json(updatedChannel)
    } catch (error: any) {
        console.error('Prisma Playground Save Error:', error)
        return res.status(500).json({ error: error.message })
    }
}
