export const useAuth = () => {
  // 앱 전체에서 공유할 유저 상태 (기본값 null)
  const user = useState<any | null>('user', () => null)
  const accessToken = useState<string | null>('accessToken', () => null)

  // 로그인 시도 함수
  const login = async (credentials: { email: string; password: string }) => {
    try {
      const data = await $fetch<any>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      // 성공 시 상태 업데이트
      user.value = data.user
      accessToken.value = data.accessToken

      // 메인 페이지로 이동
      navigateTo('/')
    } catch (error: any) {
      alert(error.data?.statusMessage || '로그인에 실패했습니다.')
    }
  }

  // 로그아웃 함수
  const logout = () => {
    user.value = null
    accessToken.value = null
    // 쿠키는 서버사이드에서 지워주는 것이 좋지만, 
    // 우선 프론트 상태를 비우고 이동합니다.
    navigateTo('/login')
  }

  return {
    user,
    accessToken,
    login,
    logout
  }
}
