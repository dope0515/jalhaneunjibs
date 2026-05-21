<template>
  <!-- 상단 진행 바 (페이지 이동 시 자동 표시) -->
  <NuxtLoadingIndicator color="#0d6b57" :height="3" />

  <!-- 전체 화면 로딩 오버레이 (페이지 전환 or 전역 withLoading 사용 시) -->
  <AppLoading :loading="isPageLoading || isLoading" />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
const { $api } = useApi()
const { user, accessToken, isLoggedIn } = useAuth()
const authStore = useAuthStore()
const { isLoading } = useLoading()

// ─── 전역 페이지 로딩 상태 ─────────────────────────────────────────────────────
const isPageLoading = ref(false)
let loadingTimer = null

const nuxtApp = useNuxtApp()

// 페이지 전환 시작
nuxtApp.hook('page:loading:start', () => {
  // 즉시 표시하면 빠른 전환에서 깜빡임 → 100ms 딜레이 후 표시
  loadingTimer = setTimeout(() => {
    isPageLoading.value = true
  }, 100)
})

// 페이지 전환 완료
nuxtApp.hook('page:loading:end', () => {
  if (loadingTimer) {
    clearTimeout(loadingTimer)
    loadingTimer = null
  }
  isPageLoading.value = false
})

// ─── 구버전 쿠키 role 보정 ────────────────────────────────────────────────────
if (isLoggedIn.value && !user.value?.role && accessToken.value) {
  try {
    const profile = await $api('/mypage/profile')
    authStore.setAuth(
      {
        id: profile.id,
        email: profile.email,
        nickname: profile.nickname,
        role: profile.role,
      },
      accessToken.value,
    )
  } catch {
    // 토큰 만료 등 — 무시하고 계속 진행
  }
}
</script>
