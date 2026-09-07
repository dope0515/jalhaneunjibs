<template>
  <section class="auth auth-signup">
    <div class="inner">
      <div class="content-wrap">
        <div class="title-bx">
          <h1 class="title">잘하는 집을,<br>안 가봐서 그래</h1>
          <p class="desc">그 음식이 별로라고? 그건 자네가 진짜 잘하는 집을 안 가봐서 그래</p>
        </div>
        <div class="form-bx">
          <div class="form-inner">
            <!-- 1단계: 회원가입 정보 입력 -->
            <template v-if="!isPendingVerification">
              <h2 class="title">환영합니다</h2>
              <p class="desc">서비스 이용을 위해 회원가입을 해주세요.</p>
              <form @submit.prevent="handleSignupSubmit">
                <div class="form-item">
                  <label for="email" class="form-item-label">이메일</label>
                  <AppInput 
                    v-model="email"
                    id="email"
                    type="email"
                    placeholder="이메일 주소를 입력해주세요"
                    autocomplete="email"
                    required
                  />
                </div>
                <div class="form-item">
                  <label for="password" class="form-item-label">비밀번호</label>
                  <AppInput 
                    v-model="password"
                    id="password"
                    type="password"
                    placeholder="영문, 숫자 포함 6자리 이상"
                    minlength = "6"
                    autocomplete="new-password"
                    required
                    show-password-toggle
                  />
                  <p v-if="password && !isPasswordValid" class="form-msg error">비밀번호는 영문과 숫자를 포함하여 6자리 이상이어야 합니다.</p>
                </div>
                <div class="form-item">
                  <label for="passwordCheck" class="form-item-label">비밀번호 확인</label>
                  <AppInput 
                    v-model="passwordCheck"
                    id="passwordCheck"
                    type="password"
                    placeholder="비밀번호를 다시 입력해주세요"
                    minlength = "6"
                    autocomplete="new-password"
                    required
                    show-password-toggle
                  />
                  <p v-if="passwordCheck && password !== passwordCheck" class="form-msg error">비밀번호가 일치하지 않습니다.</p>
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
                    title="회원가입 진행 버튼"
                    :disabled="isSendingCode"
                  >
                    {{ isSendingCode ? '인증 코드 전송 중...' : '회원가입' }}
                  </AppButton>
                </div>
                <div class="footer-bx">
                  <p class="desc">이미 계정이 있으신가요? <NuxtLink to="/login" class="link" title="로그인 페이지로 이동하기">로그인하기</NuxtLink></p>
                </div>
              </form>
            </template>

            <!-- 2단계: 이메일 인증 코드 입력 -->
            <template v-else>
              <h2 class="title">이메일 인증</h2>
              <p class="desc">입력하신 이메일 <strong>{{ email }}</strong>(으)로 6자리 인증 코드가 전송되었습니다. 확인 후 인증 코드를 입력해주세요.</p>
              <form @submit.prevent="handleVerifyAndSignup">
                <div class="form-item">
                  <label for="verificationCode" class="form-item-label">인증코드</label>
                  <div class="input-with-timer">
                    <AppInput 
                      v-model="verificationCode"
                      id="verificationCode"
                      placeholder="6자리 코드를 입력해주세요"
                      maxlength="6"
                      required
                      autocomplete="off"
                    />
                    <span class="timer-display" :class="{ 'timer-warning': timerSeconds < 60 }">{{ formattedTimer }}</span>
                  </div>
                  <p v-if="timerSeconds <= 0" class="form-msg error">인증 시간이 만료되었습니다. 재전송 버튼을 눌러주세요.</p>
                </div>
                
                <div class="verification-actions">
                  <AppButton
                    type="button"
                    size="sm"
                    color="black"
                    variant="outline"
                    @click="resendCode"
                    :disabled="isSendingCode"
                  >
                    {{ isSendingCode ? '재전송 중...' : '코드 재전송' }}
                  </AppButton>
                  <button type="button" class="back-link" @click="goBackToForm">
                    이메일 정보 수정
                  </button>
                </div>

                <div class="btn-bx">
                  <AppButton
                    type="submit"
                    color="green"
                    title="인증 및 가입 완료 버튼"
                    :disabled="isVerifyingCode || timerSeconds <= 0"
                  >
                    {{ isVerifyingCode ? '인증 및 가입 중...' : '인증 및 가입 완료' }}
                  </AppButton>
                </div>
              </form>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const { $api } = useApi()
const email = ref('')
const password = ref('')
const passwordCheck = ref('')
const nickname = ref('')

const isPendingVerification = ref(false)
const verificationCode = ref('')
const isSendingCode = ref(false)
const isVerifyingCode = ref(false)

