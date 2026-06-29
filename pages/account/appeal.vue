<template>
  <section class="auth auth-appeal">
    <div class="inner">
      <div class="content-wrap">
        <div class="title-bx">
          <h1 class="title">계정 정지<br>해제 요청</h1>
          <p class="desc">정지된 계정은 로그인 없이 본인 확인 후 해제를 요청할 수 있습니다.</p>
        </div>
        <div class="form-bx">
          <div class="form-inner">
            <h2 class="title">해제 요청하기</h2>
            <p class="desc">가입 시 사용한 이메일과 비밀번호로 본인 확인 후 요청 내용을 남겨 주세요.</p>

            <div class="appeal-notice">
              운영팀이 내용을 확인한 뒤 건의·문의 답변 또는 이메일로 안내드립니다.
            </div>

            <form @submit.prevent="submitAppeal">
              <div class="form-item">
                <label for="appeal-email" class="form-item-label">이메일</label>
                <AppInput
                  id="appeal-email"
                  v-model="form.email"
                  type="email"
                  placeholder="가입 이메일"
                  autocomplete="email"
                  required
                />
              </div>
              <div class="form-item">
                <label for="appeal-password" class="form-item-label">비밀번호</label>
                <AppInput
                  id="appeal-password"
                  v-model="form.password"
                  type="password"
                  placeholder="비밀번호 (본인 확인용)"
                  autocomplete="current-password"
                  required
                  show-password-toggle
                />
              </div>
              <div class="form-item">
                <label for="appeal-title" class="form-item-label">제목 (선택)</label>
                <AppInput
                  id="appeal-title"
                  v-model="form.title"
                  placeholder="예: 정지 해제 요청드립니다"
                />
              </div>
              <div class="form-item">
                <label for="appeal-content" class="form-item-label">요청 내용</label>
                <textarea
                  id="appeal-content"
                  v-model="form.content"
                  class="form-textarea"
                  rows="6"
                  placeholder="정지 해제가 필요한 사유를 구체적으로 작성해 주세요."
                  required
                />
              </div>

              <div class="btn-bx">
                <AppButton type="submit" color="green" :disabled="submitting">
                  {{ submitting ? '접수 중…' : '해제 요청 제출' }}
                </AppButton>
              </div>
            </form>

            <div class="footer-bx">
              <p class="desc">
                <NuxtLink to="/login" class="link">로그인으로 돌아가기</NuxtLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const route = useRoute()
const { $api } = useApi()
const { withLoading } = useLoading()

const form = ref({
  email: String(route.query.email || ''),
  password: '',
  title: '',
  content: '',
})
const submitting = ref(false)

const submitAppeal = async () => {
  if (!form.value.email.trim() || !form.value.password.trim() || !form.value.content.trim()) {
    alert('이메일, 비밀번호, 요청 내용을 모두 입력해 주세요.')
    return
  }

  submitting.value = true
  try {
    await withLoading(async () => {
      const data = await $api('/account/appeal', {
        method: 'POST',
        body: {
          email: form.value.email.trim(),
          password: form.value.password,
          title: form.value.title.trim() || undefined,
          content: form.value.content.trim(),
        },
      })
      alert(data.message || '해제 요청이 접수되었습니다.')
      await navigateTo('/login')
    })
  } catch (error) {
    alert(error.data?.statusMessage || '요청 접수에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>
