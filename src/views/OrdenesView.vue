<template>
  <section class="ord-page">
    <div class="ord-container">

      <!-- Cabecera -->
      <PageHeader
        :breadcrumb="['Conexa', 'Órdenes', 'Órdenes del día']"
        icon="fa-layer-group"
        title="Órdenes del día"
        :subtitle="dayLabel"
      >
        <template #action>
          <button class="btn-add-outline" @click="ordersStore.resetFilters()"><i class="fas fa-filter-circle-xmark"></i>Limpiar filtros</button>
        </template>
      </PageHeader>

      <!-- Tabla -->
      <div class="table-card">
        <div class="table-card-head">
          <span class="table-card-head-title">
            <i class="fas fa-layer-group"></i>{{ isAdmin ? 'Órdenes' : `Órdenes de ${mySedeName}` }}
            <span class="table-card-count">{{ rows.length }}</span>
          </span>
          <div class="table-card-search">
            <div class="search-box">
              <i class="fas fa-search search-box-icon"></i>
              <input
                type="text"
                class="form-control"
                placeholder="Buscar por orden de producción…"
                :value="filters.query"
                @input="ordersStore.setFilter('query', $event.target.value)"
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
              :model-value="filters.attendedBy"
              @update:model-value="v => ordersStore.setFilter('attendedBy', v)"
              :options="vendorOptions"
              searchable
              icon="fa-user-tag"
              size="sm"
              style="min-width:200px"
            />
            <!-- Ver otro día: solo con acceso al historial (son órdenes anteriores) -->
            <div v-if="canPickDay" class="day-pick">
              <input type="date" class="form-control form-control-sm" title="Día" :max="today"
                :value="filters.day || today" @change="pickDay($event.target.value)" />
              <button v-if="filters.day" type="button" class="btn-add-outline btn-sm-today" @click="pickDay('')">Hoy</button>
            </div>
          </div>
        </div>

        <div v-if="!rows.length" class="table-empty">
          <i class="fas fa-inbox"></i>
          <p>
            {{ noFilters
              ? (filters.day ? 'No se registraron órdenes ese día.' : 'Aún no se han registrado órdenes hoy.')
              : 'No hay órdenes para los filtros seleccionados.' }}
          </p>
          <RouterLink v-if="noFilters && authStore.hasPermission('scanner')" to="/scanner" class="btn-save mt-2">
            <i class="fas fa-camera-retro me-2"></i>Registrar una orden
          </RouterLink>
        </div>

        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Orden producción</th>
                <th>Cliente</th>
                <th v-if="isAdmin">Sede</th>
                <th>Atendido por</th>
                <th>Registró</th>
                <th>Hora</th>
                <th v-if="!isAdmin">Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in rows" :key="item.code">
                <td><span class="code-tag">{{ item.code }}</span></td>
                <td><span class="ord-product">{{ item.product }}</span></td>
                <td v-if="isAdmin">
                  <span
                    class="sede-chip"
                    :style="{ '--dot': sedeColor(item.sede) }"
                  >{{ item.sedeInfo.name }}</span>
                </td>
                <td>{{ item.attendedBy || '—' }}</td>
                <td class="cell-muted">{{ item.operator }}</td>
                <td><span class="ord-time">{{ fmtTime(item.scannedAt || item.scheduledAt) }}</span></td>
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
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
import { generateOrderPdf } from '../utils/orderPdf'
import BaseSelect from '../components/BaseSelect.vue'
import { todayKey } from '../utils/dates'
import PageHeader from '../components/PageHeader.vue'
import { useVendedores } from '../utils/useVendedores'
import OrderStatus from '../components/OrderStatus.vue'

const ordersStore = useOrdersStore()
const authStore   = useAuthStore()
const { filteredOrders, filters, sedes } = storeToRefs(ordersStore)
// El admin ve todas las sedes; el supervisor, solo la suya (el backend ya filtra)
const isAdmin    = computed(() => authStore.user?.role === 'admin')
const mySedeName = computed(() => sedes.value.find(s => s.code === authStore.user?.sede)?.name || 'tu sede')
const rows       = filteredOrders
const noFilters  = computed(() => !filters.value.query && filters.value.attendedBy === 'all')

/* Día a mostrar ('' = hoy) */
const today      = todayKey()
const canPickDay = computed(() => authStore.hasPermission('historial'))
const pickDay    = (v) => ordersStore.setFilter('day', !v || v === today ? '' : v)
const dayLabel   = computed(() => {
  const d = filters.value.day ? new Date(`${filters.value.day}T00:00:00`) : new Date()
  const text = d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: filters.value.day ? 'numeric' : undefined })
  return filters.value.day ? text : `Hoy · ${text}`
})

// Filtro por el vendedor que atendió (no por el usuario que registró)
const { filterOptions: vendorOptions } = useVendedores(
  computed(() => filters.value.sede), { includeInactive: true }
)

function onSedeChange(v) {
  ordersStore.setFilter('sede', v)
  ordersStore.setFilter('attendedBy', 'all')
}

onMounted(() => {
  ordersStore.resetFilters()
  ordersStore.fetchOrders()
})

const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  : '—'

/* Color por sede: mismo criterio que EstadisticasView, para consistencia visual */
const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)',
                 'var(--series-5)', 'var(--series-6)', 'var(--series-7)', 'var(--series-8)']
const sedeColor = (code) => {
  const idx = sedes.value.findIndex(s => s.code === code)
  return SERIES[idx >= 0 ? idx % SERIES.length : 0]
}

/* Generación de PDF */
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
</script>

<style scoped>
.ord-page { padding: 1rem 0 1.5rem; }
.ord-container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }

.search-box { position:relative; flex:1 1 220px; max-width:320px; }
.search-box-icon { position:absolute; left:0.8rem; top:50%; transform:translateY(-50%); color:var(--ink-500); font-size:0.8rem; pointer-events:none; }
.search-box .form-control { padding-left:2.15rem; }

.ord-code { font-weight:700; letter-spacing:0.04rem; }
.ord-product { max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; display:inline-block; }
.ord-time { font-size:0.82rem; font-weight:600; color:var(--ink-700); font-variant-numeric:tabular-nums; white-space:nowrap; }

.table-empty .btn-save { text-decoration:none; }
.day-pick { display:flex; align-items:center; gap:0.4rem; }
.day-pick .form-control { width:auto; min-width:150px; }
.btn-sm-today { padding:0.3rem 0.75rem; font-size:0.8rem; }


.sede-chip { display:inline-flex; align-items:center; font-size:0.75rem; font-weight:700; padding:0.28rem 0.7rem; border-radius:999px; white-space:nowrap; }
</style>
