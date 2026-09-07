<template>
  <section class="main-section">
    <div class="inner">
      <div class="main-content">
        <!-- Hero Row: 헤더 왼쪽 + 랭킹 카드 오른쪽 -->
        <div class="hero-row" data-aos="fade-up">
          <!-- 메인 헤더 영역 -->
          <div class="main-header">
            <h1 class="main-title">
              잘하는 집을<br>
              <span class="highlight">안 가봐서</span> 그래
            </h1>
            <p class="main-desc">
              그 음식이 별로라고? <br>
              그건 자네가 진짜 잘하는 집을 안 가봐서 그래.
            </p>
            <div class="main-header-btns">
              <AppButton to="/restaurants" color="green" size="lg" shape="round" arrow>
                잘하는 집 보기
              </AppButton>
              <AppButton to="/restaurants/register" variant="outline" color="black" size="lg" shape="round" arrow>
                잘하는 집 알려주기
              </AppButton>
            </div>
          </div>

          <!-- 1. 잘하는 집 순위 카드 (오른쪽) -->
          <NuxtLink :to="topRestaurant ? `/restaurants/${topRestaurant.id}` : '/restaurants?sort=rating'" class="feature-card ranking">
            <div class="card-bg">
              <img v-if="topRestaurant?.thumbnail" :src="topRestaurant.thumbnail" alt="Top Restaurant">
              <div v-else class="default-bg"></div>
            </div>
            <div class="card-overlay">
              <div class="card-tag">BEST RANKING</div>
              <div class="card-info">
                <template v-if="topRestaurant">
                  <span class="restaurant-name">{{ topRestaurant.name }}</span>
                  <div class="rating-info">
                    <img src="~/assets/images/icon/ic_star.svg" alt="Rating">
                    <span>{{ topRestaurant.averageRating.toFixed(1) }}</span>
                    <span class="review-count">({{ topRestaurant.reviewCount }}개의 리뷰)</span>
                  </div>
                </template>
                <template v-else>
                  <span class="restaurant-name">잘하는 집 순위</span>
                  <p>최고의 평점을 받은 맛집을 확인하세요</p>
                </template>
              </div>
              <div class="card-footer">
                <span class="label">{{ topRestaurant ? '바로 가기' : '순위 보러가기' }}</span>
                <i class="icon-arrow"></i>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- 하단 기능 카드 나열 -->
        <div class="sub-grid" data-aos="fade-up" data-aos-delay="100">
          <!-- 2. 잘하는 집 추천 -->
          <NuxtLink to="/recommend" class="feature-card recommend">
            <div class="card-content">
              <div class="icon-bx">
                <img src="~/assets/images/icon/ic_thumbs_up.svg" alt="Recommend">
              </div>
              <div class="text-bx">
                <h3 class="title">오늘 뭐 먹지</h3>
                <p class="desc">결정 장애가 올 때,<br>행운의 룰렛을 돌려보세요!</p>
              </div>
            </div>
            <div class="card-footer">
              <span class="label">추천받으러 가기</span>
              <i class="icon-arrow"></i>
            </div>
          </NuxtLink>

          <!-- 3. 운영진 소통 게시판 -->
          <NuxtLink to="/board" class="feature-card board">
            <div class="card-content">
              <div class="icon-bx">
                <img src="~/assets/images/icon/ic_chat.svg" alt="Board">
              </div>
              <div class="text-bx">
                <h3 class="title">건의·문의</h3>
                <p class="desc">불편한 점이나<br>필요한 기능을 제안해주세요.</p>
              </div>
            </div>
            <div class="card-footer">
              <span class="label">의견 남기기</span>
              <i class="icon-arrow"></i>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { $api } = useApi()

// 평점이 제일 높은 맛집 1곳 가져오기
const { data: topRestaurantData } = await useAsyncData('top-restaurant', () => $api('/restaurants', {
  query: { sort: 'rating', limit: 1 }
}))

const topRestaurant = computed(() => topRestaurantData.value?.restaurants?.[0] || null)

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
