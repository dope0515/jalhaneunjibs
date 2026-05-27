import jwt from 'jsonwebtoken'
import { getCookie, getRequestHeader, createError } from 'h3'

export const getUserId = (event: any): number => {
  const userId = tryGetUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }
  return userId
}

export const tryGetUserId = (event: any): number | null => {
  const token =
    getRequestHeader(event, 'authorization')?.replace('Bearer ', '') ??
    getCookie(event, 'accessToken') ??
    ''

  if (!token) return null

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: number }
    return payload.userId
  } catch {
    return null
  }
}
