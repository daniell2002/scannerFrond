<template>
  <section class="ord-page">
    <div class="ord-container">

      <!-- Cabecera -->
      <PageHeader
        :breadcrumb="['Conexa', 'Órdenes', 'Órdenes del día']"
        icon="fa-layer-group"
        title="Órdenes del día"
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
            <i class="fas fa-layer-group"></i>Órdenes
            <span class="table-card-count">{{ filteredOrders.length }}</span>
          </span>
          <div class="table-card-search">
            <div class="search-box">
              <i class="fas fa-search search-box-icon"></i>
              <input
                type="text"
                class="form-control"
                placeholder="Buscar por código, producto u operador…"
                :value="filters.query"
                @input="ordersStore.setFilter('query', $event.target.value)"
              />
            </div>
            <BaseSelect
              v-if="!isOperario"
              :model-value="filters.sede"
              @update:model-value="v => ordersStore.setFilter('sede', v)"
              :options="[{ value: 'all', label: 'Todas las sedes' }, ...ordersStore.sedes.map(s => ({ value: s.code, label: s.name }))]"
              icon="fa-building"
              size="sm"
              style="min-width:180px"
            />
          </div>
        </div>

        <div v-if="!filteredOrders.length" class="table-empty">
          <i class="fas fa-inbox"></i>
          <p>No hay órdenes para los filtros seleccionados.</p>
        </div>

        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Sede</th>
                <th>Operador</th>
                <th>Hora</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredOrders" :key="item.code">
                <td><span class="code-tag">{{ item.code }}</span></td>
                <td><span class="ord-product">{{ item.product }}</span></td>
                <td>
                  <span
                    class="sede-chip"
                    :style="{ color: sedeColor(item.sede), backgroundColor: `color-mix(in srgb, ${sedeColor(item.sede)} 16%, transparent)` }"
                  >{{ item.sedeInfo.name }}</span>
                </td>
                <td class="cell-muted">{{ item.operator }}</td>
                <td><span class="ord-time">{{ fmtTime(item.scannedAt || item.scheduledAt) }}</span></td>
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

const ordersStore = useOrdersStore()
const authStore   = useAuthStore()
const { filteredOrders, filters, loading, sedes } = storeToRefs(ordersStore)
const isOperario  = computed(() => authStore.user?.role === 'operario')

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

.sede-chip { display:inline-flex; align-items:center; font-size:0.75rem; font-weight:700; padding:0.28rem 0.7rem; border-radius:999px; white-space:nowrap; }
</style>
