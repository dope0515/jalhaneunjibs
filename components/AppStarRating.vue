<template>
  <div
    class="star-rating"
    :class="[`star-rating--${size}`, { 'is-readonly': readonly }]"
  >
    <div 
      class="star-container"
      role="img"
      :aria-label="`평점 ${displayValue}점 (5점 만점)`"
    >
      <span
        v-for="i in 5"
        :key="i"
        class="star-item"
        :class="{ 'is-lit': !readonly && activeValue >= i }"
        @click="!readonly && select(i)"
        @mouseenter="!readonly && (hoverValue = i)"
        @mouseleave="!readonly && (hoverValue = 0)"
      >
        <!-- 개별 이미지는 단순 장식용이므로 aria-hidden 유지 (컨테이너에서 전체 평점 설명함) -->
        <img src="/assets/images/icon/ic_star_off.svg" class="star star--bg" alt="" aria-hidden="true" />
        <img
          src="/assets/images/icon/ic_star.svg"
          class="star star--fg"
          alt=""
          aria-hidden="true"
          :style="readonly ? { clipPath: `inset(0 ${100 - getPartialFill(i)}% 0 0)` } : {}"
        />
      </span>
    </div>

    <span v-if="showLabel" class="star-label" aria-hidden="true">{{ displayValue }}</span>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  readonly:   { type: Boolean, default: false },
  size:       { type: String, default: 'md' }, // 'sm' | 'md' | 'lg'
  showLabel:  { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const hoverValue = ref(0)

const activeValue = computed(() =>
  props.readonly ? 0 : (hoverValue.value || props.modelValue)
)

const select = (i) => {
  emit('update:modelValue', props.modelValue === i ? 0 : i)
}

// readonly 모드에서 소수점 별 채우기 (0~100%)
const getPartialFill = (i) => {
  const r = props.modelValue || 0
  if (r >= i) return 100
  if (r < i - 1) return 0
  return Math.round((r - (i - 1)) * 100)
}

const displayValue = computed(() => {
  const r = props.modelValue || 0
  return r > 0 ? r.toFixed(1) : '-'
})
</script>
