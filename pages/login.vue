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
                  placeholder="비밀번호를 입력해주세요"
                  autocomplete="current-password"
                  required
                />
              </div>

              <div class="options-bx">
                <label class="remember-me">
                  <input type="checkbox" v-model="rememberMe" />
                  <span>로그인 상태 유지</span>
                </label>
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
                <p class="desc forgot-password-desc">비밀번호를 잊어버리셨나요? <button type="button" @click="openResetModal" class="link" title="비밀번호 찾기 팝업 열기">비밀번호 찾기</button></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- 비밀번호 재설정 모달 -->
    <Transition name="fade">
      <div v-if="showResetModal" class="modal-overlay" @click.self="closeResetModal">
        <Transition name="slide-up">
          <div class="modal-card">
            <button type="button" class="modal-close" @click="closeResetModal" aria-label="모달 닫기">
              &times;
            </button>
            
            <div class="modal-content">
              <!-- 1단계: 이메일 전송 -->
              <div v-if="resetStep === 'send'" class="modal-step">
                <h3 class="modal-title">비밀번호 찾기</h3>
                <p class="modal-desc">가입 시 등록하신 이메일 주소를 입력해 주세요. 비밀번호 재설정을 위한 인증 코드를 발송해 드립니다.</p>
                
                <form @submit.prevent="handleSendResetCode">
                  <div class="form-item">
                    <label for="resetEmail" class="form-item-label">이메일</label>
                    <AppInput
                      v-model="resetEmail"
                      id="resetEmail"
                      type="email"
                      placeholder="이메일 주소를 입력해주세요"
                      required
                    />
                  </div>
                  
                  <div class="btn-bx">
                    <AppButton
                      type="submit"
                      color="green"
                      :disabled="isSendingResetCode"
                    >
                      {{ isSendingResetCode ? '인증 코드 발송 중...' : '인증 코드 받기' }}
                    </AppButton>
                  </div>
                </form>
              </div>
              
              <!-- 2단계: 인증코드 입력 및 패스워드 재설정 -->
              <div v-else class="modal-step">
                <h3 class="modal-title">비밀번호 재설정</h3>
                <p class="modal-desc"><strong>{{ resetEmail }}</strong>(으)로 6자리 인증 코드가 전송되었습니다. 5분 이내에 코드를 입력하고 새 비밀번호를 설정해 주세요.</p>
                
                <form @submit.prevent="handleVerifyAndReset">
                  <!-- 인증코드 입력 -->
                  <div class="form-item">
                    <label for="resetCode" class="form-item-label">인증코드</label>
                    <div class="input-with-timer">
                      <AppInput
                        v-model="resetCode"
                        id="resetCode"
                        placeholder="6자리 코드를 입력해주세요"
                        maxlength="6"
                        required
                        autocomplete="off"
                      />
                      <span class="timer-display" :class="{ 'timer-warning': resetTimerSeconds < 60 }">
                        {{ formattedResetTimer }}
                      </span>
                    </div>
                    <p v-if="resetTimerSeconds <= 0" class="form-msg error">인증 시간이 만료되었습니다. 재전송 버튼을 눌러주세요.</p>
                  </div>

                  <!-- 새 비밀번호 -->
                  <div class="form-item">
                    <label for="newPassword" class="form-item-label">새로운 비밀번호</label>
                    <AppInput
                      v-model="newPassword"
                      id="newPassword"
                      type="password"
                      placeholder="영문, 숫자 포함 6자리 이상"
                      minlength="6"
                      required
                      show-password-toggle
                    />
                    <p v-if="newPassword && !isNewPasswordValid" class="form-msg error">
                      비밀번호는 영문과 숫자를 포함하여 6자리 이상이어야 합니다.
                    </p>
                  </div>

                  <!-- 새 비밀번호 확인 -->
                  <div class="form-item">
                    <label for="newPasswordCheck" class="form-item-label">비밀번호 확인</label>
                    <AppInput
                      v-model="newPasswordCheck"
                      id="newPasswordCheck"
                      type="password"
                      placeholder="새로운 비밀번호를 다시 입력해주세요"
                      minlength="6"
                      required
                      show-password-toggle
                    />
                    <p v-if="newPasswordCheck && !isPasswordMatch" class="form-msg error">
                      비밀번호가 일치하지 않습니다.
                    </p>
                  </div>

                  <!-- 부가 작업 액션 -->
                  <div class="verification-actions">
                    <AppButton
                      type="button"
                      size="sm"
                      color="white"
                      variant="outline"
                      @click="resendResetCode"
                      :disabled="isSendingResetCode"
                    >
                      {{ isSendingResetCode ? '재전송 중...' : '코드 재전송' }}
                    </AppButton>
                    <button type="button" class="back-link" @click="goBackToSendStep">
                      이메일 재입력
                    </button>
                  </div>
                  
                  <div class="btn-bx">
                    <AppButton
                      type="submit"
                      color="green"
                      :disabled="isResettingPassword || resetTimerSeconds <= 0"
                    >
                      {{ isResettingPassword ? '비밀번호 변경 중...' : '비밀번호 재설정 완료' }}
                    </AppButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

