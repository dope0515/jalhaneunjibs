export const useAuth = () => {
  // 1. 전역 상태 정의 (여러 컴포넌트에서 공유할 로그인 여부)
  const isLogin = useState('isLogin', () => false);
  
  // 2. 브라우저 쿠키와 연동 (새로고침 시 유지용 토큰 저장소)
  const authToken = useCookie('auth_token');
  
  if (authToken.value) isLogin.value = true;

  // 3. 로그아웃을 처리하는 함수
  const logout = () => {
    authToken.value = null // 쿠키 삭제
    isLogin.value = false
  }

  return {
    isLogin,
    logout
  }
}