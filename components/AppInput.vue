<template>
  <div class="app-input">
    <input 
      :id="id"
      v-model="model" 
      :type="type" 
      :placeholder="placeholder"
      :required="required"
      :autocomplete="autocomplete"
    />
  </div>
</template>

<script setup>
// 부모 컴포넌트와 v-model을 연결합니다.
const model = defineModel()

// 외부에서 받아올 속성(Props)들 정의
const props = defineProps({
  id: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  required: Boolean,
  autocomplete: String
})
</script>

<style scoped>
/* 여기에 공통 입력창 스타일을 멋지게 입혀보세요! */
</style>
