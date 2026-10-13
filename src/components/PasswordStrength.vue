<template>
  <div v-if="password" class="ps">
    <div class="ps-bars">
      <span v-for="i in 4" :key="i" class="ps-bar" :class="{ 'is-on': i <= score }" :style="{ '--c': level.color }"></span>
    </div>
    <span class="ps-label" :style="{ color: level.color }">{{ level.label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ password: { type: String, default: '' } })

// 0–4: longitud mínima + variedad de caracteres
const score = computed(() => {
  const p = props.password
  if (p.length < 8) return p ? 1 : 0
  let s = 1
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++
  if (/\d/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++
  return s
})

const level = computed(() => [
  { label: '',                   color: 'var(--ink-300)' },
  { label: 'Muy corta',          color: 'var(--danger)'  },
  { label: 'Débil',              color: '#e1a11a'        },
  { label: 'Aceptable',          color: 'var(--accent)'  },
  { label: 'Fuerte',             color: 'var(--success)' },
][score.value])
</script>

<style scoped>
.ps { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.4rem; }
.ps-bars { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.ps-bar { height: 4px; border-radius: 2px; background: var(--surface); transition: background 0.2s; }
.ps-bar.is-on { background: var(--c); }
.ps-label { font-size: 0.7rem; font-weight: 700; min-width: 4.5rem; text-align: right; }
</style>
