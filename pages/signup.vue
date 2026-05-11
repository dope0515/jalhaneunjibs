<template>
  <section class="sign-up">
    <div class="inner">
      <div class="content-wrap">
        <div class="title-bx">
          <h1>미식의 새로운 기준,<br>여기서 시작됩니다.</h1>
          <p>엄선된 레스토랑 큐레이션과 프리미엄 미식 커뮤니티. 당신의 취향을 완성할 특별한 경험을 만나보세요.</p>
        </div>
        <div class="form-bx">
          <h2>환영합니다</h2>
          <p>서비스 이용을 위해 로그인해주세요.</p>
          <form @submit.prevent="handleSignup">
            <div class="form-item">
              <label for="email">아이디 (ID)</label>
              <AppInput 
                v-model="email"
                id="email"
                placeholder="이메일을 입력해주세요"
                autocomplete="username"
                required
              />
            </div>
            <div class="form-item">
              <label for="password">비밀번호 (Password)</label>
              <AppInput 
                v-model="password"
                id="password"
                type="password"
                placeholder="비밀번호를 입력해주세요"
                autocomplete="new-password"
                required
              />
            </div>
            <div class="form-item">
              <label for="passwordCheck">비밀번호 확인 (Password Check)</label>
              <AppInput 
                v-model="password"
                id="passwordCheck"
                type="password"
                placeholder="비밀번호를 다시 입력해주세요"
                autocomplete="new-password"
                required
              />
            </div>
            <div class="form-item">
              <label for="nickname">닉네임 (Nickname)</label>
              <AppInput 
                v-model="nickname"
                id="nickname"
                placeholder="닉네임을 입력해주세요"
                required
              />
            </div>
            <div class="btn-bx">
              <AppButton
                type="submit"
                color="black">
                회원가입
              </AppButton>
            </div>
            <div class="footer-bx">
              <p>이미 계정이 있으신가요? <NuxtLink to="/login">로그인하기</NuxtLink></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const email = ref('')
const password = ref('')
const nickname = ref('')

const handleSignup = async () => {
  try {
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        nickname: nickname.value
      }
    })
    alert('회원가입이 완료되었습니다! 로그인해 주세요.')
    navigateTo('/login') // 가입 성공 후 로그인 페이지로 이동
  } catch (error) {
    alert(error.data?.statusMessage || '회원가입에 실패했습니다.')
  }
}
</script>
