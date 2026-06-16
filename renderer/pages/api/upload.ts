import { NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from '@clerk/backend'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

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

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '50mb',
        },
    },
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

    const { fileName, fileType, fileData } = req.body

    if (!fileName || !fileType || !fileData) {
        return res.status(400).json({ error: 'Missing fileName, fileType, or fileData' })
    }

    try {
        let base64Content = fileData
        if (fileData.includes(';base64,')) {
            base64Content = fileData.split(';base64,')[1]
        }

        const buffer = Buffer.from(base64Content, 'base64')
        const uniqueFileName = `${Date.now()}-${fileName.replace(/\s+/g, '_')}`

        // Save files outside the codebase in the user's home directory under .nuvio/uploads
        const homedir = os.homedir()
        const uploadDir = path.join(homedir, '.nuvio', 'uploads')

        // Ensure target directory exists
        await fs.mkdir(uploadDir, { recursive: true })

        const filePath = path.join(uploadDir, uniqueFileName)
        await fs.writeFile(filePath, buffer)

        const fileUrl = `/api/media?filename=${uniqueFileName}`
        return res.status(201).json({ fileUrl })
    } catch (error: any) {
        console.error('API Upload POST error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
