import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = getUserId(event)

  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      favorites: {
        include: {
          restaurant: { select: { id: true, thumbnail: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 4,
      },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return collections
})
