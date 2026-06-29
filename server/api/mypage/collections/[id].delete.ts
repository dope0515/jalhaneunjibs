import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: { _count: { select: { favorites: true } } },
  })
  if (!collection) throw createError({ statusCode: 404 })
  if (collection.userId !== userId) throw createError({ statusCode: 403 })

  // favorites cascade-deleted via schema onDelete: SET NULL
  await prisma.favorite.deleteMany({ where: { collectionId: id } })
  await prisma.collection.delete({ where: { id } })

  return { success: true }
})
