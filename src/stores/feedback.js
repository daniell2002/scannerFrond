import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '../api'
import { useNotificationsStore } from './notifications'
import { useOrdersStore } from './orders'
import { useReviewsStore } from './reviews'

const POLL_MS = 30000

/*
 * Retroalimentación del admin sobre las órdenes.
 * - Admin: envía comentario + evidencias y consulta el historial de una orden.
 * - Operario: recibe la retroalimentación (campana + modal de alerta).
 */
export const useFeedbackStore = defineStore('feedback', () => {
  const notify = useNotificationsStore()
  const ordersStore = useOrdersStore()

  /* ── Recibida (operario) ── */
  const items   = ref([])
  const unseen  = ref(0)
  const showing = ref(null)   // retroalimentación abierta en el modal de alerta
  const queue   = []          // no vistas pendientes de mostrar en modal
  const queued  = new Set()   // ids ya encolados en esta sesión

  let timer = null

  function showNext() {
    if (showing.value) return
    showing.value = queue.shift() || null
  }

  async function fetchMine() {
    try {
      const data = await api.get('/api/feedback/mine')
      items.value  = data.items
      unseen.value = data.unseen
      // Las más antiguas primero, para leerlas en orden
      data.items
        .filter(f => !f.seenAt && !queued.has(f.id))
        .reverse()
        .forEach(f => { queued.add(f.id); queue.push(f) })
      showNext()
    } catch {
      /* silencioso: se reintenta en el siguiente ciclo */
    }
  }

  function start() {
    if (timer) return
    fetchMine()
    timer = setInterval(fetchMine, POLL_MS)
  }

  function stop() {
    clearInterval(timer)
    timer = null
    items.value = []
    unseen.value = 0
    showing.value = null
    queue.length = 0
    queued.clear()
  }

  /** Abre una retroalimentación en el modal (p. ej. desde la campana). */
  function open(item) {
    showing.value = item
  }

  /** Cierra el modal; si no estaba vista, la marca como vista. */
  async function dismiss() {
    const item = showing.value
    showing.value = null
    if (item && !item.seenAt) {
      item.seenAt = new Date().toISOString()
      const local = items.value.find(f => f.id === item.id)
      if (local) local.seenAt = item.seenAt
      unseen.value = Math.max(0, unseen.value - 1)
      api.patch(`/api/feedback/${item.id}/seen`).catch(() => {})
    }
    showNext()
  }

  /** Marca como vistas las retroalimentaciones dadas (p. ej. al abrirlas desde la orden). */
  async function markSeen(list) {
    const now = new Date().toISOString()
    await Promise.all(list.filter(f => !f.seenAt).map(async f => {
      // Puede ser el mismo objeto de la tienda: revisar antes de modificarlo
      const local = items.value.find(i => i.id === f.id)
      if (local && !local.seenAt) unseen.value = Math.max(0, unseen.value - 1)
      f.seenAt = now
      if (local) local.seenAt = now
      await api.patch(`/api/feedback/${f.id}/seen`).catch(() => {})
    }))
  }

  /** Retroalimentación recibida sobre una orden (operario). */
  const forOrder = (code) => items.value.filter(f => f.orderCode === code)

  /** Observaciones que el operario aún no ha marcado como corregidas. */
  const openCount = computed(() => items.value.filter(f => !f.resolvedAt).length)

  /** El operario marca la observación como corregida (o la reabre). */
  async function resolve(item, resolved = true) {
    try {
      const updated = await api.patch(`/api/feedback/${item.id}/resolve`, { resolved })
      const local = items.value.find(f => f.id === item.id) || item
      // Marcarla como corregida también la marca como vista
      if (!local.seenAt && updated.seenAt) unseen.value = Math.max(0, unseen.value - 1)
      for (const target of new Set([item, local])) {
        target.seenAt     = updated.seenAt
        target.resolvedAt = updated.resolvedAt
      }
      notify.success(
        resolved ? `La observación de la orden ${item.orderCode} quedó como corregida.` : `La observación de la orden ${item.orderCode} se reabrió.`,
        { title: resolved ? 'Observación corregida' : 'Observación reabierta' }
      )
      return true
    } catch (e) {
      notify.error(e.message || 'No fue posible actualizar la observación.', { title: 'Error' })
      return false
    }
  }

  /* ── Enviar / consultar por orden (admin) ── */
  async function send(code, comment, files = []) {
    const form = new FormData()
    form.append('comment', comment)
    files.forEach(f => form.append('evidences', f))
    try {
      const fb = await api.post(`/api/orders/${encodeURIComponent(code)}/feedback`, form)
      ordersStore.markLocalReviewed(code)
      useReviewsStore().fetchPending()
      if (fb.delivered) {
        notify.success(`Se notificó a ${fb.recipientName}.`, { title: 'Retroalimentación enviada' })
      } else {
        notify.warning('Se guardó, pero no hay un usuario registrado con ese nombre para notificar.', { title: 'Retroalimentación guardada' })
      }
      return fb
    } catch (e) {
      notify.error(e.message || 'No fue posible enviar la retroalimentación.', { title: 'Error' })
      return null
    }
  }

  async function fetchForOrder(code) {
    try {
      return await api.get(`/api/orders/${encodeURIComponent(code)}/feedback`)
    } catch {
      return []
    }
  }

  return { items, unseen, showing, openCount, start, stop, open, dismiss, markSeen, resolve, forOrder, fetchMine, send, fetchForOrder }
})
