import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)
  const body = await readBody(event)
  const { restaurantId, collectionId } = body

  if (!restaurantId) throw createError({ statusCode: 400, message: 'restaurantId가 필요합니다.' })
  if (!collectionId) throw createError({ statusCode: 400, message: '저장할 목록을 선택해 주세요.' })

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
  if (!restaurant) throw createError({ statusCode: 404, message: '식당을 찾을 수 없습니다.' })

  const collection = await prisma.collection.findUnique({ where: { id: collectionId } })
  if (!collection || collection.userId !== userId) throw createError({ statusCode: 403 })

  // 현재 상태 확인 (이 컬렉션에 이미 있는지)
  const existing = await prisma.favorite.findFirst({
    where: { userId, restaurantId, collectionId },
  })

  // 전체 찜 여부 확인 (likes 증감용)
  const totalBefore = await prisma.favorite.count({ where: { userId, restaurantId } })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    const totalAfter = await prisma.favorite.count({ where: { userId, restaurantId } })
    if (totalBefore > 0 && totalAfter === 0) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { likes: { decrement: 1 } },
      })
    }
    return { action: 'removed' }
  } else {
    await prisma.favorite.create({ data: { userId, restaurantId, collectionId } })
    if (totalBefore === 0) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { likes: { increment: 1 } },
      })
    }
    return { action: 'added' }
  }
})
