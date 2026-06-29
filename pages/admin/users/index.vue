<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1 class="admin-page__title">회원 관리</h1>
      <p class="admin-page__desc">회원 목록 조회 및 관리자 권한을 설정합니다.</p>
    </div>

    <div class="admin-page__toolbar">
      <input
        v-model="searchQuery"
        type="search"
        class="admin-page__search"
        placeholder="이메일 또는 닉네임 검색"
        @keyup.enter="applySearch"
      />
      <button type="button" class="admin-page__btn" @click="applySearch">검색</button>
    </div>

    <div v-if="pending" class="admin-empty"><AppLoading /></div>
    <div v-else-if="!users.length" class="admin-empty">검색 결과가 없습니다.</div>
    <div v-else class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>닉네임</th>
            <th>이메일</th>
            <th>역할</th>
            <th>등록 매장</th>
            <th>리뷰</th>
            <th>댓글</th>
            <th>건의</th>
            <th>가입일</th>
            <th>권한 변경</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.id }}</td>
            <td>{{ u.nickname }}</td>
            <td>{{ u.email }}</td>
            <td>
              <span :class="u.role === 'ADMIN' ? 'admin-badge admin-badge--admin' : 'admin-badge'">
                {{ u.role === 'ADMIN' ? '관리자' : '일반' }}
              </span>
            </td>
            <td>{{ u._count.registeredRestaurants }}</td>
            <td>{{ u._count.reviews }}</td>
            <td>{{ u._count.comments }}</td>
            <td>{{ u._count.posts }}</td>
            <td>{{ formatDate(u.createdAt) }}</td>
            <td>
              <div class="admin-table__actions">
                <select
                  :value="u.role"
                  class="admin-table__select"
                  :disabled="updatingId === u.id"
                  @change="changeRole(u, $event.target.value)"
                >
                  <option value="USER">일반</option>
                  <option value="ADMIN">관리자</option>
                </select>
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
const updatingId = ref(null)

const { data, pending, refresh } = await useAsyncData(
  'admin-users',
  () => $api('/admin/users', {
    query: {
      page: currentPage.value,
      q: route.query.q || undefined,
    },
  }),
  { watch: [() => route.query] },
)

const users = computed(() => data.value?.users || [])
const totalPages = computed(() => data.value?.totalPages || 1)

const applySearch = () => {
  router.push({
    path: '/admin/users',
    query: {
      q: searchQuery.value.trim() || undefined,
      page: 1,
    },
  })
}

const goPage = (page) => {
  router.push({
    path: '/admin/users',
    query: {
      ...route.query,
      page,
    },
  })
}

const changeRole = async (user, role) => {
  if (user.role === role) return
  if (!confirm(`"${user.nickname}" 회원의 권한을 ${role === 'ADMIN' ? '관리자' : '일반'}로 변경할까요?`)) {
    return
  }

  updatingId.value = user.id
  try {
    await $api(`/admin/users/${user.id}`, {
      method: 'PATCH',
      body: { role },
    })
    await refresh()
  } catch (e) {
    alert(e.data?.statusMessage || '권한 변경에 실패했습니다.')
  } finally {
    updatingId.value = null
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR')
}
</script>
