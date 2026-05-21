/**
 * API를 호출하는 공통 컴포저블
 *
 * - 브라우저(클라이언트): /api 상대경로 사용 → Vercel HTTPS 엔드포인트를 통해 안전하게 처리
 * - 서버(SSR):          내부 라우트 /api 사용 → Nuxt server/api/ 핸들러가 직접 처리
 *
 * 사용법:
 *   const { $api } = useApi()
 *   const data = await $api('/restaurants', { query: { page: 1 } })
 *   const data = await $api('/auth/login', { method: 'POST', body: { login, password } })
 */
export const useApi = () => {
  const authStore = useAuthStore()
  const { accessToken } = storeToRefs(authStore)

  const $api = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      if (accessToken.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${accessToken.value}`,
        }
      }
    },
    async onResponseError({ request, response, options }) {
      // 401 에러(토큰 만료)가 발생했고, 이미 재시도 중이 아닐 때만 실행
      if (response.status === 401 && !request.toString().includes('/auth/refresh')) {
        try {
          // 1. 새로운 액세스 토큰 발급 요청 (리프레시 토큰 사용)
          const { accessToken: newToken } = await $fetch<{ accessToken: string }>('/api/auth/refresh', {
            method: 'POST',
          })

          // 2. 스토어 및 쿠키 업데이트
          authStore.updateToken(newToken)

          // 3. 이전 요청 재시도
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
          }
          return await $fetch(request, options)
        } catch (refreshError) {
          // 리프레시 토큰마저 만료된 경우 로그아웃 처리
          authStore.clearAuth()
          if (process.client) {
            navigateTo('/login')
          }
        }
      }
    }
  })

  return { $api }
}
