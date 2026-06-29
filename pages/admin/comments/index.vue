<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1 class="admin-page__title">댓글 관리</h1>
      <p class="admin-page__desc">댓글 목록을 조회하고 부적절한 댓글을 삭제합니다.</p>
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
    <div v-else-if="!comments.length" class="admin-empty">검색 결과가 없습니다.</div>
    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>매장</th>
            <th>작성자</th>
            <th>유형</th>
            <th>내용</th>
            <th>대댓글</th>
            <th>작성일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="comment in comments" :key="comment.id">
            <td>{{ comment.id }}</td>
            <td>
              <NuxtLink :to="`/restaurants/${comment.restaurant.id}`" class="admin-table__link">
                {{ comment.restaurant.name }}
              </NuxtLink>
            </td>
            <td>{{ comment.user?.nickname }}</td>
            <td>{{ comment.parentId ? '대댓글' : '댓글' }}</td>
            <td class="admin-table__muted">{{ truncate(comment.content, 80) }}</td>
            <td>{{ comment._count.replies }}</td>
            <td>{{ formatDate(comment.createdAt) }}</td>
            <td>
              <button
                type="button"
                class="admin-page__btn admin-page__btn--danger"
                :disabled="deletingId === comment.id"
                @click="deleteComment(comment)"
              >
                삭제
              </button>
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
const currentPage = computed(() => Math.max(1, parseInt(String(route.query.page || '1'), 10) || 1))
const deletingId = ref(null)

const { data, pending, refresh } = await useAsyncData(
  'admin-comments',
  () => $api('/admin/comments', {
    query: {
      page: currentPage.value,
      q: route.query.q || undefined,
    },
  }),
  { watch: [() => route.query] },
)

const comments = computed(() => data.value?.comments || [])
const totalPages = computed(() => data.value?.totalPages || 1)

const applySearch = () => {
  router.push({
    path: '/admin/comments',
    query: {
      q: searchQuery.value.trim() || undefined,
      page: 1,
    },
  })
}

const goPage = (page) => {
  router.push({
    path: '/admin/comments',
    query: { ...route.query, page },
  })
}

const deleteComment = async (comment) => {
  if (!confirm('이 댓글을 삭제할까요?')) return

  deletingId.value = comment.id
  try {
    await $api(`/comments/${comment.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e) {
    alert(e.data?.statusMessage || '댓글 삭제에 실패했습니다.')
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
