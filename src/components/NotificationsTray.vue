<template>
  <div class="notify-wrap" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="notify-list" tag="div" class="notify-list">
      <article
        v-for="n in notifications.items"
        :key="n.id"
        class="notify-card"
        :class="`notify-${n.type}`"
        :role="n.type === 'error' ? 'alert' : 'status'"
      >
        <div class="notify-icon">
          <i class="fas" :class="iconByType(n.type)" aria-hidden="true"></i>
        </div>
        <div class="notify-body">
          <p v-if="n.title" class="notify-title">{{ n.title }}</p>
          <p class="notify-text">{{ n.message }}</p>
        </div>
        <button class="notify-close" @click="notifications.remove(n.id)" aria-label="Cerrar notificación">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
        <!-- Tiempo restante antes de cerrarse sola -->
        <span
          v-if="n.timeout > 0"
          class="notify-progress"
          :style="{ animationDuration: `${n.timeout}ms` }"
          aria-hidden="true"
        ></span>
      </article>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useNotificationsStore } from '../stores/notifications'

const notifications = useNotificationsStore()

function iconByType(type) {
  if (type === 'success') return 'fa-check'
  if (type === 'error') return 'fa-exclamation'
  if (type === 'warning') return 'fa-exclamation-triangle'
  return 'fa-info'
}
</script>

<style scoped>
.notify-wrap {
  position: fixed;
  top: calc(var(--topbar-h) + 0.9rem);
  right: 1rem;
  z-index: 900;
  pointer-events: none;
}

.notify-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: min(calc(100vw - 2rem), 380px);
}

.notify-card {
  --tone: var(--accent);
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 0.9rem 1rem 1rem;
  overflow: hidden;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 0.85rem;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06);
  pointer-events: auto;
}
.notify-success { --tone: var(--success); }
.notify-error   { --tone: var(--danger); }
.notify-warning { --tone: #e1a11a; }
.notify-info    { --tone: var(--accent); }

.notify-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  color: #fff;
  background: var(--tone);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--tone) 14%, transparent);
}

.notify-body { min-width: 0; }

.notify-title {
  margin: 0 0 0.15rem;
  font-family: var(--font-display);
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--ink-900);
}

.notify-text {
  margin: 0;
  color: var(--ink-500);
  font-size: 0.8rem;
  line-height: 1.4;
  word-break: break-word;
}

.notify-close {
  align-self: start;
  width: 1.6rem;
  height: 1.6rem;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 0.4rem;
  background: transparent;
  color: var(--ink-400);
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.14s, color 0.14s;
}
.notify-close:hover {
  background: var(--surface);
  color: var(--ink-900);
}

.notify-progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--tone);
  opacity: 0.85;
  transform-origin: left;
  animation: notify-countdown linear forwards;
}

@keyframes notify-countdown {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}

/* Entrada deslizando desde la derecha */
.notify-list-enter-active {
  transition: opacity 0.25s ease, transform 0.35s cubic-bezier(.2,.9,.3,1.15);
}
.notify-list-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.notify-list-enter-from {
  opacity: 0;
  transform: translateX(110%);
}
.notify-list-leave-to {
  opacity: 0;
  transform: translateX(40%) scale(0.96);
}
.notify-list-move {
  transition: transform 0.25s ease;
}

@media (max-width: 991px) {
  .notify-wrap {
    top: 0.75rem;
    right: 0.75rem;
    left: 0.75rem;
  }
  .notify-list { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .notify-list-enter-active,
  .notify-list-leave-active,
  .notify-list-move { transition: opacity 0.15s; }
  .notify-list-enter-from,
  .notify-list-leave-to { transform: none; }
  .notify-progress { display: none; }
}
</style>
