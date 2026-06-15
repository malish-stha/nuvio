import { PrismaClient } from '../../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
    var prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL || ''

// Reuse the Prisma client globally in development to prevent open connection leaks
export const db =
    globalThis.prisma ||
    new PrismaClient({
        adapter: new PrismaPg({ connectionString })
    })

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db
