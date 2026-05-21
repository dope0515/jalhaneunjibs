import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: '유효한 식당 ID가 필요합니다.' })
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id } })
  if (!restaurant) {
    throw createError({ statusCode: 404, message: '식당을 찾을 수 없습니다.' })
  }

  // 권한 체크
  const userId = getUserId(event)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  const isOwner = restaurant.registeredById === userId
  const isAdmin = user?.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    throw createError({ statusCode: 403, message: '삭제 권한이 없습니다.' })
  }

  await prisma.restaurant.delete({ where: { id } })

  return { success: true }
})
