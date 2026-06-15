import { Redis } from '@upstash/redis'

export const redis = typeof window === 'undefined'
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL || '',
        token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
    : (null as unknown as Redis) // Prevents leaking keys or running client-side
