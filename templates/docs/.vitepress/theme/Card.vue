<script setup lang="ts">
defineProps<{ title?: string; badge?: string }>()
</script>

<template>
  <div class="wb-card">
    <div class="wb-card__head">
      <span v-if="badge" class="wb-card__badge">{{ badge }}</span>
      <strong v-if="title" class="wb-card__title">{{ title }}</strong>
    </div>
    <div class="wb-card__body">
      <slot />
    </div>
  </div>
</template>
