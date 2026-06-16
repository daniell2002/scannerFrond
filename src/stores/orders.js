import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api'
import { useNotificationsStore } from './notifications'

const normalizeValue = (v) => v.trim().toUpperCase()

const isToday = (iso) => {
  const d = new Date(iso), t = new Date()
  return d.getFullYear() === t.getFullYear() &&
         d.getMonth()    === t.getMonth()    &&
         d.getDate()     === t.getDate()
}

export const useOrdersStore = defineStore('orders', () => {
  const rawOrders       = ref([])
  const sedesData       = ref([])
  const loading         = ref(false)
  const lastScanMessage = ref('Escanea una orden para cargarla en el tablero operativo.')
  const lastScannedCode = ref('')
  const notify          = useNotificationsStore()

  const filters = ref({ query: '', sede: 'all', status: 'all', priority: 'all' })

  const sedeMap = computed(() =>
    sedesData.value.reduce((acc, s) => { acc[s.code] = s; return acc }, {})
  )

  const ordersWithMeta = computed(() =>
    rawOrders.value.map(o => ({
      ...o,
      sedeInfo:       sedeMap.value[o.sede] || { name: o.sede, city: '', manager: '', activeLines: 0 },
      completionRate: o.quantity ? Math.round((o.completed / o.quantity) * 100) : 0,
    }))
  )

  const isVisibleToday = (order) =>
    isToday(order.scheduledAt) || (order.scannedAt && isToday(order.scannedAt))

  const todayOrders = computed(() =>
    ordersWithMeta.value.filter(isVisibleToday)
  )

  const historicalOrders = computed(() =>
    ordersWithMeta.value
      .filter(o => !isVisibleToday(o))
      .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
  )

  const filteredOrders = computed(() => {
    const query = normalizeValue(filters.value.query)
    return todayOrders.value.filter(o => {
      const matchQ    = !query || [o.code, o.product, o.batch, o.operator, o.line].join(' ').toUpperCase().includes(query)
      const matchSede = filters.value.sede     === 'all' || o.sede     === filters.value.sede
      const matchSt   = filters.value.status   === 'all' || o.status   === filters.value.status
      const matchPr   = filters.value.priority === 'all' || o.priority === filters.value.priority
      return matchQ && matchSede && matchSt && matchPr
    })
  })

  const scannedOrders = computed(() =>
    ordersWithMeta.value
      .filter(o => o.scanCount > 0)
      .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))
  )

  const stats = computed(() => ({
    total:      ordersWithMeta.value.length,
    inProgress: ordersWithMeta.value.filter(o => o.status === 'En proceso').length,
    scanned:    ordersWithMeta.value.filter(o => o.scanCount > 0).length,
    blocked:    ordersWithMeta.value.filter(o => o.status === 'Bloqueada').length,
  }))

  const sedeStats = computed(() =>
    sedesData.value.map(s => {
      const so = ordersWithMeta.value.filter(o => o.sede === s.code)
      return { ...s, orders: so.length, active: so.filter(o => o.status === 'En proceso').length, completed: so.filter(o => o.status === 'Completada').length }
    })
  )

  const availableStatuses   = ['all', 'Pendiente', 'En proceso', 'Completada', 'Bloqueada']
  const availablePriorities = ['all', 'Alta', 'Media', 'Baja']

  const upsertOrder = (order) => {
    const idx = rawOrders.value.findIndex(o => normalizeValue(o.code) === normalizeValue(order.code))
    if (idx >= 0) rawOrders.value[idx] = order
    else rawOrders.value.unshift(order)
  }

  // ── API actions ──────────────────────────────────────────────────

  async function fetchSedes({ silent = false } = {}) {
    try {
      sedesData.value = await api.get('/api/sedes')
    } catch (e) {
      if (e?.message === 'SESSION_EXPIRED' || e?.code === 'SESSION_EXPIRED') {
        return
      }
      if (!silent) {
        notify.error(e.message || 'No fue posible cargar las sedes.', { title: 'Error de carga' })
      }
    }
  }

  async function fetchOrders() {
    loading.value = true
    try {
      if (!sedesData.value.length) {
        await fetchSedes({ silent: true })
      }
      rawOrders.value = await api.get('/api/orders')
    } catch (e) {
      if (e?.message === 'SESSION_EXPIRED' || e?.code === 'SESSION_EXPIRED') {
        return
      }
      console.error('fetchOrders:', e.message)
      notify.error(e.message || 'No fue posible cargar las ordenes.', { title: 'Error al cargar' })
    } finally {
      loading.value = false
    }
  }

  async function registerOrder(rawCode, productName, sedeCode = 'BOG', operatorName) {
    const code = normalizeValue(rawCode)
    if (!code) {
      lastScanMessage.value = 'Ingresa un código de orden válido.'
      notify.warning('Debes ingresar un codigo de orden.', { title: 'Validacion' })
      return { ok: false }
    }
    try {
      const order = await api.post('/api/orders', { code, product: productName?.trim() || 'Sin nombre', sede: sedeCode, operator: operatorName })
      upsertOrder(order)
      lastScannedCode.value = order.code
      lastScanMessage.value = `Orden ${order.code} registrada en ${sedeMap.value[order.sede]?.name || order.sede}.`
      notify.success(`La orden ${order.code} fue registrada correctamente.`, { title: 'Orden creada' })
      fetchOrders().catch(() => {})
      return { ok: true, order }
    } catch (e) {
      if (e?.message === 'SESSION_EXPIRED' || e?.code === 'SESSION_EXPIRED') {
        return { ok: false, reason: 'session_expired' }
      }
      lastScanMessage.value = e.message
      notify.error(e.message || 'No fue posible registrar la orden.', { title: 'Error de registro' })
      return { ok: false }
    }
  }

  async function scanOrder(rawCode) {
    const code = normalizeValue(rawCode)
    if (!code) {
      lastScanMessage.value = 'Ingresa o escanea un código válido.'
      notify.warning('Debes ingresar o escanear un codigo.', { title: 'Validacion' })
      return { ok: false, reason: 'empty' }
    }
    try {
      const order = await api.patch(`/api/orders/${code}/scan`)
      upsertOrder(order)
      lastScannedCode.value = order.code
      lastScanMessage.value = `Orden ${order.code} cargada desde ${sedeMap.value[order.sede]?.name || order.sede}.`
      notify.info(`Se registro un nuevo escaneo para ${order.code}.`, { title: 'Escaneo actualizado' })
      return { ok: true, order }
    } catch (e) {
      if (e?.message === 'SESSION_EXPIRED' || e?.code === 'SESSION_EXPIRED') {
        return { ok: false, reason: 'session_expired' }
      }
      lastScannedCode.value = code
      lastScanMessage.value = e.message.includes('404') ? `La orden ${code} no existe.` : e.message
      notify.error(lastScanMessage.value, { title: 'Error de escaneo' })
      return { ok: false, reason: 'missing' }
    }
  }

  const getOrderByCode = (code) =>
    ordersWithMeta.value.find(o => normalizeValue(o.code) === normalizeValue(code))

  const setFilter    = (key, val) => { filters.value[key] = val }
  const resetFilters = () => { filters.value = { query: '', sede: 'all', status: 'all', priority: 'all' } }

  return {
    availablePriorities, availableStatuses,
    filteredOrders, filters, loading,
    getOrderByCode,
    lastScanMessage, lastScannedCode,
    orders: ordersWithMeta,
    todayOrders, historicalOrders,
    resetFilters, scannedOrders,
    fetchOrders, fetchSedes, scanOrder, registerOrder,
    sedeStats, sedes: sedesData, setFilter, stats,
  }
})
