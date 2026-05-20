import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = getUserId(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  const body = await readBody(event)
  const { name, isPrivate } = body

  const collection = await prisma.collection.findUnique({ where: { id } })
  if (!collection) throw createError({ statusCode: 404 })
  if (collection.userId !== userId) throw createError({ statusCode: 403 })

  const updated = await prisma.collection.update({
    where: { id },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(isPrivate !== undefined && { isPrivate }),
    },
  })

  return updated
})
