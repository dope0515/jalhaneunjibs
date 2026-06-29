import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { login: loginId, password: rawPassword, rememberMe } = body
  const password = rawPassword?.trim()
  const identifier = loginId?.trim()

  console.log(`[Login Attempt]: identifier=${identifier}, rememberMe=${rememberMe}`)

  // 이메일 및 비밀번호 누락 검증 (400 Bad Request)
  if (!identifier || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: '이메일과 비밀번호를 모두 입력해 주세요.'
    })
  }

  // 1. 이메일만 허용
  const user = await prisma.user.findFirst({
    where: {
      email: identifier,
    },
  })

  if (!user) {
    console.log(`[Login Failed]: User not found - ${identifier}`)
    throw createError({
      statusCode: 401,
      statusMessage: '이메일 또는 비밀번호가 일치하지 않습니다.'
    })
  }

  if (user.status === 'WITHDRAWN') {
    throw createError({
      statusCode: 401,
      statusMessage: '탈퇴한 계정입니다.',
    })
  }

  if (user.status === 'SUSPENDED') {
    throw createError({
      statusCode: 403,
      statusMessage: '정지된 계정입니다. 계정 정지 해제 요청 페이지에서 문의해 주세요.',
    })
  }

  console.log(`[Login Info]: Found user, storedPasswordHashLength=${user.password?.length}`)

  // 2. 비밀번호 일치 여부 확인
  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    console.log(`[Login Failed]: Password mismatch for ${identifier}`)
    throw createError({
      statusCode: 401,
      statusMessage: '이메일 또는 비밀번호가 일치하지 않습니다.'
    })
  }

  console.log(`[Login Success]: ${identifier}`)

  // 3. 토큰 생성 (AccessToken은 짧게, RefreshToken은 길게)
  const accessToken = jwt.sign(
    { userId: user.id },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: '1h' } // 1시간으로 단축 (보안 강화)
  )

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET!,
    { expiresIn: '7d' }
  )

  // 4. 리프레시 토큰을 DB에 저장 (나중에 로그아웃/만료 체크용)
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7일 후
    },
  })

  // 5. 리프레시 토큰을 보안 쿠키(HttpOnly)에 저장
  setCookie(event, 'refresh_token', refreshToken, {
    httpOnly: true, // 클라이언트 JS에서 접근 불가 (보안 강화)
    secure: process.env.NODE_ENV === 'production',
    // rememberMe가 true일 때만 7일 유지, 아니면 브라우저 종료 시 삭제
    ...(rememberMe ? { maxAge: 60 * 60 * 24 * 7 } : {})
  })

  // 6. 액세스 토큰과 유저 정보 반환
  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role
    }
  }
})
