import jwt from 'jsonwebtoken'
import { getCookie, getRequestHeader, createError } from 'h3'
import { assertUserCanAccess } from '~/server/utils/userAccount'

export const getUserId = async (event: any): Promise<number> => {
  const userId = tryGetUserId(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }
  await assertUserCanAccess(userId)
  return userId
}

/** 로그인 + 활성 계정일 때만 userId 반환 (조회 API용, 정지 시 null) */
export const tryGetActiveUserId = async (event: any): Promise<number | null> => {
  const userId = tryGetUserId(event)
  if (!userId) return null
  try {
    await assertUserCanAccess(userId)
    return userId
  } catch {
    return null
  }
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
