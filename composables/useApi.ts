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
  })

  return { $api }
}
