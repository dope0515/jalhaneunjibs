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
  }

  const baseFetch = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      if (accessToken.value) {
        const headers = new Headers(options.headers || {})
        headers.set('Authorization', `Bearer ${accessToken.value}`)
        options.headers = headers
      }
    },
  })

  /**
   * onResponseError는 재시도 결과를 호출부로 되돌려주지 못하므로
   * 401 처리(토큰 갱신 + 재요청)를 래퍼에서 직접 수행한다.
   */
  const $api = async <T = any>(
    request: Parameters<typeof baseFetch>[0],
    options: Parameters<typeof baseFetch>[1] = {},
  ): Promise<T> => {
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
    }
  }

  return { $api }
}
