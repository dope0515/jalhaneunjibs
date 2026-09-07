import { randomBytes, createHash } from 'node:crypto'

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
      code: `signup:${code}`,
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

  // 코드를 일회용 가입 증명으로 교환합니다. DB에는 증명의 해시만 저장합니다.
  const signupToken = randomBytes(32).toString('hex')
  const proof = `proof:${createHash('sha256').update(signupToken).digest('hex')}`
  const consumed = await prisma.verificationToken.updateMany({
    where: { id: verificationToken.id, code: `signup:${code}`, expiresAt: { gt: new Date() } },
    data: { code: proof, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
  })
  if (consumed.count !== 1) {
    throw createError({ statusCode: 400, statusMessage: '이미 사용된 인증 코드입니다.' })
  }

  return {
    success: true,
    signupToken,
    message: '이메일 인증이 완료되었습니다.',
  }
})
