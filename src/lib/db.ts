import { PrismaClient } from '@prisma/client'

// Versioned cache key — bump when the Prisma schema changes so the running
// dev server creates a fresh PrismaClient (otherwise the globalThis cache
// keeps a stale client that lacks newly-added models).
const PRISMA_CACHE_VERSION = 'schema-1-v3'

const globalForPrisma = globalThis as unknown as Record<string, PrismaClient | undefined>

const cacheKey = `prisma_${PRISMA_CACHE_VERSION}`

export const db =
  globalForPrisma[cacheKey] ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma[cacheKey] = db
