<template>
  <section class="auth auth-login">
    <div class="inner">
      <div class="content-wrap">
       <div class="title-bx">
          <h1 class="title">미식의 새로운 기준,<br>여기서 시작됩니다.</h1>
          <p class="desc">엄선된 레스토랑 큐레이션과 프리미엄 미식 커뮤니티. 당신의 취향을 완성할 특별한 경험을 만나보세요.</p>
        </div>
        <div class="form-bx">
          <div class="form-inner">
            <h2 class="title">환영합니다</h2>
            <p class="desc">서비스 이용을 위해 로그인해주세요.</p>
            <form @submit.prevent="handleLogin">
              <div class="form-item">
                <label for="id" class="form-item-label">아이디</label>
                <AppInput 
                  v-model="id"
                  id="id"
                  placeholder="아이디를 입력해주세요"
                  autocomplete="username"
                  required
                />
              </div>
              <div class="form-item">
                <label for="password" class="form-item-label">비밀번호</label>
                <AppInput 
                  v-model="password"
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력해주세요"
                  autocomplete="new-password"
                  required
                />
              </div>
              <div class="btn-bx">
                <AppButton
                  type="submit"
                  color="green"
                  title="로그인 버튼">
                  로그인
                </AppButton>
              </div>
              <div class="footer-bx">
                <p class="desc">아직 계정이 없으신가요? <NuxtLink to="/signup" class="link" title="회원가입 페이지로 이동하기">회원가입하기</NuxtLink></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const id = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: id.value,
        password: password.value
      }
    })
    alert('로그인 되었습니다! 메인 페이지로 이동합니다.')
    navigateTo('/') // 로그인 성공 후 메인 페이지로 이동
  } catch (error) {
    alert(error.data?.statusMessage || '로그인에 실패했습니다.')
  }
}
</script>