<template>
  <div v-if="totalPages > 1" class="app-pagination">
    <button
      class="page-btn"
      :disabled="currentPage <= 1"
      @click="emit('change', currentPage - 1)"
    >이전</button>

    <button
      v-for="p in visiblePages"
      :key="`page-${p}`"
      class="page-btn"
      :class="{ 'is-active': p === currentPage }"
      @click="emit('change', p)"
    >{{ p }}</button>

    <button
      class="page-btn"
      :disabled="currentPage >= totalPages"
      @click="emit('change', currentPage + 1)"
    >다음</button>
  </div>
</template>

<script setup>
const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages:  { type: Number, required: true },
})

const emit = defineEmits(['change'])

const visiblePages = computed(() => {
  const delta = 1;
  const pages = [];
  const from = Math.max(1, props.currentPage - delta);
  const to   = Math.min(props.totalPages, props.currentPage + delta);
  for (let i = from; i <= to; i++) pages.push(i);
  return pages;
})
</script>

<style lang="scss" scoped>
.app-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: rem(6);
}

.page-btn {
  min-width: rem(36);
  height: rem(36);
  padding: 0 rem(10);
  border: 1px solid $gray-e4;
  border-radius: rem(8);
  background: $white;
  @include font(14, 1, 500, $gray-78);
  cursor: pointer;
  transition: all 0.15s;
  touch-action: manipulation;

  &:hover:not(:disabled, &.is-active) {
    border-color: $primary-color;
    color: $primary-color;
  }

  &.is-active {
    background: $primary-color;
    border-color: $primary-color;
    color: $white;
    font-weight: 700;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>