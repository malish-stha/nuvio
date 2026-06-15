import 'dotenv/config'
import { PrismaClient } from '../../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

declare global {
    var prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL || ''

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)

// Reuse the Prisma client globally in development to prevent open connection leaks
export const db =
    globalThis.prisma ||
    new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db
