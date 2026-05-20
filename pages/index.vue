<template>
  <section class="main-section">
    <div class="inner">
      <div class="content-wrap">
        <div class="title-bx">
          <h1 class="title">잘하는 집을<br><span>안 가봐서 </span>그래</h1>
        </div>
        <div class="desc-bx">
          <p>그 음식이 별로라고?<br>그건 자네가 잘하는 집을 안 가봐서 그래</p>
          <div class="btn-bx">
            <AppButton
              to="/restaurants"
              color="black"
              shape="round"
              arrow>
              잘하는 집 보러가기
            </AppButton>
            <AppButton
              color="red"
              variant="outline"
              shape="round"
              arrow
              @click="goToRegister">
              잘하는 집 알려주기
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { isLoggedIn } = useAuth()

const goToRegister = () => {
  if (!isLoggedIn.value) {
    alert('로그인 후 이용 가능합니다.')
    navigateTo('/login')
    return
  }
  navigateTo('/restaurants/register')
}
</script>