import { storeToRefs } from 'pinia'
import { useAuthStore } from '~/stores/auth'

export const useAuth = () => {
  const authStore = useAuthStore()
  const { user, accessToken, isLoggedIn } = storeToRefs(authStore)

  // 로그인 시도 함수
  const login = async (credentials: { login: string; password: string }) => {
    const { $api } = useApi()
    try {
      const data = await $api<any>('/auth/login', {
        method: 'POST',
        body: credentials
      })

      // Pinia 스토어에 상태 저장
      authStore.setAuth(data.user, data.accessToken)

      navigateTo('/')
    } catch (error: any) {
      alert(error.data?.statusMessage || '로그인에 실패했습니다.')
    }
  }

  // 로그아웃 함수
  const logout = () => {
    authStore.clearAuth()
    navigateTo('/login')
  }

  return {
    user,
    accessToken,
    isLoggedIn,
    login,
    logout
  }
}
