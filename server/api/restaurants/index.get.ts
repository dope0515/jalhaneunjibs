import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const { category, region1, region2, keyword, page = '1' } = getQuery(event)

  const pageNum = Math.max(1, parseInt(page as string))
  const pageSize = 12
  const skip = (pageNum - 1) * pageSize

  const where: Record<string, unknown> = {}
  if (category) where.foodCategory = category
  if (region1) where.region1 = region1
  if (region2) where.region2 = region2
  if (keyword) {
    where.OR = [
      { name: { contains: keyword as string, mode: 'insensitive' } },
      { keywords: { has: keyword as string } },
    ]
  }

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
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
        likes: true,
        placeId: true,
        menus: {
          where: { isRecommended: true },
          select: { name: true, price: true },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.restaurant.count({ where }),
  ])

  return {
    restaurants,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / pageSize),
  }
})
