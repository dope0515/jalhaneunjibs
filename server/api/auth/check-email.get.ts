export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const email = query.email as string

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: '이메일을 입력해주세요.',
    })
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  return {
    isAvailable: !user,
  }
})
