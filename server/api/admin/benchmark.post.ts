import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const iterations = body?.iterations || 50

  const results = {
    connection: 0,
    write: 0,
    read: 0,
    total: 0
  }

  try {
    const totalStart = Date.now()

    // 1. Connection
    const connStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    results.connection = Date.now() - connStart

    // 2. Write
    const writeStart = Date.now()
    // Use transaction for consistency
    await prisma.$transaction(
      Array.from({ length: iterations }).map((_, i) =>
        prisma.user.create({
          data: {
            email: `bench_${totalStart}_${i}@test.com`,
            name: `Bench User ${i}`,
          },
        })
      )
    )
    results.write = Date.now() - writeStart

    // 3. Read
    const readStart = Date.now()
    await prisma.user.findMany({
      take: iterations,
      orderBy: { id: 'desc' },
    })
    results.read = Date.now() - readStart

    // 4. Cleanup (Async - don't wait for response)
    prisma.user.deleteMany({
      where: { email: { startsWith: `bench_${totalStart}` } }
    }).catch(console.error)

    results.total = Date.now() - totalStart

    return {
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})
      error: error.message
    }
  }
})
