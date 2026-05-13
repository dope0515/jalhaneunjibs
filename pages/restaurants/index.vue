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

      <!-- 카테고리 필터 -->
      <div class="filter-wrap">
        <div class="category-filters">
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

      <!-- 로딩 스켈레톤 -->
      <div v-if="status === 'pending'" class="card-list">
        <div v-for="n in 6" :key="n" class="card-list-item">
          <AppSkeleton />
        </div>
      </div>

      <!-- 결과 없음 -->
      <div v-else-if="!restaurants.length" class="list-empty">
        <p>아직 등록된 식당이 없습니다.</p>
        <NuxtLink to="/restaurants/register" class="empty-register-link">
          첫 번째 맛집을 등록해보세요 →
        </NuxtLink>
      </div>

      <!-- 카드 목록 -->
      <div v-else class="card-list">
        <div v-for="restaurant in restaurants" :key="restaurant.id" class="card-list-item">
          <AppCardList :restaurant="restaurant" />
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
const currentPage = ref(1)

const { data, status } = await useAsyncData(
  'restaurants',
  () => $fetch('/api/restaurants', {
    query: {
      ...(selectedCategory.value ? { category: selectedCategory.value } : {}),
      page: currentPage.value,
    },
  }),
  { watch: [selectedCategory, currentPage] }
)

const restaurants = computed(() => data.value?.restaurants ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 1)

const setCategory = (cat) => {
  selectedCategory.value = cat
  currentPage.value = 1
}

const goPage = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style lang="scss" scoped>
.filter-wrap {
  margin-bottom: rem(32);
}

.category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: rem(8);
  justify-content: center;
}

.filter-btn {
  padding: rem(8) rem(18);
  border: 1px solid $gray-e4;
  border-radius: rem(100);
  background: $white;
  @include font(14, 1, 500, $gray-78);
  cursor: pointer;
  transition: all 0.2s;
  touch-action: manipulation;

  &:hover {
    border-color: $secondary-color;
    color: $secondary-color;
  }

  &.is-active {
    background: $primary-color;
    border-color: $primary-color;
    color: $white;
    font-weight: 700;
  }
}

.list-empty {
  text-align: center;
  padding: rem(80) 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: rem(16);

  p {
    @include font(16, 1, 400, $gray-78);
  }

  .empty-register-link {
    @include font(14, 1, 700, $primary-color);
    text-decoration: none;
    border-bottom: 1px solid $primary-color;
    padding-bottom: rem(2);
  }
}

.pagination-wrap {
  margin-top: rem(48);
}
</style>
