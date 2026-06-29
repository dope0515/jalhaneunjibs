import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)

  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      restaurant: {
        select: {
          id: true,
          name: true,
          thumbnail: true,
          foodCategory: true,
          address: true,
          region2: true,
          region3: true,
          keywords: true,
          averageRating: true,
          reviewCount: true,
          viewCount: true,
          likes: true,
          menus: {
            where: { isRecommended: true },
            select: { name: true, price: true },
            take: 3,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return reviews
})
