<template>
  <div class="page-wrap">

      <!-- Cabecera -->
      <PageHeader
        :breadcrumb="['Conexa', 'Estadísticas']"
        icon="fa-chart-bar"
        title="Estadísticas"
        :subtitle="new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' })"
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
            <div class="metric-icon" style="background:rgba(196,69,54,0.1);color:var(--danger)">
              <i class="fas fa-bell"></i>
            </div>
            <div>
              <p class="metric-label mb-1">Por revisar</p>
              <p class="metric-value mb-0">{{ kpis.porRevisar }}</p>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="metric-card p-3 d-flex align-items-center gap-3">
            <div class="metric-icon" style="background:rgba(227,73,72,0.1);color:var(--series-8)">
              <i class="fas fa-archive"></i>
            </div>
            <div>
              <p class="metric-label mb-1">En historial</p>
              <p class="metric-value mb-0">{{ kpis.historial }}</p>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="metric-card p-3 d-flex align-items-center gap-3">
            <div class="metric-icon" style="background:rgba(237,161,0,0.12);color:var(--series-4)">
              <i class="fas fa-database"></i>
            </div>
            <div>
              <p class="metric-label mb-1">Total general</p>
              <p class="metric-value mb-0">{{ kpis.total }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">

        <!-- Escaneo del día -->
        <div class="col-12 col-md-6">
          <div class="chart-card">
            <div class="chart-card-head">
              <span class="chart-card-icon"><i class="fas fa-clipboard-check"></i></span>
              <div>
                <p class="e-card-title mb-0">Revisión del día</p>
                <p class="e-card-sub mb-0">Órdenes de hoy revisadas por el administrador</p>
              </div>
            </div>
            <div class="scan-ring-wrap">
              <div class="ring-container">
                <svg viewBox="0 0 120 120" class="ring-svg">
                  <circle cx="60" cy="60" r="46" class="ring-bg"/>
                  <circle cx="60" cy="60" r="46" class="ring-fg"
                    :stroke-dasharray="`${reviewPct * 2.89} 289`"/>
                </svg>
                <div class="ring-label">
                  <span class="ring-num">{{ reviewPct }}</span>
                  <span class="ring-pct">%</span>
                </div>
              </div>
            </div>
            <div class="scan-row">
              <div class="scan-item">
                <span class="scan-n" style="color:var(--success)">{{ kpis.revisadas }}</span>
                <span class="scan-l">revisadas</span>
              </div>
              <div class="scan-sep"></div>
              <div class="scan-item">
                <span class="scan-n" style="color:var(--danger)">{{ kpis.porRevisar }}</span>
                <span class="scan-l">por revisar</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Órdenes hoy por sede -->
        <div class="col-12 col-md-6">
          <div class="chart-card">
            <div class="chart-card-head">
              <span class="chart-card-icon"><i class="fas fa-building"></i></span>
              <div>
                <p class="e-card-title mb-0">Órdenes del día por sede</p>
                <p class="e-card-sub mb-0">Distribución de órdenes de hoy · <i class="fas fa-bell"></i> por revisar</p>
              </div>
            </div>
            <div v-if="!sedeHoy.length" class="empty-msg">Sin órdenes hoy.</div>
            <div v-else class="bar-list">
              <div class="bar-row" v-for="s in sedeHoy" :key="s.name">
                <div class="bar-top">
                  <span class="bar-label"><span class="bar-dot" :style="{ background: sedeColor(s.code) }"></span>{{ s.name }}</span>
                  <div class="bar-right">
                    <span class="bar-scan-badge" v-if="s.porRevisar" :title="`${s.porRevisar} por revisar`">
                      <i class="fas fa-bell"></i> {{ s.porRevisar }}
                    </span>
                    <span class="bar-count">{{ s.total }}</span>
                  </div>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: `${(s.total / maxSede) * 100}%`, background: sedeColor(s.code) }"></div>
                  <div class="bar-fill-scan" :style="{ width: `${(s.revisadas / maxSede) * 100}%` }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Segunda fila: historial -->
      <div class="row g-3">

        <!-- Historial por día -->
        <div class="col-12 col-md-6">
          <div class="chart-card">
            <div class="chart-card-head">
              <span class="chart-card-icon"><i class="fas fa-calendar-alt"></i></span>
              <div>
                <p class="e-card-title mb-0">Historial por día</p>
                <p class="e-card-sub mb-0">Órdenes de días anteriores</p>
              </div>
            </div>
            <div v-if="!histByDay.length" class="empty-msg">Sin historial aún.</div>
            <div v-else class="bar-list">
              <div class="bar-row" v-for="d in histByDay" :key="d.day">
                <div class="bar-top">
                  <span class="bar-label">{{ d.day }}</span>
                  <span class="bar-count">{{ d.count }}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: `${(d.count / maxDay) * 100}%`, background: 'var(--series-1)' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Historial por sede -->
        <div class="col-12 col-md-6">
          <div class="chart-card">
            <div class="chart-card-head">
              <span class="chart-card-icon"><i class="fas fa-building"></i></span>
              <div>
                <p class="e-card-title mb-0">Historial por sede</p>
                <p class="e-card-sub mb-0">Órdenes anteriores por sede</p>
              </div>
            </div>
            <div v-if="!sedeHist.length" class="empty-msg">Sin historial aún.</div>
            <div v-else class="bar-list">
              <div class="bar-row" v-for="s in sedeHist" :key="s.name">
                <div class="bar-top">
                  <span class="bar-label"><span class="bar-dot" :style="{ background: sedeColor(s.code) }"></span>{{ s.name }}</span>
                  <span class="bar-count">{{ s.total }}</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" :style="{ width: `${(s.total / maxHist) * 100}%`, background: sedeColor(s.code) }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useOrdersStore } from '../stores/orders'
