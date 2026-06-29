export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
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
  }
})
