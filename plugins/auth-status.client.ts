export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
<<<<<<< HEAD
  const { $api } = useApi()

  try {
    // 사용자 쿠키가 사라졌어도 HttpOnly refresh 쿠키가 유효하면 복원합니다.
    if (!authStore.isLoggedIn) {
      const data = await $fetch<any>('/api/auth/refresh', { method: 'POST' })
      authStore.setAuth(data.user, data.accessToken, data.rememberMe)
    }
    const user = await $api<any>('/mypage/profile')
    authStore.setAuth(user, authStore.accessToken ?? authStore.persistentToken!,
      !!authStore.rememberMeCookie || !!authStore.persistentUser)
  } catch {
    // 인증 실패는 useApi에서 처리합니다. 네트워크 장애에는 기존 상태를 보존합니다.
    // 비로그인 방문자의 refresh 401은 정상이며 로그인 화면으로 강제 이동하지 않습니다.
=======
  if (!authStore.isLoggedIn) return

  const { $api } = useApi()

  try {
    await $api('/mypage/profile')
  } catch (error: any) {
    const status = error?.status || error?.statusCode
    if (status === 401 || status === 403) {
      authStore.clearAuth()
      await navigateTo('/login')
    }
>>>>>>> fe68c4d19848374d3b1d311c9a22684453dee1c1
  }
})
