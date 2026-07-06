import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // 1. 상태 (State)
  // 기본 세션 쿠키 (브라우저 종료 시 만료)
  const user = useCookie<any | null>('user')
  const accessToken = useCookie<string | null>('accessToken')
  const rememberMeCookie = useCookie<boolean>('rememberMe')

  // 지속성 쿠키 (7일 동안 유지)
  const persistentUser = useCookie<any | null>('user', { maxAge: 60 * 60 * 24 * 7 })
  const persistentToken = useCookie<string | null>('accessToken', { maxAge: 60 * 60 * 24 * 7 })

  // 2. 게터 (Getters)
  const isLoggedIn = computed(() => !!user.value)

  // 3. 액션 (Actions)
  const setAuth = (userData: any, token: string, rememberMe: boolean = false) => {
    rememberMeCookie.value = rememberMe
    
    if (rememberMe) {
      persistentUser.value = userData
      persistentToken.value = token
    } else {
      user.value = userData
      accessToken.value = token
    }
  }

  const updateToken = (token: string) => {
    const isPersistent = !!rememberMeCookie.value
    if (isPersistent) {
      persistentToken.value = token
    } else {
      accessToken.value = token
    }
  }

  const clearAuth = () => {
    user.value = null
    accessToken.value = null
    rememberMeCookie.value = false
  }

  return {
    user,
    accessToken,
    isLoggedIn,
    setAuth,
    updateToken,
    clearAuth
  }
})
