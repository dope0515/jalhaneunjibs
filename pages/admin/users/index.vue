<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1 class="admin-page__title">회원 관리</h1>
      <p class="admin-page__desc">회원 목록 조회, 계정 정지·탈퇴, 관리자 권한을 설정합니다.</p>
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
            <AdminSortableTh label="ID" field="id" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="닉네임" field="nickname" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="이메일" field="email" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="역할" field="role" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="계정 상태" field="status" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="등록 매장" field="registeredRestaurants" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="리뷰" field="reviews" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="댓글" field="comments" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="건의" field="posts" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <AdminSortableTh label="가입일" field="createdAt" :sort-by="sortBy" :sort-dir="sortDir" @sort="toggleSort" />
            <th>권한</th>
            <th>계정 관리</th>
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
            <td>
              <span :class="accountStatusBadgeClass(u.status)" :title="u.suspendedReason || ''">
                {{ accountStatusLabel(u.status) }}
              </span>
            </td>
            <td>{{ u._count.registeredRestaurants }}</td>
            <td>{{ u._count.reviews }}</td>
            <td>{{ u._count.comments }}</td>
            <td>{{ u._count.posts }}</td>
            <td>{{ formatDate(u.createdAt) }}</td>
            <td>
              <select
                v-if="u.status !== 'WITHDRAWN'"
                :key="`role-${u.id}-${u.role}`"
                :value="u.role"
                class="admin-table__select"
                :disabled="updatingId === u.id"
                @change="changeRole(u, $event.target.value)"
              >
                <option value="USER">일반</option>
                <option value="ADMIN">관리자</option>
              </select>
              <span v-else class="admin-table__muted">-</span>
            </td>
            <td>
              <div v-if="u.status !== 'WITHDRAWN'" class="admin-table__actions">
                <select
                  :key="`status-${u.id}-${u.status}`"
                  :value="u.status"
                  class="admin-table__select"
                  :class="{ 'admin-table__select--suspended': u.status === 'SUSPENDED' }"
                  :disabled="updatingId === u.id"
                  @change="changeAccountStatus(u, $event.target.value)"
                >
                  <option value="ACTIVE">활성</option>
                  <option value="SUSPENDED">정지</option>
                </select>
                <button
                  v-if="u.role !== 'ADMIN'"
                  type="button"
                  class="admin-page__btn admin-page__btn--danger"
                  :disabled="updatingId === u.id"
                  @click="forceWithdraw(u)"
                >
                  강제 탈퇴
                </button>
              </div>
              <span v-else class="admin-table__muted">탈퇴 완료</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPaginationBar
      v-if="!pending && users.length"
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
const updatingId = ref(null)

const { currentPage, pageSize, sortBy, sortDir, listQuery, goPage, changePageSize, toggleSort } = useAdminListQuery()

const { data, pending, refresh } = await useAsyncData(
  'admin-users',
  () => $api('/admin/users', {
    query: {
      ...listQuery.value,
      q: route.query.q || undefined,
    },
  }),
  { watch: [() => route.query] },
)

const users = computed(() => data.value?.users || [])
const { total, totalPages, rangeStart, rangeEnd } = useAdminPaginationMeta(data, currentPage, pageSize)

const applySearch = () => {
  router.push({
    path: '/admin/users',
    query: {
      ...route.query,
      q: searchQuery.value.trim() || undefined,
      page: 1,
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

const changeAccountStatus = async (user, status) => {
  if (user.status === status) return

  let suspendedReason
  if (status === 'SUSPENDED') {
    suspendedReason = prompt(`"${user.nickname}" 회원을 정지하는 사유를 입력해 주세요.`)
    if (!suspendedReason?.trim()) {
      await refresh()
      return
    }
  } else if (!confirm(`"${user.nickname}" 회원의 정지를 해제할까요?`)) {
    await refresh()
    return
  }

  updatingId.value = user.id
  try {
    await $api(`/admin/users/${user.id}`, {
      method: 'PATCH',
      body: { status, suspendedReason: suspendedReason?.trim() },
    })
    await refresh()
  } catch (e) {
    alert(e.data?.statusMessage || '계정 상태 변경에 실패했습니다.')
  } finally {
    updatingId.value = null
  }
}

const forceWithdraw = async (user) => {
  const reason = prompt(`"${user.nickname}" 회원을 강제 탈퇴합니다.\n사유를 입력해 주세요.`)
  if (!reason?.trim()) return
  if (!confirm('정말 강제 탈퇴 처리할까요? 이 작업은 되돌릴 수 없습니다.')) return

  updatingId.value = user.id
  try {
    await $api(`/admin/users/${user.id}/withdraw`, {
      method: 'POST',
      body: { reason: reason.trim() },
    })
    await refresh()
  } catch (e) {
    alert(e.data?.statusMessage || '강제 탈퇴에 실패했습니다.')
  } finally {
    updatingId.value = null
  }
}

const accountStatusLabel = (status) => {
  const map = { ACTIVE: '활성', SUSPENDED: '정지', WITHDRAWN: '탈퇴' }
  return map[status] || status
}

const accountStatusBadgeClass = (status) => {
  const map = {
    ACTIVE: 'admin-badge admin-badge--active',
    SUSPENDED: 'admin-badge admin-badge--suspended',
    WITHDRAWN: 'admin-badge admin-badge--withdrawn',
  }
  return map[status] || 'admin-badge'
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('ko-KR')
}
</script>
