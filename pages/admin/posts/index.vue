<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1 class="admin-page__title">건의·문의</h1>
      <p class="admin-page__desc">사용자 건의·문의를 확인하고 답변합니다.</p>
    </div>

    <div class="admin-page__toolbar">
      <input
        v-model="searchQuery"
        type="search"
        class="admin-page__search"
        placeholder="제목, 내용, 작성자 검색"
        @keyup.enter="applyFilters"
      />
      <label class="admin-table__muted">
        <input v-model="pendingOnly" type="checkbox" @change="applyFilters" />
        미답변만
      </label>
      <button type="button" class="admin-page__btn" @click="applyFilters">검색</button>
    </div>

    <div v-if="pending" class="admin-empty"><AppLoading /></div>
    <div v-else-if="!posts.length" class="admin-empty">검색 결과가 없습니다.</div>
    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>제목</th>
            <th>작성자</th>
            <th>상태</th>
            <th>작성일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id">
            <td>{{ post.id }}</td>
            <td>{{ post.title }}</td>
            <td>{{ post.user?.nickname }}</td>
            <td>
              <span :class="post.reply ? 'admin-badge admin-badge--answered' : 'admin-badge admin-badge--pending'">
                {{ post.reply ? '답변완료' : '미답변' }}
              </span>
            </td>
            <td>{{ formatDate(post.createdAt) }}</td>
            <td>
              <div class="admin-table__actions">
                <button type="button" class="admin-page__btn admin-page__btn--outline" @click="openReply(post)">
                  {{ post.reply ? '답변 수정' : '답변 작성' }}
                </button>
                <NuxtLink :to="`/board/${post.id}`" class="admin-page__btn admin-page__btn--outline" target="_blank">
                  상세
                </NuxtLink>
              </div>
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

    <div v-if="replyModalOpen" class="admin-reply-modal">
      <div class="admin-reply-modal__backdrop" @click="closeReply" />
      <div class="admin-reply-modal__box">
        <h2 class="admin-reply-modal__title">{{ selectedPost?.reply ? '답변 수정' : '답변 작성' }}</h2>
        <p class="admin-reply-modal__content">{{ selectedPost?.content }}</p>
        <textarea
          v-model="replyContent"
          class="admin-reply-modal__textarea"
          rows="5"
          placeholder="답변을 입력하세요."
        />
        <div class="admin-reply-modal__actions">
          <button type="button" class="admin-page__btn admin-page__btn--outline" @click="closeReply">취소</button>
          <button type="button" class="admin-page__btn" :disabled="submitting" @click="submitReply">
            {{ submitting ? '저장 중…' : '저장' }}
          </button>
        </div>
      </div>
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
const pendingOnly = ref(route.query.pending === 'true')
const currentPage = computed(() => Math.max(1, parseInt(String(route.query.page || '1'), 10) || 1))

const replyModalOpen = ref(false)
const selectedPost = ref(null)
const replyContent = ref('')
const submitting = ref(false)

const { data, pending, refresh } = await useAsyncData(
  'admin-posts',
  () => $api('/admin/posts', {
    query: {
      page: currentPage.value,
      q: route.query.q || undefined,
      pending: route.query.pending === 'true' ? 'true' : undefined,
    },
  }),
  { watch: [() => route.query] },
)

const posts = computed(() => data.value?.posts || [])
const totalPages = computed(() => data.value?.totalPages || 1)

const applyFilters = () => {
  router.push({
    path: '/admin/posts',
    query: {
      q: searchQuery.value.trim() || undefined,
      pending: pendingOnly.value ? 'true' : undefined,
      page: 1,
    },
  })
}

const goPage = (page) => {
  router.push({
    path: '/admin/posts',
    query: { ...route.query, page },
  })
}

const openReply = (post) => {
  selectedPost.value = post
  replyContent.value = post.reply || ''
  replyModalOpen.value = true
}

const closeReply = () => {
  replyModalOpen.value = false
  selectedPost.value = null
  replyContent.value = ''
}

const submitReply = async () => {
  if (!replyContent.value.trim()) {
    alert('답변 내용을 입력해주세요.')
    return
  }

  submitting.value = true
  try {
    await $api(`/board/${selectedPost.value.id}/reply`, {
      method: 'POST',
      body: { reply: replyContent.value.trim() },
    })
    closeReply()
    await refresh()
  } catch (e) {
    alert(e.data?.statusMessage || '답변 저장에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR')
}
</script>
