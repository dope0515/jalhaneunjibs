import { prisma } from '~/server/utils/prisma'

/**
 * 로그아웃 시 서버 측 토큰 무효화 처리
 */
export default defineEventHandler(async (event) => {
  const refreshToken = getCookie(event, 'refresh_token')

  if (refreshToken) {
    // 1. DB에서 리프레시 토큰 삭제
    try {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      })
    } catch (e) {
      console.error('Logout: Failed to delete token from DB', e)
    }
  }

  // 2. 인증 관련 쿠키 모두 삭제 (세션 + rememberMe persistent)
  deleteCookie(event, 'refresh_token')
  deleteCookie(event, 'accessToken')
  deleteCookie(event, 'user')
  deleteCookie(event, 'accessToken_p')
  deleteCookie(event, 'user_p')
  deleteCookie(event, 'rememberMe')

  return {
    success: true,
    message: '성공적으로 로그아웃되었습니다.'
  }
})
