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
          :src="restaurant.thumbnail || '/assets/images/common/default.jpg'"
          :alt="restaurant.name"
          class="app-card-list-img"
        />
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
            <img src="/assets/images/icon/ic_star.svg" width="12" height="12" alt="" class="icon-star" />
            {{ menu.name }}
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
            <AppStarRating
              :modelValue="restaurant.averageRating"
              readonly
              size="sm"
              show-label
            />
            <span class="app-card-list-stat-item">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {{ (restaurant.viewCount ?? 0).toLocaleString() }}
            </span>
            <span class="app-card-list-stat-item">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              {{ restaurant.reviewCount }}
            </span>
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
