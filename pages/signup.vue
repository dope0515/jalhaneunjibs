<template>
  <section class="auth auth-signup">
    <div class="inner">
      <div class="content-wrap">
        <div class="title-bx">
          <h1 class="title">미식의 새로운 기준,<br>여기서 시작됩니다.</h1>
          <p class="desc">엄선된 레스토랑 큐레이션과 프리미엄 미식 커뮤니티. 당신의 취향을 완성할 특별한 경험을 만나보세요.</p>
        </div>
        <div class="form-bx">
          <div class="form-inner">
            <h2 class="title">환영합니다</h2>
            <p class="desc">서비스 이용을 위해 회원가입을 해주세요.</p>
            <form @submit.prevent="handleSignup">
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
              <div class="form-item">
                <label for="passwordCheck" class="form-item-label">비밀번호 확인</label>
                <AppInput 
                  v-model="passwordCheck"
                  id="passwordCheck"
                  type="password"
                  placeholder="비밀번호를 다시 입력해주세요"
                  autocomplete="new-password"
                  required
                />
              </div>
              <div class="form-item">
                <label for="email" class="form-item-label">이메일</label>
                <div class="input-with-btn">
                  <AppInput 
                    ref="emailInput"
                    v-model="email"
                    id="email"
                    type="email"
                    placeholder="이메일을 입력해주세요"
                    autocomplete="email"
                    required
                    :disabled="isEmailVerified"
                  />
                  <AppButton 
                    type="button" 
                    size="sm" 
                    color="black"
                    @click="checkEmail"
                    :disabled="isEmailVerified"
                  >
                    중복확인
                  </AppButton>
                </div>
                <p v-if="emailMessage" :class="['form-msg', isEmailAvailable ? 'success' : 'error']">{{ emailMessage }}</p>
              </div>

              <!-- 이메일 인증 영역 -->
              <div v-if="isEmailAvailable && !isEmailVerified" class="form-item">
                <label class="form-item-label">이메일 인증</label>
                <div class="input-with-btn">
                  <AppButton 
                    type="button" 
                    size="sm" 
                    color="black"
                    @click="sendVerificationCode"
                    :disabled="isSendingCode"
                  >
                    {{ isSendingCode ? '전송 중...' : '인증코드 전송' }}
                  </AppButton>
                </div>
              </div>

              <div v-if="isCodeSent && !isEmailVerified" class="form-item">
                <label for="verificationCode" class="form-item-label">인증코드</label>
                <div class="input-with-btn">
                  <AppInput 
                    ref="codeInput"
                    v-model="verificationCode"
                    id="verificationCode"
                    placeholder="6자리 코드를 입력해주세요"
                    required
                  />
                  <AppButton 
                    type="button" 
                    size="sm" 
                    color="black"
                    @click="verifyCode"
                  >
                    인증하기
                  </AppButton>
                </div>
              </div>

              <div class="form-item">
                <label for="nickname" class="form-item-label">닉네임</label>
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
                  color="green"
                  title="회원가입 버튼"
                >
                  회원가입
                </AppButton>
              </div>
              <div class="footer-bx">
                <p class="desc">이미 계정이 있으신가요? <NuxtLink to="/login" class="link" title="로그인 페이지로 이동하기">로그인하기</NuxtLink></p>
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
const email = ref('')
const password = ref('')
const passwordCheck = ref('')
const nickname = ref('')

const emailInput = ref(null)
const codeInput = ref(null)

const verificationCode = ref('')
const isEmailAvailable = ref(false)
const isEmailVerified = ref(false)
const isCodeSent = ref(false)
const isSendingCode = ref(false)
const emailMessage = ref('')

const checkEmail = async () => {
  if (!emailInput.value?.input.reportValidity()) return
  
  try {
    const { isAvailable } = await $fetch('/api/auth/check-email', {
      params: { email: email.value }
    })
    
    isEmailAvailable.value = isAvailable
    if (isAvailable) {
      emailMessage.value = '사용 가능한 이메일입니다.'
    } else {
      emailMessage.value = '이미 사용 중인 이메일입니다.'
    }
  } catch (error) {
    emailMessage.value = '이메일 확인 중 오류가 발생했습니다.'
  }
}

const sendVerificationCode = async () => {
  if (!emailInput.value?.input.reportValidity()) return

  isSendingCode.value = true
  try {
    await $fetch('/api/auth/verify-send', {
      method: 'POST',
      body: { email: email.value }
    })
    isCodeSent.value = true
    alert('인증 코드가 전송되었습니다. 이메일을 확인해주세요.')
  } catch (error) {
    alert(error.data?.statusMessage || '코드 전송에 실패했습니다.')
  } finally {
    isSendingCode.value = false
  }
}

const verifyCode = async () => {
  if (!codeInput.value?.input.reportValidity()) return

  try {
    await $fetch('/api/auth/verify-code', {
      method: 'POST',
      body: { 
        email: email.value,
        code: verificationCode.value
      }
    })
    isEmailVerified.value = true
    alert('이메일 인증이 완료되었습니다.')
  } catch (error) {
    alert(error.data?.statusMessage || '인증에 실패했습니다.')
  }
}

const handleSignup = async () => {
  if (!isEmailVerified.value) {
    alert('이메일 인증이 필요합니다.')
    return
  }

  if (password.value !== passwordCheck.value) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }

  try {
    await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        username: id.value,
        email: email.value,
        password: password.value,
        nickname: nickname.value
      }
    })
    alert('회원가입이 완료되었습니다! 로그인해 주세요.')
    navigateTo('/login')
  } catch (error) {
    alert(error.data?.statusMessage || '회원가입에 실패했습니다.')
  }
}
</script>

<style lang="scss" scoped>
.input-with-btn {
  display: flex;
  gap: 8px;
  align-items: flex-start;

  .app-input {
    flex: 1;
  }

  :deep(.app-button) {
    flex-shrink: 0;
    height: 48px; // AppInput 높이에 맞춤
    padding: 0 16px;
    white-space: nowrap;
  }
}

.form-msg {
  margin-top: 4px;
  font-size: 12px;
  
  &.success {
    color: #28a745;
  }
  
  &.error {
    color: #dc3545;
  }
}
</style>
