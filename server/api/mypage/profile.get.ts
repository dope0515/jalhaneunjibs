import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = getUserId(event)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      nickname: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) throw createError({ statusCode: 404, message: '사용자를 찾을 수 없습니다.' })

  return user
})
