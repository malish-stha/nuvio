import Pusher from 'pusher'

export const pusherServer = typeof window === 'undefined'
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID || '',
        key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
        secret: process.env.PUSHER_SECRET || '',
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
        useTLS: true,
    })
    : (null as unknown as Pusher)
