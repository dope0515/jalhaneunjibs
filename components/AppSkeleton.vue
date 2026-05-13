<template>
  <div class="app-skeleton-card">
    <div class="skeleton-thumb"></div>
    <div class="skeleton-body">
      <div class="skeleton-line w-65"></div>
      <div class="skeleton-line w-40"></div>
      <div class="skeleton-line w-80"></div>
      <div class="skeleton-footer">
        <div class="skeleton-line w-50"></div>
        <div class="skeleton-line w-20"></div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@mixin shimmer-bg {
  background: linear-gradient(90deg, #f0f0ee 25%, #e8e8e5 50%, #f0f0ee 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.app-skeleton-card {
  background: $white;
  border-radius: rem(16);
  overflow: hidden;
  box-shadow: 0 rem(2) rem(12) rgba(0, 0, 0, 0.06);
}

.skeleton-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  @include shimmer-bg;
}

.skeleton-body {
  padding: rem(14) rem(16) rem(16);
  display: flex;
  flex-direction: column;
  gap: rem(10);
}

.skeleton-line {
  height: rem(14);
  border-radius: rem(4);
  @include shimmer-bg;

  &.w-20 { width: 20%; }
  &.w-40 { width: 40%; }
  &.w-50 { width: 50%; }
  &.w-65 { width: 65%; }
  &.w-80 { width: 80%; }
}

.skeleton-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: rem(2);
}
</style>
