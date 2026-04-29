export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, nickname } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required',
    })
  }

  try {
    // Note: We will add password hashing in the next step!
    const user = await prisma.user.create({
      data: {
        email,
        password,
        nickname,
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
    // Handle duplicate email error
    if (error.code === 'P2002') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email already exists',
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Something went wrong',
    })
  }
})
