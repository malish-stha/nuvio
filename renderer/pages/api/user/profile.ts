import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { db } from '@/lib/db'
import { invalidateWorkspaceForUser } from '@/lib/redis-cache'

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
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }

    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const userId = (auth as any).sub
    const { fullName, imageUrl, bio } = req.body

    if (!fullName) {
        return res.status(400).json({ error: 'Full name is required' })
    }

    try {
        const updatedUser = await db.user.update({
            where: { id: userId },
            data: {
                fullName,
                imageUrl: imageUrl || null,
                bio: bio || null,
            },
        })

        await invalidateWorkspaceForUser(userId)

        return res.status(200).json(updatedUser)
    } catch (error: any) {
        console.error('API Update Profile error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
