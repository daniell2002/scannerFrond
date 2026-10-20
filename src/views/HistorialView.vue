<template>
  <section class="hist-page">
    <div class="hist-container">

      <!-- Cabecera -->
      <PageHeader
        :breadcrumb="['Conexa', 'Historial', 'Historial de órdenes']"
        icon="fa-history"
        title="Historial de órdenes"
        :subtitle="isAdmin ? hoy : `${mySedeName} · ${hoy}`"
      >
        <template #action>
          <button class="btn-add-outline" :disabled="exporting || !filteredHistoricalOrders.length" @click="exportExcel">
            <i class="fas" :class="exporting ? 'fa-spinner fa-spin' : 'fa-file-excel'"></i>{{ exporting ? 'Generando…' : 'Exportar a Excel' }}
          </button>
        </template>
      </PageHeader>

      <!-- Resumen de la sede del supervisor -->
      <div v-if="!isAdmin" class="kpi-grid">
        <div class="kpi">
          <div class="kpi-head"><span class="kpi-label">Total registradas</span><i class="fas fa-database kpi-icon"></i></div>
          <span class="kpi-value">{{ myStats.total }}</span>
        </div>
        <div class="kpi">
          <div class="kpi-head"><span class="kpi-label">Este mes</span><i class="fas fa-calendar kpi-icon"></i></div>
          <span class="kpi-value">{{ myStats.month }}</span>
        </div>
        <div class="kpi">
          <div class="kpi-head"><span class="kpi-label">Hoy</span><i class="fas fa-calendar-day kpi-icon"></i></div>
          <span class="kpi-value">{{ myStats.today }}</span>
        </div>
        <div class="kpi">
          <div class="kpi-head"><span class="kpi-label">Pendientes de revisión</span><i class="fas fa-hourglass-half kpi-icon"></i></div>
          <span class="kpi-value" :class="{ 'is-warn': myStats.pending }">{{ myStats.pending }}</span>
        </div>
      </div>

      <!-- Tabla -->
      <div class="table-card">
        <div class="table-card-head">
          <span class="table-card-head-title">
            <i class="fas fa-archive"></i>
            Órdenes anteriores
            <span class="table-card-count">{{ filteredHistoricalOrders.length }}</span>
          </span>
          <div class="table-card-search">
            <div class="search-box">
              <i class="fas fa-search search-box-icon"></i>
              <input
                type="text"
                class="form-control"
                placeholder="Buscar por orden de producción…"
                v-model="filters.query"
              />
            </div>
            <BaseSelect
              v-if="isAdmin"
              :model-value="filters.sede"
              @update:model-value="onSedeChange"
              :options="[{ value: 'all', label: 'Todas las sedes' }, ...ordersStore.sedes.map(s => ({ value: s.code, label: s.name }))]"
              icon="fa-building"
              size="sm"
              style="min-width:180px"
            />
            <BaseSelect
              v-model="filters.attendedBy"
              :options="vendorOptions"
              searchable
              icon="fa-user-tag"
              size="sm"
              style="min-width:200px"
            />
            <DateRangeFilter v-model:from="filters.from" v-model:to="filters.to" :max="yesterday" />
          </div>
        </div>

        <!-- Vacío -->
        <div v-if="!filteredHistoricalOrders.length" class="log-empty">
          <div class="log-empty-icon">
            <i class="fas fa-clipboard-list"></i>
          </div>
          <p class="log-empty-title">{{ noFilters ? 'Sin historial aún' : 'Sin resultados' }}</p>
          <p class="log-empty-sub">
            {{ noFilters
              ? 'Las órdenes de días anteriores aparecen aquí automáticamente.'
              : 'No hay órdenes para los filtros seleccionados.' }}
          </p>
          <RouterLink v-if="noFilters && authStore.hasPermission('scanner')" to="/scanner" class="btn btn-primary">
            <i class="fas fa-qrcode me-2"></i>Ir al Scanner
          </RouterLink>
        </div>

        <!-- Tabla -->
        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Orden producción</th>
                <th>Cliente</th>
                <th v-if="isAdmin">Sede</th>
                <th>Atendido por</th>
                <th>Registró</th>
                <th>Fecha</th>
                <th v-if="!isAdmin">Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredHistoricalOrders" :key="item.code">
                <td><span class="code-tag">{{ item.code }}</span></td>
                <td><span class="h-product">{{ item.product }}</span></td>
                <td v-if="isAdmin">
                  <span
                    class="sede-chip"
                    :style="{ '--dot': sedeColor(item.sede) }"
                  >{{ item.sedeInfo.name }}</span>
                </td>
                <td>{{ item.attendedBy || '—' }}</td>
                <td class="cell-muted">{{ item.operator }}</td>
                <td>
                  <span class="h-date">{{ fmtDate(item.scannedAt || item.scheduledAt) }}</span>
                  <span class="h-time">{{ fmtTime(item.scannedAt || item.scheduledAt) }}</span>
                </td>
                <td v-if="!isAdmin">
                  <OrderStatus :order="item" />
                </td>
                <td>
                  <div class="row-actions">
                    <button
                      class="btn-icon btn-del"
                      :disabled="generatingPdf === item.code"
                      title="Descargar PDF"
                      @click="generatePdf(item)"
                    >
                      <i class="fas" :class="generatingPdf === item.code ? 'fa-spinner fa-spin' : 'fa-file-pdf'"></i>
                    </button>
                    <RouterLink :to="`/orden/${item.code}`" class="btn-icon" title="Ver detalle">
                      <i class="fas fa-arrow-right"></i>
                    </RouterLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
