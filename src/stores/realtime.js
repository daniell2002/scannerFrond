import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, BASE } from '../api'
import { useReviewsStore } from './reviews'
import { useFeedbackStore } from './feedback'
import { useOrdersStore } from './orders'
import { useNotificationsStore } from './notifications'

/*
 * Avisos en tiempo real (Server-Sent Events, ver scannerBack/src/helpers/events.js).
 * - Admin: orden nueva por revisar → se actualiza la campana y la lista al instante.
 * - Supervisor: observación nueva del admin → aparece sin esperar.
 * La consulta periódica de reviews/feedback sigue activa como respaldo.
 */
export const useRealtimeStore = defineStore('realtime', () => {
  const connected = ref(false)
  let source = null
  let retryTimer = null
  let retryMs = 5000
  let active = false

  async function connect() {
    if (!active || source) return
    try {
      // EventSource no envía el token: se cambia por un ticket de un solo uso
      const { ticket } = await api.post('/api/events/ticket')
      if (!active) return
      source = new EventSource(`${BASE}/api/events?ticket=${encodeURIComponent(ticket)}`)
    } catch {
      return scheduleRetry()
    }

    source.addEventListener('ready', () => {
      connected.value = true
      retryMs = 5000
    })

    source.addEventListener('order', (e) => {
      const { code, edited, operator } = JSON.parse(e.data)
      if (edited) {
        // Una orden corregida por un supervisor: aviso propio y vuelve a la lista de revisión
        useNotificationsStore().info(`${code} · corregida por ${operator}`, { title: 'Orden corregida' })
        useReviewsStore().fetchPending({ silent: true })
      } else {
        useReviewsStore().fetchPending()   // campana + aviso "Nueva orden por revisar"
      }
      useOrdersStore().refreshOrder(code)
    })

    source.addEventListener('feedback', () => {
      useFeedbackStore().fetchMine()
    })

    // El ticket ya se usó: en vez del reintento automático se pide uno nuevo
    source.onerror = () => {
      closeSource()
      scheduleRetry()
    }
  }

  function scheduleRetry() {
    if (!active || retryTimer) return
    retryTimer = setTimeout(() => { retryTimer = null; connect() }, retryMs)
    retryMs = Math.min(retryMs * 2, 60_000)
  }

  function closeSource() {
    source?.close()
    source = null
    connected.value = false
  }

  function start() {
    active = true
    connect()
  }

  function stop() {
    active = false
    clearTimeout(retryTimer)
    retryTimer = null
    closeSource()
  }

  return { connected, start, stop }
})
