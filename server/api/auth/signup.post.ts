import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, email, password, nickname } = body

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
