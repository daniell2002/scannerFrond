<template>
  <span class="order-status" :class="`is-${status.key}`" :title="status.hint">
    <i class="fas" :class="status.icon"></i>{{ status.label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { useFeedbackStore } from '../stores/feedback'

/*
 * Estado de una orden desde el punto de vista del operario:
 * Con observaciones → Corregida → Pendiente (sin revisar) → Revisada.
 * Las observaciones mandan sobre la revisión: si el admin dejó un comentario
 * sin atender, eso es lo que el operario necesita ver.
 */
const props = defineProps({ order: { type: Object, required: true } })
const feedback = useFeedbackStore()

const status = computed(() => {
  const list = feedback.forOrder(props.order.code)
  const open = list.filter(f => !f.resolvedAt).length
  if (open)        return { key: 'feedback', label: 'Con observaciones', icon: 'fa-comment-dots', hint: `${open} observación(es) por atender` }
  if (list.length) return { key: 'resolved', label: 'Corregida',         icon: 'fa-check-double', hint: 'Observaciones atendidas' }
  if (props.order.pendingReview)
                   return { key: 'pending',  label: 'Pendiente',         icon: 'fa-hourglass-half', hint: 'Aún no la revisa el administrador' }
  return             { key: 'reviewed', label: 'Revisada',          icon: 'fa-check',        hint: 'Revisada por el administrador' }
})
</script>

<style scoped>
.order-status {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.22rem 0.6rem; border-radius: 999px;
  font-size: 0.74rem; font-weight: 600; white-space: nowrap;
}
.order-status i { font-size: 0.68rem; }
.is-feedback { color: var(--danger);  background: color-mix(in srgb, var(--danger) 10%, transparent); }
.is-resolved { color: var(--accent-strong); background: var(--accent-soft); }
.is-pending  { color: var(--warning); background: color-mix(in srgb, var(--warning) 12%, transparent); }
.is-reviewed { color: var(--success); background: color-mix(in srgb, var(--success) 10%, transparent); }
html.dark .is-resolved { color: #93c5fd; }
</style>
