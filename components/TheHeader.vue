<template>
  <header class="header" id="header">
    <div class="inner">
      <NuxtLink 
        to="/"
        class="logo"
      >
        잘하는 집을<br>안 가봐서 그래
      </NuxtLink>
      <nav class="nav">
        <ul class="nav-list">
          <li class="nav-item">
            <NuxtLink to="/" class="nav-link">맛집 목록</NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/" class="nav-link">맛집 등록</NuxtLink>
          </li>
          <li class="nav-item">
            <AppButton v-if="!isLogin" @click="handleLogin"  variant="solid">
              LOGIN
            </AppButton>
            <AppButton v-else @click="handleLogout" variant="outline">
              LOGOUT
            </AppButton>
          </li>
        </ul>
      </nav>
    </div>
  </header>
</template>

<script setup>
  const isLogin = ref(false);

  const handleLogout = () => {
    // 로그아웃 로직...
    isLogin.value = false
  }

  const handleLogin = () => {
    // 로그인 로직...
    isLogin.value = true
  }
  
</script>