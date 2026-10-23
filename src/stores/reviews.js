import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import { useNotificationsStore } from './notifications'
import { useOrdersStore } from './orders'

const POLL_MS = 30000

/* Órdenes que llegaron desde el scanner y el admin aún no ha revisado. */
export const useReviewsStore = defineStore('reviews', () => {
  const total  = ref(0)
  const orders = ref([])
  const notify = useNotificationsStore()
  const ordersStore = useOrdersStore()

  let timer = null
  let knownCodes = null // null = primera carga, no avisar

  /** silent: actualiza la lista sin avisar de órdenes nuevas (ya se avisó por otro lado). */
  async function fetchPending({ silent = false } = {}) {
    try {
      const data = await api.get('/api/orders/pending-review')
      const fresh = knownCodes
        ? data.orders.filter(o => !knownCodes.has(o.code))
        : []
      knownCodes = new Set(data.orders.map(o => o.code))
      total.value  = data.total
      orders.value = data.orders

      if (silent) {
        /* sin aviso */
      } else if (fresh.length === 1) {
        notify.info(`${fresh[0].code} · ${fresh[0].operator}`, { title: 'Nueva orden por revisar' })
      } else if (fresh.length > 1) {
        notify.info(`Llegaron ${fresh.length} órdenes nuevas.`, { title: 'Órdenes por revisar' })
      }
    } catch {
      /* silencioso: se reintenta en el siguiente ciclo */
    }
  }

  function start() {
    if (timer) return
    fetchPending()
    timer = setInterval(fetchPending, POLL_MS)
  }

  function stop() {
    clearInterval(timer)
    timer = null
    knownCodes = null
    total.value = 0
    orders.value = []
  }

  async function markReviewed(code) {
    ordersStore.markLocalReviewed(code)
    const listed = orders.value.some(o => o.code === code)
    if (listed) {
      orders.value = orders.value.filter(o => o.code !== code)
      total.value  = Math.max(0, total.value - 1)
    }
    try {
      await api.patch(`/api/orders/${encodeURIComponent(code)}/review`)
      if (!listed) fetchPending()
    } catch {
      fetchPending()
    }
  }

  async function markAllReviewed() {
    try {
      await api.patch('/api/orders/pending-review')
      ordersStore.markLocalReviewed()
      orders.value = []
      total.value  = 0
    } catch (e) {
      notify.error(e.message || 'No fue posible marcar las órdenes.')
    }
  }

  return { total, orders, fetchPending, start, stop, markReviewed, markAllReviewed }
})
