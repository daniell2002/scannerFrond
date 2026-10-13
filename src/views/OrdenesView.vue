<template>
  <section class="ord-page">
    <div class="ord-container">

      <!-- Cabecera -->
      <PageHeader
        :breadcrumb="['Conexa', 'Órdenes', isOperario ? 'Mis órdenes del día' : 'Órdenes del día']"
        icon="fa-layer-group"
        :title="isOperario ? 'Mis órdenes del día' : 'Órdenes del día'"
        :subtitle="new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' })"
      >
        <template #action>
          <button class="btn-add-outline" @click="ordersStore.resetFilters()"><i class="fas fa-trash me-2"></i>Limpiar</button>
        </template>
      </PageHeader>

      <!-- Tabla -->
      <div class="table-card">
        <div class="table-card-head">
          <span class="table-card-head-title">
            <i class="fas fa-layer-group"></i>{{ isOperario ? 'Registradas por ti hoy' : 'Órdenes' }}
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
              v-if="!isOperario"
              :model-value="filters.sede"
              @update:model-value="onSedeChange"
              :options="[{ value: 'all', label: 'Todas las sedes' }, ...ordersStore.sedes.map(s => ({ value: s.code, label: s.name }))]"
              icon="fa-building"
              size="sm"
              style="min-width:180px"
            />
            <BaseSelect
              v-if="isAdmin"
              :model-value="filters.operator"
              @update:model-value="v => ordersStore.setFilter('operator', v)"
              :options="operatorOptions"
              icon="fa-user"
              size="sm"
              style="min-width:180px"
            />
          </div>
        </div>

        <div v-if="!rows.length" class="table-empty">
          <i class="fas fa-inbox"></i>
          <p>
            {{ isOperario && !filters.query
              ? 'Aún no has registrado órdenes hoy.'
              : 'No hay órdenes para los filtros seleccionados.' }}
          </p>
          <RouterLink v-if="isOperario && !filters.query" to="/scanner" class="btn-save mt-2">
            <i class="fas fa-camera-retro me-2"></i>Registrar una orden
          </RouterLink>
        </div>

        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Orden producción</th>
                <th>Cliente</th>
                <th v-if="!isOperario">Sede</th>
                <th v-if="!isOperario">Operador</th>
                <th>Hora</th>
                <th v-if="isOperario">Revisión</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in rows" :key="item.code">
                <td><span class="code-tag">{{ item.code }}</span></td>
                <td><span class="ord-product">{{ item.product }}</span></td>
                <td v-if="!isOperario">
                  <span
                    class="sede-chip"
                    :style="{ color: sedeColor(item.sede), backgroundColor: `color-mix(in srgb, ${sedeColor(item.sede)} 16%, transparent)` }"
                  >{{ item.sedeInfo.name }}</span>
                </td>
                <td v-if="!isOperario" class="cell-muted">{{ item.operator }}</td>
                <td><span class="ord-time">{{ fmtTime(item.scannedAt || item.scheduledAt) }}</span></td>
                <td v-if="isOperario">
                  <span class="review-chip" :class="item.pendingReview ? 'is-pending' : 'is-done'">
                    <i class="fas" :class="item.pendingReview ? 'fa-hourglass-half' : 'fa-check'"></i>
                    {{ item.pendingReview ? 'Pendiente' : 'Revisada' }}
                  </span>
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
import PageHeader from '../components/PageHeader.vue'
import { useResponsables } from '../utils/useResponsables'
import { isOwnOrder } from '../utils/ownOrders'

const ordersStore = useOrdersStore()
const authStore   = useAuthStore()
const { filteredOrders, filters, loading, sedes, todayOrders } = storeToRefs(ordersStore)
const isOperario  = computed(() => authStore.user?.role === 'operario')
const isAdmin     = computed(() => authStore.user?.role === 'admin')

// Operario: solo las órdenes del día que él registró
const rows = computed(() =>
  isOperario.value
    ? filteredOrders.value.filter(o => isOwnOrder(o, authStore.user))
    : filteredOrders.value
)

const { options: operatorOptions } = useResponsables(
  todayOrders, computed(() => filters.value.sede), isAdmin
)

function onSedeChange(v) {
  ordersStore.setFilter('sede', v)
  ordersStore.setFilter('operator', 'all')
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

.review-chip { display:inline-flex; align-items:center; gap:0.35rem; font-size:0.72rem; font-weight:700; padding:0.25rem 0.65rem; border-radius:999px; white-space:nowrap; }
.review-chip i { font-size:0.65rem; }
.review-chip.is-pending { color:#b7770b; background:rgba(225,161,26,0.14); }
.review-chip.is-done    { color:var(--success); background:color-mix(in srgb, var(--success) 12%, transparent); }

.sede-chip { display:inline-flex; align-items:center; font-size:0.75rem; font-weight:700; padding:0.28rem 0.7rem; border-radius:999px; white-space:nowrap; }
</style>
