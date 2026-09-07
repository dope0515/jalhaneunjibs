import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  // 1. 상태 (State)
  // 기본 세션 쿠키 (브라우저 종료 시 만료) — rememberMe=false 일 때 사용
  const user = useCookie<any | null>('user')
  const accessToken = useCookie<string | null>('accessToken')
  const rememberMeCookie = useCookie<boolean>('rememberMe', { maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })

  // 지속성 쿠키 (7일 동안 유지) — rememberMe=true 일 때 사용 (이름을 분리하여 충돌 방지)
  const persistentUser = useCookie<any | null>('user_p', { maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })
  const persistentToken = useCookie<string | null>('accessToken_p', { maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' })

  // 2. 게터 (Getters)
  // 세션 쿠키 또는 지속성 쿠키 중 하나라도 있으면 로그인 상태로 간주
  const isLoggedIn = computed(() => !!user.value || !!persistentUser.value)

  // 3. 액션 (Actions)
  const setAuth = (userData: any, token: string, rememberMe: boolean = false) => {
    rememberMeCookie.value = rememberMe

    if (rememberMe) {
      // rememberMe=true: 지속성 쿠키에 저장 (7일 유지)
      persistentUser.value = userData
      persistentToken.value = token
      // 혹시 남아있을 수 있는 세션 쿠키 초기화
      user.value = null
      accessToken.value = null
    } else {
      // rememberMe=false: 세션 쿠키에 저장 (브라우저 종료 시 삭제)
      user.value = userData
      accessToken.value = token
      // 혹시 남아있을 수 있는 지속성 쿠키 초기화
      persistentUser.value = null
      persistentToken.value = null
    }
  }

  const updateToken = (token: string) => {
    const isPersistent = !!rememberMeCookie.value || !!persistentUser.value
    if (isPersistent) {
      persistentToken.value = token
    } else {
      accessToken.value = token
    }
  }

  const clearAuth = () => {
    // 세션 쿠키 초기화
    user.value = null
    accessToken.value = null
    // 지속성 쿠키 초기화
    persistentUser.value = null
    persistentToken.value = null
    rememberMeCookie.value = false
  }

  return {
    user,
    accessToken,
    persistentUser,
    persistentToken,
    rememberMeCookie,
    isLoggedIn,
    setAuth,
    updateToken,
    clearAuth
  }
})
