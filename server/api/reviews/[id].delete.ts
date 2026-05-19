import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: '유효하지 않은 ID입니다.' })
  }

  const review = await prisma.review.findUnique({ where: { id } })

  if (!review) {
    throw createError({ statusCode: 404, statusMessage: '리뷰를 찾을 수 없습니다.' })
  }

  await prisma.review.delete({ where: { id } })

  // 평균 별점 & 리뷰 수 갱신
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
