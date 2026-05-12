<template>
  <header class="header" id="header">
    <div class="inner">
      <NuxtLink 
        to="/"
        class="logo"
        title="메인 페이지로 이동하기"
      >
        잘하는 집을<br>안 가봐서 그래
      </NuxtLink>
      <nav class="nav">
        <ul class="nav-list">
          <li class="nav-item">
            <NuxtLink to="/" class="nav-link" title="맛집 목록 페이지로 이동하기">맛집 목록</NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/" class="nav-link" title="맛집 등록 페이지로 이동하기">맛집 등록</NuxtLink>
          </li>
          <li class="nav-item">
            <!-- Pinia 스토어 상태 직접 참조 -->
            <AppButton 
              v-if="!authStore.isLoggedIn" 
              to="/login" 
              color="green"
              size="sm" 
              title="로그인 페이지로 이동하기">
              로그인
            </AppButton>
            <AppButton 
              v-else 
              @click="handleLogout" 
              size="sm" 
              variant="outline"
              title="로그아웃 버튼">
              로그아웃
            </AppButton>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script setup>
  import { useAuthStore } from '~/stores/auth'
  
  const authStore = useAuthStore()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }
</script>