<template>
  <div class="recommend-page">
    <div class="inner">
      <AppTitle
        badge="Recommend"
        title="오늘 뭐 먹지"
        desc="조건을 고르고 룰렛을 돌려 오늘 갈 잘하는 집을 정해보세요!"
      />

      <div class="recommend-container">
        <!-- 단계 1: 필터 설정 -->
        <div v-if="step === 1" class="step-wrap filter-step">
          <div class="filter-section">
            <div class="category-section-header">
              <h3 class="filter-title">1. 무엇을 드시겠어요?</h3>
              <div class="category-actions">
                <AppButton
                  variant="outline"
                  size="sm"
                  shape="round"
                  :disabled="isAllCategoriesSelected"
                  @click="selectAllCategories"
                >
                  전체 선택
                </AppButton>
                <AppButton
                  variant="outline"
                  size="sm"
                  shape="round"
                  :disabled="selectedCategories.length === 0"
                  @click="clearAllCategories"
                >
                  전체 해제
                </AppButton>
              </div>
            </div>
            <div class="category-grid">
              <button
                v-for="cat in categories"
                :key="cat"
                class="category-btn"
                :class="{ 'is-active': selectedCategories.includes(cat) }"
                @click="toggleCategory(cat)"
              >
                {{ cat }}
              </button>
            </div>
            <p v-if="selectedCategories.length === 0" class="validation-msg">카테고리를 하나 이상 선택해주세요.</p>
          </div>

          <div class="filter-section">
            <h3 class="filter-title">2. 어디서 드시겠어요?</h3>
            <div class="location-box">
              <AppButton 
                variant="outline" 
                size="sm" 
                shape="round"
                :class="{ 'is-active': useCurrentLocation, 'is-loading': isLocating }"
                :disabled="isLocating"
                @click="toggleLocation"
              >
                <img :src="useCurrentLocation ? '/assets/images/icon/ic_marker_active.svg' : '/assets/images/icon/ic_marker.svg'" width="16" height="16" alt="marker">
                {{ locationButtonLabel }}
              </AppButton>
              <p v-if="useCurrentLocation && detectedRegionLabel" class="location-detected">
                {{ detectedRegionLabel }} 주변
              </p>
              <div class="region-selects" v-if="!useCurrentLocation">
                <select v-model="selectedRegion1" class="custom-select">
                  <option :value="null">시/도 선택</option>
                  <option v-for="r1 in regionKeys" :key="r1" :value="r1">{{ r1 }}</option>
                </select>
                <select
                  v-if="selectedRegion1 && region2Keys.length > 0"
                  v-model="selectedRegion2"
                  class="custom-select"
                >
                  <option :value="null">구/군 전체</option>
                  <option v-for="r2 in region2Keys" :key="r2" :value="r2">{{ r2 }}</option>
                </select>
              </div>
            </div>
            <p v-if="!useCurrentLocation && !selectedRegion1" class="validation-msg">위치 정보를 활성화하거나 지역을 선택해주세요.</p>
            <p v-else-if="useCurrentLocation && !selectedRegion1 && !isLocating" class="validation-msg">위치를 확인할 수 없습니다. 다시 시도해 주세요.</p>
          </div>

          <div class="filter-section">
            <h3 class="filter-title">3. 예산은 어느 정도인가요?</h3>
            <div class="price-range-selector">
              <div class="price-display">
                <span>{{ formatPrice(priceMax) }}</span>
              </div>
              <input 
                type="range" 
                v-model="priceMax" 
                :min="PRICE_MIN"
                :max="PRICE_MAX"
                :step="PRICE_STEP"
                class="price-slider"
              >
              <div class="price-labels">
                <span>5천원</span>
                <span>5만원</span>
                <span>10만원+</span>
              </div>
            </div>
          </div>

          <div class="action-bx">
            <AppButton 
              size="md" 
              shape="round" 
              color="green" 
              :disabled="selectedCategories.length === 0 || isLocating || (!useCurrentLocation && !selectedRegion1) || (useCurrentLocation && !selectedRegion1)"
              @click="fetchCandidates"
            >
              식당 찾아보기
            </AppButton>
          </div>
        </div>

        <!-- 단계 2: 식당 선택 (나만의 리스트 만들기) -->
        <div v-if="step === 2" class="step-wrap selection-step">
          <div class="selection-header">
            <div class="text-bx">
              <h3 class="step-title">룰렛에 넣을 식당을 골라주세요</h3>
              <p class="step-desc">최대 12개까지 선택 가능합니다. (현재 {{ selectedCandidates.length }}개 선택됨)</p>
            </div>
            <div class="btns">
              <AppButton variant="outline" size="sm" shape="round" @click="autoFill">랜덤 채우기</AppButton>
              <AppButton variant="outline" size="sm" shape="round" @click="selectedCandidates = []">전체 해제</AppButton>
            </div>
          </div>

          <div class="candidate-list">
            <div 
              v-for="item in fetchedRestaurants" 
              :key="item.id" 
              class="candidate-item"
              :class="{ 'is-selected': isSelected(item) }"
              @click="toggleCandidate(item)"
            >
              <div class="item-img">
                <img
                  :src="item.thumbnail || '/assets/images/common/default.jpg'"
                  :alt="item.name"
                  @error="(e) => { e.target.src = '/assets/images/common/default.jpg' }"
                >
              </div>
              <div class="item-info">
                <span class="cat">{{ item.foodCategory }}</span>
                <h4 class="name">{{ item.name }}</h4>
                <p class="addr">{{ item.region2 }} {{ item.region3 }}</p>
              </div>
              <div class="item-check">
                <div class="check-circle"></div>
              </div>
            </div>
          </div>

          <div class="action-bx sticky-bottom">
            <AppButton variant="outline" size="lg" shape="round" @click="step = 1">이전으로</AppButton>
            <AppButton 
              size="lg" 
              shape="round" 
              color="green" 
              :disabled="selectedCandidates.length < 2"
              @click="goToRoulette"
            >
              룰렛 완성! ({{ selectedCandidates.length }}개)
            </AppButton>
          </div>
        </div>

        <!-- 단계 3: 룰렛 돌리기 -->
        <div v-if="step === 3" class="step-wrap roulette-step">
          <div class="roulette-header">
            <h3 class="step-title">오늘의 식당을 결정해볼까요?</h3>
            <div class="roulette-chips">
              <span v-for="item in selectedCandidates" :key="item.id" class="roulette-chip">{{ item.name }}</span>
            </div>
          </div>

          <div class="roulette-body">
            <div class="roulette-stage">
              <div class="roulette-glow"></div>
              <div class="roulette-pointer">
                <div class="pointer-pin"></div>
              </div>
              <svg
                class="roulette-wheel"
                viewBox="0 0 400 400"
                :style="wheelStyle"
                xmlns="http://www.w3.org/2000/svg"
              >
                <!-- 외곽 테두리 링 -->
                <circle cx="200" cy="200" r="199" fill="#1a1a1a" />
                <circle cx="200" cy="200" r="194" fill="#2d2d2d" />
                <!-- 슬라이스 -->
                <g v-for="(item, index) in selectedCandidates" :key="item.id">
                  <path
                    :d="getSlicePath(index)"
                    :fill="getSliceColor(index)"
                    stroke="rgba(255,255,255,0.3)"
                    stroke-width="1.5"
                  />
                  <text
                    :transform="getSliceTextTransform(index)"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    :font-size="sliceTextFontSize"
                    font-weight="700"
                    fill="#1a1a1a"
                    font-family="inherit"
                  >{{ truncateSliceName(item.name) }}</text>
                </g>
                <!-- 중앙 캡 -->
                <circle cx="200" cy="200" r="28" fill="#1a1a1a" />
                <circle cx="200" cy="200" r="20" fill="#fff" />
                <circle cx="200" cy="200" r="8" fill="#1a1a1a" />
              </svg>
            </div>

            <div class="roulette-actions">
              <template v-if="!resultRestaurant">
                <AppButton
                  v-if="!isSpinning"
                  size="lg"
                  color="green"
                  shape="round"
                  class="spin-btn"
                  @click="spinRoulette"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px">
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  룰렛 돌리기!
                </AppButton>
                <div v-else class="spinning-indicator">
                  <div class="spin-dots">
                    <span class="spin-dot"></span>
                    <span class="spin-dot"></span>
                    <span class="spin-dot"></span>
                  </div>
                  <p>결과를 정하는 중...</p>
                </div>
              </template>

              <div v-if="resultRestaurant && !isSpinning" class="result-card">
                <div class="result-icon">🎉</div>
                <p class="res-label">오늘의 선택</p>
                <span class="res-cat">{{ resultRestaurant.foodCategory }}</span>
                <h4 class="res-name">{{ resultRestaurant.name }}</h4>
                <p class="res-addr">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {{ resultRestaurant.address }}
                </p>
                <div class="res-btns">
                  <AppButton :to="`/restaurants/${resultRestaurant.id}`" color="green" shape="round">
                    식당 정보 보기
                  </AppButton>
                  <AppButton variant="outline" shape="round" @click="resetSpin">다시 돌리기</AppButton>
                </div>
                <button type="button" class="restart-btn" @click="reset">처음부터 다시 하기</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { $api } = useApi()

