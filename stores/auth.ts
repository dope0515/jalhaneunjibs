import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // 1. 상태 (State): useCookie를 사용하여 브라우저 쿠키와 동기화 (새로고침 시 유지)
  const user = useCookie<any | null>('user', { maxAge: 60 * 60 * 24 * 7 })
  const accessToken = useCookie<string | null>('accessToken', { maxAge: 60 * 60 * 24 * 7 })

  // 2. 게터 (Getters)
  const isLoggedIn = computed(() => !!user.value)

  // 3. 액션 (Actions)
  const setAuth = (userData: any, token: string) => {
    user.value = userData
    accessToken.value = token
  }

  const clearAuth = () => {
    user.value = null
    accessToken.value = null
  }

  return {
    user,
    accessToken,
    isLoggedIn,
    setAuth,
    clearAuth
  }
})
