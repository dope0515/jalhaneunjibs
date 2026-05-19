<template>
  <div v-if="loading" class="app-loading-overlay">
    <div class="spinner-container">
      <div class="spinner"></div>
      <p v-if="message" class="loading-text">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: '처리 중입니다...'
  }
})
</script>

<style lang="scss" scoped>
.app-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: rem(16);
}

.spinner {
  width: rem(48);
  height: rem(48);
  border: rem(4) solid $gray-e4;
  border-top: rem(4) solid $primary-color;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  @include font(16, 1.5, 600, $primary-color);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
