import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)
  const body = await readBody(event)
  const { name, isPrivate = true } = body

  if (!name?.trim()) throw createError({ statusCode: 400, message: '목록 이름을 입력해 주세요.' })

  const collection = await prisma.collection.create({
    data: {
      name: name.trim(),
      isPrivate,
      userId,
    },
    include: {
      _count: { select: { favorites: true } },
      favorites: { include: { restaurant: { select: { id: true, thumbnail: true, name: true } } }, take: 4 },
    },
  })

  return collection
})
