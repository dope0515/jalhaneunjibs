import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { tryGetUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { category, region1, region2, keyword, priceMin, priceMax, page = '1', sort = 'latest' } = getQuery(event)
  const userId = tryGetUserId(event)

  const pageNum = Math.max(1, parseInt(page as string))
  const pageSize = 6
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
  if (priceMin !== undefined || priceMax !== undefined) {
    const priceFilter: Record<string, number> = {}
    if (priceMin !== undefined) priceFilter.gte = parseInt(priceMin as string)
    if (priceMax !== undefined) priceFilter.lte = parseInt(priceMax as string)
    where.menus = {
      some: {
        price: priceFilter,
      },
    }
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
        viewCount: true,
        placeId: true,
        menus: {
          where: { isRecommended: true },
          select: { name: true, price: true },
          take: 3,
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy:
        sort === 'rating'  ? { averageRating: 'desc' } :
        sort === 'views'   ? { viewCount: 'desc' } :
        sort === 'reviews' ? { reviewCount: 'desc' } :
        { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.restaurant.count({ where }),
  ])

  // 로그인 상태라면 찜 상태 추가
  let results = restaurants as any[]
  if (userId) {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
        restaurantId: { in: restaurants.map((r) => r.id) },
      },
      select: { restaurantId: true },
    })
    const savedIds = new Set(favorites.map((f) => f.restaurantId))
    results = restaurants.map((r) => ({
      ...r,
      isSaved: savedIds.has(r.id),
    }))
  }

  return {
    restaurants: results,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / pageSize),
  }
})
