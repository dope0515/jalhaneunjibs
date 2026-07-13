import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  const { user, accessToken, persistentUser, persistentToken, isLoggedIn } = storeToRefs(authStore)

  // 세션 쿠키 또는 지속성 쿠키 중 실제로 값이 있는 것을 사용
  const currentUser = computed(() => user.value ?? persistentUser.value)
  const currentToken = computed(() => accessToken.value ?? persistentToken.value)
  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN')

  // 로그인 시도 함수
  const login = async (credentials: { login: string; password: string; rememberMe?: boolean }) => {
    const { $api } = useApi()
    try {
      const data = await $api<any>('/auth/login', {
        method: 'POST',
        body: credentials
      })

      // Pinia 스토어에 상태 저장
      authStore.setAuth(data.user, data.accessToken, credentials.rememberMe)

      navigateTo('/')
    } catch (error: any) {
      throw error
    }
  }

  // 로그아웃 함수
  const logout = async () => {
    const { $api } = useApi()
    try {
      // 서버측 토큰 무효화 요청
      await $api('/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Logout API failed', e)
    } finally {
      // 클라이언트측 상태 초기화 (실패하더라도 수행)
      authStore.clearAuth()
      navigateTo('/login')
    }
  }

  return {
    user: currentUser,
    accessToken: currentToken,
    isLoggedIn,
    isAdmin,
    login,
    logout
  }
}
