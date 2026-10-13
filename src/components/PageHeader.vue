<template>
  <div class="page-head">
    <div class="page-head-left">
      <div class="min-w-0">
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="subtitle" class="page-sub">{{ subtitle }}</p>
      </div>
    </div>
    <div v-if="$slots.action" class="page-head-actions">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
// breadcrumb e icon se aceptan por compatibilidad: la ubicación ya se muestra en la barra superior.
defineProps({
  breadcrumb: { type: Array, default: () => [] },
  icon:       { type: String, default: '' },
  title:      { type: String, required: true },
  subtitle:   { type: String, default: '' },
})
</script>

<style scoped>
.page-head-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
</style>
