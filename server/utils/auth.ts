import jwt from 'jsonwebtoken'
import { getCookie, getRequestHeader, createError } from 'h3'

export const getUserId = (event: any): number => {
  const token =
    getRequestHeader(event, 'authorization')?.replace('Bearer ', '') ??
    getCookie(event, 'accessToken') ??
    ''

  if (!token) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: number }
    return payload.userId
  } catch {
    throw createError({ statusCode: 401, message: '유효하지 않은 토큰입니다.' })
  }
}