const { $api } = useApi()
const { login } = useAuth()
const { withLoading } = useLoading()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)

// 비밀번호 찾기 모달 관련 상태
const showResetModal = ref(false)
const resetStep = ref('send') // 'send' | 'verify'
const resetEmail = ref('')
const resetCode = ref('')
const newPassword = ref('')
const newPasswordCheck = ref('')

const isSendingResetCode = ref(false)
const isResettingPassword = ref(false)

const resetTimerSeconds = ref(300)
let resetTimerInterval = null

const isNewPasswordValid = computed(() => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/
  return passwordRegex.test(newPassword.value)
})

const isPasswordMatch = computed(() => {
  return newPassword.value !== '' && newPassword.value === newPasswordCheck.value
})

const formattedResetTimer = computed(() => {
  const m = Math.floor(resetTimerSeconds.value / 60)
  const s = resetTimerSeconds.value % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const startResetTimer = () => {
  stopResetTimer()
  resetTimerSeconds.value = 300
  resetTimerInterval = setInterval(() => {
    if (resetTimerSeconds.value > 0) {
      resetTimerSeconds.value--
    } else {
      stopResetTimer()
    }
  }, 1000)
}

const stopResetTimer = () => {
  if (resetTimerInterval) {
    clearInterval(resetTimerInterval)
    resetTimerInterval = null
  }
}

const openResetModal = () => {
  showResetModal.value = true
  resetStep.value = 'send'
  resetEmail.value = ''
  resetCode.value = ''
  newPassword.value = ''
  newPasswordCheck.value = ''
  stopResetTimer()
}

const closeResetModal = () => {
  showResetModal.value = false
  stopResetTimer()
}

const goBackToSendStep = () => {
  stopResetTimer()
  resetStep.value = 'send'
  resetCode.value = ''
  newPassword.value = ''
  newPasswordCheck.value = ''
}

const handleSendResetCode = async () => {
  if (!resetEmail.value) {
    alert('이메일 주소를 입력해주세요.')
    return
  }

  isSendingResetCode.value = true
  try {
    await $api('/auth/reset-password-send', {
      method: 'POST',
      body: { email: resetEmail.value }
    })

    alert('비밀번호 재설정 코드가 전송되었습니다. 이메일을 확인해 주세요.')
    resetStep.value = 'verify'
    startResetTimer()
  } catch (error) {
    alert(error.data?.statusMessage || '인증 코드 발송에 실패했습니다.')
  } finally {
    isSendingResetCode.value = false
  }
}

const resendResetCode = async () => {
  isSendingResetCode.value = true
  try {
    await $api('/auth/reset-password-send', {
      method: 'POST',
      body: { email: resetEmail.value }
    })

    alert('인증 코드가 재전송되었습니다. 이메일을 확인해 주세요.')
    startResetTimer()
  } catch (error) {
    alert(error.data?.statusMessage || '인증 코드 재발송에 실패했습니다.')
  } finally {
    isSendingResetCode.value = false
  }
}

const handleVerifyAndReset = async () => {
  if (!resetCode.value || resetCode.value.length !== 6) {
    alert('6자리 인증 코드를 입력해 주세요.')
    return
  }

  if (resetTimerSeconds.value <= 0) {
    alert('인증 시간이 만료되었습니다. 다시 인증 코드를 발송해 주세요.')
    return
  }

  if (!isNewPasswordValid.value) {
    alert('비밀번호 조건을 확인해주세요 (영문, 숫자 포함 6자리 이상).')
    return
  }

  if (newPassword.value !== newPasswordCheck.value) {
    alert('비밀번호가 일치하지 않습니다.')
    return
  }

  isResettingPassword.value = true
  try {
    await $api('/auth/reset-password-verify', {
      method: 'POST',
      body: {
        email: resetEmail.value,
        code: resetCode.value,
        newPassword: newPassword.value
      }
    })

    stopResetTimer()
    alert('비밀번호가 성공적으로 변경되었습니다. 새로운 비밀번호로 로그인해 주세요.')
    closeResetModal()
  } catch (error) {
    alert(error.data?.statusMessage || '비밀번호 재설정에 실패했습니다.')
  } finally {
    isResettingPassword.value = false
  }
}

const handleLogin = async () => {
  await withLoading(async () => {
    await login({
      login: email.value,
      password: password.value,
      rememberMe: rememberMe.value
    })
  })
}

onUnmounted(() => {
  stopResetTimer()
})
</script>

<style lang="scss" scoped>
/* 페이지 전용 스타일은 assets/scss/pages/_auth.scss 에서 관리합니다. */
</style>