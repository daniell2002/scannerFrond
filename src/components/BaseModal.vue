<template>
  <Teleport to="body">
    <Transition name="bm">
      <div v-if="modelValue" class="bm-overlay" @mousedown.self="close">
        <div
          class="bm-box"
          :class="`bm-tone-${tone}`"
          :style="{ maxWidth }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >

          <header class="bm-head">
            <div v-if="icon" class="bm-icon">
              <i class="fas" :class="icon"></i>
            </div>
            <div class="bm-head-info">
              <h3 :id="titleId" class="bm-title">{{ title }}</h3>
              <p v-if="subtitle" class="bm-sub">{{ subtitle }}</p>
            </div>
            <button type="button" class="bm-close" aria-label="Cerrar" @click="close">
              <i class="fas fa-times"></i>
            </button>
          </header>

          <div class="bm-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="bm-foot">
            <slot name="footer" />
          </footer>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  icon:       String,
  title:      { type: String, default: '' },
  subtitle:   { type: String, default: '' },
  maxWidth:   { type: String, default: '580px' },
  // Color del ícono: accent | danger | success | warning
  tone:       { type: String, default: 'accent' },
})
const emit = defineEmits(['update:modelValue'])

const titleId = `bm-title-${Math.random().toString(36).slice(2, 8)}`
const close = () => emit('update:modelValue', false)

// Esc cierra; mientras está abierto, la página de fondo no se desplaza
const onKey = (e) => { if (e.key === 'Escape') close() }
watch(() => props.modelValue, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
  open ? document.addEventListener('keydown', onKey) : document.removeEventListener('keydown', onKey)
}, { immediate: true })
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  if (props.modelValue) document.body.style.overflow = ''
})
</script>

<style scoped>
.bm-overlay {
  position: fixed; inset: 0; z-index: 500;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(3px);
}

.bm-box {
  --tone: var(--accent);
  width: 100%;
  max-height: min(88vh, 860px);
  display: flex; flex-direction: column;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 1rem;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.22), 0 2px 8px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}
.bm-tone-danger  { --tone: var(--danger); }
.bm-tone-success { --tone: var(--success); }
.bm-tone-warning { --tone: #e1a11a; }

/* ── Cabecera ── */
.bm-head {
  display: flex; align-items: center; gap: 0.9rem;
  padding: 1.35rem 1.5rem 0.25rem;
  flex-shrink: 0;
}
.bm-icon {
  width: 2.5rem; height: 2.5rem; min-width: 2.5rem;
  display: grid; place-items: center;
  border-radius: 0.7rem;
  font-size: 0.95rem;
  color: var(--tone);
  background: color-mix(in srgb, var(--tone) 12%, transparent);
}
.bm-head-info { flex: 1; min-width: 0; }
.bm-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.05rem; font-weight: 700; line-height: 1.35;
  color: var(--ink-900);
}
.bm-sub {
  margin: 0.15rem 0 0;
  font-size: 0.8rem; line-height: 1.4;
  color: var(--ink-500);
  overflow-wrap: anywhere;
}
.bm-close {
  width: 2rem; height: 2rem; min-width: 2rem;
  margin: 0 -0.5rem 0 0; align-self: flex-start;
  display: grid; place-items: center;
  border: none; border-radius: 0.5rem;
  background: transparent;
  color: var(--ink-400);
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.14s, color 0.14s;
}
.bm-close:hover { background: var(--surface); color: var(--ink-900); }
.bm-close:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* ── Contenido (desplazable) ── */
.bm-body {
  flex: 1; min-height: 0;
  overflow-y: auto;
  padding: 1.1rem 1.5rem 1.5rem;
  display: flex; flex-direction: column; gap: 0.9rem;
}

/* ── Acciones ── */
.bm-foot {
  flex-shrink: 0;
  display: flex; gap: 0.6rem; justify-content: flex-end; flex-wrap: wrap;
  padding: 0.9rem 1.5rem;
  border-top: 1px solid var(--line);
}

/* ── Celular: hoja que sube desde abajo ── */
@media (max-width: 575px) {
  .bm-overlay { align-items: flex-end; padding: 0; }
  .bm-box {
    max-width: none !important;
    max-height: 92vh;
    border-radius: 1.1rem 1.1rem 0 0;
    border-bottom: none;
  }
  .bm-head { padding: 1.25rem 1.25rem 0.25rem; }
  .bm-body { padding: 1rem 1.25rem 1.25rem; }
  .bm-foot { padding: 0.85rem 1.25rem calc(0.85rem + env(safe-area-inset-bottom)); }
  .bm-foot > :deep(*) { flex: 1 1 0; justify-content: center; }
}

/* ── Animación ── */
.bm-enter-active { transition: opacity 0.2s ease; }
.bm-leave-active { transition: opacity 0.15s ease; }
.bm-enter-from, .bm-leave-to { opacity: 0; }
.bm-enter-active .bm-box { animation: bm-in 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
.bm-leave-active .bm-box { animation: bm-out 0.15s ease forwards; }

@keyframes bm-in {
  from { transform: translateY(12px) scale(0.98); opacity: 0; }
  to   { transform: none; opacity: 1; }
}
@keyframes bm-out {
  to { transform: translateY(6px) scale(0.99); opacity: 0; }
}
@media (max-width: 575px) {
  @keyframes bm-in  { from { transform: translateY(100%); } to { transform: none; } }
  @keyframes bm-out { to { transform: translateY(100%); } }
}
@media (prefers-reduced-motion: reduce) {
  .bm-enter-active .bm-box, .bm-leave-active .bm-box { animation: none; }
}
</style>
