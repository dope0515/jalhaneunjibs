<template>
  <div class="app-input" :class="{ 'has-toggle': showPasswordToggle && type === 'password' }">
    <input 
      ref="inputRef"
      v-bind="$attrs"
      :id="id"
      v-model="model" 
      :type="actualType" 
      :placeholder="placeholder"
      :required="required"
      :autocomplete="autocomplete"
      :disabled="disabled"
    />
    <button 
      v-if="showPasswordToggle && type === 'password'" 
      type="button" 
      class="password-toggle"
      @click="togglePasswordVisibility"
      :aria-label="isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'"
    >
      <svg v-if="isPasswordVisible" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
      <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 속성 상속 비활성화 (root div에 속성이 붙지 않도록)
defineOptions({
  inheritAttrs: false
})

const inputRef = ref(null)

// 내부 input 요소를 외부에서 접근할 수 있도록 노출합니다.
defineExpose({
  input: inputRef
})

// 부모 컴포넌트와 v-model을 연결합니다.
const model = defineModel()

// 외부에서 받아올 속성(Props)들 정의
const props = defineProps({
  id: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  required: Boolean,
  autocomplete: String,
  disabled: Boolean,
  showPasswordToggle: Boolean
})

const isPasswordVisible = ref(false)
const actualType = computed(() => {
  if (props.type === 'password' && isPasswordVisible.value) {
    return 'text'
  }
  return props.type
})

const togglePasswordVisibility = () => {
  isPasswordVisible.value = !isPasswordVisible.value
}
</script>

<style lang="scss" scoped>
/* 여기에 공통 입력창 스타일을 멋지게 입혀보세요! */
.app-input {
  position: relative;
  display: flex;
  align-items: center;

  input {
    &[type="text"],
    &[type="password"],
    &[type="email"],
    &[type="search"],
    &[type="tel"],
    &[type="url"],
    &[type="number"] {
      @include font(16, 20, 400);
      border-radius: rem(8);
      padding: rem(12) rem(16);
      width: 100%;
      outline: none;
      border: rem(1) solid #E7E5E4;
      background-color: #FAFAF9;
      &::placeholder {
        color: #929292;
      }
      &:focus {
        border-color: $primary-color;
      }
      &[readonly] {
        color: $black;
        background-color: transparent;
        border: 0;
        padding: 0;
        cursor: not-allowed;
      }
    }
  }

  &.has-toggle {
    input {
      padding-right: rem(48);
    }
  }

  .password-toggle {
    position: absolute;
    right: rem(12);
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: rem(4);
    cursor: pointer;
    color: #929292;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;

    &:hover {
      color: $primary-color;
    }
  }
}
</style>
