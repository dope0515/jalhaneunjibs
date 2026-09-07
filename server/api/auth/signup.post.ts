import { createHash } from 'node:crypto'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password: rawPassword, nickname, signupToken } = body
  const password = typeof rawPassword === 'string' ? rawPassword.trim() : ''

  if (typeof email !== 'string' || !email || !password || (nickname != null && typeof nickname !== 'string')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

  if (typeof password !== 'string' || !/^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password)) {
    throw createError({ statusCode: 400, statusMessage: '비밀번호는 영문과 숫자를 포함하여 6자리 이상이어야 합니다.' })
  }
  if (typeof signupToken !== 'string' || !/^[a-f0-9]{64}$/.test(signupToken)) {
    throw createError({ statusCode: 400, statusMessage: '이메일 인증을 완료해주세요.' })
  }

  // 1. 닉네임 중복 체크
  if (nickname) {
    const existingNickname = await prisma.user.findUnique({
      where: { nickname: nickname.trim() }
    })
    if (existingNickname) {
      throw createError({
        statusCode: 400,
        statusMessage: '이미 사용 중인 닉네임입니다.',
      })
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.$transaction(async (tx) => {
      const consumed = await tx.verificationToken.deleteMany({
        where: {
          email,
          code: `proof:${createHash('sha256').update(signupToken).digest('hex')}`,
          expiresAt: { gt: new Date() },
        },
      })
      if (consumed.count !== 1) {
        throw createError({ statusCode: 400, statusMessage: '이메일 인증이 만료되었거나 유효하지 않습니다.' })
      }
      return tx.user.create({
        data: { email, password: hashedPassword, nickname: nickname?.trim(), emailVerified: true },
      })
    })

    return {
      message: 'Signup successful!',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[Signup Error Details]:', {
      code: error.code,
      message: error.message,
      meta: error.meta,
      stack: error.stack
    })

    // Handle duplicate error
    if (error.code === 'P2002') {
      const isNickname = error.meta?.target?.includes('nickname')
      throw createError({
        statusCode: 400,
        statusMessage: isNickname ? '이미 사용 중인 닉네임입니다.' : '이미 사용 중인 이메일입니다.',
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Something went wrong',
    })
  }
})
