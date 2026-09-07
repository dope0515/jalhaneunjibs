// Store별로 공유하므로 컴포넌트 간 갱신은 합치고 SSR 사용자 간에는 분리합니다.
const refreshRequests = new WeakMap<object, Promise<string>>()

export const useApi = () => {
  const authStore = useAuthStore()
  const requestFetch = useRequestFetch()
  const currentToken = () => authStore.accessToken ?? authStore.persistentToken
  const statusOf = (error: any) => error?.response?.status ?? error?.statusCode ?? error?.status
  const isSuspended = (error: any) => error?.data?.data?.code === 'ACCOUNT_SUSPENDED'
  const clearSession = () => {
    const wasLoggedIn = authStore.isLoggedIn
    authStore.clearAuth()
    if (import.meta.client && wasLoggedIn) navigateTo('/login')
  }

  const refreshAccessToken = () => {
    let pending = refreshRequests.get(authStore)
    if (!pending) {
      pending = requestFetch<{ accessToken: string }>('/api/auth/refresh', { method: 'POST' })
        .then(({ accessToken }) => {
          authStore.updateToken(accessToken)
          return accessToken
        })
        .finally(() => refreshRequests.delete(authStore))
      refreshRequests.set(authStore, pending)
    }
    return pending
  }

  const baseFetch = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      const headers = new Headers(options.headers || {})
      if (currentToken()) headers.set('Authorization', `Bearer ${currentToken()}`)
      options.headers = headers
    },
  })

  const $api = async <T = any>(
    request: Parameters<typeof baseFetch>[0],
    options: Parameters<typeof baseFetch>[1] = {},
  ): Promise<T> => {
    const sentToken = currentToken()
    try {
      return await baseFetch<T>(request, options)
    } catch (error: any) {
      const isAuthEndpoint = /(?:^|\/)auth\//.test(request.toString())
      if (isAuthEndpoint) throw error
      if (isSuspended(error)) {
        clearSession()
        throw error
      }
      if (statusOf(error) !== 401) throw error

      // 늦게 도착한 401은 이미 갱신된 토큰으로 재시도합니다.
      if (!currentToken() || currentToken() === sentToken) {
        try {
          await refreshAccessToken()
        } catch (refreshError: any) {
          if (statusOf(refreshError) === 401 || isSuspended(refreshError)) clearSession()
          throw refreshError
        }
      }
      try {
        return await baseFetch<T>(request, options)
      } catch (retryError: any) {
        if (statusOf(retryError) === 401 || isSuspended(retryError)) clearSession()
        throw retryError
      }
    }
  }

  return { $api }
}