const categories = ['한식', '중식', '일식', '양식', '카페', '주점', '분식', '아시아음식']
const PRICE_MIN = 5000
const PRICE_MAX = 100000
const PRICE_STEP = 5000
const step = ref(1)
const selectedCategories = ref([])
const useCurrentLocation = ref(false)
const selectedRegion1 = ref(null)
const priceMax = ref(50000)

const fetchedRestaurants = ref([])
const selectedCandidates = ref([])
const isSpinning = ref(false)
const wheelRotation = ref(0)
const resultRestaurant = ref(null)

const { data: regionsData } = await useAsyncData('regions', () => $api('/restaurants/regions'))
const regionsMap = computed(() => regionsData.value ?? {})
const regionKeys = computed(() => Object.keys(regionsMap.value))

const selectedRegion2 = ref(null)
const region2Keys = computed(() => {
  if (!selectedRegion1.value || !regionsMap.value) return []
  return regionsMap.value[selectedRegion1.value] ?? []
})

const { isLocating, resolveCurrentLocation, alertLocationError } = useLocationRegion(regionsMap, regionKeys)

const locationButtonLabel = computed(() => {
  if (isLocating.value) return '위치 확인 중…'
  if (useCurrentLocation.value) return '내 위치 사용 중'
  return '내 위치 사용하기'
})

