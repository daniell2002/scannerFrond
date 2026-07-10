<template>
  <Transition name="bm">
    <div v-if="modelValue" class="bm-overlay" @click.self="$emit('update:modelValue', false)">
      <div class="bm-box" :style="{ maxWidth }">

        <div class="bm-head">
          <div v-if="icon" class="bm-icon">
            <i class="fas" :class="icon"></i>
          </div>
          <div class="bm-head-info">
            <h3 class="bm-title">{{ title }}</h3>
            <p v-if="subtitle" class="bm-sub">{{ subtitle }}</p>
          </div>
          <button class="bm-close" @click="$emit('update:modelValue', false)">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="bm-body">
          <slot />
        </div>

        <div v-if="$slots.footer" class="bm-foot">
          <slot name="footer" />
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  icon:       String,
  title:      { type: String, default: '' },
  subtitle:   { type: String, default: '' },
  maxWidth:   { type: String, default: '580px' },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.bm-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(5px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}

.bm-box {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  width: 100%;
  box-shadow: 0 32px 80px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.08);
  overflow: hidden;
  max-height: 92vh;
  overflow-y: auto;
}

/* ── Header ── */
.bm-head {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(120deg, var(--accent) 0%, var(--accent-strong) 100%);
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.bm-icon {
  width: 2.25rem; height: 2.25rem; min-width: 2.25rem;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.28);
  border-radius: 0.5rem;
  display: grid; place-items: center;
  color: #fff; font-size: 0.875rem;
  flex-shrink: 0;
}

.bm-head-info { flex: 1; min-width: 0; }

.bm-title {
  font-family: var(--font-display);
  font-size: 0.95rem; font-weight: 700;
  color: #fff; margin: 0 0 0.1rem; line-height: 1.3;
}

.bm-sub {
  font-size: 0.72rem;
  color: rgba(255,255,255,0.7);
  margin: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.bm-close {
  width: 1.875rem; height: 1.875rem; min-width: 1.875rem;
  display: grid; place-items: center;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 0.375rem;
  color: rgba(255,255,255,0.85);
  cursor: pointer; font-size: 0.75rem;
  transition: background 0.15s;
  flex-shrink: 0;
}
.bm-close:hover { background: rgba(0,0,0,0.22); color: #fff; }

/* ── Body ── */
.bm-body {
  padding: 1.5rem;
  display: flex; flex-direction: column; gap: 0.875rem;
}

/* ── Footer ── */
.bm-foot {
  display: flex; gap: 0.625rem; justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--line);
  background: var(--surface);
}

/* ── Animación: overlay fade + box slide-up ── */
.bm-enter-active { transition: opacity 0.2s ease; }
.bm-leave-active { transition: opacity 0.16s ease; }
.bm-enter-from, .bm-leave-to { opacity: 0; }

.bm-enter-active .bm-box {
  animation: bm-in 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
.bm-leave-active .bm-box {
  animation: bm-out 0.16s ease forwards;
}

@keyframes bm-in {
  from { transform: translateY(18px) scale(0.97); opacity: 0; }
  to   { transform: translateY(0)    scale(1);    opacity: 1; }
}
@keyframes bm-out {
  from { transform: translateY(0);   opacity: 1; }
  to   { transform: translateY(8px); opacity: 0; }
}
</style>
