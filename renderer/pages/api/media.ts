import { NextApiRequest, NextApiResponse } from 'next'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({ error: `Method ${req.method} not allowed` })
    }

    const { filename } = req.query

    if (!filename || typeof filename !== 'string') {
        return res.status(400).json({ error: 'Missing filename query parameter' })
    }

    // Prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename)
    if (sanitizedFilename !== filename) {
        return res.status(400).json({ error: 'Invalid filename parameter' })
    }

    try {
        const homedir = os.homedir()
        const filePath = path.join(homedir, '.nuvio', 'uploads', sanitizedFilename)

        try {
            await fs.access(filePath)
        } catch {
            return res.status(404).json({ error: 'File not found' })
        }

        const buffer = await fs.readFile(filePath)

        // Resolve common content types
        const ext = path.extname(sanitizedFilename).toLowerCase()
        let contentType = 'application/octet-stream'
        if (ext === '.png') contentType = 'image/png'
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
        else if (ext === '.gif') contentType = 'image/gif'
        else if (ext === '.webp') contentType = 'image/webp'
        else if (ext === '.mp4') contentType = 'video/mp4'
        else if (ext === '.webm') contentType = 'video/webm'
        else if (ext === '.ogg') contentType = 'video/ogg'
        else if (ext === '.mov') contentType = 'video/quicktime'
        else if (ext === '.pdf') contentType = 'application/pdf'
        else if (ext === '.txt') contentType = 'text/plain'

        res.setHeader('Content-Type', contentType)
        // Add cache headers for better performance
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        
        return res.send(buffer)
    } catch (error: any) {
        console.error('API Media GET error:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}
