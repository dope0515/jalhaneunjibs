import bcrypt from 'bcrypt'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email, code, newPassword } = body

<<<<<<< HEAD
    if (!email || typeof code !== 'string' || !/^\d{6}$/.test(code.trim()) || !newPassword) {
=======
    if (!email || !code || !newPassword) {
>>>>>>> fe68c4d19848374d3b1d311c9a22684453dee1c1
      throw createError({
        statusCode: 400,
        statusMessage: '이메일, 인증 코드, 새로운 비밀번호를 모두 입력해주세요.',
      })
    }

    const trimmedPassword = newPassword.trim()

    // 1. 비밀번호 조건 검증 (영문, 숫자 포함 6자 이상)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/
    if (!passwordRegex.test(trimmedPassword)) {
      throw createError({
        statusCode: 400,
        statusMessage: '비밀번호는 영문과 숫자를 포함하여 6자리 이상이어야 합니다.',
      })
    }

    // 2. 인증 토큰 존재 여부 및 만료 체크
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        email: email.trim(),
        code: code.trim(),
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!verificationToken) {
      throw createError({
        statusCode: 400,
        statusMessage: '유효하지 않거나 만료된 인증 코드입니다.',
      })
    }

    // 3. 사용자 비밀번호 해시화 및 업데이트
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10)
    await prisma.user.update({
      where: { email: email.trim() },
      data: { password: hashedPassword },
    })

    // 4. 성공 후 사용된 인증 토큰 즉시 삭제
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    })

    return {
      success: true,
      message: '비밀번호가 성공적으로 재설정되었습니다.',
    }
  } catch (error: any) {
    console.error('[Password Reset Verify Error]:', error.message || error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || '서버 오류가 발생했습니다.',
    })
  }
})
