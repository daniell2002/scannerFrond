import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '../api'
import { useNotificationsStore } from './notifications'
import { dayKey } from '../utils/dates'

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

  // day: 'AAAA-MM-DD' para ver las órdenes de otro día en "Órdenes del día" ('' = hoy)
  const filters = ref({ query: '', sede: 'all', attendedBy: 'all', status: 'all', priority: 'all', day: '' })

  const sedeMap = computed(() =>
    sedesData.value.reduce((acc, s) => { acc[s.code] = s; return acc }, {})
  )

  const ordersWithMeta = computed(() =>
    rawOrders.value.map(o => ({
      ...o,
      sedeInfo:       sedeMap.value[o.sede] || { name: o.sede, city: '', manager: '' },
      completionRate: o.quantity ? Math.round((o.completed / o.quantity) * 100) : 0,
    }))
  )

  // registeredAt: las ingresadas hoy con una fecha anterior también son del día
  const isVisibleToday = (order) =>
    isToday(order.scheduledAt) || (order.scannedAt && isToday(order.scannedAt)) ||
    (order.registeredAt && isToday(order.registeredAt))

  const todayOrders = computed(() =>
    ordersWithMeta.value.filter(isVisibleToday)
  )

  const historicalOrders = computed(() =>
    ordersWithMeta.value
      .filter(o => !isVisibleToday(o))
      .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
  )

  const ordersOfDay = computed(() => {
    const day = filters.value.day
    if (!day) return todayOrders.value
    return ordersWithMeta.value.filter(o =>
      dayKey(o.scheduledAt) === day || (o.scannedAt && dayKey(o.scannedAt) === day) ||
      (o.registeredAt && dayKey(o.registeredAt) === day))
  })

  const filteredOrders = computed(() => {
    const query = normalizeValue(filters.value.query)
    return ordersOfDay.value.filter(o => {
      const matchQ    = !query || String(o.code).toUpperCase().includes(query)
      const matchSede = filters.value.sede     === 'all' || o.sede     === filters.value.sede
      const matchOp   = filters.value.attendedBy === 'all' || String(o.attendedById) === filters.value.attendedBy
      const matchSt   = filters.value.status   === 'all' || o.status   === filters.value.status
      const matchPr   = filters.value.priority === 'all' || o.priority === filters.value.priority
      return matchQ && matchSede && matchOp && matchSt && matchPr
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

  /**
   * Corrige una orden ya registrada (permiso editar_ordenes). Queda en su historial.
   * fields: { code, product, attendedById, keepPhotos: [url], files: [File], reason }
   * Devuelve { ok, order } o { ok: false, message }.
   */
  async function correctOrder(currentCode, { code, product, attendedById, keepPhotos, files = [], reason }) {
    const form = new FormData()
    form.append('code', code)
    form.append('product', product)
    if (attendedById) form.append('attendedById', attendedById)
    form.append('keepPhotos', JSON.stringify(keepPhotos))
    files.forEach(f => form.append('photos', f))
    form.append('reason', reason)
    try {
      const order = await api.patch(`/api/orders/${encodeURIComponent(currentCode)}/correct`, form)
      // Si cambió el código, la orden se reemplaza en su misma posición
      const idx = rawOrders.value.findIndex(o => String(o.id) === String(order.id))
      if (idx >= 0) rawOrders.value[idx] = order
      else upsertOrder(order)
      notify.success(`La orden ${order.code} fue corregida.`, { title: 'Orden corregida' })
      return { ok: true, order }
    } catch (e) {
      if (e?.message === 'SESSION_EXPIRED' || e?.code === 'SESSION_EXPIRED') return { ok: false, message: '' }
      return { ok: false, message: e.message || 'No fue posible corregir la orden.' }
    }
  }

  /** Elimina una orden (permiso eliminar_ordenes) con su motivo. Devuelve { ok } o { ok: false, message }. */
  async function deleteOrder(code, reason) {
    try {
      await api.del(`/api/orders/${encodeURIComponent(code)}`, { reason })
      rawOrders.value = rawOrders.value.filter(o => normalizeValue(o.code) !== normalizeValue(code))
      notify.warning(`La orden ${code} fue eliminada.`, { title: 'Orden eliminada' })
      return { ok: true }
    } catch (e) {
      if (e?.message === 'SESSION_EXPIRED' || e?.code === 'SESSION_EXPIRED') return { ok: false, message: '' }
      return { ok: false, message: e.message || 'No fue posible eliminar la orden.' }
    }
  }

  // Refleja localmente la revisión del admin (sin recargar todas las órdenes)
  const markLocalReviewed = (code = null) => {
    rawOrders.value.forEach(o => {
      if (code === null || normalizeValue(o.code) === normalizeValue(code)) o.pendingReview = false
    })
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

  /** late: { date, reason } si la orden se ingresa con una fecha anterior (por defecto, ahora) */
  async function registerOrder(rawCode, productName, sedeCode = 'BOG', attendedById, photoFiles = [], late = null) {
    const code = normalizeValue(rawCode)
    if (!code) {
      lastScanMessage.value = 'Ingresa una orden de producción válida.'
      notify.warning('Debes ingresar una orden de producción.', { title: 'Validación' })
      return { ok: false }
    }
    try {
      const form = new FormData()
      form.append('code', code)
      form.append('product', productName?.trim() || 'Sin nombre')
      form.append('sede', sedeCode)
      if (attendedById) form.append('attendedById', attendedById)
      if (late) {
        form.append('orderDate', late.date.toISOString())
        form.append('dateReason', late.reason)
      }
      ;(Array.isArray(photoFiles) ? photoFiles : [photoFiles]).filter(Boolean).forEach(f => form.append('photos', f))

      const order = await api.post('/api/orders', form)
      upsertOrder(order)
      lastScannedCode.value = order.code
      lastScanMessage.value = `Orden ${order.code} registrada en ${sedeMap.value[order.sede]?.name || order.sede}.`
      notify.success(`La orden ${order.code} fue registrada correctamente.`, { title: 'Orden creada' })
      return { ok: true, order }
    } catch (e) {
      if (e?.message === 'SESSION_EXPIRED' || e?.code === 'SESSION_EXPIRED') {
        return { ok: false, reason: 'session_expired' }
      }
      // Orden ya registrada: la vista muestra quién y cuándo (sin toast de error)
      if (e?.status === 409 && e.data?.code === 'DUPLICATE') {
        return { ok: false, reason: 'duplicate', message: e.message, sameUser: e.data.sameUser, existing: e.data.order }
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
      notify.warning('Debes ingresar o escanear un codigo.', { title: 'Validación' })
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

  // Trae una orden puntual (p. ej. al llegar un aviso en tiempo real) sin recargar todo
  async function refreshOrder(code) {
    if (!rawOrders.value.length) return
    try { upsertOrder(await api.get(`/api/orders/${encodeURIComponent(code)}`)) } catch { /* se verá en la próxima carga */ }
  }

  const getOrderByCode = (code) =>
    ordersWithMeta.value.find(o => normalizeValue(o.code) === normalizeValue(code))

  const setFilter    = (key, val) => { filters.value[key] = val }
  const resetFilters = () => { filters.value = { query: '', sede: 'all', attendedBy: 'all', status: 'all', priority: 'all', day: '' } }

  return {
    availablePriorities, availableStatuses,
    filteredOrders, filters, loading,
    getOrderByCode,
    lastScanMessage, lastScannedCode,
    orders: ordersWithMeta,
    todayOrders, historicalOrders,
    markLocalReviewed, resetFilters, scannedOrders,
    correctOrder, deleteOrder, fetchOrders, fetchSedes, refreshOrder, scanOrder, registerOrder,
    sedeStats, sedes: sedesData, setFilter, stats,
  }
})
