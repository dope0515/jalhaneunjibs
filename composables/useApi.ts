/**
 * Express 백엔드 API를 호출하는 공통 컴포저블
 *
 * 사용법:
 *   const { $api } = useApi()
 *   const data = await $api('/restaurants', { method: 'GET' })
 *   const data = await $api('/auth/login', { method: 'POST', body: { login, password } })
 */
export const useApi = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const { accessToken } = storeToRefs(authStore)

  const $api = $fetch.create({
    baseURL: config.public.apiBase + '/api',
    onRequest({ options }) {
      if (accessToken.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${accessToken.value}`,
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        // 인증 만료 시 처리는 각 호출부에서 처리
      }
    },
  })

  return { $api }
}
