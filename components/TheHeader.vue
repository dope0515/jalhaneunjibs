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
              title="잘하는 집 보기 페이지로 이동하기"
            >
              잘하는 집 보기
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
          <li class="nav-item">
            <NuxtLink
              to="/recommend"
              class="nav-link"
              title="오늘 뭐 먹지 페이지로 이동하기"
            >
              오늘 뭐 먹지
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink
              to="/board"
              class="nav-link"
              title="건의·문의 페이지로 이동하기"
            >
              건의·문의
            </NuxtLink>
          </li>
          <li v-if="isAdmin" class="nav-item">
            <NuxtLink
              to="/admin"
              class="nav-link"
              title="관리자 페이지로 이동하기"
            >
              관리자 페이지
            </NuxtLink>
          </li>
          <li v-if="authStore.isLoggedIn" class="nav-item">
            <NuxtLink to="/mypage" class="user-profile" title="마이페이지로 이동">
              <div class="user-avatar">{{ userInitial }}</div>
              <span class="user-nickname">{{ authStore.user?.nickname }}</span>
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
    <Transition name="drawer-slide" @after-leave="handleAfterLeave">
      <nav v-if="menuOpen" class="nav-drawer">
        <div class="nav-drawer__header">
          <span class="nav-drawer__logo">잘하는 집을<br>안 가봐서 그래</span>
          <button class="nav-drawer__close" @click="menuOpen = false" aria-label="메뉴 닫기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 모바일 유저 정보 -->
        <div v-if="authStore.isLoggedIn" class="nav-drawer__user">
          <NuxtLink to="/mypage" class="user-profile" @click="menuOpen = false">
            <div class="user-avatar">{{ userInitial }}</div>
            <div class="user-info">
              <span class="user-nickname">{{ authStore.user?.nickname }}</span>
              <span class="user-email">{{ authStore.user?.email }}</span>
            </div>
          </NuxtLink>
        </div>

        <ul class="nav-drawer__list">
          <li>
            <NuxtLink to="/restaurants" class="nav-drawer__link" @click="menuOpen = false">
              잘하는 집 보기
            </NuxtLink>
          </li>
          <li>
            <button type="button" class="nav-drawer__link" @click="goToRegisterMobile">
              잘하는 집 알려주기
            </button>
          </li>
          <li>
            <NuxtLink to="/recommend" class="nav-drawer__link" @click="menuOpen = false">
              오늘 뭐 먹지
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/board" class="nav-drawer__link" @click="menuOpen = false">
              건의·문의
            </NuxtLink>
          </li>
          <li v-if="isAdmin">
            <NuxtLink to="/admin" class="nav-drawer__link" @click="menuOpen = false">
              관리
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
const { logout, isAdmin } = useAuth()
const menuOpen = ref(false)
const route = useRoute()

// 드로어 열릴 때 배경 스크롤 방지
const scrollLock = ref(false)
let scrollPos = 0

watch(menuOpen, (val) => {
  if (val) {
    scrollPos = window.scrollY
    document.body.style.top = `-${scrollPos}px`
    scrollLock.value = true
  }
})

const handleAfterLeave = () => {
  scrollLock.value = false
  document.body.style.top = ''
  window.scrollTo(0, scrollPos)
}

useHead({
  bodyAttrs: {
    class: computed(() => scrollLock.value ? 'overflow-hidden' : '')
  }
})

const userInitial = computed(() => {
  const name = authStore.user?.nickname || '?'
  return name.charAt(0).toUpperCase()
})

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
