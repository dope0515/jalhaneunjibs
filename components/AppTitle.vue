<template>
  <div class="app-title">
    <span class="badge">{{ badge }}</span>
    <h1 class="title">{{ title }}</h1>
    <p class="desc">{{ desc }}</p>
  </div>
</template>

<script setup>
defineProps({
  badge: String,
  title: String,
  desc: String
})
</script>

<style lang="scss" scoped>
@use "../assets/scss/abstracts/variables" as *;
@use "../assets/scss/abstracts/mixins" as *;

.app-title {
  text-align: center;
  width: min(rem(574), 100%);
  margin-inline: auto;
  margin-block-end: rem(48);
  .badge {
    @include font(12,16,700);
    color: $primary-color; 
    text-transform: uppercase;
    border: 1px solid $primary-color;
    padding: rem(4) rem(10);
    border-radius: rem(24);
  }
  .title {
    font-family: $font-family-serif;
    @include font(40,1,700);
    margin-block-start: rem(16);
  }
  .desc {
    @include font(18,28,400);
    text-wrap: balance;
    margin-block-start: rem(16);
  }
}
</style>