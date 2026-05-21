import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // 1. 상태 (State)
  // 기본적으로 세션 쿠키로 시작하되, 실제 값은 setAuth에서 결정됩니다.
  const user = useCookie<any | null>('user')
  const accessToken = useCookie<string | null>('accessToken')
  const rememberMeCookie = useCookie<boolean>('rememberMe')

  // 2. 게터 (Getters)
  const isLoggedIn = computed(() => !!user.value)

  // 3. 액션 (Actions)
  const setAuth = (userData: any, token: string, rememberMe: boolean = false) => {
    rememberMeCookie.value = rememberMe
    
    const cookieOptions = rememberMe ? { maxAge: 60 * 60 * 24 * 7 } : {}
    
    // 쿠키 옵션을 적용하여 다시 가져오기
    const userCookie = useCookie<any | null>('user', cookieOptions)
    const tokenCookie = useCookie<string | null>('accessToken', cookieOptions)
    
    userCookie.value = userData
    tokenCookie.value = token
    
    user.value = userData
    accessToken.value = token
  }

  const updateToken = (token: string) => {
    const isPersistent = !!rememberMeCookie.value
    const cookieOptions = isPersistent ? { maxAge: 60 * 60 * 24 * 7 } : {}
    
    const tokenCookie = useCookie<string | null>('accessToken', cookieOptions)
    tokenCookie.value = token
    accessToken.value = token
  }

  const clearAuth = () => {
    user.value = null
    accessToken.value = null
    rememberMeCookie.value = false
    
    // 명시적으로 쿠키 삭제
    const userCookie = useCookie('user')
    const tokenCookie = useCookie('accessToken')
    const remCookie = useCookie('rememberMe')
    
    userCookie.value = null
    tokenCookie.value = null
    remCookie.value = null
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
