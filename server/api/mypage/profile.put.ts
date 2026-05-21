import bcrypt from 'bcrypt'
import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = getUserId(event)
  const body = await readBody(event)
  const { nickname, currentPassword, newPassword } = body

  const updateData: Record<string, any> = {}

  if (nickname !== undefined) {
    const trimmed = nickname.trim()
    if (!trimmed) throw createError({ statusCode: 400, message: '닉네임을 입력해 주세요.' })

    const existingNickname = await prisma.user.findFirst({
      where: {
        nickname: trimmed,
        id: { not: userId }
      }
    })
    if (existingNickname) {
      throw createError({
        statusCode: 400,
        message: '이미 사용 중인 닉네임입니다.'
      })
    }
    updateData.nickname = trimmed
  }

  if (newPassword) {
    if (!currentPassword) {
      throw createError({ statusCode: 400, message: '현재 비밀번호를 입력해 주세요.' })
    }
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw createError({ statusCode: 404 })

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) throw createError({ statusCode: 400, message: '현재 비밀번호가 일치하지 않습니다.' })
    if (newPassword.length < 6) throw createError({ statusCode: 400, message: '비밀번호는 6자 이상이어야 합니다.' })

    updateData.password = await bcrypt.hash(newPassword, 10)
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({ statusCode: 400, message: '변경할 항목이 없습니다.' })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, email: true, nickname: true, role: true },
  })

  return updated
})
