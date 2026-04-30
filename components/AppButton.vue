<!-- components/AppButton.vue -->
<template>
  <component 
    :is="componentType" 
    v-bind="dynamicProps" 
    class="app-button"
    :class="[`btn-${variant}`, `btn-${size}`]"
  >
    <slot />
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { NuxtLink } from '#components'

const props = defineProps({
  to: { type: [String, Object], default: null },
  href: { type: String, default: null },
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'solid' },
  size: { type: String, default: 'md' }
})

// 어떤 태그로 변신할지 결정하는 핵심 로직!
const componentType = computed(() => {
  if (props.to) return NuxtLink // 문자열이 아닌 임포트한 컴포넌트 자체를 반환합니다.
  if (props.href) return 'a'
  return 'button'
})

// 일반 버튼일 때만 type 속성을 넣어줍니다.
const dynamicProps = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: '_blank' }
  return { type: props.type }
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
