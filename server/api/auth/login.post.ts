import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password: rawPassword } = body
  const password = rawPassword?.trim()

  console.log(`[Login Attempt]: username=${username}, passwordLength=${password?.length}`)

  // 1. 유저 존재 여부 확인 (ID로 찾기)
  const user = await prisma.user.findUnique({
    where: { username }
  })

  if (!user) {
    console.log(`[Login Failed]: User not found - ${username}`)
    throw createError({
      statusCode: 401,
      statusMessage: '아이디 또는 비밀번호가 일치하지 않습니다.'
    })
  }

  console.log(`[Login Info]: Found user, storedPasswordHashLength=${user.password?.length}`)

  // 2. 비밀번호 일치 여부 확인
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    console.log(`[Login Failed]: Password mismatch for ${username}`)
    throw createError({
      statusCode: 401,
      statusMessage: '아이디 또는 비밀번호가 일치하지 않습니다.'
    })
  }

  console.log(`[Login Success]: ${username}`)

  // 3. 토큰 생성 (아까 만든 .env의 키들을 여기서 꺼내 씁니다!)
  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: '15m' } // 액세스 토큰은 짧게!
  )

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: '7d' } // 리프레시 토큰은 길게!
  )

  // 4. 리프레시 토큰을 DB에 저장 (나중에 로그아웃/만료 체크용)
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id
    }
  })

  // 5. 리프레시 토큰을 보안 쿠키(HttpOnly)에 저장
  setCookie(event, 'refresh_token', refreshToken, {
    httpOnly: true, // 클라이언트 JS에서 접근 불가 (보안 강화)
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7 // 7일
  })

  // 6. 액세스 토큰과 유저 정보 반환
  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      role: user.role
    }
  }
})