import { generateOrderPdf } from '../utils/orderPdf'
import { exportOrders } from '../utils/exportExcel'
import { useNotificationsStore } from '../stores/notifications'
import BaseSelect from '../components/BaseSelect.vue'
import DateRangeFilter from '../components/DateRangeFilter.vue'
import { inRange, dayKey } from '../utils/dates'
import PageHeader from '../components/PageHeader.vue'
import { useVendedores } from '../utils/useVendedores'
import OrderStatus from '../components/OrderStatus.vue'

const ordersStore = useOrdersStore()
const authStore    = useAuthStore()
const { historicalOrders, orders, sedes } = storeToRefs(ordersStore)
// El admin ve todas las sedes; el supervisor, solo la suya (el backend ya filtra)
const isAdmin    = computed(() => authStore.user?.role === 'admin')
const mySedeName = computed(() => sedes.value.find(s => s.code === authStore.user?.sede)?.name || 'Tu sede')

onMounted(() => ordersStore.fetchOrders())

/* Color por sede: mismo criterio que EstadisticasView, para consistencia visual */
const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)',
                 'var(--series-5)', 'var(--series-6)', 'var(--series-7)', 'var(--series-8)']
const sedeColor = (code) => {
  const idx = sedes.value.findIndex(s => s.code === code)
  return SERIES[idx >= 0 ? idx % SERIES.length : 0]
}

const generatingPdf = ref('')
async function generatePdf(order) {
  if (generatingPdf.value) return
  generatingPdf.value = order.code
  try {
    await generateOrderPdf(order)
  } finally {
    generatingPdf.value = ''
  }
}

// Exporta exactamente lo que se ve en la tabla (con los filtros aplicados)
const notify    = useNotificationsStore()
const exporting = ref(false)
async function exportExcel() {
  exporting.value = true
  try {
    await exportOrders(filteredHistoricalOrders.value, { name: 'historial' })
  } catch {
    notify.error('No fue posible generar el archivo de Excel.')
  } finally {
    exporting.value = false
  }
}

const filters   = ref({ query: '', sede: 'all', attendedBy: 'all', from: '', to: '' })
const noFilters = computed(() => !filters.value.query.trim() && filters.value.sede === 'all' && filters.value.attendedBy === 'all'
  && !filters.value.from && !filters.value.to)
// El historial llega hasta ayer
const yesterday = dayKey(Date.now() - 86_400_000)

// Filtro por el vendedor que atendió (no por el usuario que registró)
const { filterOptions: vendorOptions } = useVendedores(
  computed(() => filters.value.sede), { includeInactive: true }
)

function onSedeChange(v) {
  filters.value.sede = v
  filters.value.attendedBy = 'all'
}

/* Resumen de la sede (el supervisor solo recibe las órdenes de su sede) */
const myStats = computed(() => {
  const now = new Date()
  const dateOf = (o) => new Date(o.scannedAt || o.scheduledAt)
  return {
    total:   orders.value.length,
    month:   orders.value.filter(o => { const d = dateOf(o); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() }).length,
    today:   orders.value.filter(o => dateOf(o).toDateString() === now.toDateString()).length,
    pending: orders.value.filter(o => o.pendingReview).length,
  }
})

const filteredHistoricalOrders = computed(() => {
  const query = filters.value.query.trim().toUpperCase()
  return historicalOrders.value.filter(o => {
    const matchQ    = !query || String(o.code).toUpperCase().includes(query)
    const matchSede = filters.value.sede === 'all' || o.sede === filters.value.sede
    const matchVend = filters.value.attendedBy === 'all' || String(o.attendedById) === filters.value.attendedBy
    const matchDate = inRange(o.scannedAt || o.scheduledAt, filters.value.from, filters.value.to)
    return matchQ && matchSede && matchVend && matchDate
  })
})

const hoy = new Date().toLocaleDateString('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

const fmtDate = (iso) => new Date(iso).toLocaleDateString('es-CO', {
  day: 'numeric', month: 'short', year: 'numeric',
})
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('es-CO', {
  hour: 'numeric', minute: '2-digit',
})
</script>

<style scoped>
.hist-page { padding: 1rem 0 1.5rem; }
.hist-container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }

.search-box { position:relative; flex:1 1 220px; max-width:320px; }
.search-box-icon { position:absolute; left:0.8rem; top:50%; transform:translateY(-50%); color:var(--ink-500); font-size:0.8rem; pointer-events:none; }
.search-box .form-control { padding-left:2.15rem; }

/* Empty */
.log-empty { display:flex; flex-direction:column; align-items:center; text-align:center; padding:3.5rem 2rem; }
.log-empty-icon { width:56px; height:56px; display:grid; place-items:center; font-size:1.4rem; color:var(--ink-500); background:var(--surface); border-radius:0.75rem; margin-bottom:1rem; }
.log-empty-title { font-size:0.95rem; font-weight:600; color:var(--ink-900); margin:0 0 0.35rem; }
.log-empty-sub   { font-size:0.82rem; color:var(--ink-500); max-width:300px; line-height:1.7; margin:0 0 1rem; }

/* Tabla */
.h-product { max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; display:inline-block; }
.h-date    { font-size:0.82rem; font-weight:600; color:var(--ink-700); white-space:nowrap; }

.h-time    { display:block; font-size:0.72rem; color:var(--ink-500); margin-top:0.1rem; }



.sede-chip { display:inline-flex; align-items:center; font-size:0.75rem; font-weight:700; padding:0.28rem 0.7rem; border-radius:999px; white-space:nowrap; }
</style>
