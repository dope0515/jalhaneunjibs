<!-- components/AppButton.vue -->
<template>
  <component 
    :is="componentType" 
    v-bind="mergedProps"
    class="app-button"
    :class="buttonClasses" 
    :style="buttonStyles"
  >
    <slot />
    <i v-if="arrow" class="icon-arrow"></i>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { NuxtLink } from '#components'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  // Navigation
  to: { type: [String, Object], default: null },
  href: { type: String, default: null },
  type: { type: String, default: 'button' },
  
  // Style Props
  color: { type: String, default: 'black' }, // black, green, white
  variant: { type: String, default: 'fill' }, // fill, outline
  shape: { type: String, default: 'default' }, // default, round
  size: { type: String, default: 'md' },  // sm, md, lg
  weight: { type: [String, Number], default: '' }, // font-weight
  arrow: { type: Boolean, default: false } // 화살표 여부
})

const buttonClasses = computed(() => {
  return [
    `btn-size-${props.size}`,
    `btn-shape-${props.shape}`,
    `btn-variant-${props.variant}`,
    props.color ? `btn-color-${props.color}` : '',
    props.arrow ? 'has-arrow' : ''
  ].filter(Boolean)
})

const buttonStyles = computed(() => {
  const styles = {}
  if (props.weight) styles.fontWeight = props.weight
  return styles
})

const componentType = computed(() => {
  if (props.to) return NuxtLink
  if (props.href) return 'a'
  return 'button'
})

const attrs = useAttrs()

const dynamicProps = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) return { href: props.href, target: '_blank' }
  return { type: props.type }
})

const mergedProps = computed(() => ({ ...dynamicProps.value, ...attrs }))
</script>

<style lang="scss" scoped>
@use "../assets/scss/abstracts/variables" as *;
@use "../assets/scss/abstracts/mixins" as *;

.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  padding: 0;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  
  // 기본 폰트 설정
  font-weight: 700;
  
  // Background Variants (자동 텍스트 색상 포함)
  // Variants (Fill, Outline)
  &.btn-variant-fill {
    &.btn-color-black {
      background-color: #000;
      color: #fff;
      &:hover { background-color: #333; }
    }
    &.btn-color-green {
      background-color: $primary-color;
      color: #fff;
      &:hover { background-color: #0d4a3e; }
    }
    &.btn-color-white {
      background-color: #fff;
      color: #000;
      border: 1px solid $gray-e4;
      &:hover { background-color: #f5f5f4; }
    }
  }

  &.btn-variant-outline {
    background-color: transparent;
    border: 1px solid currentColor;
    
    &.btn-color-black {
      border-color: #000;
      color: #000;
      background-color: $white;
      &:hover { background-color: #f5f5f4; }
    }
    &.btn-color-green {
      border-color: $primary-color;
      color: $primary-color;
      &:hover { background-color: rgba($primary-color, 0.05); }
    }
    &.btn-color-white {
      border-color: #fff;
      color: #fff;
      &:hover { background-color: rgba(255, 255, 255, 0.1); }
    }
    
    // Default outline if no bg matches
    &:not([class*="btn-color-"]) {
      border-color: $gray-e4;
      color: inherit;
      &:hover { background-color: #f5f5f4; }
    }
  }
  
  // Shape Variants
  &.btn-shape-default {
    border-radius: rem(8);
  }
  
  &.btn-shape-round {
    border-radius: rem(100);
  }

  // Size Variants
  &.btn-size-md {
    padding: rem(12) rem(24);
    @include font(14);
    
    &.btn-shape-round {
      padding: rem(16) rem(32);
    }
  }

  &.btn-size-sm {
    padding: rem(8) rem(16);
    @include font(13);
  }

  &.btn-size-xs {
    padding: rem(4) rem(8);
    @include font(12);
  }

  &.btn-size-lg {
    padding: rem(20) rem(40);
    @include font(18);
  }

  // Arrow
  &.has-arrow {
    gap: rem(8);
    
    .icon-arrow {
      display: inline-block;
      width: rem(12);
      height: rem(9);
      background-color: currentColor;
      mask-image: url("@/assets/images/icon/ic_arrow.svg");
      mask-repeat: no-repeat;
      mask-position: center;
      mask-size: contain;
      transition: transform 0.3s ease;
    }

    &:hover {
      .icon-arrow {
        transform: translateX(rem(4));
      }
    }
  }
  
}
</style>
