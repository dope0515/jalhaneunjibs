import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password: rawPassword, nickname } = body
  const password = rawPassword?.trim()

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
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

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nickname: nickname?.trim(),
        emailVerified: true,
      },
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
