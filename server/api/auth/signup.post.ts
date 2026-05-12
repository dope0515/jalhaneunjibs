import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, email, password: rawPassword, nickname } = body
  const password = rawPassword?.trim()

  if (!username || !email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID, Email and password are required',
    })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        nickname,
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
    
    // Handle duplicate email/username error
    if (error.code === 'P2002') {
      const target = error.meta?.target || []
      const field = target.includes('email') ? '이메일' : '아이디'
      throw createError({
        statusCode: 400,
        statusMessage: `이미 사용 중인 ${field}입니다.`,
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Something went wrong',
    })
  }
})
