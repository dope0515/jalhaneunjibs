import bcrypt from 'bcrypt'
import { getUserId } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { withdrawUser } from '~/server/utils/userAccount'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)
  const body = await readBody(event)
  const password = body?.password?.trim()

  if (!password) {
    throw createError({ statusCode: 400, statusMessage: '비밀번호를 입력해 주세요.' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, role: true },
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: '사용자를 찾을 수 없습니다.' })
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw createError({ statusCode: 400, statusMessage: '비밀번호가 일치하지 않습니다.' })
  }

  await withdrawUser(userId)

  deleteCookie(event, 'refresh_token')
  deleteCookie(event, 'accessToken')
  deleteCookie(event, 'user')

  return { success: true }
})
