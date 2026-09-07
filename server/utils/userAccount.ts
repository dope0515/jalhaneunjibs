import bcrypt from 'bcrypt'
import { randomUUID } from 'node:crypto'
import { prisma } from '~/server/utils/prisma'

export async function assertUserCanAccess(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  })

  if (!user || user.status === 'WITHDRAWN') {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  if (user.status === 'SUSPENDED') {
    throw createError({
      statusCode: 403,
      data: { code: 'ACCOUNT_SUSPENDED' },
      statusMessage: '정지된 계정입니다. 운영팀에 문의해 주세요.',
    })
  }
}

export async function withdrawUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, role: true },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: '사용자를 찾을 수 없습니다.' })
  }

  if (user.status === 'WITHDRAWN') {
    throw createError({ statusCode: 400, statusMessage: '이미 탈퇴한 계정입니다.' })
  }

  if (user.role === 'ADMIN') {
    throw createError({ statusCode: 400, statusMessage: '관리자 계정은 탈퇴 처리할 수 없습니다.' })
  }

  const deletedEmail = `withdrawn_${userId}_${Date.now()}@deleted.local`
  const randomPassword = await bcrypt.hash(randomUUID(), 10)

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId } }),
    prisma.user.update({
      where: { id: userId },
      data: {
        status: 'WITHDRAWN',
        withdrawnAt: new Date(),
        email: deletedEmail,
        nickname: `탈퇴회원${userId}`,
        password: randomPassword,
        suspendedReason: null,
      },
    }),
  ])
}
