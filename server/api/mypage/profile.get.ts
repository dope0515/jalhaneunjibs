import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
      status: true,
      createdAt: true,
    },
  })

  if (!user || user.status === 'WITHDRAWN') {
    throw createError({ statusCode: 404, message: '사용자를 찾을 수 없습니다.' })
  }

  return user
})
