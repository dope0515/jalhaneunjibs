import { createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export async function requireAdmin(event: any) {
  const userId = await getUserId(event)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, nickname: true, status: true },
  })

  if (!user || user.status === 'WITHDRAWN') {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  if (user.status === 'SUSPENDED') {
    throw createError({
      statusCode: 403,
      data: { code: 'ACCOUNT_SUSPENDED' },
      statusMessage: '정지된 계정입니다.',
    })
  }

  if (user.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: '관리자 권한이 필요합니다.' })
  }

  return user
}
