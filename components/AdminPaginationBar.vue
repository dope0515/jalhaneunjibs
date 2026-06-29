<template>
  <div v-if="total > 0" class="admin-pagination-bar">
    <p class="admin-pagination-bar__meta">
      총 {{ total }}건 · {{ rangeStart }}–{{ rangeEnd }}
    </p>
    <div class="admin-pagination-bar__controls">
      <label class="admin-pagination-bar__size">
        <span class="admin-pagination-bar__size-label">표시</span>
        <select
          class="admin-pagination-bar__select"
          :value="pageSize"
          @change="onPageSizeChange"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">
            {{ size }}개
          </option>
        </select>
      </label>
      <AppPagination
        v-if="totalPages > 1"
        :current-page="currentPage"
        :total-pages="totalPages"
        @change="emit('change-page', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ADMIN_PAGE_SIZE_OPTIONS } from '~/composables/useAdminPagination'

const props = defineProps({
  total: { type: Number, required: true },
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  rangeStart: { type: Number, required: true },
  rangeEnd: { type: Number, required: true },
})

const emit = defineEmits(['change-page', 'change-page-size'])

const pageSizeOptions = ADMIN_PAGE_SIZE_OPTIONS

const onPageSizeChange = (event) => {
  emit('change-page-size', Number(event.target.value))
}
</script>