import PageHeader from '../components/PageHeader.vue'

const store = useOrdersStore()
const { orders, todayOrders, historicalOrders, sedes } = storeToRefs(store)

/* KPIs */
const kpis = computed(() => ({
  hoy:        todayOrders.value.length,
  porRevisar: todayOrders.value.filter(o => o.pendingReview).length,
  revisadas:  todayOrders.value.filter(o => !o.pendingReview).length,
  historial:  historicalOrders.value.length,
  total:      orders.value.length,
}))

/* Órdenes hoy por sede */
const sedeHoy = computed(() => {
  const map = {}
  todayOrders.value.forEach(o => {
    if (!map[o.sede]) map[o.sede] = { code: o.sede, name: o.sedeInfo.name, total: 0, revisadas: 0, porRevisar: 0 }
    map[o.sede].total++
    o.pendingReview ? map[o.sede].porRevisar++ : map[o.sede].revisadas++
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
})
const maxSede = computed(() => Math.max(...sedeHoy.value.map(s => s.total), 1))

/* Historial por sede */
const sedeHist = computed(() => {
  const map = {}
  historicalOrders.value.forEach(o => {
    if (!map[o.sede]) map[o.sede] = { code: o.sede, name: o.sedeInfo.name, total: 0 }
    map[o.sede].total++
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
})
const maxHist = computed(() => Math.max(...sedeHist.value.map(s => s.total), 1))

/* Color por sede: orden fijo (no depende del ranking) para que cada sede
   conserve siempre el mismo color entre gráficos y al reordenar/filtrar. */
const SERIES = ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)',
                 'var(--series-5)', 'var(--series-6)', 'var(--series-7)', 'var(--series-8)']
const sedeColor = (code) => {
  const idx = sedes.value.findIndex(s => s.code === code)
  return SERIES[idx >= 0 ? idx % SERIES.length : 0]
}

/* Revisadas vs por revisar (hoy) */
const reviewPct = computed(() => {
  if (!kpis.value.hoy) return 0
  return Math.round((kpis.value.revisadas / kpis.value.hoy) * 100)
})

/* Órdenes historial agrupadas por fecha */
const histByDay = computed(() => {
  const map = {}
  historicalOrders.value.forEach(o => {
    const day = new Date(o.scheduledAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    if (!map[day]) map[day] = 0
    map[day]++
  })
  return Object.entries(map).map(([day, count]) => ({ day, count }))
})
const maxDay = computed(() => Math.max(...histByDay.value.map(d => d.count), 1))
</script>

<style scoped>
/* Page shell (reemplaza container-lg + py-3 py-lg-4 de Bootstrap) */
.page-wrap { padding: 1rem 1rem 2rem; max-width: 1200px; margin: 0 auto; width: 100%; }

/* Cabecera */
.est-title { font-family:var(--font-display); font-weight:700; }

/* Chart card (reemplaza v-card + v-card-item) */
.chart-card {
  height: 100%;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 0.65rem;
  box-shadow: var(--shadow-sm);
  padding: 1.25rem;
}
.chart-card-head { display:flex; align-items:center; gap:0.75rem; margin-bottom:1.1rem; }
.chart-card-icon {
  width:38px; height:38px; min-width:38px;
  display:grid; place-items:center;
  border-radius:0.5rem;
  background:var(--accent); color:#fff; font-size:0.85rem;
}
.e-card-title { font-family:var(--font-display); font-weight:700; }
.e-card-sub   { font-size:0.75rem; color:var(--ink-500); }

.empty-msg { font-size:0.85rem; color:var(--ink-500); text-align:center; padding:2rem 0; }

/* Ring */
.scan-ring-wrap { display:flex; justify-content:center; margin-bottom:1.25rem; }
.ring-container { position:relative; width:130px; height:130px; }
.ring-svg { width:100%; height:100%; transform:rotate(-90deg); }
.ring-bg  { fill:none; stroke:var(--surface-2); stroke-width:10; }
.ring-fg  { fill:none; stroke:var(--success); stroke-width:10; stroke-linecap:round; transition:stroke-dasharray 0.6s ease; }
.ring-label { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:1px; }
.ring-num { font-family:var(--font-display); font-size:1.9rem; font-weight:700; color:var(--ink-900); }
.ring-pct { font-size:0.85rem; color:var(--ink-500); align-self:flex-end; margin-bottom:0.25rem; }

.scan-row { display:flex; align-items:center; }
.scan-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.1rem; }
.scan-sep  { width:1px; height:2rem; background:var(--line); flex-shrink:0; }
.scan-n    { font-family:var(--font-display); font-size:1.3rem; font-weight:700; }
.scan-l    { font-size:0.6rem; text-transform:uppercase; letter-spacing:0.08rem; color:var(--ink-500); }

/* Bars */
.bar-list { display:flex; flex-direction:column; gap:1rem; }
.bar-row  { display:flex; flex-direction:column; gap:0.4rem; }
.bar-top  { display:flex; justify-content:space-between; align-items:center; }
.bar-label { display:inline-flex; align-items:center; gap:0.5rem; font-size:0.83rem; font-weight:500; color:var(--ink-900); }
.bar-dot   { width:0.55rem; height:0.55rem; min-width:0.55rem; border-radius:50%; }
.bar-right { display:flex; align-items:center; gap:0.4rem; }
.bar-count { font-size:0.72rem; font-weight:700; color:var(--ink-500); background:var(--surface); border:1px solid var(--line); padding:0.1rem 0.5rem; border-radius:0.4rem; }
.bar-scan-badge { font-size:0.65rem; font-weight:600; background:rgba(46,139,87,0.12); color:var(--success); border:1px solid rgba(46,139,87,0.25); padding:0.1rem 0.5rem; border-radius:0.4rem; }

.bar-track { position:relative; height:7px; background:var(--surface-2); border-radius:999px; overflow:hidden; }
.bar-fill  { position:absolute; top:0; left:0; height:100%; background:var(--accent); border-radius:999px; transition:width 0.5s ease, background 0.2s ease; }
.bar-fill-scan { position:absolute; top:0; left:0; height:100%; background:rgba(255,255,255,0.45); border-radius:999px; transition:width 0.5s ease; }
</style>
