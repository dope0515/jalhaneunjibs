import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import pkg from 'pg'
const { Pool } = pkg
import { PrismaPg } from '@prisma/adapter-pg'

async function main() {
  const connectionString = `${process.env.DATABASE_URL}`
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    const users = await prisma.user.findMany()
    console.log('Total users:', users.length)
    console.log('Users list:', users.map(u => ({ id: u.id, email: u.email, nickname: u.nickname })))
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main().catch(e => console.error(e))
