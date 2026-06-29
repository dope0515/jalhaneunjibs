import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = getUserId(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: '유효하지 않은 ID입니다.' })
  }

  const [review, user] = await Promise.all([
    prisma.review.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ])

  if (!review) {
    throw createError({ statusCode: 404, statusMessage: '리뷰를 찾을 수 없습니다.' })
  }

  const isAdmin = user?.role === 'ADMIN'
  if (review.userId !== userId && !isAdmin) {
    throw createError({ statusCode: 403, statusMessage: '삭제 권한이 없습니다.' })
  }

  await prisma.review.delete({ where: { id } })

  const stats = await prisma.review.aggregate({
    where: { restaurantId: review.restaurantId },
    _avg: { rating: true },
    _count: { id: true },
  })

  await prisma.restaurant.update({
    where: { id: review.restaurantId },
    data: {
      averageRating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
      reviewCount: stats._count.id,
    },
  })

  return { success: true }
})
