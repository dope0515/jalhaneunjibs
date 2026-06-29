/**
 * API를 호출하는 공통 컴포저블
 */
export const useApi = () => {
  const authStore = useAuthStore()
  const { accessToken } = storeToRefs(authStore)

  const handleAuthFailure = (statusMessage?: string) => {
    authStore.clearAuth()
    if (import.meta.client) {
      if (statusMessage) alert(statusMessage)
      navigateTo('/login')
    }
  }

  const $api = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      if (accessToken.value) {
        const headers = new Headers(options.headers || {})
        headers.set('Authorization', `Bearer ${accessToken.value}`)
        options.headers = headers
      }
    },
    async onResponseError({ request, response, options }) {
      const statusMessage =
        (response._data as { statusMessage?: string; message?: string })?.statusMessage
        || (response._data as { message?: string })?.message

      if (response.status === 403) {
        handleAuthFailure(statusMessage || '접근 권한이 없습니다.')
        return
      }

      if (response.status === 401 && !request.toString().includes('/auth/refresh')) {
        try {
          const { accessToken: newToken } = await $fetch<{ accessToken: string }>('/api/auth/refresh', {
            method: 'POST',
          })

          authStore.updateToken(newToken)

          const headers = new Headers(options.headers || {})
          headers.set('Authorization', `Bearer ${newToken}`)
          options.headers = headers

          return await $fetch(request, options as any)
        } catch {
          handleAuthFailure(statusMessage || '다시 로그인해 주세요.')
        }
      }
    },
  })

  return { $api }
}