const detectedRegionLabel = computed(() => {
  if (!selectedRegion1.value) return ''
  if (selectedRegion2.value) return `${selectedRegion1.value} ${selectedRegion2.value}`
  return selectedRegion1.value
})

watch(selectedRegion1, () => { selectedRegion2.value = null })

const formatPrice = (p) => p >= PRICE_MAX ? '금액 제한 없음' : `${Number(p).toLocaleString()}원 이하`

const toggleCategory = (cat) => {
  if (selectedCategories.value.includes(cat)) {
    selectedCategories.value = selectedCategories.value.filter(c => c !== cat)
  } else {
    selectedCategories.value.push(cat)
  }
}

const isAllCategoriesSelected = computed(() =>
  categories.every((cat) => selectedCategories.value.includes(cat))
)

const selectAllCategories = () => {
  selectedCategories.value = [...categories]
}

const clearAllCategories = () => {
  selectedCategories.value = []
}

const toggleLocation = async () => {
  if (useCurrentLocation.value) {
    useCurrentLocation.value = false
    selectedRegion1.value = null
    selectedRegion2.value = null
    return
  }

  useCurrentLocation.value = true
  selectedRegion1.value = null
  selectedRegion2.value = null

  try {
    const { region1, region2 } = await resolveCurrentLocation()
    selectedRegion1.value = region1
    selectedRegion2.value = region2
  } catch (error) {
    useCurrentLocation.value = false
    selectedRegion1.value = null
    selectedRegion2.value = null
    alertLocationError(error)
  }
}

