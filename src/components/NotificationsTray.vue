<template>
  <div class="notify-wrap" aria-live="polite" aria-atomic="true">
    <TransitionGroup name="notify-list" tag="div" class="notify-list">
      <article
        v-for="n in notifications.items"
        :key="n.id"
        class="notify-card"
        :class="`notify-${n.type}`"
      >
        <div class="notify-icon">
          <i class="fas" :class="iconByType(n.type)" aria-hidden="true"></i>
        </div>
        <div class="notify-body">
          <p v-if="n.title" class="notify-title">{{ n.title }}</p>
          <p class="notify-text">{{ n.message }}</p>
        </div>
        <button class="notify-close" @click="notifications.remove(n.id)" aria-label="Cerrar notificacion">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </article>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useNotificationsStore } from '../stores/notifications'

const notifications = useNotificationsStore()

function iconByType(type) {
  if (type === 'success') return 'fa-check-circle'
  if (type === 'error') return 'fa-exclamation-circle'
  if (type === 'warning') return 'fa-exclamation-triangle'
  return 'fa-info-circle'
}
</script>

<style scoped>
.notify-wrap {
  position: fixed;
  top: calc(var(--topbar-h) + 0.75rem);
  right: 0.9rem;
  z-index: 900;
  pointer-events: none;
}

.notify-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: min(92vw, 360px);
}

.notify-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 0.65rem;
  background: var(--paper);
  border: 1px solid var(--line);
  border-left: 4px solid var(--accent);
  box-shadow: var(--shadow-lg);
  border-radius: 0.5rem;
  padding: 0.7rem 0.75rem;
  pointer-events: auto;
}

.notify-icon {
  width: 1.25rem;
  color: var(--accent);
  text-align: center;
  line-height: 1.25rem;
  padding-top: 0.05rem;
}

.notify-title {
  margin: 0 0 0.08rem;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.08rem;
  color: var(--ink-700);
  font-weight: 700;
}

.notify-text {
  margin: 0;
  color: var(--ink-900);
  font-size: 0.82rem;
  line-height: 1.35;
}

.notify-close {
  border: none;
  background: transparent;
  color: var(--ink-500);
  font-size: 0.72rem;
  padding: 0.12rem;
  cursor: pointer;
}

.notify-close:hover {
  color: var(--ink-900);
}

.notify-success {
  border-left-color: var(--success);
}
.notify-success .notify-icon {
  color: var(--success);
}

.notify-error {
  border-left-color: var(--danger);
}
.notify-error .notify-icon {
  color: var(--danger);
}

.notify-warning {
  border-left-color: #e1a11a;
}
.notify-warning .notify-icon {
  color: #e1a11a;
}

.notify-info {
  border-left-color: var(--accent);
}

.notify-list-enter-active,
.notify-list-leave-active {
  transition: all 0.18s ease;
}

.notify-list-enter-from,
.notify-list-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.notify-list-move {
  transition: transform 0.18s ease;
}

@media (max-width: 991px) {
  .notify-wrap {
    top: 0.75rem;
    right: 0.65rem;
  }
}
</style>
