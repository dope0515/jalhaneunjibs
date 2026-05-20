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

      <!-- 데스크탑 nav -->
      <nav class="nav">
        <ul class="nav-list">
          <li class="nav-item">
            <NuxtLink 
              to="/restaurants" 
              class="nav-link" 
              title="잘하는 집 보러가기 페이지로 이동하기"
            >
              잘하는 집 보러가기
            </NuxtLink>
          </li>
          <li class="nav-item">
            <button 
              type="button"
              class="nav-link" 
              title="잘하는 집 알려주기 페이지로 이동하기"
              @click="goToRegister"
            >
              잘하는 집 알려주기
            </button>
          </li>
          <li v-if="authStore.isLoggedIn" class="nav-item">
            <NuxtLink to="/mypage" class="nav-link" title="마이페이지로 이동">
              마이페이지
            </NuxtLink>
          </li>
          <li class="nav-item">
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

      <!-- 모바일 햄버거 버튼 -->
      <button
        class="hamburger"
        :class="{ 'is-open': menuOpen }"
        @click="menuOpen = !menuOpen"
        aria-label="메뉴 열기"
      >
        <span class="hamburger__line" />
        <span class="hamburger__line" />
        <span class="hamburger__line" />
      </button>
    </div>

    <!-- 모바일 드로어 오버레이 -->
    <Transition name="overlay-fade">
      <div v-if="menuOpen" class="nav-overlay" @click="menuOpen = false" />
    </Transition>

    <!-- 모바일 드로어 -->
    <Transition name="drawer-slide">
      <nav v-if="menuOpen" class="nav-drawer">
        <div class="nav-drawer__header">
          <span class="nav-drawer__logo">잘하는 집을<br>안 가봐서 그래</span>
          <button class="nav-drawer__close" @click="menuOpen = false" aria-label="메뉴 닫기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <ul class="nav-drawer__list">
          <li>
            <NuxtLink to="/restaurants" class="nav-drawer__link" @click="menuOpen = false">
              잘하는 집 보러가기
            </NuxtLink>
          </li>
          <li>
            <button type="button" class="nav-drawer__link" @click="goToRegisterMobile">
              잘하는 집 알려주기
            </button>
          </li>
          <li v-if="authStore.isLoggedIn">
            <NuxtLink to="/mypage" class="nav-drawer__link" @click="menuOpen = false">
              마이페이지
            </NuxtLink>
          </li>
        </ul>
        <div class="nav-drawer__footer">
          <AppButton
            v-if="!authStore.isLoggedIn"
            to="/login"
            color="green"
            class="nav-drawer__auth-btn"
            @click="menuOpen = false"
          >
            로그인
          </AppButton>
          <AppButton
            v-else
            variant="outline"
            class="nav-drawer__auth-btn"
            @click="handleLogoutMobile"
          >
            로그아웃
          </AppButton>
        </div>
      </nav>
    </Transition>
  </header>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const { logout } = useAuth()
const menuOpen = ref(false)
const route = useRoute()

// 페이지 이동 시 드로어 자동 닫기
watch(() => route.path, () => { menuOpen.value = false })

const goToRegister = () => {
  if (!authStore.isLoggedIn) {
    alert('로그인 후 이용 가능합니다.')
    navigateTo('/login')
    return
  }
  navigateTo('/restaurants/register')
}

const goToRegisterMobile = () => {
  menuOpen.value = false
  goToRegister()
}

const handleLogout = () => {
  logout()
}

const handleLogoutMobile = () => {
  menuOpen.value = false
  logout()
}
</script>

<style lang="scss" scoped>
.nav-link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: inherit;
  
  &:hover,
  &.router-link-active {
    color: $primary-color;
  }
}
</style>