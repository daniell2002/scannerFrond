<template>
  <div class="page-wrap">

    <PageHeader
      :breadcrumb="['Conexa', 'Dashboard']"
      icon="fa-th-large"
      title="Dashboard"
      :subtitle="`Bienvenido, ${auth.user?.name || 'usuario'} · ${hoy}`"
    />

    <!-- KPIs -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="metric-card p-3 d-flex align-items-center gap-3">
          <div class="metric-icon" style="background:rgba(42,120,214,0.1);color:var(--accent)">
            <i class="fas fa-layer-group"></i>
          </div>
          <div>
            <p class="metric-label mb-1">Órdenes hoy</p>
            <p class="metric-value mb-0">{{ kpis.hoy }}</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="metric-card p-3 d-flex align-items-center gap-3">
          <div class="metric-icon" style="background:rgba(46,139,87,0.12);color:var(--success)">
            <i class="fas fa-qrcode"></i>
          </div>
          <div>
            <p class="metric-label mb-1">Escaneadas hoy</p>
            <p class="metric-value mb-0">{{ kpis.escaneadas }}</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="metric-card p-3 d-flex align-items-center gap-3">
          <div class="metric-icon" style="background:rgba(227,73,72,0.1);color:var(--series-8)">
            <i class="fas fa-building"></i>
          </div>
          <div>
            <p class="metric-label mb-1">Sedes registradas</p>
            <p class="metric-value mb-0">{{ sedes.length }}</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="metric-card p-3 d-flex align-items-center gap-3">
          <div class="metric-icon" style="background:rgba(237,161,0,0.12);color:var(--series-4)">
            <i class="fas fa-database"></i>
          </div>
          <div>
            <p class="metric-label mb-1">Órdenes totales</p>
            <p class="metric-value mb-0">{{ orders.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Accesos rápidos -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-4">
        <RouterLink to="/scanner" class="quick-card">
          <span class="quick-icon"><i class="fas fa-qrcode"></i></span>
          <div>
            <p class="quick-title">Registrar orden</p>
            <p class="quick-sub">Escanear y cargar una nueva orden</p>
          </div>
        </RouterLink>
      </div>
      <div class="col-12 col-sm-4">
        <RouterLink to="/ordenes" class="quick-card">
          <span class="quick-icon"><i class="fas fa-layer-group"></i></span>
          <div>
            <p class="quick-title">Órdenes del día</p>
            <p class="quick-sub">Ver y filtrar las órdenes de hoy</p>
          </div>
        </RouterLink>
      </div>
      <div class="col-12 col-sm-4">
        <RouterLink to="/historial" class="quick-card">
          <span class="quick-icon"><i class="fas fa-history"></i></span>
          <div>
            <p class="quick-title">Historial</p>
            <p class="quick-sub">Consultar órdenes anteriores</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Últimas órdenes de hoy -->
    <div class="table-card">
      <div class="table-card-head">
        <span class="table-card-head-title"><i class="fas fa-clock"></i>Últimas órdenes de hoy</span>
        <RouterLink to="/ordenes" class="table-card-link">Ver todas</RouterLink>
      </div>
      <div v-if="!recentOrders.length" class="table-empty">
        <i class="fas fa-inbox"></i>
        <p>Aún no hay órdenes registradas hoy.</p>
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
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in recentOrders" :key="o.code">
              <td><span class="code-tag">{{ o.code }}</span></td>
              <td class="cell-bold">{{ o.product }}</td>
              <td class="cell-muted">{{ o.sedeInfo.name }}</td>
              <td class="cell-muted">{{ o.operator }}</td>
              <td class="cell-muted">{{ fmtTime(o.scannedAt || o.scheduledAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
import PageHeader from '../components/PageHeader.vue'

const ordersStore = useOrdersStore()
const auth        = useAuthStore()
const { todayOrders, orders, sedes } = storeToRefs(ordersStore)

onMounted(() => ordersStore.fetchOrders())

const kpis = computed(() => ({
  hoy:        todayOrders.value.length,
  escaneadas: todayOrders.value.filter(o => o.scanCount > 0).length,
}))

const recentOrders = computed(() =>
  [...todayOrders.value].sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)).slice(0, 5)
)

const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  : '—'

const hoy = new Date().toLocaleDateString('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long',
})
</script>

<style scoped>
.page-wrap { padding: 1rem 1rem 2rem; max-width: 1200px; margin: 0 auto; width: 100%; }

.quick-card {
  display: flex; align-items: center; gap: 0.75rem;
  height: 100%;
  padding: 1rem 1.1rem;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 0.65rem;
  box-shadow: var(--shadow-sm);
  transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
}
.quick-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent);
}
.quick-icon {
  width: 2.5rem; height: 2.5rem; min-width: 2.5rem;
  display: grid; place-items: center;
  border-radius: 0.5rem;
  background: var(--accent);
  color: #fff;
  font-size: 1rem;
}
.quick-title { font-weight: 600; color: var(--ink-900); margin: 0; }
.quick-sub { font-size: 0.78rem; color: var(--ink-500); margin: 0; }

.table-card-link { font-size: 0.8rem; font-weight: 700; color: var(--accent); }
.table-card-link:hover { color: var(--accent-strong); text-decoration: underline; }
</style>
