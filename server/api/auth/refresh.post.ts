import jwt from 'jsonwebtoken'
import { prisma } from '~/server/utils/prisma'

/**
 * 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급하는 API
 */
export default defineEventHandler(async (event) => {
  // 1. 쿠키에서 리프레시 토큰 추출
  const refreshToken = getCookie(event, 'refresh_token')

  if (!refreshToken) {
    throw createError({
      statusCode: 401,
      statusMessage: '리프레시 토큰이 없습니다. 다시 로그인해주세요.',
    })
  }

  try {
    // 2. JWT 검증
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as { userId: number }

    // 3. DB에 저장된 유효한 토큰인지 확인
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt: { gt: new Date() },
      },
    })

    if (!storedToken) {
      throw createError({
        statusCode: 401,
        statusMessage: '유효하지 않거나 만료된 리프레시 토큰입니다.',
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { status: true },
    })

    if (!user || user.status === 'WITHDRAWN') {
      throw createError({
        statusCode: 401,
        statusMessage: '다시 로그인해주세요.',
      })
    }

    if (user.status === 'SUSPENDED') {
      throw createError({
        statusCode: 403,
        statusMessage: '정지된 계정입니다.',
      })
    }

    // 4. 새로운 액세스 토큰 생성
    const accessToken = jwt.sign(
      { userId: payload.userId },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '1h' }
    )

    // 5. (선택적) 리프레시 토큰 로테이션 - 보안을 위해 리프레시 토큰도 새로 발급 가능
    // 여기서는 단순함을 위해 액세스 토큰만 새로 발급합니다.

    return {
      accessToken,
    }
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: '인증 갱신에 실패했습니다. 다시 로그인해주세요.',
    })
  }
})
