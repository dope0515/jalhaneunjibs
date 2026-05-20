<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
const { $api } = useApi()
const { user, accessToken, isLoggedIn } = useAuth()
const authStore = useAuthStore()

// 토큰은 있지만 user 쿠키에 role이 없는 경우(구버전 쿠키) 서버에서 프로필 재조회
if (isLoggedIn.value && !user.value?.role && accessToken.value) {
  try {
    const profile = await $api('/mypage/profile')
    authStore.setAuth(
      {
        id: profile.id,
        username: profile.username,
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
