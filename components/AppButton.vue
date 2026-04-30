<!-- components/AppButton.vue -->
<template>
  <component 
    :is="componentType" 
    :to="to"
    :href="href"
    :type="buttonType"
    class="app-button"
    :class="[`btn-${variant}`, `btn-${size}`]"
  >
    <!-- 버튼 안에 들어갈 글자나 아이콘을 받을 수 있게 slot을 씁니다 -->
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { NuxtLink } from '#components'

const props = defineProps({
  // 링크 이동용 (Nuxt 내부 이동)
  to: {
    type: [String, Object],
    default: null
  },
  // 외부 링크용
  href: {
    type: String,
    default: null
  },
  // 버튼 타입 (submit, button, reset)
  type: {
    type: String,
    default: 'button'
  },
  // 디자인 변형 (solid, outline, text 등)
  variant: {
    type: String,
    default: 'solid'
  },
  // 버튼 크기 (sm, md, lg)
  size: {
    type: String,
    default: 'md'
  }
})

// 어떤 태그로 변신할지 결정하는 핵심 로직!
const componentType = computed(() => {
  if (props.to) return NuxtLink   // 'to'가 있으면 NuxtLink로 변신
  if (props.href) return 'a'      // 'href'가 있으면 a 태그로 변신
  return 'button'                 // 둘 다 없으면 일반 button 태그로 변신
})

// 일반 버튼일 때만 type 속성을 넣어줍니다.
const buttonType = computed(() => {
  return componentType.value === 'button' ? props.type : null
})
</script>

<style lang="scss" scoped>
// 버튼 공통 뼈대 스타일
.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: rem(8);
  font-weight: 700;
  transition: all 0.2s ease;
  cursor: pointer;
  
  // 크기 변형
  &.btn-md {
    padding: rem(10) rem(20);
    @include font(15);
  }
}
</style>
