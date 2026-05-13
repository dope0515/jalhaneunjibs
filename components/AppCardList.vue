<template>
  <NuxtLink :to="`/restaurants/${restaurant.id}`" class="app-card-list">
    <div class="card-thumbnail">
      <img
        v-if="restaurant.thumbnail"
        :src="restaurant.thumbnail"
        :alt="restaurant.name"
        class="card-img"
      />
      <div v-else class="card-img-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M3 11l19-9-9 19-2-8-8-2z"/>
        </svg>
      </div>
      <span v-if="restaurant.foodCategory" class="card-category">{{ restaurant.foodCategory }}</span>
    </div>

    <div class="card-body">
      <h3 class="card-name">{{ restaurant.name }}</h3>

      <p class="card-address">{{ restaurant.region2 }} {{ restaurant.region3 }}</p>

      <div v-if="recommendedMenus.length > 0" class="card-menus">
        <span v-for="menu in recommendedMenus" :key="menu.name" class="card-menu-tag">
          ★ {{ menu.name }}
          <em v-if="menu.price">{{ formatPrice(menu.price) }}</em>
        </span>
      </div>

      <div class="card-footer">
        <div v-if="restaurant.keywords?.length" class="card-keywords">
          <span v-for="kw in restaurant.keywords.slice(0, 3)" :key="kw" class="card-kw">#{{ kw }}</span>
        </div>
        <div class="card-stats">
          <span class="card-rating">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            {{ restaurant.averageRating > 0 ? restaurant.averageRating.toFixed(1) : '-' }}
          </span>
          <span class="card-review-count">리뷰 {{ restaurant.reviewCount }}</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup>
const props = defineProps({
  restaurant: { type: Object, required: true },
})

const recommendedMenus = computed(() => props.restaurant.menus ?? [])

const formatPrice = (price) => {
  const num = parseInt(price)
  if (isNaN(num)) return price
  return num.toLocaleString('ko-KR') + '원'
}
</script>

<style lang="scss" scoped>
.app-card-list {
  display: block;
  background: $white;
  border-radius: rem(16);
  overflow: hidden;
  box-shadow: 0 rem(2) rem(12) rgba(0, 0, 0, 0.06);
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(rem(-4));
    box-shadow: 0 rem(8) rem(24) rgba(0, 0, 0, 0.12);
  }
}

.card-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #f0f0ee;
  overflow: hidden;

  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;

    .app-card-list:hover & {
      transform: scale(1.04);
    }
  }

  .card-img-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c4c4c0;
  }

  .card-category {
    position: absolute;
    top: rem(10);
    left: rem(10);
    padding: rem(4) rem(10);
    background: rgba(0, 0, 0, 0.52);
    backdrop-filter: blur(4px);
    border-radius: rem(100);
    @include font(11, 1, 700, $white);
  }
}

.card-body {
  padding: rem(14) rem(16) rem(16);
  display: flex;
  flex-direction: column;
  gap: rem(6);
}

.card-name {
  @include font(16, 1.3, 700, $black);
  @include text-ellipsis(1);
}

.card-address {
  @include font(12, 1, 400, $gray-78);
}

.card-menus {
  display: flex;
  flex-wrap: wrap;
  gap: rem(4);
  margin-top: rem(2);

  .card-menu-tag {
    display: inline-flex;
    align-items: center;
    gap: rem(4);
    padding: rem(3) rem(8);
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: rem(6);
    @include font(11, 1, 600, #92400e);

    em {
      font-style: normal;
      font-weight: 400;
      color: $gray-78;
    }
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: rem(4);
}

.card-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: rem(4);

  .card-kw {
    @include font(11, 1, 500, $gray-78);
  }
}

.card-stats {
  display: flex;
  align-items: center;
  gap: rem(6);
  flex-shrink: 0;

  .card-rating {
    display: flex;
    align-items: center;
    gap: rem(3);
    @include font(12, 1, 700, $tertiary-color);
  }

  .card-review-count {
    @include font(11, 1, 400, $gray-78);
  }
}
</style>
