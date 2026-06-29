import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)
  const query = getQuery(event)
  const restaurantId = parseInt(query.restaurantId as string)

  if (!restaurantId) throw createError({ statusCode: 400 })

  // 이 식당을 담고 있는 컬렉션 ID 목록
  const favorites = await prisma.favorite.findMany({
    where: { userId, restaurantId },
    select: { collectionId: true },
  })

  const savedCollectionIds = favorites.map((f) => f.collectionId).filter(Boolean) as number[]

  return { savedCollectionIds, isSaved: savedCollectionIds.length > 0 }
})
