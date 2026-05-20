import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = getUserId(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      favorites: {
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              thumbnail: true,
              foodCategory: true,
              address: true,
              averageRating: true,
              reviewCount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!collection) throw createError({ statusCode: 404 })
  if (collection.userId !== userId) throw createError({ statusCode: 403 })

  return collection
})
