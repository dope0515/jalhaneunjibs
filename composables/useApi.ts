<<<<<<< HEAD
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
=======
/**
 * API를 호출하는 공통 컴포저블
 */
export const useApi = () => {
  const authStore = useAuthStore()
  const { accessToken, persistentToken } = storeToRefs(authStore)

  // rememberMe 여부와 관계없이 실제 보유 중인 액세스 토큰 사용
  const currentAccessToken = computed(
    () => accessToken.value ?? persistentToken.value,
  )

  const handleAuthFailure = (statusMessage?: string) => {
    authStore.clearAuth()
    if (import.meta.client) {
      if (statusMessage) alert(statusMessage)
      navigateTo('/login')
    }
  }

  // 동시에 여러 요청이 401을 만나도 refresh는 한 번만 수행 (single-flight)
  let refreshPromise: Promise<string> | null = null
  const refreshAccessToken = () => {
    if (!refreshPromise) {
      refreshPromise = $fetch<{ accessToken: string }>('/api/auth/refresh', {
        method: 'POST',
      })
        .then(({ accessToken: newToken }) => {
          authStore.updateToken(newToken)
          return newToken
        })
        .finally(() => {
          refreshPromise = null
        })
    }
    return refreshPromise
>>>>>>> fe68c4d19848374d3b1d311c9a22684453dee1c1
  }

  const baseFetch = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
<<<<<<< HEAD
      const headers = new Headers(options.headers || {})
      if (currentToken()) headers.set('Authorization', `Bearer ${currentToken()}`)
      options.headers = headers
    },
  })

=======
      if (currentAccessToken.value) {
        const headers = new Headers(options.headers || {})
        headers.set('Authorization', `Bearer ${currentAccessToken.value}`)
        options.headers = headers
      }
    },
  })

  /**
   * onResponseError는 재시도 결과를 호출부로 되돌려주지 못하므로
   * 401 처리(토큰 갱신 + 재요청)를 래퍼에서 직접 수행한다.
   */
>>>>>>> fe68c4d19848374d3b1d311c9a22684453dee1c1
  const $api = async <T = any>(
    request: Parameters<typeof baseFetch>[0],
    options: Parameters<typeof baseFetch>[1] = {},
  ): Promise<T> => {
<<<<<<< HEAD
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
=======
    try {
      return await baseFetch<T>(request, options)
    } catch (error: any) {
      const status: number | undefined = error?.response?.status ?? error?.statusCode
      const statusMessage: string | undefined =
        error?.data?.statusMessage ?? error?.data?.message

      const url = request.toString()

      if (status === 403) {
        handleAuthFailure(statusMessage || '접근 권한이 없습니다.')
        throw error
      }

      const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/auth/login')
      if (status === 401 && !isAuthEndpoint) {
        try {
          await refreshAccessToken()
          // 갱신된 토큰은 onRequest에서 자동으로 헤더에 실린다.
          return await baseFetch<T>(request, options)
        } catch {
          handleAuthFailure(statusMessage || '다시 로그인해 주세요.')
          throw error
        }
      }

      throw error
>>>>>>> fe68c4d19848374d3b1d311c9a22684453dee1c1
    }
  }

  return { $api }
}
