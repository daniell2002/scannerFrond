<template>
  <div class="page-head">
    <div class="page-head-left">
      <div class="page-icon"><i v-if="icon" class="fas" :class="icon"></i></div>
      <div class="min-w-0">
        <p class="page-crumb">
          <template v-for="(c, i) in breadcrumb" :key="i">
            <span>{{ c }}</span><template v-if="i < breadcrumb.length - 1"> / </template>
          </template>
        </p>
        <h2 class="page-title">{{ title }}</h2>
        <p v-if="subtitle" class="page-sub">{{ subtitle }}</p>
      </div>
    </div>
    <div v-if="$slots.action" class="d-flex ga-2">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  breadcrumb: { type: Array, default: () => [] },
  icon:       { type: String, default: '' },
  title:      { type: String, required: true },
  subtitle:   { type: String, default: '' },
})
</script>
