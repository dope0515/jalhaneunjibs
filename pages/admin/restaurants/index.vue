<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1 class="admin-page__title">매장 관리</h1>
      <p class="admin-page__desc">매장 상태(운영중, 폐업, 숨김)를 변경합니다.</p>
    </div>

    <div class="admin-page__toolbar">
      <input
        v-model="searchQuery"
        type="search"
        class="admin-page__search"
        placeholder="매장명 또는 주소 검색"
        @keyup.enter="applyFilters"
      />
      <select v-model="statusFilter" class="admin-page__select" @change="applyFilters">
        <option value="">전체 상태</option>
        <option value="ACTIVE">운영중</option>
        <option value="CLOSED">폐업</option>
        <option value="HIDDEN">숨김</option>
      </select>
      <button type="button" class="admin-page__btn" @click="applyFilters">검색</button>
    </div>

    <div v-if="pending" class="admin-empty"><AppLoading /></div>
    <div v-else-if="!restaurants.length" class="admin-empty">검색 결과가 없습니다.</div>
    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>매장명</th>
            <th>카테고리</th>
            <th>지역</th>
            <th>상태</th>
            <th>별점</th>
            <th>리뷰</th>
            <th>조회</th>
            <th>등록자</th>
            <th>등록일</th>
            <th>상태 변경</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in restaurants" :key="r.id">
            <td>{{ r.id }}</td>
            <td>
              <NuxtLink :to="`/restaurants/${r.id}`" class="admin-table__link">{{ r.name }}</NuxtLink>
            </td>
            <td>{{ r.foodCategory }}</td>
            <td>{{ r.region2 || '-' }}</td>
            <td>
              <span :class="statusBadgeClass(r.status)">{{ statusLabel(r.status) }}</span>
            </td>
            <td>{{ r.averageRating?.toFixed(1) || '0.0' }}</td>
            <td>{{ r.reviewCount }}</td>
            <td>{{ r.viewCount }}</td>
            <td>{{ r.registeredBy?.nickname || '-' }}</td>
            <td>{{ formatDate(r.createdAt) }}</td>
            <td>
              <select
                :value="r.status"
                class="admin-table__select"
                :disabled="updatingId === r.id"
                @change="changeStatus(r, $event.target.value)"
              >
                <option value="ACTIVE">운영중</option>
                <option value="CLOSED">폐업</option>
                <option value="HIDDEN">숨김</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="admin-pagination">
      <AppPagination
        :current-page="currentPage"
        :total-pages="totalPages"
        @change="goPage"
      />
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const router = useRouter()
const { $api } = useApi()

const searchQuery = ref(String(route.query.q || ''))
const statusFilter = ref(String(route.query.status || ''))
const currentPage = computed(() => Math.max(1, parseInt(String(route.query.page || '1'), 10) || 1))
const updatingId = ref(null)

const { data, pending, refresh } = await useAsyncData(
  'admin-restaurants',
  () => $api('/admin/restaurants', {
    query: {
      page: currentPage.value,
      q: route.query.q || undefined,
      status: route.query.status || undefined,
    },
  }),
  { watch: [() => route.query] },
)

const restaurants = computed(() => data.value?.restaurants || [])
const totalPages = computed(() => data.value?.totalPages || 1)

const statusLabel = (status) => {
  const map = { ACTIVE: '운영중', CLOSED: '폐업', HIDDEN: '숨김', TASTER: '숨김' }
  return map[status] || status
}

const statusBadgeClass = (status) => {
  const map = {
    ACTIVE: 'admin-badge admin-badge--active',
    CLOSED: 'admin-badge admin-badge--closed',
    HIDDEN: 'admin-badge admin-badge--hidden',
    TASTER: 'admin-badge admin-badge--hidden',
  }
  return map[status] || 'admin-badge'
}

const applyFilters = () => {
  router.push({
    path: '/admin/restaurants',
    query: {
      q: searchQuery.value.trim() || undefined,
      status: statusFilter.value || undefined,
      page: 1,
    },
  })
}

const goPage = (page) => {
  router.push({
    path: '/admin/restaurants',
    query: { ...route.query, page },
  })
}

const changeStatus = async (restaurant, status) => {
  if (restaurant.status === status) return
  if (!confirm(`"${restaurant.name}" 상태를 ${statusLabel(status)}(으)로 변경할까요?`)) return

  updatingId.value = restaurant.id
  try {
    await $api(`/admin/restaurants/${restaurant.id}`, {
      method: 'PATCH',
      body: { status },
    })
    await refresh()
  } catch (e) {
    alert(e.data?.statusMessage || '상태 변경에 실패했습니다.')
  } finally {
    updatingId.value = null
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR')
}
</script>
