import { redis } from './redis'
import { db } from './db'

export async function getCached<T>(key: string): Promise<T | null> {
    if (!redis) return null
    try {
        const cached = await redis.get(key)
        if (cached) {
            // Upstash client can automatically parse JSON or return it as string
            return (typeof cached === 'string' ? JSON.parse(cached) : cached) as T
        }
    } catch (err) {
        console.warn('Redis read error:', err)
    }
    return null
}

export async function setCached<T>(key: string, data: T, ttlSeconds = 3600): Promise<void> {
    if (!redis) return
    try {
        await redis.set(key, JSON.stringify(data), { ex: ttlSeconds })
    } catch (err) {
        console.warn('Redis write error:', err)
    }
}

export async function invalidateCache(key: string): Promise<void> {
    if (!redis) return
    try {
        await redis.del(key)
    } catch (err) {
        console.warn('Redis delete error:', err)
    }
}

export async function invalidateWorkspaceForUser(userId: string): Promise<void> {
    await invalidateCache(`workspace:${userId}`)
}

export async function invalidateWorkspaceForServer(serverId: string): Promise<void> {
    try {
        const members = await db.member.findMany({
            where: { serverId },
            select: { userId: true }
        })
        const keys = members.map(m => `workspace:${m.userId}`)
        if (keys.length > 0) {
            if (redis) {
                await Promise.all(keys.map(key => redis.del(key)))
            }
        }
    } catch (err) {
        console.error('Failed to invalidate workspace for server:', err)
    }
}
