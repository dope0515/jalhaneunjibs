import { createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export async function requireAdmin(event: any) {
  const userId = getUserId(event)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, nickname: true },
  })

  if (user?.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: '관리자 권한이 필요합니다.' })
  }

  return user
}