const fetchCandidates = async () => {
  try {
    const query = {
      category: selectedCategories.value.join(','),
      priceMax: priceMax.value,
      limit: 30 // 선택 후보를 넉넉히 가져옴
    }
    if (selectedRegion1.value) query.region1 = selectedRegion1.value
    if (selectedRegion2.value) query.region2 = selectedRegion2.value

    const { restaurants } = await $api('/restaurants', { query })

    if (restaurants.length < 2) {
      alert('조건에 맞는 식당이 너무 적습니다. 조건을 변경해보세요!')
      return
    }

    fetchedRestaurants.value = restaurants
    selectedCandidates.value = [] // 초기화
    step.value = 2
  } catch (e) {
    alert('데이터를 가져오는데 실패했습니다.')
  }
}

const isSelected = (item) => selectedCandidates.value.some(c => c.id === item.id)

const toggleCandidate = (item) => {
  if (isSelected(item)) {
    selectedCandidates.value = selectedCandidates.value.filter(c => c.id !== item.id)
  } else {
    if (selectedCandidates.value.length >= 12) {
      alert('룰렛에는 최대 12개까지만 넣을 수 있습니다.')
      return
    }
    selectedCandidates.value.push(item)
  }
}

const autoFill = () => {
  const count = Math.min(fetchedRestaurants.value.length, 12)
  const shuffled = [...fetchedRestaurants.value].sort(() => 0.5 - Math.random())
  selectedCandidates.value = shuffled.slice(0, count)
}

const goToRoulette = () => {
  step.value = 3
  wheelRotation.value = 0
  resultRestaurant.value = null
}

const spinRoulette = () => {
  if (isSpinning.value) return
  
  isSpinning.value = true
  const sliceDegree = 360 / selectedCandidates.value.length
  const randomIndex = Math.floor(Math.random() * selectedCandidates.value.length)
  
  // 최소 5바퀴 + 랜덤 위치 (화살표가 12시 방향이므로 인덱스 역순 계산)
  const extraRotation = (360 * 5) + (360 - (randomIndex * sliceDegree)) - (sliceDegree / 2)
  wheelRotation.value += extraRotation
  
  setTimeout(() => {
    isSpinning.value = false
    resultRestaurant.value = selectedCandidates.value[randomIndex]
  }, 4000)
}

const getSlicePath = (index) => {
  const count = selectedCandidates.value.length
  const sliceAngle = (2 * Math.PI) / count
  const startAngle = index * sliceAngle - Math.PI / 2
  const endAngle = startAngle + sliceAngle
  const cx = 200, cy = 200, r = 187

  if (count === 1) {
    return `M ${cx - r} ${cy} a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 -${r * 2} 0`
  }

  const x1 = (cx + r * Math.cos(startAngle)).toFixed(3)
  const y1 = (cy + r * Math.sin(startAngle)).toFixed(3)
  const x2 = (cx + r * Math.cos(endAngle)).toFixed(3)
  const y2 = (cy + r * Math.sin(endAngle)).toFixed(3)
  const largeArc = sliceAngle > Math.PI ? 1 : 0

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

const getSliceColor = (index) => {
  const count = selectedCandidates.value.length
  const hue = index * (360 / count)
  return `hsl(${hue}, 70%, 93%)`
}

const sliceTextFontSize = computed(() => {
  const count = selectedCandidates.value.length
  if (count <= 4) return 14
  if (count <= 8) return 12
  return 10
})

const truncateSliceName = (name) => {
  const count = selectedCandidates.value.length
  const maxLen = count <= 4 ? 8 : count <= 8 ? 6 : 5
  return name.length > maxLen ? name.slice(0, maxLen - 1) + '…' : name
}

const getSliceTextTransform = (index) => {
  const count = selectedCandidates.value.length
  const sliceDeg = 360 / count
  const midAngleDeg = index * sliceDeg + sliceDeg / 2 - 90
  const midAngleRad = midAngleDeg * Math.PI / 180
  const textR = count <= 4 ? 105 : count <= 8 ? 118 : 128
  const cx = 200, cy = 200

  const tx = (cx + textR * Math.cos(midAngleRad)).toFixed(2)
  const ty = (cy + textR * Math.sin(midAngleRad)).toFixed(2)

  // 왼쪽 반원(90°~270°)에 있는 텍스트는 180° 뒤집어 항상 읽기 쉽게 표시
  const norm = ((midAngleDeg % 360) + 360) % 360
  const rotation = (norm > 90 && norm <= 270) ? midAngleDeg + 180 : midAngleDeg

  return `translate(${tx}, ${ty}) rotate(${rotation.toFixed(2)})`
}

const wheelStyle = computed(() => ({
  transform: `rotate(${wheelRotation.value}deg)`,
  transition: isSpinning.value ? 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)' : 'none'
}))

