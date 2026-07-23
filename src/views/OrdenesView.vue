<template>
  <section class="py-3 py-lg-4">
    <div class="container-lg">

      <!-- Cabecera + Filtros -->
      <div class="ord-header mb-4">

        <!-- Título -->
        <div class="ord-title-row">
          <div class="ord-title-left">
            <div class="ord-title-icon"><i class="fas fa-layer-group"></i></div>
            <div>
              <h2 class="ord-title">Órdenes del día</h2>
              <p class="ord-subtitle">
                <span class="ord-count-badge">{{ filteredOrders.length }}</span>
                orden(es) · {{ new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long' }) }}
              </p>
            </div>
          </div>
          <button class="ord-clear-btn" @click="ordersStore.resetFilters()">
            <i class="fas fa-trash me-1"></i>Limpiar
          </button>
        </div>

        <!-- Filtros -->
        <div class="ord-filters">
          <div class="ord-search-wrap">
            <i class="fas fa-search ord-search-icon"></i>
            <input
              :value="filters.query" type="text"
              class="ord-search-input"
              placeholder="Buscar por código, producto u operador…"
              @input="updateFilter('query', $event)" />
          </div>
          <div v-if="!isOperario" class="ord-select-wrap">
            <i class="fas fa-building ord-select-icon"></i>
            <select class="ord-select" :value="filters.sede" @change="updateFilter('sede', $event)">
              <option value="all">Todas las sedes</option>
              <option v-for="s in ordersStore.sedes" :key="s.code" :value="s.code">{{ s.name }}</option>
            </select>
          </div>
        </div>

      </div>

      <!-- Tabla -->
      <div class="ord-table-wrap">
        <div class="table-responsive">
          <table class="ord-table">
            <thead>
              <tr>
                <th>Código</th><th>Producto</th><th>Sede</th><th>Operador</th><th>Hora</th><th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in filteredOrders" :key="o.code">
                <td><span class="ord-code">{{ o.code }}</span></td>
                <td class="ord-product">{{ o.product }}</td>
                <td><span class="chip chip-sede">{{ o.sedeInfo.name }}</span></td>
                <td class="text-muted-sm">{{ o.operator }}</td>
                <td class="ord-time">{{ fmtTime(o.scannedAt || o.scheduledAt) }}</td>
                <td>
                  <div class="d-flex gap-1">
                    <button class="btn-pdf" @click="generatePdf(o)" :disabled="generatingPdf === o.code" title="Descargar PDF">
                      <i class="fas" :class="generatingPdf === o.code ? 'fa-spinner fa-spin' : 'fa-file-pdf'"></i>
                    </button>
                    <RouterLink :to="`/orden/${o.code}`" class="btn btn-sm btn-dark">
                      <i class="fas fa-arrow-right"></i>
                    </RouterLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="!filteredOrders.length" class="empty-row">
          <i class="fas fa-inbox me-2"></i>No hay órdenes para los filtros seleccionados.
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

const ordersStore = useOrdersStore()
const authStore   = useAuthStore()
const { filteredOrders, filters, loading } = storeToRefs(ordersStore)
const isOperario  = computed(() => authStore.user?.role === 'operario')

onMounted(() => {
  ordersStore.resetFilters()
  ordersStore.fetchOrders()
})

const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  : '—'
const updateFilter = (key, e) => ordersStore.setFilter(key, e.target.value)

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
/* ── Cabecera órdenes ── */
.ord-header { display:flex; flex-direction:column; gap:1rem; }

.ord-title-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap;
  background: var(--paper); border: 1px solid var(--line);
  border-radius: 0.375rem; padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
}
.ord-title-left { display:flex; align-items:center; gap:1rem; }
.ord-title-icon {
  width: 2.75rem; height: 2.75rem; min-width: 2.75rem;
  background: var(--accent); border-radius: 0.375rem;
  display: grid; place-items: center;
  color: #fff; font-size: 1rem;
}
.ord-title    { font-family:var(--font-display); font-size:1.15rem; font-weight:700; margin:0 0 0.2rem; color:var(--ink-900); }
.ord-subtitle { font-size:0.8rem; color:var(--ink-500); margin:0; display:flex; align-items:center; gap:0.4rem; }
.ord-count-badge {
  font-size:0.72rem; font-weight:700;
  background:rgba(66,130,194,0.12); color:var(--accent);
  border:1px solid rgba(66,130,194,0.2);
  padding:0.1rem 0.5rem; border-radius:3px;
}
.ord-clear-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.45rem 0.875rem;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 0.375rem; font-size: 0.8rem; font-weight: 600;
  color: var(--ink-700); cursor: pointer;
  transition: background 0.14s, color 0.14s;
}
.ord-clear-btn:hover { background: var(--danger); color: #fff; border-color: var(--danger); }

.ord-filters { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.ord-search-wrap {
  flex: 1; min-width: 220px;
  display: flex; align-items: center;
  background: var(--paper); border: 1.5px solid var(--line);
  border-radius: 0.75rem; overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ord-search-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(66,130,194,0.1);
}
.ord-search-icon  { padding: 0 0.875rem; color: var(--ink-500); font-size: 0.85rem; flex-shrink:0; }
.ord-search-input {
  flex: 1; border: none; outline: none;
  padding: 0.75rem 0.5rem 0.75rem 0;
  font-size: 0.875rem; color: var(--ink-900);
  background: transparent; font-family: var(--font-body);
}
.ord-search-input::placeholder { color: var(--ink-500); opacity: 0.6; }

.ord-select-wrap {
  min-width: 180px;
  display: flex; align-items: center;
  background: var(--paper); border: 1.5px solid var(--line);
  border-radius: 0.75rem; overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ord-select-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(66,130,194,0.1);
}
.ord-select-icon { padding: 0 0.875rem; color: var(--ink-500); font-size: 0.85rem; flex-shrink:0; }
.ord-select {
  flex: 1; border: none; outline: none;
  padding: 0.75rem 0.5rem 0.75rem 0;
  font-size: 0.875rem; color: var(--ink-900);
  background: transparent; cursor: pointer; font-family: var(--font-body);
  color-scheme: light;
}
html.dark .ord-select { color-scheme: dark; }
.ord-select option { color: var(--ink-900); background: var(--paper); }
html.dark .ord-select option { color: var(--ink-900); background: var(--surface); }

.ord-table-wrap { background:var(--paper); border:1px solid var(--line); border-radius:0.375rem; overflow:hidden; box-shadow:var(--shadow-sm); }

.ord-table { width:100%; border-collapse:collapse; font-size:0.865rem; }
.ord-table th { padding:0.8rem 1rem; text-align:left; font-size:0.62rem; text-transform:uppercase; letter-spacing:0.1rem; color:var(--ink-500); font-weight:700; border-bottom:1px solid var(--line); background:var(--surface); white-space:nowrap; }
.ord-table td { padding:0.85rem 1rem; border-bottom:1px solid var(--line); vertical-align:middle; color:var(--ink-900); }
.ord-table tbody tr:last-child td { border-bottom:none; }
.ord-table tbody tr:hover { background:rgba(66,130,194,0.04); }
.ord-code    { font-weight:700; font-size:0.82rem; letter-spacing:0.04rem; color:var(--ink-500); }
.ord-product { max-width:170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; }
.text-muted-sm { color:var(--ink-500); font-size:0.83rem; }
.ord-time { font-size:0.82rem; font-weight:600; color:var(--ink-700); font-variant-numeric:tabular-nums; white-space:nowrap; }

.chip { display:inline-block; font-size:0.68rem; font-weight:600; padding:0.22rem 0.6rem; border-radius:3px; white-space:nowrap; }
.chip-sede { background:var(--surface); color:var(--ink-700); border:1px solid var(--line); }

.empty-row { padding:2.5rem; text-align:center; color:var(--ink-500); font-size:0.88rem; }

.btn-pdf { display:inline-flex; align-items:center; justify-content:center; width:2rem; height:2rem; background:rgba(196,69,54,0.1); color:var(--danger); border:1px solid rgba(196,69,54,0.2); border-radius:0.375rem; font-size:0.78rem; cursor:pointer; transition:background 0.14s,transform 0.14s; }
.btn-pdf:hover:not(:disabled) { background:var(--danger); color:#fff; transform:scale(1.08); }
.btn-pdf:disabled { opacity:0.6; cursor:not-allowed; }
</style>
