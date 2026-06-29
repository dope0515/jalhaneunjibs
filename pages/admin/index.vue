<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1 class="admin-page__title">대시보드</h1>
      <p class="admin-page__desc">서비스 현황과 최근 활동을 확인합니다.</p>
    </div>

    <div v-if="pending" class="admin-empty">
      <AppLoading />
    </div>
    <div v-else-if="error" class="admin-empty">
      데이터를 불러오지 못했습니다.
    </div>
    <template v-else>
      <div class="admin-stats">
        <div class="admin-stats__card">
          <div class="admin-stats__label">회원</div>
          <div class="admin-stats__value">{{ stats.userCount }}</div>
          <div class="admin-stats__sub">최근 7일 +{{ stats.newUsersWeek }}</div>
        </div>
        <div class="admin-stats__card">
          <div class="admin-stats__label">매장</div>
          <div class="admin-stats__value">{{ stats.restaurantCount }}</div>
          <div class="admin-stats__sub">최근 7일 +{{ stats.newRestaurantsWeek }}</div>
        </div>
        <div class="admin-stats__card">
          <div class="admin-stats__label">리뷰</div>
          <div class="admin-stats__value">{{ stats.reviewCount }}</div>
        </div>
        <div class="admin-stats__card">
          <div class="admin-stats__label">댓글</div>
          <div class="admin-stats__value">{{ stats.commentCount }}</div>
        </div>
        <div class="admin-stats__card admin-stats__card--warn">
          <div class="admin-stats__label">건의·문의 (미답변)</div>
          <div class="admin-stats__value">{{ stats.pendingPosts }}</div>
          <div class="admin-stats__sub">전체 {{ stats.postCount }}건</div>
        </div>
        <div class="admin-stats__card">
          <div class="admin-stats__label">기미상궁 / 숨김</div>
          <div class="admin-stats__value">{{ stats.tasterCount }} / {{ stats.hiddenCount }}</div>
        </div>
      </div>

      <div class="admin-panel">
        <div class="admin-panel__title">최근 등록 매장</div>
        <div class="admin-panel__body">
          <ul v-if="recent.restaurants.length" class="admin-recent-list">
            <li v-for="item in recent.restaurants" :key="item.id" class="admin-recent-list__item">
              <div>
                <NuxtLink :to="`/restaurants/${item.id}`" class="admin-recent-list__title admin-table__link">
                  {{ item.name }}
                </NuxtLink>
                <div class="admin-recent-list__meta">
                  {{ item.foodCategory }} · {{ statusLabel(item.status) }} · {{ item.registeredBy?.nickname || '알 수 없음' }}
                </div>
              </div>
              <span class="admin-recent-list__date">{{ formatDate(item.createdAt) }}</span>
            </li>
          </ul>
          <p v-else class="admin-empty">최근 등록 매장이 없습니다.</p>
        </div>
      </div>

      <div class="admin-panel">
        <div class="admin-panel__title">최근 리뷰</div>
        <div class="admin-panel__body">
          <ul v-if="recent.reviews.length" class="admin-recent-list">
            <li v-for="item in recent.reviews" :key="item.id" class="admin-recent-list__item">
              <div>
                <NuxtLink :to="`/restaurants/${item.restaurant.id}`" class="admin-recent-list__title admin-table__link">
                  {{ item.restaurant.name }}
                </NuxtLink>
                <div class="admin-recent-list__meta">
                  ★ {{ item.rating }} · {{ item.user?.nickname }} · {{ truncate(item.content, 60) }}
                </div>
              </div>
              <span class="admin-recent-list__date">{{ formatDate(item.createdAt) }}</span>
            </li>
          </ul>
          <p v-else class="admin-empty">최근 리뷰가 없습니다.</p>
        </div>
      </div>

      <div class="admin-panel">
        <div class="admin-panel__title">최근 건의·문의</div>
        <div class="admin-panel__body">
          <ul v-if="recent.posts.length" class="admin-recent-list">
            <li v-for="item in recent.posts" :key="item.id" class="admin-recent-list__item">
              <div>
                <span class="admin-recent-list__title">{{ item.title }}</span>
                <div class="admin-recent-list__meta">
                  {{ item.user?.nickname }} ·
                  <span :class="item.reply ? 'admin-badge admin-badge--answered' : 'admin-badge admin-badge--pending'">
                    {{ item.reply ? '답변완료' : '미답변' }}
                  </span>
                </div>
              </div>
              <span class="admin-recent-list__date">{{ formatDate(item.createdAt) }}</span>
            </li>
          </ul>
          <p v-else class="admin-empty">최근 건의·문의가 없습니다.</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { $api } = useApi()

const { data, pending, error } = await useAsyncData('admin-stats', () => $api('/admin/stats'))

const stats = computed(() => data.value?.stats || {})
const recent = computed(() => data.value?.recent || { restaurants: [], reviews: [], posts: [] })

const statusLabel = (status) => {
  const map = { ACTIVE: '운영중', CLOSED: '폐업', HIDDEN: '숨김', TASTER: '기미상궁' }
  return map[status] || status
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

const truncate = (text, len) => {
  if (!text) return ''
  return text.length > len ? `${text.slice(0, len)}…` : text
}
</script>
