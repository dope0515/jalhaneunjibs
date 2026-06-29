<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1 class="admin-page__title">리뷰 관리</h1>
      <p class="admin-page__desc">리뷰 목록을 조회하고 부적절한 리뷰를 삭제합니다.</p>
    </div>

    <div class="admin-page__toolbar">
      <input
        v-model="searchQuery"
        type="search"
        class="admin-page__search"
        placeholder="내용, 매장명, 작성자 검색"
        @keyup.enter="applySearch"
      />
      <button type="button" class="admin-page__btn" @click="applySearch">검색</button>
    </div>

    <div v-if="pending" class="admin-empty"><AppLoading /></div>
    <div v-else-if="!reviews.length" class="admin-empty">검색 결과가 없습니다.</div>
    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <AdminSortableTh label="ID" field="id" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="매장" field="restaurant" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="작성자" field="user" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="별점" field="rating" th-class="admin-table__col--rating" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <th>내용</th>
            <AdminSortableTh label="작성일" field="createdAt" th-class="admin-table__col--date" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <th class="admin-table__col--action">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="review in reviews" :key="review.id">
            <td>{{ review.id }}</td>
            <td>
              <NuxtLink :to="`/restaurants/${review.restaurant.id}`" class="admin-table__link">
                {{ review.restaurant.name }}
              </NuxtLink>
            </td>
            <td>{{ review.user?.nickname }}</td>
            <td class="admin-table__col--rating">★ {{ review.rating }}</td>
            <td class="admin-table__col--content admin-table__muted">{{ truncate(review.content, 80) }}</td>
            <td class="admin-table__col--date">{{ formatDate(review.createdAt) }}</td>
            <td class="admin-table__col--action">
              <button
                type="button"
                class="admin-page__btn admin-page__btn--danger"
                :disabled="deletingId === review.id"
                @click="deleteReview(review)"
              >
                삭제
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPaginationBar
      v-if="!pending && reviews.length"
      :total="total"
      :current-page="currentPage"
      :total-pages="totalPages"
      :page-size="pageSize"
      :range-start="rangeStart"
      :range-end="rangeEnd"
      @change-page="goPage"
      @change-page-size="changePageSize"
    />
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
const deletingId = ref(null)

const { currentPage, pageSize, sortBy, sortDir, listQuery, goPage, changePageSize, toggleSort } = useAdminListQuery()

const { data, pending, refresh } = await useAsyncData(
  'admin-reviews',
  () => $api('/admin/reviews', {
    query: {
      ...listQuery.value,
      q: route.query.q || undefined,
    },
  }),
  { watch: [() => route.query] },
)

const reviews = computed(() => data.value?.reviews || [])
const { total, totalPages, rangeStart, rangeEnd } = useAdminPaginationMeta(data, currentPage, pageSize)

const applySearch = () => {
  router.push({
    path: '/admin/reviews',
    query: {
      ...route.query,
      q: searchQuery.value.trim() || undefined,
      page: 1,
    },
  })
}

const deleteReview = async (review) => {
  if (!confirm('이 리뷰를 삭제할까요?')) return

  deletingId.value = review.id
  try {
    await $api(`/reviews/${review.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e) {
    alert(e.data?.statusMessage || '리뷰 삭제에 실패했습니다.')
  } finally {
    deletingId.value = null
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR')
}

const truncate = (text, len) => {
  if (!text) return '-'
  return text.length > len ? `${text.slice(0, len)}…` : text
}
</script>
