<template>
  <div class="card-list">
    <NuxtLink
      v-for="restaurant in restaurants"
      :key="restaurant.id"
      :to="`/restaurants/${restaurant.id}`"
      class="app-card-list"
    >
      <div class="app-card-list-thumbnail">
        <img
          v-if="restaurant.thumbnail"
          :src="restaurant.thumbnail"
          :alt="restaurant.name"
          class="app-card-list-img"
        />
        <div v-else class="app-card-list-img-placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <path d="M3 11l19-9-9 19-2-8-8-2z"/>
          </svg>
        </div>
        <span v-if="restaurant.foodCategory" class="app-card-list-category">{{ restaurant.foodCategory }}</span>
      </div>

      <div class="app-card-list-body">
        <h3 class="app-card-list-name">{{ restaurant.name }}</h3>

        <p class="app-card-list-address">{{ restaurant.region2 }} {{ restaurant.region3 }}</p>

        <div v-if="getRecommendedMenus(restaurant).length > 0" class="app-card-list-menus">
          <span
            v-for="menu in getRecommendedMenus(restaurant)"
            :key="menu.name"
            class="app-card-list-menu-tag"
          >
            ★ {{ menu.name }}
            <em v-if="menu.price">{{ formatPrice(menu.price) }}</em>
          </span>
        </div>

        <div class="app-card-list-footer">
          <div v-if="restaurant.keywords?.length" class="app-card-list-keywords">
            <span
              v-for="kw in restaurant.keywords.slice(0, 3)"
              :key="kw"
              class="app-card-list-keyword"
            >#{{ kw }}</span>
          </div>
          <div class="app-card-list-stats">
            <span class="app-card-list-rating">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {{ restaurant.averageRating > 0 ? restaurant.averageRating.toFixed(1) : '-' }}
            </span>
            <span class="app-card-list-review-count">리뷰 {{ restaurant.reviewCount }}</span>
          </div>
        </div>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup>
defineProps({
  restaurants: { type: Array, required: true },
})

const getRecommendedMenus = (restaurant) => restaurant.menus ?? []

const formatPrice = (price) => {
  const num = parseInt(price)
  if (isNaN(num)) return price
  return num.toLocaleString('ko-KR') + '원'
}
</script>
