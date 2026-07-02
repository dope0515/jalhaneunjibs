import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

const DEFAULT_PAGE_SIZE = 6

const restaurantListSelect = {
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
} as const

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)
  const query = getQuery(event)

  const pageNum = Math.max(1, parseInt(query.page as string, 10) || 1)
  const requestedLimit = query.limit ? parseInt(query.limit as string, 10) : DEFAULT_PAGE_SIZE
  const pageSize = Number.isFinite(requestedLimit)
    ? Math.min(50, Math.max(1, requestedLimit))
    : DEFAULT_PAGE_SIZE
  const skip = (pageNum - 1) * pageSize

  const where = { userId }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      select: {
        restaurant: {
          select: restaurantListSelect,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.review.count({ where }),
  ])

  return {
    restaurants: reviews.map((review) => review.restaurant),
    total,
    page: pageNum,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
})
