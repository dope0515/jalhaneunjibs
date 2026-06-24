<template>
  <section class="mypage">
    <div class="inner">

      <!-- 유저 히어로 -->
      <div class="mypage-hero">
        <div class="avatar">{{ userInitial }}</div>
        <div class="hero-info">
          <h1 class="hero-name">{{ profile?.nickname || '사용자' }}</h1>
          <p class="hero-email">{{ profile?.email }}</p>
          <p class="hero-join">{{ joinDate }} 가입</p>
        </div>
      </div>

      <!-- 탭 -->
      <div class="mypage-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ 'is-active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.id === 'reviews' && reviews.length" class="tab-count">{{ reviews.length }}</span>
          <span v-if="tab.id === 'collections' && collections.length" class="tab-count">{{ collections.length }}</span>
          <span v-if="tab.id === 'myRestaurants' && myRestaurants.length" class="tab-count">{{ myRestaurants.length }}</span>
          <span v-if="tab.id === 'myPosts' && myPosts.length" class="tab-count">{{ myPosts.length }}</span>
        </button>
      </div>

      <!-- ─── 탭 콘텐츠 ─────────────────────────────── -->

      <!-- 계정 정보 탭 -->
      <div v-if="activeTab === 'profile'" class="tab-panel">
        <div class="mypage-cards">

          <!-- 기본 정보 카드 -->
          <div class="mypage-card">
            <h2 class="card-title">기본 정보</h2>
            <div class="field-group">
              <label class="field-label">이메일</label>
              <p class="field-readonly">{{ profile?.email }}</p>
            </div>
            <div class="field-group">
              <label class="field-label">닉네임</label>
              <input v-model="profileForm.nickname" class="field-input" placeholder="닉네임을 입력하세요" />
            </div>
            <div class="card-actions">
              <button class="btn-primary" :disabled="profileSaving" @click="saveProfile">
                {{ profileSaving ? '저장 중…' : '저장' }}
              </button>
            </div>
          </div>

          <!-- 비밀번호 변경 카드 -->
          <div class="mypage-card">
            <h2 class="card-title">비밀번호 변경</h2>
            <div class="field-group">
              <label class="field-label">현재 비밀번호</label>
              <input v-model="passwordForm.current" type="password" class="field-input" placeholder="현재 비밀번호" />
            </div>
            <div class="field-group">
              <label class="field-label">새 비밀번호</label>
              <input v-model="passwordForm.next" type="password" class="field-input" placeholder="6자 이상" />
            </div>
            <div class="field-group">
              <label class="field-label">새 비밀번호 확인</label>
              <input v-model="passwordForm.confirm" type="password" class="field-input" placeholder="다시 입력" />
            </div>
            <div class="card-actions">
              <button class="btn-primary" :disabled="pwSaving" @click="savePassword">
                {{ pwSaving ? '변경 중…' : '비밀번호 변경' }}
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- 내 등록 맛집 탭 -->
      <div v-else-if="activeTab === 'myRestaurants'" class="tab-panel">
        <div v-if="myRestaurantsLoading" class="loading-msg">불러오는 중…</div>
        <div v-else-if="myRestaurantsError" class="empty-state">
          <p>{{ myRestaurantsError }}</p>
        </div>
        <div v-else-if="myRestaurants.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <p>아직 등록한 맛집이 없어요</p>
          <NuxtLink to="/restaurants/register" class="empty-link">맛집 등록하러 가기</NuxtLink>
        </div>
        <AppCardList :restaurants="myRestaurants" />
      </div>

      <!-- 내 리뷰 탭 -->
      <div v-else-if="activeTab === 'reviews'" class="tab-panel">
        <div v-if="reviewsLoading" class="loading-msg">불러오는 중…</div>
        <div v-else-if="reviewsError" class="empty-state">
          <p>{{ reviewsError }}</p>
        </div>
        <div v-else-if="reviews.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>아직 작성한 리뷰가 없어요</p>
          <NuxtLink to="/restaurants" class="empty-link">맛집 보러 가기</NuxtLink>
        </div>
        <AppCardList :restaurants="reviewedRestaurants" />
      </div>

      <!-- 내 찜 목록 탭 -->
      <div v-else-if="activeTab === 'collections'" class="tab-panel">
        <div v-if="collectionsLoading" class="loading-msg">불러오는 중…</div>
        <div v-else class="collections-section">
          <div class="collections-grid">

            <!-- 컬렉션 카드 -->
            <button
              v-for="col in collections"
              :key="col.id"
              class="col-card"
              @click="openCollection(col)"
            >
              <div class="col-mosaic">
                <template v-if="col.favorites.length === 0">
                  <div class="col-mosaic__empty">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </div>
                </template>
                <template v-else>
                  <div
                    v-for="(fav, i) in col.favorites.slice(0, 4)"
                    :key="i"
                    class="col-mosaic__cell"
                    :class="`col-mosaic__cell--${col.favorites.slice(0, 4).length}`"
                  >
                    <img
                      :src="fav.restaurant.thumbnail || '/assets/images/common/default.jpg'"
                      :alt="fav.restaurant.name"
                    />
                  </div>
                </template>
              </div>
              <div class="col-info">
                <span class="col-name">{{ col.name }}</span>
                <span class="col-meta">
                  {{ col._count.favorites }}개
                  <span v-if="col.isPrivate" class="col-private">· 나만 보기</span>
                </span>
              </div>
              <div class="col-menu-btn" @click.stop="startRenameCollection(col)" title="이름 변경" role="button" aria-label="이름 변경">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              </div>
            </button>

            <!-- 새 목록 만들기 카드 -->
            <button class="col-card col-card--new" @click="showCreateModal = true">
              <div class="col-new-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
              </div>
              <span class="col-new-label">새 목록 만들기</span>
            </button>

          </div>
        </div>
      </div>

      <!-- 내 문의 내역 탭 -->
      <div v-else-if="activeTab === 'myPosts'" class="tab-panel">
        <div v-if="myPostsLoading" class="loading-msg">불러오는 중…</div>
        <div v-else-if="myPostsError" class="empty-state">
          <p>{{ myPostsError }}</p>
        </div>
        <div v-else-if="myPosts.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>아직 남기신 문의가 없어요</p>
          <NuxtLink to="/board" class="empty-link">문의하러 가기</NuxtLink>
        </div>
        <div v-else class="mypage-post-list">
          <NuxtLink v-for="post in myPosts" :key="post.id" :to="`/board/${post.id}`" class="mypage-post-card">
            <div class="post-header">
              <div class="title-wrap">
                <span v-if="post.reply" class="reply-badge">답변 완료</span>
                <span v-else class="reply-badge waiting">답변 대기</span>
                <h3 class="post-title">{{ post.title }}</h3>
              </div>
              <span class="post-date">{{ formatDate(post.createdAt) }}</span>
            </div>
            <p class="post-content">{{ post.content }}</p>
          </NuxtLink>
        </div>
      </div>

    </div>

    <!-- ─── 모달: 새 목록 만들기 ─────────────── -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-box">
          <h3 class="modal-title">새 목록 만들기</h3>
          <input
            v-model="newColName"
            class="modal-input"
            placeholder="예: 데이트 코스, 부모님과 함께"
            maxlength="30"
            @keydown.enter="(e) => { if (!e.isComposing) createCollection() }"
          />
          <label class="modal-check-row">
            <input v-model="newColPrivate" type="checkbox" />
            <span>나만 보기</span>
          </label>
          <div class="modal-actions">
            <button class="btn-ghost" @click="showCreateModal = false">취소</button>
            <button class="btn-primary" :disabled="!newColName.trim()" @click="createCollection">만들기</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ─── 모달: 컬렉션 이름 변경 ───────────── -->
    <Teleport to="body">
      <div v-if="renameTarget" class="modal-overlay" @click.self="renameTarget = null">
        <div class="modal-box">
          <h3 class="modal-title">목록 이름 변경</h3>
          <input
            v-model="renameValue"
            class="modal-input"
            maxlength="30"
            @keydown.enter="(e) => { if (!e.isComposing) confirmRename() }"
          />
          <div class="modal-actions">
            <button class="btn-ghost btn-danger" @click="deleteCollection(renameTarget)">목록 삭제</button>
            <div class="modal-actions-right">
              <button class="btn-ghost" @click="renameTarget = null">취소</button>
              <button class="btn-primary" :disabled="!renameValue.trim()" @click="confirmRename">저장</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ─── 드로어: 컬렉션 상세 ──────────────── -->
    <Teleport to="body">
      <Transition name="drawer" @after-leave="handleDrawerAfterLeave">
        <div v-if="activeCollection" class="drawer-overlay" @click.self="activeCollection = null">
          <div class="drawer">
            <div class="drawer-header">
              <button class="drawer-close" @click="activeCollection = null">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
              <h3 class="drawer-title">{{ activeCollection.name }}</h3>
              <span class="drawer-count">{{ activeCollection.favorites?.length || 0 }}개</span>
            </div>
            <div v-if="drawerLoading" class="loading-msg">불러오는 중…</div>
            <div v-else-if="!activeCollection.favorites?.length" class="empty-state empty-state--sm">
              <p>저장된 맛집이 없어요</p>
            </div>
            <div v-else class="drawer-list">
              <div v-for="fav in activeCollection.favorites" :key="fav.id" class="drawer-item">
                <NuxtLink :to="`/restaurants/${fav.restaurant.id}`" class="drawer-item-link">
                  <img
                    :src="fav.restaurant.thumbnail || '/assets/images/common/default.jpg'"
                    class="drawer-item-thumb"
                    :alt="fav.restaurant.name"
                  />
                  <div class="drawer-item-info">
                    <span class="drawer-item-category">{{ fav.restaurant.foodCategory }}</span>
                    <strong class="drawer-item-name">{{ fav.restaurant.name }}</strong>
                    <div class="drawer-item-rating">
                      <AppStarRating :modelValue="fav.restaurant.averageRating" readonly size="sm" show-label />
                    </div>
                    <p class="drawer-item-addr">{{ fav.restaurant.address }}</p>
                  </div>
                </NuxtLink>
                <button
                  class="drawer-item-remove"
                  title="목록에서 제거"
                  @click="removeFavorite(fav, activeCollection)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </section>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const { $api } = useApi()
