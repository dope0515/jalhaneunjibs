<template>
  <section class="restaurants-list">
    <div class="inner">
      <div class="page-header">
        <AppTitle
          badge="Places"
          title="잘하는 집 모아보기"
          desc="사람들이 추천하는 잘하는 집 구경하기"
        />
      </div>

      <!-- 검색 영역 -->
      <div class="search-wrap">
        <div class="search-box">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            v-model="searchInput"
            type="text"
            class="search-input"
            placeholder="식당 이름 또는 키워드로 검색"
            @keydown="handleSearchKeydown"
            @compositionstart="searchComposing = true"
            @compositionend="searchComposing = false"
          />
          <button v-if="searchInput" class="search-clear" @click="clearSearch" aria-label="검색어 지우기">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="search-actions">
          <button class="search-submit-btn" @click="submitSearch">검색</button>
        </div>
      </div>

      <!-- 필터 영역 -->
      <div class="filter-wrap">
        <!-- 카테고리 필터 -->
        <div class="filter-group">
          <span class="filter-label">카테고리</span>
          <div class="filter-chips">
            <button
              class="filter-btn"
              :class="{ 'is-active': !selectedCategory }"
              @click="setCategory(null)"
            >전체</button>
            <button
              v-for="cat in categories"
              :key="cat"
              class="filter-btn"
              :class="{ 'is-active': selectedCategory === cat }"
              @click="setCategory(cat)"
            >{{ cat }}</button>
          </div>
        </div>

        <!-- 시/도 필터 -->
        <div v-if="regionKeys.length > 0" class="filter-group">
          <span class="filter-label">지역</span>
          <div class="filter-chips">
            <button
              class="filter-btn"
              :class="{ 'is-active': !selectedRegion1 }"
              @click="setRegion1(null)"
            >전체</button>
            <button
              v-for="r1 in regionKeys"
              :key="r1"
              class="filter-btn"
              :class="{ 'is-active': selectedRegion1 === r1 }"
              @click="setRegion1(r1)"
            >{{ r1 }}</button>
          </div>
        </div>

        <!-- 구/군 필터 (시/도 선택 시에만 노출) -->
        <Transition name="filter-slide">
          <div v-if="selectedRegion1 && subRegions.length > 0" class="filter-group filter-group--sub">
            <span class="filter-label">구/군</span>
            <div class="filter-chips">
              <button
                class="filter-btn filter-btn--sm"
                :class="{ 'is-active': !selectedRegion2 }"
                @click="setRegion2(null)"
              >전체</button>
              <button
                v-for="r2 in subRegions"
                :key="r2"
                class="filter-btn filter-btn--sm"
                :class="{ 'is-active': selectedRegion2 === r2 }"
                @click="setRegion2(r2)"
              >{{ r2 }}</button>
            </div>
          </div>
        </Transition>

        <!-- 가격대 필터 -->
        <div class="filter-group filter-group--sub">
          <span class="filter-label">가격대</span>
          <div class="price-range-wrap">
            <div class="price-range-labels">
              <span class="price-range-value">
                {{ priceMinLabel }}
              </span>
              <span class="price-range-sep">~</span>
              <span class="price-range-value">
                {{ priceMaxLabel }}
              </span>
              <button
                v-if="priceMin > PRICE_MIN || priceMax < PRICE_MAX"
                class="price-range-reset"
                @click="resetPrice"
                aria-label="가격대 초기화"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="price-range-slider">
              <div
                class="price-range-track-fill"
                :style="trackFillStyle"
              />
              <input
                type="range"
                class="price-range-input price-range-input--min"
                :min="PRICE_MIN"
                :max="PRICE_MAX"
                :step="PRICE_STEP"
                :value="priceMin"
                @input="onMinInput"
              />
              <input
                type="range"
                class="price-range-input price-range-input--max"
                :min="PRICE_MIN"
                :max="PRICE_MAX"
                :step="PRICE_STEP"
                :value="priceMax"
                @input="onMaxInput"
              />
            </div>
            <div class="price-range-ticks">
              <span v-for="tick in priceTicks" :key="tick.value" class="price-tick">{{ tick.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 정렬 영역 -->
      <div class="sort-wrap">
        <button
          v-for="opt in sortOptions"
          :key="opt.value"
          class="sort-btn"
          :class="{ 'is-active': selectedSort === opt.value }"
          @click="setSort(opt.value)"
        >{{ opt.label }}</button>
      </div>

      <!-- 결과 영역 -->
      <div class="list-container">
        <!-- 최초 로딩 스켈레톤 -->
        <div v-if="isFirstLoading" class="card-list">
          <AppSkeleton v-for="n in 6" :key="n" class="skeleton-item" />
        </div>

        <!-- 결과 없음 (로딩 중이 아닐 때만 노출) -->
        <div v-else-if="!isRefreshing && !restaurants.length" class="list-empty">
          <template v-if="searchKeyword">
            <p>"{{ searchKeyword }}"에 대한 검색 결과가 없습니다.</p>
            <button class="empty-register-link" @click="clearSearch">검색어 지우기</button>
          </template>
          <template v-else>
            <p>아직 등록된 식당이 없습니다.</p>
            <NuxtLink to="/restaurants/register" class="empty-register-link">
              첫 번째 맛집을 등록해보세요 →
            </NuxtLink>
          </template>
        </div>

        <!-- 카드 목록 (데이터가 있으면 항상 유지) -->
        <AppCardList 
          v-else 
          :restaurants="restaurants" 
          @toggle-favorite="openFavoriteModal"
        />
      </div>

      <!-- 찜 저장 모달 -->
      <AppFavoriteModal
        v-model="favoriteModalOpen"
        :restaurant-id="targetRestaurantId"
        @changed="handleFavoriteChanged"
      />

      <!-- 필터/정렬 변경 시 재로딩 오버레이 -->
      <AppLoading :loading="isRefreshing" />

      <!-- 페이지네이션 -->
      <div class="pagination-wrap">
        <AppPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @change="goPage"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
const { $api } = useApi()

const categories = ['한식', '중식', '일식', '양식', '카페', '주점', '분식', '아시아음식']

const sortOptions = [
  { label: '등록순', value: 'latest' },
  { label: '별점순', value: 'rating' },
  { label: '조회순', value: 'views' },
  { label: '리뷰순', value: 'reviews' },
]

const PRICE_MIN = 0
const PRICE_MAX = 50000
const PRICE_STEP = 5000

const priceTicks = [
  { value: 0,     label: '0' },
  { value: 10000, label: '1만' },
  { value: 20000, label: '2만' },
  { value: 30000, label: '3만' },
  { value: 40000, label: '4만' },
  { value: 50000, label: '5만+' },
]

const selectedCategory = ref(null)
const selectedRegion1 = ref(null)
const selectedRegion2 = ref(null)
const priceMin = ref(PRICE_MIN)
const priceMax = ref(PRICE_MAX)
const selectedSort = ref('latest')
const currentPage = ref(1)
const searchInput = ref('')
const searchKeyword = ref('')
const searchComposing = ref(false)

const handleSearchKeydown = (e) => {
  if (e.key !== 'Enter') return
  if (searchComposing.value) return
  e.preventDefault()
  submitSearch()
}

const { data: regionsData } = await useAsyncData(
  'regions',
  () => $api('/restaurants/regions'),
)

// { "서울특별시": ["강남구", ...], ... }
const regionsMap = computed(() => regionsData.value ?? {})
const regionKeys = computed(() => Object.keys(regionsMap.value))
const subRegions = computed(() =>
  selectedRegion1.value ? (regionsMap.value[selectedRegion1.value] ?? []) : []
)

const { data, status } = await useAsyncData(
  'restaurants',
  () => $api('/restaurants', {
    query: {
      ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
      ...(selectedRegion1.value ? { region1: selectedRegion1.value } : {}),
      ...(selectedRegion2.value ? { region2: selectedRegion2.value } : {}),
      ...(priceMin.value > PRICE_MIN ? { priceMin: priceMin.value } : {}),
      ...(priceMax.value < PRICE_MAX ? { priceMax: priceMax.value } : {}),
      ...(searchKeyword.value ? { keyword: searchKeyword.value } : {}),
      sort: selectedSort.value,
      page: currentPage.value,
    },
  }),
  {
    watch: [selectedCategory, selectedRegion1, selectedRegion2, selectedSort, currentPage, searchKeyword],
  }
)

// 깜빡임 방지: 데이터가 로딩 중일 때도 이전 데이터를 유지
const lastValidData = ref(data.value)
watch(data, (newData) => {
  if (newData) lastValidData.value = newData
})

const restaurants = computed(() => lastValidData.value?.restaurants ?? [])
const totalPages = computed(() => lastValidData.value?.totalPages ?? 1)
const isFirstLoading = computed(() => status.value === 'pending' && !lastValidData.value)
const isRefreshing = computed(() => status.value === 'pending' && !!lastValidData.value)

// 찜하기 관련
const favoriteModalOpen = ref(false)
const targetRestaurantId = ref(0)

const openFavoriteModal = (restaurant) => {
  targetRestaurantId.value = restaurant.id
  favoriteModalOpen.value = true
}

const handleFavoriteChanged = ({ action, restaurantId }) => {
  // 로컬 데이터 상태 업데이트
  const target = restaurants.value.find(r => r.id === restaurantId)
  if (target) {
    if (action === 'added') {
      target.isSaved = true
      target.likes++
    } else {
      checkStillSaved(restaurantId)
    }
  }
}

const checkStillSaved = async (id) => {
  try {
    const status = await $api(`/mypage/favorites/status?restaurantId=${id}`)
    const target = restaurants.value.find(r => r.id === id)
    if (target) {
      target.isSaved = status.isSaved
      if (!status.isSaved) {
        // 모든 컬렉션에서 빠졌을 때만 likes 감소 (단, 서버에서 이미 처리됨)
        // 여기서는 likes를 수동으로 맞추기보다 그냥 UI적으로만 대응
        target.likes = Math.max(0, target.likes - 1)
      }
    }
  } catch (e) { /* noop */ }
}

const setCategory = (cat) => {
  selectedCategory.value = cat
  currentPage.value = 1
}

const setRegion1 = (r1) => {
  selectedRegion1.value = r1
  selectedRegion2.value = null
  currentPage.value = 1
}

const setRegion2 = (r2) => {
  selectedRegion2.value = r2
  currentPage.value = 1
}

// 가격 레이블 포맷
const formatPrice = (v) => v >= PRICE_MAX ? '5만원+' : v === 0 ? '0원' : `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}만원`
const priceMinLabel = computed(() => formatPrice(priceMin.value))
const priceMaxLabel = computed(() => formatPrice(priceMax.value))

// 슬라이더 트랙 체우기
const trackFillStyle = computed(() => {
  const range = PRICE_MAX - PRICE_MIN
  const left = ((priceMin.value - PRICE_MIN) / range) * 100
  const right = ((PRICE_MAX - priceMax.value) / range) * 100
  return { left: `${left}%`, right: `${right}%` }
})

// 디바운스: 슬라이더 조작 후 300ms 뒤 API 호출
let priceDebounceTimer = null
const triggerPriceSearch = () => {
  clearTimeout(priceDebounceTimer)
  priceDebounceTimer = setTimeout(() => {
    currentPage.value = 1
    refreshNuxtData('restaurants')
  }, 300)
}

const onMinInput = (e) => {
  const val = Number(e.target.value)
  priceMin.value = Math.min(val, priceMax.value - PRICE_STEP)
  triggerPriceSearch()
}

const onMaxInput = (e) => {
  const val = Number(e.target.value)
  priceMax.value = Math.max(val, priceMin.value + PRICE_STEP)
  triggerPriceSearch()
}

const resetPrice = () => {
  priceMin.value = PRICE_MIN
  priceMax.value = PRICE_MAX
  triggerPriceSearch()
}

const setSort = (sort) => {
  selectedSort.value = sort
  currentPage.value = 1
}

const goPage = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const submitSearch = () => {
  searchKeyword.value = searchInput.value.trim()
  currentPage.value = 1
}

const clearSearch = () => {
  searchInput.value = ''
  searchKeyword.value = ''
  currentPage.value = 1
}
</script>
