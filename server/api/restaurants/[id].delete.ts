import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: '유효한 식당 ID가 필요합니다.' })
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id } })
  if (!restaurant) {
    throw createError({ statusCode: 404, message: '식당을 찾을 수 없습니다.' })
  }

  await prisma.restaurant.delete({ where: { id } })

  return { success: true }
})
