<template>
  <div class="recommend-page">
    <div class="inner">
      <AppTitle
        badge="Recommend"
        title="잘하는 집 추천"
        desc="내가 가고 싶은 곳들만 쏙쏙 골라 룰렛을 만들어보세요!"
      />

      <div class="recommend-container">
        <!-- 단계 1: 필터 설정 -->
        <div v-if="step === 1" class="step-wrap filter-step">
          <div class="filter-section">
            <h3 class="filter-title">1. 무엇을 드시겠어요?</h3>
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
                :class="{ 'is-active': useCurrentLocation }"
                @click="toggleLocation"
              >
                <img src="~/assets/images/icon/ic_marker.svg" width="16" alt="">
                {{ useCurrentLocation ? '내 위치 사용 중' : '내 위치 사용하기' }}
              </AppButton>
              <div class="region-selects" v-if="!useCurrentLocation">
                <select v-model="selectedRegion1" class="custom-select">
                  <option :value="null">지역 선택 (시/도)</option>
                  <option v-for="r1 in regionKeys" :key="r1" :value="r1">{{ r1 }}</option>
                </select>
              </div>
            </div>
            <p v-if="!useCurrentLocation && !selectedRegion1" class="validation-msg">위치 정보를 활성화하거나 지역을 선택해주세요.</p>
          </div>

          <div class="filter-section">
            <h3 class="filter-title">3. 예산은 어느 정도인가요?</h3>
            <div class="price-range-selector">
              <div class="price-display">
                <span>{{ formatPrice(priceMax) }} 이하</span>
              </div>
              <input 
                type="range" 
                v-model="priceMax" 
                min="0" 
                max="100000" 
                step="5000" 
                class="price-slider"
              >
              <div class="price-labels">
                <span>0원</span>
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
              :disabled="selectedCategories.length === 0 || (!useCurrentLocation && !selectedRegion1)"
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
                <img v-if="item.thumbnail" :src="item.thumbnail" alt="">
                <div v-else class="no-img"></div>
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
          <div class="roulette-stage">
            <div class="roulette-pointer"></div>
            <div 
              class="roulette-wheel" 
              :style="wheelStyle"
            >
              <div 
                v-for="(item, index) in selectedCandidates" 
                :key="item.id" 
                class="wheel-slice"
                :style="getSliceStyle(index)"
              >
                <span class="slice-text">{{ item.name }}</span>
              </div>
            </div>
          </div>

          <div class="roulette-actions">
            <AppButton 
              v-if="!isSpinning && !resultRestaurant" 
              size="lg" 
              color="green" 
              shape="round" 
              @click="spinRoulette"
            >
              룰렛 돌리기!
            </AppButton>
            
            <div v-if="resultRestaurant && !isSpinning" class="result-card" data-aos="zoom-in">
              <span class="res-cat">{{ resultRestaurant.foodCategory }}</span>
              <h4 class="res-name">{{ resultRestaurant.name }}</h4>
              <p class="res-addr">{{ resultRestaurant.address }}</p>
              <div class="res-btns">
                <AppButton :to="`/restaurants/${resultRestaurant.id}`" color="green" shape="round">식당 정보 보기</AppButton>
                <AppButton variant="outline" shape="round" @click="reset">다시 하기</AppButton>
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
const regionKeys = computed(() => regionsData.value ? Object.keys(regionsData.value) : [])

const formatPrice = (p) => p >= 100000 ? '금액 제한 없음' : `${Number(p).toLocaleString()}원 이하`

const toggleCategory = (cat) => {
  if (selectedCategories.value.includes(cat)) {
    selectedCategories.value = selectedCategories.value.filter(c => c !== cat)
  } else {
    selectedCategories.value.push(cat)
  }
}

const toggleLocation = () => {
  useCurrentLocation.value = !useCurrentLocation.value
  if (useCurrentLocation.value) selectedRegion1.value = null
}

