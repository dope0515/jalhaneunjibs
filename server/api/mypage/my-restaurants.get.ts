import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'
import { attachIsSavedToRestaurants } from '~/server/utils/attachIsSaved'

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
  status: true,
  createdAt: true,
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

  const where = { registeredById: userId }

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      select: restaurantListSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.restaurant.count({ where }),
  ])

  const results = await attachIsSavedToRestaurants(userId, restaurants)

  return {
    restaurants: results,
    total,
    page: pageNum,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
})
