import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const targets = await prisma.restaurant.findMany({
      where: { foodCategory: '회' }
    })
    console.log(`Found ${targets.length} restaurants with category '회':`)
    targets.forEach(r => console.log(`- ID: ${r.id}, Name: ${r.name}, Address: ${r.address}`))
  } catch (error) {
    console.error('Find failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