const resetSpin = () => {
  resultRestaurant.value = null
  // wheelRotation은 유지 → 바로 이어서 돌릴 때 자연스럽게 연속 회전
}

const reset = () => {
  step.value = 1
  fetchedRestaurants.value = []
  selectedCandidates.value = []
  resultRestaurant.value = null
  wheelRotation.value = 0
  selectedRegion2.value = null
}
</script>

<style lang="scss" scoped>
.recommend-page {
  padding-block: rem(32);
  overflow-x: hidden;

  @include tablet {
    padding-block: rem(60);
  }

  .recommend-container {
    margin-top: rem(24);
    background-color: $white;
    border: 1px solid $gray-e4;
    border-radius: rem(20);
    padding: rem(24) rem(16);
    min-height: auto;

    @include tablet {
      margin-top: rem(48);
      border-radius: rem(32);
      padding: rem(60) rem(40);
      min-height: rem(600);
    }
  }

  .step-wrap {
    max-width: rem(800);
    margin: 0 auto;
  }

  .step-title {
    @include font(20, 1.3, 700);
    margin-bottom: rem(10);

    @include tablet {
      @include font(24, 1, 700);
      margin-bottom: rem(12);
    }
  }

  .step-desc {
    @include font(14, 1.5, 400, $gray-66);

    @include tablet {
      @include font(15, 1, 400, $gray-66);
    }
  }

  .required {
    @include font(12, 1, 500, #ff4d4f);
    margin-left: rem(4);
    vertical-align: middle;
  }

  .validation-msg {
    @include font(13, 1, 400, #ff4d4f);
    margin-top: rem(12);
  }

  // Filter Step
  .filter-section {
    margin-bottom: rem(32);

    @include tablet {
      margin-bottom: rem(48);
    }

    .filter-title {
      @include font(17, 1.3, 700, $black);
      margin-bottom: rem(16);
      display: flex;
      align-items: center;
      gap: rem(8);

      @include tablet {
        @include font(20, 1, 700, $black);
        margin-bottom: rem(24);
      }

      &::before {
        content: "";
        width: rem(4);
        height: rem(18);
        background-color: $primary-color;
        border-radius: rem(2);
        flex-shrink: 0;

        @include tablet {
          height: rem(20);
        }
      }
    }

    .category-section-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: rem(12);
      margin-bottom: rem(16);

      @include tablet {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        margin-bottom: rem(24);
      }

      .filter-title {
        margin-bottom: 0;
      }
    }

    .category-actions {
      display: flex;
      flex-wrap: wrap;
      gap: rem(8);
      width: 100%;

      :deep(.app-button) {
        flex: 1 1 calc(50% - #{rem(4)});
        min-width: calc(50% - #{rem(4)});
        justify-content: center;
      }

      @include tablet {
        width: auto;
        flex-wrap: nowrap;

        :deep(.app-button) {
          flex: none;
          min-width: 0;
          width: auto;
        }
      }
    }
  }

  .category-grid {
    display: flex;
    flex-wrap: wrap;
    gap: rem(8);

    @include tablet {
      gap: rem(12);
    }
  }

  .category-btn {
    flex: 1 1 calc(50% - #{rem(4)});
    min-width: calc(50% - #{rem(4)});
    padding: rem(12);
    border: 1px solid $gray-e4;
    border-radius: rem(12);
    @include font(14, 1, 500, $gray-66);
    transition: all 0.2s ease;
    background-color: $white;
    cursor: pointer;

    @include tablet {
      flex: 1 1 calc(25% - #{rem(9)});
      min-width: calc(25% - #{rem(9)});
      padding: rem(14);
      @include font(15, 1, 500, $gray-66);
    }

    &:hover {
      border-color: $primary-color;
      color: $primary-color;
      background-color: rgba($primary-color, 0.02);
    }

    &.is-active {
      background-color: $primary-color;
      border-color: $primary-color;
      color: $white;
    }
  }

  .location-box {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: rem(12);

    @include tablet {
      flex-direction: row;
      align-items: center;
      gap: rem(16);
    }

    :deep(.app-button) {
      width: 100%;
      justify-content: center;
      gap: rem(6);
      transition: all 0.2s ease;

      @include tablet {
        width: auto;
      }

      &.is-active {
        background-color: $primary-color;
        border-color: $primary-color;
        color: $white;
        font-weight: 700;
        box-shadow: 0 rem(4) rem(12) rgba($primary-color, 0.25);

      }

      &.is-loading {
        opacity: 0.7;
        pointer-events: none;
      }
    }

    .location-detected {
      margin: 0;
      font-size: rem(14);
      color: $gray-66;
      font-weight: 500;
    }

    .region-selects {
      display: flex;
      flex-direction: column;
      gap: rem(8);
      width: 100%;

      @include tablet {
        flex-direction: row;
        gap: rem(10);
        width: auto;
      }
    }

    .custom-select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      width: 100%;
      padding: rem(12) rem(40) rem(12) rem(20);
      border: 1px solid $gray-e4;
      border-radius: rem(100);
      background-color: $white;
      background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right rem(16) center;
      background-size: rem(12) rem(8);
      @include font(15, 1, 500, $gray-44);
      outline: none;
      cursor: pointer;
      transition: all 0.2s ease;

      @include tablet {
        width: auto;
      }

      &:hover { border-color: $primary-color; }

      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
      }
    }
  }

  .price-range-selector {
    .price-display {
      @include font(22, 1, 700, $primary-color);
      margin-bottom: rem(16);
      text-align: center;

      @include tablet {
        @include font(28, 1, 700, $primary-color);
        margin-bottom: rem(20);
      }
    }

    .price-slider {
      width: 100%;
      height: rem(8);
      background: $gray-e4;
      border-radius: rem(4);
      appearance: none;
      outline: none;

      &::-webkit-slider-thumb {
        appearance: none;
        width: rem(28);
        height: rem(28);
        background: $white;
        border: 2px solid $primary-color;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 rem(2) rem(8) rgba(0,0,0,0.15);
        transition: transform 0.2s ease;
      }

      &::-webkit-slider-thumb:hover {
        transform: scale(1.15);
      }
    }

    .price-labels {
      display: flex;
      justify-content: space-between;
      margin-top: rem(12);
      @include font(13, 1, 500, $gray-99);

      @include tablet {
        @include font(14, 1, 500, $gray-99);
      }
    }
  }

  // Selection Step
  .selection-header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: rem(16);
    margin-bottom: rem(24);
    padding-bottom: rem(16);
    border-bottom: 1px solid $gray-f0;

    @include tablet {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: rem(32);
      padding-bottom: rem(20);
    }

    .btns {
      display: flex;
      flex-wrap: wrap;
      gap: rem(8);
      width: 100%;

      :deep(.app-button) {
        flex: 1 1 calc(50% - #{rem(4)});
        min-width: calc(50% - #{rem(4)});
        justify-content: center;
      }

      @include tablet {
        width: auto;
        flex-wrap: nowrap;

        :deep(.app-button) {
          flex: none;
          min-width: 0;
          width: auto;
        }
      }
    }
  }

  .candidate-list {
    display: flex;
    flex-direction: column;
    gap: rem(12);
    margin-bottom: rem(24);

    @include tablet {
      flex-direction: row;
      flex-wrap: wrap;
      gap: rem(16);
      margin-bottom: rem(40);
    }
  }

  .candidate-item {
    display: flex;
    align-items: center;
    gap: rem(12);
    padding: rem(12);
    border: 1px solid $gray-e4;
    border-radius: rem(16);
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: $white;
    width: 100%;

    @include tablet {
      gap: rem(16);
      padding: rem(16);
      width: calc(50% - #{rem(8)});
    }

    &:hover {
      border-color: $primary-color;
      transform: translateY(rem(-2));
      box-shadow: 0 rem(6) rem(16) rgba(0,0,0,0.06);
    }

    &.is-selected {
      border-color: $primary-color;
      background-color: rgba($primary-color, 0.03);

      .item-check .check-circle {
        background-color: $primary-color;
        border-color: $primary-color;
      }

      .item-check .check-circle::after {
        content: '';
        display: block;
        width: rem(10);
        height: rem(6);
        border-bottom: 2px solid $white;
        border-left: 2px solid $white;
        transform: rotate(-45deg) translate(rem(2), rem(-1));
      }
    }

    .item-img {
      width: rem(52);
      height: rem(52);
      border-radius: rem(12);
      overflow: hidden;
      flex-shrink: 0;

      @include tablet {
        width: rem(60);
        height: rem(60);
      }

      img { width: 100%; height: 100%; object-fit: cover; }
    }

    .item-info {
      flex: 1;
      min-width: 0;

      .cat { @include font(12, 1, 500, $primary-color); }

      .name {
        @include font(15, 1.3, 700, $black);
        margin-block: rem(4);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        @include tablet {
          @include font(16, 1.3, 700, $black);
        }
      }

      .addr { @include font(12, 1, 400, $gray-99); }
    }

    .item-check {
      flex-shrink: 0;

      .check-circle {
        width: rem(24);
        height: rem(24);
        border: 2px solid $gray-e4;
        border-radius: 50%;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .action-bx {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: rem(10);

    :deep(.app-button) {
      width: 100%;
      justify-content: center;
    }

    @include tablet {
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: rem(12);

      :deep(.app-button) {
        width: auto;
      }
    }

    &.sticky-bottom {
      position: sticky;
      bottom: 0;
      background: $white;
      padding-block: rem(16);
      margin-inline: rem(-16);
      padding-inline: rem(16);
      border-top: 1px solid $gray-f0;
      z-index: 10;

      @include tablet {
        margin-inline: 0;
        padding-inline: 0;
        padding-block: rem(20);
      }
    }
  }

  // Roulette Step
  .roulette-header {
    text-align: center;
    margin-bottom: rem(24);

    @include tablet {
      margin-bottom: rem(32);
    }

    .step-title { margin-bottom: rem(12); }

    @include tablet {
      .step-title { margin-bottom: rem(16); }
    }

    .roulette-chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: rem(6);

      @include tablet {
        gap: rem(8);
      }
    }

    .roulette-chip {
      display: inline-block;
      max-width: 100%;
      padding: rem(5) rem(12);
      background-color: $gray-f0;
      border-radius: rem(100);
      @include font(12, 1, 500, $gray-66);
      word-break: keep-all;

      @include tablet {
        padding: rem(6) rem(14);
        @include font(13, 1, 500, $gray-66);
      }
    }
  }

  .roulette-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: rem(24);

    @include tablet {
      flex-direction: row;
      align-items: flex-start;
      gap: rem(48);
    }
  }

  .roulette-stage {
    position: relative;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 1;
    flex-shrink: 0;
    margin-inline: auto;

    @include tablet {
      max-width: rem(380);
    }

    .roulette-glow {
      position: absolute;
      inset: rem(-12);
      border-radius: 50%;
      background: radial-gradient(circle, rgba($primary-color, 0.12) 0%, transparent 70%);
      pointer-events: none;

      @include tablet {
        inset: rem(-20);
      }
    }

    .roulette-pointer {
      position: absolute;
      top: rem(-4);
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;

      @include tablet {
        top: rem(-6);
      }

      .pointer-pin {
        width: rem(16);
        height: rem(36);
        background: linear-gradient(180deg, $white 0%, $primary-color 40%, $primary-color-hover 100%);
        border-radius: rem(4) rem(4) 0 0;
        clip-path: polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%);
        box-shadow: 0 rem(4) rem(12) rgba(0,0,0,0.25);

        @include tablet {
          width: rem(20);
          height: rem(44);
        }
      }
    }

    .roulette-wheel {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: block;
      box-shadow:
        0 rem(12) rem(40) rgba(0,0,0,0.2),
        0 0 0 rem(3) rgba(255,255,255,0.6);

      @include tablet {
        box-shadow:
          0 rem(20) rem(60) rgba(0,0,0,0.25),
          0 0 0 rem(4) rgba(255,255,255,0.6);
      }
    }
  }

  .roulette-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: auto;
    gap: rem(20);

    @include tablet {
      flex: 1;
      min-height: rem(380);
      gap: rem(24);
    }

    .spin-btn {
      width: 100%;
      max-width: rem(280);
      font-size: rem(16);

      @include tablet {
        width: rem(200);
        max-width: none;
        font-size: rem(17);
      }
    }
  }

  .spinning-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: rem(14);

    .spin-dots {
      display: flex;
      gap: rem(8);
    }

    .spin-dot {
      display: block;
      width: rem(10);
      height: rem(10);
      border-radius: 50%;
      background-color: $primary-color;
      animation: spin-bounce 1.2s infinite ease-in-out both;

      &:nth-child(1) { animation-delay: -0.32s; }
      &:nth-child(2) { animation-delay: -0.16s; }
      &:nth-child(3) { animation-delay: 0s; }
    }

    p {
      @include font(15, 1, 500, $gray-66);
    }
  }

  @keyframes spin-bounce {
    0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }

  .result-card {
    width: 100%;
    text-align: center;
    background: linear-gradient(135deg, #f8fdfc 0%, #edfaf5 100%);
    border: 1.5px solid rgba($primary-color, 0.3);
    padding: rem(24) rem(16);
    border-radius: rem(20);
    box-shadow: 0 rem(8) rem(32) rgba($primary-color, 0.1);
    animation: result-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;

    @include tablet {
      padding: rem(36) rem(32);
      border-radius: rem(28);
    }

    .result-icon {
      font-size: rem(40);
      line-height: 1;
      margin-bottom: rem(12);

      @include tablet {
        font-size: rem(48);
        margin-bottom: rem(16);
      }
    }

    .res-label {
      @include font(12, 1, 600, $primary-color);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: rem(8);

      @include tablet {
        @include font(13, 1, 600, $primary-color);
      }
    }

    .res-cat {
      display: inline-block;
      padding: rem(4) rem(12);
      background-color: rgba($primary-color, 0.1);
      border-radius: rem(100);
      @include font(12, 1, 600, $primary-color);
      margin-bottom: rem(10);
    }

    .res-name {
      @include font(22, 1.3, 800, $black);
      margin-bottom: rem(10);
      word-break: keep-all;

      @include tablet {
        @include font(28, 1.2, 800, $black);
        margin-bottom: rem(12);
      }
    }

    .res-addr {
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: rem(4);
      @include font(13, 1.5, 400, $gray-66);
      margin-bottom: rem(20);
      word-break: keep-all;

      @include tablet {
        @include font(14, 1.5, 400, $gray-66);
        margin-bottom: rem(28);
      }

      svg { flex-shrink: 0; margin-top: rem(2); }
    }

    .res-btns {
      display: flex;
      flex-direction: column;
      gap: rem(8);
      width: 100%;

      :deep(.app-button) {
        width: 100%;
        justify-content: center;
      }

      @include tablet {
        flex-direction: row;
        justify-content: center;
        gap: rem(10);
        width: auto;

        :deep(.app-button) {
          width: auto;
        }
      }
    }

    .restart-btn {
      margin-top: rem(12);
      background: none;
      border: none;
      cursor: pointer;
      @include font(13, 1, 400, $gray-99);
      text-decoration: underline;
      text-underline-offset: rem(3);
      transition: color 0.2s;

      @include tablet {
        margin-top: rem(14);
      }

      &:hover { color: $gray-66; }
    }
  }

  @keyframes result-pop {
    0% { opacity: 0; transform: scale(0.85) translateY(rem(16)); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
}
</style>
