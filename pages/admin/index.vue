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
          <div class="admin-stats__label">숨김</div>
          <div class="admin-stats__value">{{ stats.hiddenCount }}</div>
        </div>
      </div>

      <div class="admin-panel">
        <div class="admin-panel__title">스토리지 사용량</div>
        <div class="admin-panel__body">
          <div v-if="storagePending" class="admin-empty">불러오는 중…</div>
          <div v-else class="admin-storage">
            <!-- DB -->
            <div class="admin-storage__item">
              <div class="admin-storage__head">
                <span class="admin-storage__name">데이터베이스 (PostgreSQL)</span>
                <span class="admin-storage__figure">
                  {{ formatBytes(dbStorage.usedBytes) }}
                  <template v-if="dbStorage.limitBytes"> / {{ formatBytes(dbStorage.limitBytes) }}</template>
                </span>
              </div>
              <div v-if="dbPercent !== null" class="admin-storage__bar">
                <div
                  class="admin-storage__bar-fill"
                  :class="barClass(dbPercent)"
                  :style="{ width: `${Math.min(dbPercent, 100)}%` }"
                />
              </div>
              <div class="admin-storage__sub">
                <template v-if="dbPercent !== null">{{ dbPercent.toFixed(1) }}% 사용</template>
                <template v-else>한도 미설정 · 사용량만 표시 (DB_STORAGE_LIMIT_MB로 한도 지정 가능)</template>
              </div>
              <ul v-if="dbStorage.tables?.length" class="admin-storage__tables">
                <li v-for="t in dbStorage.tables" :key="t.name">
                  <span>{{ t.name }}</span>
                  <span>{{ formatBytes(t.bytes) }}</span>
                </li>
              </ul>
            </div>

            <!-- Cloudinary -->
            <div class="admin-storage__item">
              <div class="admin-storage__head">
                <span class="admin-storage__name">이미지 (Cloudinary{{ cloudStorage?.plan ? ` · ${cloudStorage.plan}` : '' }})</span>
                <span class="admin-storage__figure">
                  <template v-if="cloudStorage?.storageBytes != null">
                    {{ formatCloudinaryMb(cloudStorage.storageBytes) }}
                  </template>
                  <template v-else-if="cloudStorage">-</template>
                  <template v-else>조회 실패</template>
                </span>
              </div>

              <!-- 무료 플랜: 크레딧 기준 진행 바 -->
              <div v-if="cloudCreditsPercent !== null" class="admin-storage__bar">
                <div
                  class="admin-storage__bar-fill"
                  :class="barClass(cloudCreditsPercent)"
                  :style="{ width: `${Math.min(cloudCreditsPercent, 100)}%` }"
                />
              </div>
              <!-- 유료 등 storage.limit 있는 경우 -->
              <div v-else-if="cloudStoragePercent !== null" class="admin-storage__bar">
                <div
                  class="admin-storage__bar-fill"
                  :class="barClass(cloudStoragePercent)"
                  :style="{ width: `${Math.min(cloudStoragePercent, 100)}%` }"
                />
              </div>

              <ul v-if="cloudStorage" class="admin-storage__detail">
                <li v-if="cloudStorage.creditsUsed != null && cloudStorage.creditsLimit != null">
                  <span>월 크레딧</span>
                  <span>{{ cloudStorage.creditsUsed.toFixed(2) }} / {{ cloudStorage.creditsLimit }}</span>
                </li>
                <li v-if="cloudStorage.storageCreditsUsage != null">
                  <span>스토리지 크레딧</span>
                  <span>{{ cloudStorage.storageCreditsUsage.toFixed(2) }}</span>
                </li>
                <li v-if="cloudStorage.bandwidthBytes != null">
                  <span>대역폭 (30일)</span>
                  <span>{{ formatCloudinaryMb(cloudStorage.bandwidthBytes) }}</span>
                </li>
                <li v-if="cloudStorage.resourceCount != null">
                  <span>원본 이미지</span>
                  <span>{{ cloudStorage.resourceCount.toLocaleString() }}개</span>
                </li>
                <li v-if="cloudStorage.derivedResourceCount != null">
                  <span>변환(derived)</span>
                  <span>{{ cloudStorage.derivedResourceCount.toLocaleString() }}개</span>
                </li>
              </ul>

              <p class="admin-storage__note">
                Cloudinary 콘솔과 동일한 MB(1000 기준) 표시 · API 갱신 주기로 콘솔과 수치가 약간 다를 수 있습니다.
                <template v-if="cloudStorage?.lastUpdated"> (API 기준 {{ cloudStorage.lastUpdated }})</template>
              </p>
            </div>
          </div>
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

// 스토리지 사용량 (Cloudinary API가 느릴 수 있어 lazy 로드)
const { data: storageData, pending: storagePending } = useLazyAsyncData(
  'admin-storage',
  () => $api('/admin/storage'),
)

const dbStorage = computed(() => storageData.value?.db || { usedBytes: null, limitBytes: null, tables: [] })
const cloudStorage = computed(() => storageData.value?.cloudinary || null)

const percentOf = (used, limit) => {
  if (used == null || !limit) return null
  return (used / limit) * 100
}

const dbPercent = computed(() => percentOf(dbStorage.value.usedBytes, dbStorage.value.limitBytes))

const cloudStoragePercent = computed(() =>
  cloudStorage.value
    ? percentOf(cloudStorage.value.storageBytes, cloudStorage.value.storageLimitBytes)
    : null,
)

const cloudCreditsPercent = computed(() => {
  const c = cloudStorage.value
  if (!c) return null
  if (c.creditsUsedPercent != null) return c.creditsUsedPercent
  return percentOf(c.creditsUsed, c.creditsLimit)
})

/** Cloudinary 콘솔과 동일한 1000 기준 MB */
const formatCloudinaryMb = (bytes) => {
  if (bytes == null) return '-'
  return `${(bytes / 1_000_000).toFixed(2)} MB`
}

const formatBytes = (bytes) => {
  if (bytes == null) return '-'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

const barClass = (percent) => {
  if (percent >= 90) return 'admin-storage__bar-fill--danger'
  if (percent >= 70) return 'admin-storage__bar-fill--warn'
  return ''
}

const statusLabel = (status) => {
  const map = { ACTIVE: '운영중', CLOSED: '폐업', HIDDEN: '숨김', TASTER: '숨김' }
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
