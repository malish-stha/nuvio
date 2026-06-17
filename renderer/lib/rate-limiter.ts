import { NextApiResponse } from 'next'
import { redis } from './redis'

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    reset: number
}

/**
 * Perform rate limiting on a specific key using Upstash Redis.
 * Automatically falls back to passing the request if Redis is offline/unconfigured.
 */
export async function rateLimit(
    key: string,
    limit = 60,
    windowSeconds = 60
): Promise<RateLimitResult> {
    if (!redis) {
        return {
            success: true,
            limit,
            remaining: limit,
            reset: Date.now() + windowSeconds * 1000
        }
    }

    try {
        const fullKey = `ratelimit:${key}`
        const currentCount = await redis.incr(fullKey)

        if (currentCount === 1) {
            await redis.expire(fullKey, windowSeconds)
        }

        const ttl = await redis.ttl(fullKey)
        const resetTime = Date.now() + (ttl > 0 ? ttl : windowSeconds) * 1000

        return {
            success: currentCount <= limit,
            limit,
            remaining: Math.max(0, limit - currentCount),
            reset: resetTime
        }
    } catch (err) {
        console.warn('Redis rate limiter error, passing request through:', err)
        return {
            success: true,
            limit,
            remaining: limit,
            reset: Date.now() + windowSeconds * 1000
        }
    }
}

/**
 * Middleware helper to check rate limit and set headers.
 * Returns true if the request is within limits, false if it was rate limited (and sends a 429 response).
 */
export async function checkRateLimit(
    res: NextApiResponse,
    key: string,
    limit = 60,
    windowSeconds = 60
): Promise<boolean> {
    const result = await rateLimit(key, limit, windowSeconds)

    res.setHeader('X-RateLimit-Limit', result.limit.toString())
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString())
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.reset / 1000).toString())

    if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000)
        res.setHeader('Retry-After', retryAfter.toString())
        res.status(429).json({
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
        })
        return false
    }

    return true
}