const fetchCandidates = async () => {
  try {
    const query = {
      category: selectedCategories.value.join(','),
      priceMax: priceMax.value,
      limit: 30 // 선택 후보를 넉넉히 가져옴
    }
    if (selectedRegion1.value) query.region1 = selectedRegion1.value

    const { restaurants } = await $api('/restaurants', { query })

    if (restaurants.length < 2) {
      alert('조건에 맞는 식당이 너무 적습니다(최소 2개 필요). 조건을 변경해보세요!')
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

const getSliceStyle = (index) => {
  const count = selectedCandidates.value.length
  const degree = 360 / count
  const rotate = index * degree
  const skew = 90 - degree
  
  // 무지개색 계열로 자동 배색
  const hue = (index * (360 / count))
  return {
    transform: `rotate(${rotate}deg) skewY(-${skew}deg)`,
    backgroundColor: `hsl(${hue}, 70%, 95%)`
  }
}

const wheelStyle = computed(() => ({
  transform: `rotate(${wheelRotation.value}deg)`,
  transition: isSpinning.value ? 'transform 4s cubic-bezier(0.15, 0, 0.15, 1)' : 'none'
}))

const reset = () => {
  step.value = 1
  fetchedRestaurants.value = []
  selectedCandidates.value = []
  resultRestaurant.value = null
  wheelRotation.value = 0
}
</script>

<style lang="scss" scoped>
.recommend-page {
  padding-block: rem(60);

  .recommend-container {
    margin-top: rem(48);
    background-color: $white;
    border: 1px solid $gray-e4;
    border-radius: rem(32);
    padding: rem(60) rem(40);
    min-height: rem(600);
  }

  .step-wrap {
    max-width: rem(800);
    margin: 0 auto;
  }

  .step-title { @include font(24, 1, 700); margin-bottom: rem(12); }
  .step-desc { @include font(15, 1, 400, $gray-66); }

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
    margin-bottom: rem(48);
    .filter-title {
      @include font(20, 1, 700, $black);
      margin-bottom: rem(24);
      display: flex;
      align-items: center;
      gap: rem(8);
      &::before {
        content: ""; width: rem(4); height: rem(20); background-color: $primary-color; border-radius: rem(2);
      }
    }
  }

  .category-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: rem(12); }
  .category-btn {
    padding: rem(14); border: 1px solid $gray-e4; border-radius: rem(12);
    @include font(15, 1, 500, $gray-66); transition: all 0.2s ease;
    background-color: $white; cursor: pointer;
    &:hover {
      border-color: $primary-color;
      color: $primary-color;
      background-color: rgba($primary-color, 0.02);
    }
    &.is-active { background-color: $primary-color; border-color: $primary-color; color: $white; }
  }

  .location-box {
    display: flex; gap: rem(16); align-items: center;
    .custom-select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
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

      &:hover { border-color: $primary-color; }
      &:focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba($primary-color, 0.1);
      }
    }
  }

  .price-range-selector {
    .price-display { @include font(28, 1, 700, $primary-color); margin-bottom: rem(20); text-align: center; }
    .price-slider {
      width: 100%; height: rem(8); background: $gray-e4; border-radius: rem(4); appearance: none; outline: none;
      &::-webkit-slider-thumb {
        appearance: none; width: rem(28); height: rem(28); background: $white; border: 2px solid $primary-color; border-radius: 50%; cursor: pointer;
        box-shadow: 0 rem(2) rem(8) rgba(0,0,0,0.15); transition: transform 0.2s ease;
      }
      &::-webkit-slider-thumb:hover {
        transform: scale(1.15);
      }
    }
    .price-labels { display: flex; justify-content: space-between; margin-top: rem(12); @include font(14, 1, 500, $gray-99); }
  }

  // Selection Step
  .selection-header {
    display: flex; justify-content: space-between; align-items: flex-end;
    margin-bottom: rem(32); padding-bottom: rem(20); border-bottom: 1px solid $gray-f0;
    .btns { display: flex; gap: rem(8); }
  }

  .candidate-list {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: rem(16);
    margin-bottom: rem(40);
  }

  .candidate-item {
    display: flex; align-items: center; gap: rem(16); padding: rem(16);
    border: 1px solid $gray-e4; border-radius: rem(16); cursor: pointer; transition: all 0.2s ease;
    background-color: $white;
    
    &:hover { border-color: $primary-color; transform: translateY(rem(-2)); box-shadow: 0 rem(6) rem(16) rgba(0,0,0,0.06); }
    &.is-selected {
      border-color: $primary-color; background-color: rgba($primary-color, 0.03);
      .item-check .check-circle { background-color: $primary-color; border-color: $primary-color; }
      .item-check .check-circle::after {
        content: ''; display: block; width: rem(10); height: rem(6);
        border-bottom: 2px solid $white; border-left: 2px solid $white;
        transform: rotate(-45deg) translate(rem(2), rem(-1));
      }
    }

    .item-img {
      width: rem(60); height: rem(60); border-radius: rem(12); overflow: hidden; flex-shrink: 0;
      img { width: 100%; height: 100%; object-fit: cover; }
      .no-img { width: 100%; height: 100%; background-color: $gray-f0; }
    }

    .item-info {
      flex: 1; min-width: 0;
      .cat { @include font(12, 1, 500, $primary-color); }
      .name { @include font(16, 1.3, 700, $black); margin-block: rem(4); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .addr { @include font(13, 1, 400, $gray-99); }
    }

    .item-check {
      .check-circle {
        width: rem(24); height: rem(24); border: 2px solid $gray-e4; border-radius: 50%;
        transition: all 0.2s ease; display: flex; align-items: center; justify-content: center;
      }
    }
  }

  .action-bx {
    display: flex; gap: rem(12); justify-content: center;
    &.sticky-bottom { position: sticky; bottom: 0; background: white; padding-block: rem(20); border-top: 1px solid $gray-f0; z-index: 10; }
  }

  // Roulette Step
  .roulette-stage {
    position: relative; width: rem(400); height: rem(400); margin: 0 auto rem(60);
    .roulette-pointer {
      position: absolute; top: rem(-20); left: 50%; transform: translateX(-50%);
      width: rem(40); height: rem(50); background-color: $primary-color;
      clip-path: polygon(0% 0%, 100% 0%, 50% 100%); z-index: 10;
    }
    .roulette-wheel {
      width: 100%; height: 100%; border-radius: 50%; border: rem(12) solid #333;
      position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }
    .wheel-slice {
      position: absolute; width: 50%; height: 50%; top: 0; right: 0;
      transform-origin: 0% 100%; display: flex; align-items: center; justify-content: center;
      border: 0.5px solid rgba(0,0,0,0.05);

      .slice-text {
        // 이 텍스트 회전 값은 슬라이스 개수에 따라 미세 조정이 필요할 수 있음
        transform: skewY(0deg) rotate(0deg); 
        @include font(14, 1.2, 700, $black);
        width: rem(120); text-align: center;
        position: absolute; left: rem(40); bottom: rem(40);
        transform: rotate(45deg); // 기본 45도 방향
      }
    }
  }

  .result-card {
    text-align: center; background-color: #f8fdfc; border: 1px solid $primary-color;
    padding: rem(40); border-radius: rem(24);
    .res-cat { @include font(14, 1, 600, $primary-color); }
    .res-name { @include font(32, 1.2, 700, $black); margin-block: rem(12); }
    .res-addr { @include font(16, 1, 400, $gray-66); margin-bottom: rem(32); }
    .res-btns { display: flex; gap: rem(12); justify-content: center; }
  }
}
</style>
