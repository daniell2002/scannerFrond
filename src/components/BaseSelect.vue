<template>
  <div class="bsel" :class="{ 'bsel-open': open, 'bsel-disabled': disabled, 'bsel-sm': size === 'sm' }" ref="root">
    <button type="button" class="bsel-trigger" :disabled="disabled" @click="toggle">
      <i v-if="icon" class="fas" :class="icon"></i>
      <span class="bsel-label" :class="{ 'bsel-placeholder': !selectedLabel }">{{ selectedLabel || placeholder || 'Seleccionar' }}</span>
      <i class="fas fa-chevron-down bsel-chevron"></i>
    </button>
    <Transition name="bsel-fade">
      <div v-if="open" class="bsel-menu">
        <button
          v-for="opt in options"
          :key="opt.value"
          type="button"
          class="bsel-option"
          :class="{ 'is-active': opt.value === modelValue }"
          @click="select(opt.value)"
        >{{ opt.label }}</button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options:    { type: Array, required: true }, // [{ value, label }]
  icon:       { type: String, default: '' },
  placeholder:{ type: String, default: '' },
  disabled:   { type: Boolean, default: false },
  size:       { type: String, default: 'md' }, // 'md' | 'sm'
})
const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const open = ref(false)

const selectedLabel = computed(() => props.options.find(o => o.value === props.modelValue)?.label || '')

function toggle() { if (!props.disabled) open.value = !open.value }
function select(v) { emit('update:modelValue', v); open.value = false }
function onClickOutside(e) { if (root.value && !root.value.contains(e.target)) open.value = false }

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.bsel { position: relative; min-width: 0; }

.bsel-trigger {
  width: 100%; display: flex; align-items: center; gap: 0.6rem;
  border: 1.5px solid var(--line); border-radius: 0.65rem;
  background: var(--paper); color: var(--ink-900);
  padding: 0.72rem 0.875rem; font-size: 0.875rem; font-family: var(--font-body);
  cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;
  min-height: 3rem;
}
.bsel-sm .bsel-trigger { padding: 0.45rem 0.7rem; min-height: 2.35rem; font-size: 0.82rem; }
.bsel-trigger:hover { border-color: var(--ink-300); }
.bsel-open .bsel-trigger { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(42,120,214,0.12); }
.bsel-disabled .bsel-trigger { opacity: 0.55; cursor: not-allowed; }

.bsel-trigger > i:first-child { color: var(--ink-500); font-size: 0.85rem; flex-shrink: 0; }
.bsel-label { flex: 1; text-align: left; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.bsel-placeholder { color: var(--ink-500); opacity: 0.7; }
.bsel-chevron { font-size: 0.7rem; color: var(--ink-500); transition: transform 0.15s; flex-shrink: 0; }
.bsel-open .bsel-chevron { transform: rotate(180deg); }

.bsel-menu {
  position: absolute; top: calc(100% + 0.35rem); left: 0; right: 0; z-index: 400;
  background: var(--paper); border: 1px solid var(--line); border-radius: 0.65rem;
  box-shadow: 0 12px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06);
  max-height: 15rem; overflow-y: auto; padding: 0.35rem;
}

.bsel-option {
  display: block; width: 100%; text-align: left; border: none; background: none;
  padding: 0.55rem 0.75rem; font-size: 0.85rem; color: var(--ink-900);
  border-radius: 0.45rem; cursor: pointer; transition: background 0.12s;
}
.bsel-option:hover { background: var(--surface); }
.bsel-option.is-active { background: rgba(42,120,214,0.1); color: var(--accent-strong); font-weight: 600; }

.bsel-fade-enter-active, .bsel-fade-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.bsel-fade-enter-from, .bsel-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
