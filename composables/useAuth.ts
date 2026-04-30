export const useAuth = () => {
  // 전역 상태 정의 (여러 컴포넌트에서 공유)
  const isLogin = useState<boolean>('isLogin', () => false)
  
  // 브라우저 쿠키와 연동 (새로고침 시 유지용)
  const authToken = useCookie('auth_token', {
    maxAge: 60 * 60 * 24 * 7 // 7일간 유지
  })

  // 초기화: 쿠키가 있으면 로그인 상태로 간주
  if (authToken.value && !isLogin.value) {
    isLogin.value = true
  }

  // 로그인 로직
  const login = async () => {
    // TODO: 나중에 여기서 실제 API를 호출할 예정입니다.
    // 지금은 테스트를 위해 더미 토큰을 저장합니다.
    authToken.value = 'dummy-auth-token-12345' 
    isLogin.value = true
    console.log('로그인 성공!')
  }

  // 로그아웃 로직
  const logout = () => {
    authToken.value = null // 쿠키 삭제
    isLogin.value = false
    console.log('로그아웃 완료!')
    
    // 로그아웃 후 메인 페이지로 이동 (선택 사항)
    navigateTo('/')
  }

  return {
    isLogin,
    login,
    logout
  }
}
