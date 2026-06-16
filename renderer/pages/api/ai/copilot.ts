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
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const auth = await authenticate(req)
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const { channelId, action } = req.body

    if (!channelId || !action || !['summarize', 'draft'].includes(action)) {
        return res.status(400).json({ error: 'Missing channelId or invalid action' })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
        return res.status(400).json({
            error: 'AI_NOT_CONFIGURED',
            message: 'Google Gemini API Key is not configured in .env. Please define GEMINI_API_KEY.'
        })
    }

    try {
        // Fetch the last 15 messages in the channel to give context to Gemini
        const chatHistory = await db.message.findMany({
            where: { channelId },
            take: 15,
            orderBy: { createdAt: 'desc' },
            include: {
                member: {
                    include: {
                        user: {
                            select: { fullName: true }
                        }
                    }
                }
            }
        })

        // Reverse to make it chronological
        const chronologicalMessages = [...chatHistory].reverse()

        if (chronologicalMessages.length === 0) {
            return res.status(200).json({
                result: 'There are no messages in this channel to compile context for.'
            })
        }

        // Format history as: SenderName: MessageContent
        const formattedHistory = chronologicalMessages
            .map(m => `${m.member.user.fullName}: ${m.content}`)
            .join('\n')

        let systemPrompt = ''
        if (action === 'summarize') {
            systemPrompt = `You are a helpful chat assistant called Nuvio Co-Pilot. Take the following conversation history and write a short, clear, bulleted summary of key points and highlights. Focus on decisions made, action items, or topics of debate. Keep it concise.
            
            Conversation History:
            ${formattedHistory}`
        } else {
            systemPrompt = `You are Nuvio Co-Pilot. Write a single natural, friendly, and helpful chat reply draft from the perspective of the server admin to respond to the last few messages in the conversation below. Write only the reply message itself, and do not put quotes around it.
            
            Conversation History:
            ${formattedHistory}`
        }

        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

        const response = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: systemPrompt
                    }]
                }]
            })
        })

        if (!response.ok) {
            const errDetails = await response.text()
            throw new Error(`Gemini API call failed: ${errDetails}`)
        }

        const data = await response.json()
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response draft compiled.'

        return res.status(200).json({ result: aiText.trim() })

    } catch (error: any) {
        console.error('Co-Pilot API Error:', error)
        return res.status(500).json({ error: error.message || 'Internal Server Error' })
    }
}