const timerSeconds = ref(300)
let timerInterval = null

const isPasswordValid = computed(() => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/
  return passwordRegex.test(password.value)
})

const startTimer = () => {
  stopTimer()
  timerSeconds.value = 300
  timerInterval = setInterval(() => {
    if (timerSeconds.value > 0) {
      timerSeconds.value--
    } else {
      stopTimer()
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const formattedTimer = computed(() => {
  const m = Math.floor(timerSeconds.value / 60)
  const s = timerSeconds.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const handleSignupSubmit = async () => {
  if (!email.value || !password.value || !passwordCheck.value || !nickname.value) {
    alert('모든 필드를 입력해 주세요.')
    return
  }

  if (!isPasswordValid.value) {
    alert('비밀번호 조건을 확인해주세요 (영문, 숫자 포함 6자리 이상).')
    return
  }

  if (password.value !== passwordCheck.value) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }

  isSendingCode.value = true
  try {
    // 1. 이메일 중복 확인
    const { isAvailable } = await $api('/auth/check-email', {
      params: { email: email.value }
    })
    
    if (!isAvailable) {
      alert('이미 사용 중인 이메일입니다.')
      return
    }

    // 2. 인증 코드 발송
    await $api('/auth/verify-send', {
      method: 'POST',
      body: { email: email.value }
    })

    // 3. 타이머 가동 및 화면 전환
    startTimer()
    isPendingVerification.value = true
    alert('인증 코드가 전송되었습니다. 이메일을 확인해 주세요.')
  } catch (error) {
    alert(error.data?.statusMessage || '인증 코드 발송에 실패했습니다.')
  } finally {
    isSendingCode.value = false
  }
}

const handleVerifyAndSignup = async () => {
  if (!verificationCode.value || verificationCode.value.length !== 6) {
    alert('6자리 인증 코드를 입력해 주세요.')
    return
  }

  if (timerSeconds.value <= 0) {
    alert('인증 시간이 만료되었습니다. 다시 인증 코드를 발송해 주세요.')
    return
  }

  isVerifyingCode.value = true
  try {
    // 1. 코드 검증
<<<<<<< HEAD
    const { signupToken } = await $api('/auth/verify-code', {
=======
    await $api('/auth/verify-code', {
>>>>>>> fe68c4d19848374d3b1d311c9a22684453dee1c1
      method: 'POST',
      body: { 
        email: email.value,
        code: verificationCode.value
      }
    })

    // 2. 실제 회원가입 진행
    await $api('/auth/signup', {
      method: 'POST',
      body: {
        email: email.value,
        password: password.value,
        signupToken,
        nickname: nickname.value
      }
    })

    stopTimer()
    alert('회원가입이 완료되었습니다! 로그인해 주세요.')
    navigateTo('/login')
  } catch (error) {
    alert(error.data?.statusMessage || '인증 또는 가입 진행 중 오류가 발생했습니다.')
  } finally {
    isVerifyingCode.value = false
  }
}

const resendCode = async () => {
  isSendingCode.value = true
  try {
    await $api('/auth/verify-send', {
      method: 'POST',
      body: { email: email.value }
    })
    startTimer()
    alert('인증 코드가 재전송되었습니다. 이메일을 확인해 주세요.')
  } catch (error) {
    alert(error.data?.statusMessage || '인증 코드 재발송에 실패했습니다.')
  } finally {
    isSendingCode.value = false
  }
}

const goBackToForm = () => {
  stopTimer()
  isPendingVerification.value = false
  verificationCode.value = ''
}

onUnmounted(() => {
  stopTimer()
})
</script>

<style lang="scss" scoped>
.input-with-timer {
  position: relative;
  display: flex;
  align-items: center;

  :deep(.app-input) {
    flex: 1;
    input {
      padding-right: 60px; /* 타이머 영역을 감안한 여백 */
    }
  }

  .timer-display {
    position: absolute;
    right: 16px;
    font-size: 14px;
    font-weight: 500;
    color: #0d6b57;
    pointer-events: none;
    transition: color 0.3s ease;

    &.timer-warning {
      color: #dc3545;
      font-weight: bold;
      animation: pulse 1s infinite alternate;
    }
  }
}

.verification-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  margin-bottom: 24px;

  :deep(.app-button) {
    height: 38px;
    padding: 0 12px;
    font-size: 13px;
  }

  .back-link {
    font-size: 13px;
    color: #666;
    background: none;
    border: none;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s ease;

    &:hover {
      color: #000;
    }
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

@keyframes pulse {
  from { opacity: 0.6; }
  to { opacity: 1; }
}
</style>
