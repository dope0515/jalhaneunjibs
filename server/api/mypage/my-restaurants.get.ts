import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = getUserId(event)

  const restaurants = await prisma.restaurant.findMany({
    where: { registeredById: userId },
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
      status: true,
      createdAt: true,
      menus: {
        where: { isRecommended: true },
        select: { name: true, price: true },
        take: 3,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return restaurants
})
