import { NextApiRequest, NextApiResponse } from 'next'
import { Webhook } from 'svix'
import { db } from '../../../lib/db'

// Disables automatic body parsing so we can read the raw request body to verify the signature
export const config = {
    api: {
        bodyParser: false,
    },
}

// Utility to read the raw request stream into a buffer
async function buffer(readable: any) {
    const chunks = []
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || ''

    if (!webhookSecret) {
        console.error('Missing CLERK_WEBHOOK_SECRET env variable')
        return res.status(500).json({ error: 'Webhook secret config error' })
    }

    const payload = (await buffer(req)).toString()
    const headers = req.headers

    // Fetch svix credentials
    const svixId = headers['svix-id'] as string
    const svixTimestamp = headers['svix-timestamp'] as string
    const svixSignature = headers['svix-signature'] as string

    if (!svixId || !svixTimestamp || !svixSignature) {
        return res.status(400).json({ error: 'Missing webhook headers' })
    }

    const wh = new Webhook(webhookSecret)
    let evt: any

    try {
        evt = wh.verify(payload, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        })
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message)
        return res.status(400).json({ error: 'Invalid signature' })
    }

    const { id } = evt.data
    const eventType = evt.type

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { email_addresses, first_name, last_name, image_url } = evt.data
        const email = email_addresses[0]?.email_address
        const fullName = `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0]

        await db.user.upsert({
            where: { id },
            update: {
                email,
                fullName,
                imageUrl: image_url,
            },
            create: {
                id,
                email,
                fullName,
                imageUrl: image_url,
            },
        })
        console.log(`👤 User synced successfully: ${id} (${fullName})`)
    }

    return res.status(200).json({ response: 'ok' })
}