const { user } = useAuth()

const tabs = [
  { id: 'profile', label: '계정 정보' },
  { id: 'myRestaurants', label: '내 등록 맛집' },
  { id: 'reviews', label: '내 리뷰' },
  { id: 'collections', label: '내 찜 목록' },
  { id: 'myPosts', label: '내 문의 내역' },
]
const activeTab = ref('profile')

// ── 프로필 상태 ──────────────────────────────────────────
const profile = ref(null)
const profileSaving = ref(false)
const profileForm = ref({ nickname: '' })

const userInitial = computed(() => {
  const name = profile.value?.nickname || '?'
  return name.charAt(0).toUpperCase()
})

const joinDate = computed(() => {
  if (!profile.value?.createdAt) return ''
  return new Date(profile.value.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
})

const loadProfile = async () => {
  try {
    profile.value = await $api('/mypage/profile')
    profileForm.value.nickname = profile.value?.nickname ?? ''
  } catch { /* noop */ }
}

const saveProfile = async () => {
  profileSaving.value = true
  try {
    const updated = await $api('/mypage/profile', {
      method: 'PUT',
      body: { nickname: profileForm.value.nickname },
    })
    profile.value = { ...profile.value, ...updated }
    alert('저장됐습니다.')
  } catch (e) {
    alert(e.data?.message || '저장에 실패했습니다.')
  } finally {
    profileSaving.value = false
  }
}

// ── 비밀번호 상태 ────────────────────────────────────────
const passwordForm = ref({ current: '', next: '', confirm: '' })
const pwSaving = ref(false)

const savePassword = async () => {
  if (passwordForm.value.next !== passwordForm.value.confirm) {
    return alert('새 비밀번호가 일치하지 않습니다.')
  }
  pwSaving.value = true
  try {
    await $api('/mypage/profile', {
      method: 'PUT',
      body: { currentPassword: passwordForm.value.current, newPassword: passwordForm.value.next },
    })
    passwordForm.value = { current: '', next: '', confirm: '' }
    alert('비밀번호가 변경됐습니다.')
  } catch (e) {
    alert(e.data?.message || '비밀번호 변경에 실패했습니다.')
  } finally {
    pwSaving.value = false
  }
}

// ── 내 등록 맛집 상태 ──────────────────────────────────────
const myRestaurants = ref([])
const myRestaurantsLoading = ref(false)
const myRestaurantsError = ref('')

const loadMyRestaurants = async () => {
  if (myRestaurants.value.length) return
  myRestaurantsLoading.value = true
  myRestaurantsError.value = ''
  try {
    myRestaurants.value = await $api('/mypage/my-restaurants')
  } catch (e) {
    myRestaurantsError.value = '맛집 목록을 불러오지 못했습니다.'
    console.error('[mypage] loadMyRestaurants error:', e)
  } finally {
    myRestaurantsLoading.value = false
  }
}

// ── 리뷰 상태 ────────────────────────────────────────────
const reviews = ref([])
const reviewsLoading = ref(false)
const reviewsError = ref('')

const loadReviews = async () => {
  if (reviews.value.length) return
  reviewsLoading.value = true
  reviewsError.value = ''
  try {
    reviews.value = await $api('/mypage/reviews')
  } catch (e) {
    reviewsError.value = '리뷰를 불러오지 못했습니다. 다시 로그인 후 시도해 주세요.'
    console.error('[mypage] loadReviews error:', e)
  } finally {
    reviewsLoading.value = false
  }
}

const reviewedRestaurants = computed(() => {
  const seen = new Set()
  return reviews.value
    .filter((r) => { if (seen.has(r.restaurant.id)) return false; seen.add(r.restaurant.id); return true })
    .map((r) => r.restaurant)
})

// ── 컬렉션 상태 ──────────────────────────────────────────
const collections = ref([])
const collectionsLoading = ref(false)
const showCreateModal = ref(false)
const newColName = ref('')
const newColPrivate = ref(true)
const renameTarget = ref(null)
const renameValue = ref('')
const activeCollection = ref(null)
const drawerLoading = ref(false)

// 드로어 열릴 때 배경 스크롤 방지
const scrollLock = ref(false)
let scrollPos = 0

watch(activeCollection, (val) => {
  if (val) {
    scrollPos = window.scrollY
    document.body.style.top = `-${scrollPos}px`
    scrollLock.value = true
  }
})

const handleDrawerAfterLeave = () => {
  scrollLock.value = false
  document.body.style.top = ''
  window.scrollTo(0, scrollPos)
}

useHead({
  bodyAttrs: {
    class: computed(() => scrollLock.value ? 'overflow-hidden' : '')
  }
})

const loadCollections = async () => {
  collectionsLoading.value = true
  try {
    collections.value = await $api('/mypage/collections')
  } catch (e) {
    console.error('[mypage] loadCollections error:', e)
  } finally {
    collectionsLoading.value = false
  }
}

const createCollection = async () => {
  if (!newColName.value.trim()) return
  try {
    const col = await $api('/mypage/collections', {
      method: 'POST',
      body: { name: newColName.value.trim(), isPrivate: newColPrivate.value },
    })
    collections.value.unshift(col)
    newColName.value = ''
    newColPrivate.value = true
    showCreateModal.value = false
  } catch (e) {
    alert(e.data?.message || '목록 생성에 실패했습니다.')
  }
}

const startRenameCollection = (col) => {
  renameTarget.value = col
  renameValue.value = col.name
}

const confirmRename = async () => {
  if (!renameValue.value.trim() || !renameTarget.value) return
  try {
    await $api(`/mypage/collections/${renameTarget.value.id}`, {
      method: 'PUT',
      body: { name: renameValue.value.trim() },
    })
    const target = collections.value.find((c) => c.id === renameTarget.value.id)
    if (target) target.name = renameValue.value.trim()
    renameTarget.value = null
  } catch (e) {
    alert(e.data?.message || '수정에 실패했습니다.')
  }
}

const deleteCollection = async (col) => {
  if (!confirm(`"${col.name}" 목록을 삭제할까요?`)) return
  try {
    await $api(`/mypage/collections/${col.id}`, {
      method: 'DELETE',
    })
    collections.value = collections.value.filter((c) => c.id !== col.id)
    renameTarget.value = null
    if (activeCollection.value?.id === col.id) activeCollection.value = null
  } catch (e) {
    alert(e.data?.message || '삭제에 실패했습니다.')
  }
}

const openCollection = async (col) => {
  activeCollection.value = { ...col }
  drawerLoading.value = true
  try {
    const detail = await $api(`/mypage/collections/${col.id}/restaurants`)
    activeCollection.value = detail
  } finally {
    drawerLoading.value = false
  }
}

const removeFavorite = async (fav, col) => {
  try {
    await $api('/mypage/favorites/toggle', {
      method: 'POST',
      body: { restaurantId: fav.restaurant.id, collectionId: col.id },
    })
    activeCollection.value.favorites = activeCollection.value.favorites.filter((f) => f.id !== fav.id)
    const colRef = collections.value.find((c) => c.id === col.id)
    if (colRef) {
      colRef._count.favorites = Math.max(0, colRef._count.favorites - 1)
      colRef.favorites = colRef.favorites.filter((f) => f.id !== fav.id)
    }
  } catch (e) {
    alert('제거에 실패했습니다.')
  }
}

// ── 공통 유틸리티 ────────────────────────────────────────
const formatDate = (iso) => {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── 내 문의 내역 상태 ───────────────────────────────────────
const myPosts = ref([])
const myPostsLoading = ref(false)
const myPostsError = ref('')

const loadMyPosts = async () => {
  if (myPosts.value.length) return
  myPostsLoading.value = true
  myPostsError.value = ''
  try {
    const data = await $api('/board')
    if (data.success) {
      myPosts.value = data.posts
    } else {
      throw new Error('불러오기 실패')
    }
  } catch (e) {
    myPostsError.value = '내 문의 내역을 불러오지 못했습니다.'
    console.error('[mypage] loadMyPosts error:', e)
  } finally {
    myPostsLoading.value = false
  }
}

// ── 감시자 및 실행 ───────────────────────────────────────
watch(activeTab, (tab) => {
  if (tab === 'myRestaurants' && !myRestaurants.value.length && !myRestaurantsLoading.value) loadMyRestaurants()
  if (tab === 'reviews' && !reviews.value.length && !reviewsLoading.value) loadReviews()
  if (tab === 'collections' && !collections.value.length && !collectionsLoading.value) loadCollections()
  if (tab === 'myPosts' && !myPosts.value.length && !myPostsLoading.value) loadMyPosts()
})

await loadProfile()
Promise.all([loadMyRestaurants(), loadReviews(), loadCollections()])
</script>
