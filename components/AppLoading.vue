<template>
  <Transition name="loading-fade">
    <div v-if="loading" class="app-loading-overlay">
      <div class="app-loading-content">
        <div class="app-loading-spinner">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <p v-if="message" class="app-loading-message">{{ message }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  loading: { type: Boolean, default: false },
  message: { type: String, default: '' },
})
</script>

<style lang="scss" scoped>
.app-loading-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.app-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: rem(16);
}

.app-loading-spinner {
  display: flex;
  align-items: center;
  gap: rem(8);

  span {
    display: block;
    width: rem(10);
    height: rem(10);
    border-radius: 50%;
    background-color: $primary-color;
    animation: loading-bounce 0.8s ease-in-out infinite;

    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.15s; }
    &:nth-child(3) { animation-delay: 0.3s; }
  }
}

.app-loading-message {
  @include font(15, 22, 500, $gray-44);
  text-align: center;
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.2s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}
</style>
