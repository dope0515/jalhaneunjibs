<template>
  <section class="restaurants-list">
    <div class="inner">
      <div class="page-header">
        <AppTitle
          badge="Places"
          title="잘하는 집 모아보기"
          desc="이미 다녀온 사람들이 직접 추천하는 숨은 맛집을 찾아보세요."
        />
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
      </div>

      <!-- 결과 영역 -->
      <div class="list-container" :class="{ 'is-loading': isRefreshing }">
        <!-- 최초 로딩 스켈레톤 -->
        <div v-if="isFirstLoading" class="card-list">
          <AppSkeleton v-for="n in 6" :key="n" />
        </div>

        <!-- 결과 없음 (로딩 중이 아닐 때만 노출) -->
        <div v-else-if="!isRefreshing && !restaurants.length" class="list-empty">
          <p>아직 등록된 식당이 없습니다.</p>
          <NuxtLink to="/restaurants/register" class="empty-register-link">
            첫 번째 맛집을 등록해보세요 →
          </NuxtLink>
        </div>

        <!-- 카드 목록 (데이터가 있으면 항상 유지) -->
        <AppCardList v-else :restaurants="restaurants" />
        
        <!-- 로딩 오버레이 (재로딩 시에만 노출) -->
        <div v-if="isRefreshing" class="loading-overlay">
          <div class="spinner"></div>
        </div>
      </div>

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
const categories = ['한식', '중식', '일식', '양식', '카페', '주점', '분식', '아시아음식']

const selectedCategory = ref(null)
const selectedRegion1 = ref(null)
const selectedRegion2 = ref(null)
const currentPage = ref(1)

const { data: regionsData } = await useAsyncData(
  'regions',
  () => $fetch('/api/restaurants/regions'),
)

// { "서울특별시": ["강남구", ...], ... }
const regionsMap = computed(() => regionsData.value ?? {})
const regionKeys = computed(() => Object.keys(regionsMap.value))
const subRegions = computed(() =>
  selectedRegion1.value ? (regionsMap.value[selectedRegion1.value] ?? []) : []
)

const { data, status } = await useAsyncData(
  'restaurants',
  () => $fetch('/api/restaurants', {
    query: {
      ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
      ...(selectedRegion1.value ? { region1: selectedRegion1.value } : {}),
      ...(selectedRegion2.value ? { region2: selectedRegion2.value } : {}),
      page: currentPage.value,
    },
  }),
  { 
    watch: [selectedCategory, selectedRegion1, selectedRegion2, currentPage],
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

const goPage = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>
