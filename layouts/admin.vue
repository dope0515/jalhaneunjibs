<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-sidebar__brand">
        <NuxtLink to="/admin" class="admin-sidebar__logo">관리자</NuxtLink>
        <NuxtLink to="/" class="admin-sidebar__site-link">사이트로</NuxtLink>
      </div>

      <nav class="admin-sidebar__nav">
        <NuxtLink
          to="/admin"
          class="admin-sidebar__link"
          exact-active-class="is-active"
        >
          대시보드
        </NuxtLink>
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="admin-sidebar__link"
          active-class="is-active"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <span class="admin-topbar__user">{{ user?.nickname }} (관리자)</span>
        <button type="button" class="admin-topbar__logout" @click="logout">로그아웃</button>
      </header>

      <main class="admin-content">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup>
const { user, logout } = useAuth()

const navItems = [
  { to: '/admin/users', label: '회원 관리' },
  { to: '/admin/restaurants', label: '매장 관리' },
  { to: '/admin/reviews', label: '리뷰 관리' },
  { to: '/admin/comments', label: '댓글 관리' },
  { to: '/admin/posts', label: '건의·문의' },
]
</script>
