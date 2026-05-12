export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, code } = body

  if (!email || !code) {
    throw createError({
      statusCode: 400,
      statusMessage: '이메일과 인증 코드를 입력해주세요.',
    })
  }

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      email,
      code,
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

  // Delete the token after successful verification
  await prisma.verificationToken.delete({
    where: {
      id: verificationToken.id,
    },
  })

  return {
    success: true,
    message: '이메일 인증이 완료되었습니다.',
  }
})
