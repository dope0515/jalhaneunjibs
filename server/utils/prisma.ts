// server/utils/prisma.ts

import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
  pgPool: Pool | undefined
}

function createPgPool() {
  if (globalForPrisma.pgPool) return globalForPrisma.pgPool

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pgPool = pool
  }

  return pool
}

function createPrismaClient() {
  const adapter = new PrismaPg(createPgPool())
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
