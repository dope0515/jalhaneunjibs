import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const result = await prisma.restaurant.updateMany({
      where: { foodCategory: '회' },
      data: { foodCategory: '일식' }
    })
    console.log(`Successfully updated ${result.count} restaurants from '회' to '일식'.`)
  } catch (error) {
    console.error('Update failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
