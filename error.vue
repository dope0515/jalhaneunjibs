<template>
  <div class="error-page">
    <div class="error-page__inner">
      <!-- 배경 장식 숫자 -->
      <div class="error-page__bg-number" aria-hidden="true">{{ error.statusCode }}</div>

      <div class="error-page__content">
        <div class="error-page__icon">
          <svg v-if="is404" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
            <path d="M8 11h6M11 8v6" stroke-linecap="round"/>
          </svg>
          <svg v-else width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <p class="error-page__code">{{ error.statusCode }}</p>
        <h1 class="error-page__title">{{ title }}</h1>
        <p class="error-page__desc">{{ desc }}</p>

        <div class="error-page__actions">
          <button class="error-page__btn error-page__btn--outline" @click="handleError">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
            </svg>
            다시 시도
          </button>
          <NuxtLink to="/" class="error-page__btn error-page__btn--primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            홈으로 가기
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  error: { type: Object, required: true },
})

const is404 = computed(() => props.error.statusCode === 404)

const title = computed(() =>
  is404.value ? '페이지를 찾을 수 없어요' : '문제가 발생했어요'
)
const desc = computed(() =>
  is404.value
    ? '잘못된 집을 찾아왔습니다.\n잘하는 집을 찾으러 가볼까요?'
    : '일시적인 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.'
)

const handleError = () => clearError({ redirect: '/' })
</script>

<style lang="scss">
@use 'assets/scss/abstracts/variables' as *;
@use 'assets/scss/abstracts/mixins' as *;

.error-page {
  min-height: 100vh;
  background: $bg-color;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: rem(40) rem(20);
  overflow: hidden;
  position: relative;

  &__inner {
    position: relative;
    max-width: rem(560);
    width: 100%;
    text-align: center;
  }

  &__bg-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -55%);
    font-size: rem(240);
    font-weight: 900;
    color: rgba($primary-color, 0.04);
    line-height: 1;
    letter-spacing: rem(-8);
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: rem(12);
  }

  &__icon {
    width: rem(96);
    height: rem(96);
    background: rgba($primary-color, 0.08);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $primary-color;
    margin-bottom: rem(8);
  }

  &__code {
    font-size: rem(14);
    font-weight: 700;
    color: $primary-color;
    letter-spacing: rem(2);
    text-transform: uppercase;
  }

  &__title {
    font-size: rem(28);
    font-weight: 800;
    color: $black;
    line-height: 1.3;
    margin-bottom: rem(4);
  }

  &__desc {
    font-size: rem(15);
    color: #888;
    line-height: 1.7;
    white-space: pre-line;
    margin-bottom: rem(16);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: rem(10);
    flex-wrap: wrap;
    justify-content: center;
    margin-top: rem(8);
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: rem(7);
    height: rem(48);
    padding: 0 rem(24);
    border-radius: rem(12);
    font-size: rem(14);
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s;

    &--outline {
      background: $white;
      border: 1.5px solid #ddd;
      color: $black;

      &:hover {
        border-color: $primary-color;
        color: $primary-color;
      }
    }

    &--primary {
      background: $primary-color;
      border: none;
      color: $white;

      &:hover {
        background: $primary-color-hover;
      }
    }
  }

  @include tablet {
    &__bg-number {
      font-size: rem(160);
    }

    &__title {
      font-size: rem(22);
    }

    &__icon {
      width: rem(80);
      height: rem(80);
    }
  }
}
</style>
