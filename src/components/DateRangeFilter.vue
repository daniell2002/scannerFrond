<template>
  <div class="drf">
    <BaseSelect :model-value="preset" :options="DATE_PRESETS" icon="fa-calendar" size="sm" style="min-width:170px" @update:model-value="choose" />
    <template v-if="preset === 'custom'">
      <input type="date" class="form-control form-control-sm drf-date" title="Desde" :max="to || max"
        :value="from" @change="emitRange($event.target.value, to)" />
      <span class="drf-sep">a</span>
      <input type="date" class="form-control form-control-sm drf-date" title="Hasta" :min="from" :max="max"
        :value="to" @change="emitRange(from, $event.target.value)" />
    </template>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseSelect from './BaseSelect.vue'
import { DATE_PRESETS } from '../utils/dates'

// v-model:from / v-model:to con fechas 'AAAA-MM-DD' ('' = sin límite)
const props = defineProps({
  from: { type: String, default: '' },
  to:   { type: String, default: '' },
  max:  { type: String, default: '' },
})
const emit = defineEmits(['update:from', 'update:to'])

const preset = ref(props.from || props.to ? 'custom' : 'all')

// "Limpiar filtros" desde fuera deja el rango vacío
watch(() => [props.from, props.to], ([f, t]) => { if (!f && !t && preset.value !== 'custom') preset.value = 'all' })

function emitRange(f, t) {
  emit('update:from', f || '')
  emit('update:to', t || '')
}

function choose(value) {
  preset.value = value
  const p = DATE_PRESETS.find(x => x.value === value)
  if (p?.range) { const r = p.range(); emitRange(r.from, r.to) }
  else if (value === 'all') emitRange('', '')
}

defineExpose({ reset: () => choose('all') })
</script>

<style scoped>
.drf { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.drf-date { width: auto; min-width: 140px; }
.drf-sep { font-size: 0.8rem; color: var(--ink-500); }
</style>
