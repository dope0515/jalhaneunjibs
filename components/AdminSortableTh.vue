<template>
  <th
    :class="thClasses"
    :aria-sort="ariaSort"
    @click="onClick"
  >
    <span class="admin-table__th-inner">
      <span class="admin-table__th-label">{{ label }}</span>
      <span v-if="sortable" class="admin-table__sort-icon" aria-hidden="true">
        <template v-if="isActive">{{ sortDir === 'asc' ? '↑' : '↓' }}</template>
        <template v-else>↕</template>
      </span>
    </span>
  </th>
</template>

<script setup>
const props = defineProps({
  label: { type: String, required: true },
  field: { type: String, default: '' },
  sortable: { type: Boolean, default: true },
  sortBy: { type: String, default: 'createdAt' },
  sortDir: { type: String, default: 'desc' },
  thClass: { type: String, default: '' },
})

const emit = defineEmits(['sort'])

const isActive = computed(() => props.sortable && props.field === props.sortBy)

const thClasses = computed(() => [
  props.thClass,
  {
    'admin-table__th--sortable': props.sortable,
    'admin-table__th--active': isActive.value,
  },
])

const ariaSort = computed(() => {
  if (!props.sortable || !isActive.value) return undefined
  return props.sortDir === 'asc' ? 'ascending' : 'descending'
})

const onClick = () => {
  if (!props.sortable || !props.field) return
  emit('sort', props.field)
}
</script>
