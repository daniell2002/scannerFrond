<template>
  <!-- El operario tiene su propio inicio, centrado en su trabajo del día -->
  <OperarioHome v-if="auth.user?.role === 'operario'" />

  <div v-else class="page-wrap">

    <PageHeader
      :title="`Hola, ${firstName}`"
      :subtitle="hoy"
    >
      <template v-if="auth.hasPermission('scanner')" #action>
        <RouterLink to="/scanner" class="btn-add"><i class="fas fa-plus"></i>Registrar orden</RouterLink>
      </template>
    </PageHeader>

    <!-- Indicadores -->
    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-head"><span class="kpi-label">Órdenes hoy</span><i class="fas fa-layer-group kpi-icon"></i></div>
        <span class="kpi-value">{{ todayOrders.length }}</span>
        <span class="kpi-foot">
          <template v-if="trend !== null">
            <span class="kpi-trend" :class="trend >= 0 ? 'is-up' : 'is-down'">
              <i class="fas" :class="trend >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'"></i> {{ Math.abs(trend) }}
            </span>
            frente a ayer ({{ yesterdayCount }})
          </template>
          <template v-else>Sin registros ayer</template>
        </span>
      </div>
      <div class="kpi">
        <div class="kpi-head"><span class="kpi-label">Pendientes de revisión</span><i class="fas fa-hourglass-half kpi-icon"></i></div>
        <span class="kpi-value" :class="{ 'is-warn': pendingCount }">{{ pendingCount }}</span>
        <span class="kpi-foot">{{ pendingCount ? 'Órdenes sin revisar por el admin' : 'Todo revisado' }}</span>
      </div>
      <div class="kpi">
        <div class="kpi-head"><span class="kpi-label">Esta semana</span><i class="fas fa-calendar-week kpi-icon"></i></div>
        <span class="kpi-value">{{ weekCount }}</span>
        <span class="kpi-foot">Desde el lunes</span>
      </div>
      <div class="kpi">
        <div class="kpi-head"><span class="kpi-label">Órdenes totales</span><i class="fas fa-database kpi-icon"></i></div>
        <span class="kpi-value">{{ orders.length }}</span>
        <span class="kpi-foot">En {{ sedes.length }} {{ sedes.length === 1 ? 'sede' : 'sedes' }}</span>
      </div>
    </div>

    <div class="dash-grid">

      <!-- Últimas órdenes de hoy -->
      <section class="panel">
        <header class="panel-head">
          <div>
            <h2 class="panel-title">Últimas órdenes de hoy</h2>
            <p class="panel-sub">Las 6 más recientes</p>
          </div>
          <RouterLink v-if="auth.hasPermission('ordenes')" to="/ordenes" class="panel-link">
            Ver todas <i class="fas fa-arrow-right ms-1"></i>
          </RouterLink>
        </header>
        <div v-if="!recentOrders.length" class="table-empty">
          <i class="fas fa-inbox"></i>
          <p>Aún no hay órdenes registradas hoy.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Cliente</th>
                <th>Sede</th>
                <th>Responsable</th>
                <th class="text-end">Hora</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in recentOrders" :key="o.code" class="is-clickable" @click="openOrder(o.code)">
                <td><span class="code-tag">{{ o.code }}</span></td>
                <td class="cell-bold">{{ o.product }}</td>
                <td>{{ o.sedeInfo.name }}</td>
                <td>{{ o.operator }}</td>
                <td class="text-end cell-muted">{{ fmtTime(o.scannedAt || o.scheduledAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="dash-side">
        <!-- Accesos rápidos -->
        <section class="panel">
          <header class="panel-head"><h2 class="panel-title">Accesos rápidos</h2></header>
          <nav class="quick-list">
            <RouterLink v-for="q in quickLinks" :key="q.to" :to="q.to" class="quick-item">
              <span class="quick-icon"><i class="fas" :class="q.icon"></i></span>
              <span class="quick-text">
                <span class="quick-title">{{ q.title }}</span>
                <span class="quick-sub">{{ q.sub }}</span>
              </span>
              <i class="fas fa-chevron-right quick-arrow"></i>
            </RouterLink>
          </nav>
        </section>

        <!-- Hoy por sede -->
        <section class="panel">
          <header class="panel-head"><h2 class="panel-title">Hoy por sede</h2></header>
          <div class="panel-body">
            <p v-if="!bySede.length" class="side-empty">Sin órdenes hoy.</p>
            <div v-for="s in bySede" :key="s.code" class="sede-bar">
              <div class="sede-bar-row">
                <span class="sede-bar-name"><span class="sede-dot" :style="{ background: s.color }"></span>{{ s.name }}</span>
                <span class="sede-bar-val">{{ s.count }}</span>
              </div>
              <div class="sede-bar-track"><span :style="{ width: `${s.pct}%`, background: s.color }"></span></div>
            </div>
          </div>
        </section>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
import PageHeader from '../components/PageHeader.vue'
import OperarioHome from '../components/OperarioHome.vue'

const ordersStore = useOrdersStore()
const auth        = useAuthStore()
const router      = useRouter()
const { todayOrders, orders, sedes } = storeToRefs(ordersStore)

onMounted(() => { if (auth.user?.role !== 'operario') ordersStore.fetchOrders() })

const firstName = computed(() => (auth.user?.name || 'usuario').split(' ')[0])

const dateOf = (o) => new Date(o.scannedAt || o.scheduledAt)
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

const yesterdayCount = computed(() => {
  const today = startOfDay(new Date())
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  return orders.value.filter(o => { const d = dateOf(o); return d >= yesterday && d < today }).length
})
const trend = computed(() => yesterdayCount.value ? todayOrders.value.length - yesterdayCount.value : null)

const weekCount = computed(() => {
  const monday = startOfDay(new Date())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return orders.value.filter(o => dateOf(o) >= monday).length
})

const pendingCount = computed(() => orders.value.filter(o => o.pendingReview).length)

const recentOrders = computed(() =>
  [...todayOrders.value].sort((a, b) => dateOf(b) - dateOf(a)).slice(0, 6)
)

const openOrder = (code) => { if (auth.hasPermission('ordenes')) router.push(`/orden/${code}`) }

const QUICK = [
  { key: 'scanner',      to: '/scanner',      icon: 'fa-qrcode',            title: 'Registrar orden',  sub: 'Escanear una orden nueva' },
  { key: 'ordenes',      to: '/ordenes',      icon: 'fa-layer-group',       title: 'Órdenes del día',  sub: 'Ver y filtrar las de hoy' },
  { key: 'historial',    to: '/historial',    icon: 'fa-clock-rotate-left', title: 'Historial',        sub: 'Órdenes anteriores' },
  { key: 'estadisticas', to: '/estadisticas', icon: 'fa-chart-column',      title: 'Estadísticas',     sub: 'Indicadores por sede' },
]
const quickLinks = computed(() => QUICK.filter(q => auth.hasPermission(q.key)))

/* Color por sede: mismo criterio que el resto de vistas */
const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)',
                'var(--series-5)', 'var(--series-6)', 'var(--series-7)', 'var(--series-8)']
const bySede = computed(() => {
  const counts = {}
  todayOrders.value.forEach(o => { counts[o.sede] = (counts[o.sede] || 0) + 1 })
  const max = Math.max(1, ...Object.values(counts))
  return sedes.value
    .map((s, i) => ({ code: s.code, name: s.name, count: counts[s.code] || 0, color: SERIES[i % SERIES.length] }))
    .filter(s => s.count)
    .sort((a, b) => b.count - a.count)
    .map(s => ({ ...s, pct: Math.round((s.count / max) * 100) }))
})

const fmtTime = (iso) => iso
  ? new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  : '—'

const hoy = new Date().toLocaleDateString('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})
</script>

<style scoped>
.dash-grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 1rem; align-items: start; }
@media (max-width: 1099.98px) { .dash-grid { grid-template-columns: 1fr; } }
.dash-side { display: flex; flex-direction: column; gap: 1rem; }

.is-clickable { cursor: pointer; }

.quick-list { padding: 0.4rem; }
.quick-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0.65rem; border-radius: 0.55rem;
  transition: background 0.12s;
}
.quick-item:hover { background: var(--surface); }
.quick-icon {
  width: 2.1rem; height: 2.1rem; min-width: 2.1rem;
  display: grid; place-items: center;
  border-radius: 0.5rem; border: 1px solid var(--line);
  color: var(--ink-700); font-size: 0.85rem;
  background: var(--paper);
}
.quick-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.quick-title { font-size: 0.86rem; font-weight: 600; color: var(--ink-900); }
.quick-sub { font-size: 0.76rem; color: var(--ink-500); }
.quick-arrow { font-size: 0.65rem; color: var(--ink-400); transition: transform 0.14s; }
.quick-item:hover .quick-arrow { transform: translateX(2px); color: var(--ink-700); }

.side-empty { margin: 0; font-size: 0.84rem; color: var(--ink-500); }
.sede-bar + .sede-bar { margin-top: 0.85rem; }
.sede-bar-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; font-size: 0.84rem; }
.sede-bar-name { display: inline-flex; align-items: center; gap: 0.45rem; color: var(--ink-700); font-weight: 500; }
.sede-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; }
.sede-bar-val { font-weight: 600; color: var(--ink-900); font-variant-numeric: tabular-nums; }
.sede-bar-track { height: 6px; border-radius: 999px; background: var(--surface); overflow: hidden; }
.sede-bar-track span { display: block; height: 100%; border-radius: 999px; transition: width 0.4s ease; }
</style>
