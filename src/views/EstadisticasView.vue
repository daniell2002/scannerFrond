<template>
  <div class="page-wrap">

    <PageHeader title="Estadísticas" :subtitle="`Indicadores de producción · ${hoy}`" />

    <!-- Indicadores -->
    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-head"><span class="kpi-label">Órdenes hoy</span><i class="fas fa-layer-group kpi-icon"></i></div>
        <span class="kpi-value">{{ kpis.hoy }}</span>
        <span class="kpi-foot">{{ kpis.revisadas }} revisadas</span>
      </div>
      <div class="kpi">
        <div class="kpi-head"><span class="kpi-label">Por revisar hoy</span><i class="fas fa-hourglass-half kpi-icon"></i></div>
        <span class="kpi-value" :class="{ 'is-warn': kpis.porRevisar }">{{ kpis.porRevisar }}</span>
        <span class="kpi-foot">{{ kpis.porRevisar ? 'Pendientes del administrador' : 'Todo revisado' }}</span>
      </div>
      <div class="kpi">
        <div class="kpi-head"><span class="kpi-label">Promedio diario</span><i class="fas fa-chart-line kpi-icon"></i></div>
        <span class="kpi-value">{{ dailyAvg }}</span>
        <span class="kpi-foot">Últimos 14 días</span>
      </div>
      <div class="kpi">
        <div class="kpi-head"><span class="kpi-label">Total general</span><i class="fas fa-database kpi-icon"></i></div>
        <span class="kpi-value">{{ kpis.total }}</span>
        <span class="kpi-foot">{{ kpis.historial }} en el historial</span>
      </div>
    </div>

    <!-- Órdenes por día (columnas) -->
    <section class="panel mb-3">
      <header class="panel-head">
        <div>
          <h2 class="panel-title">Órdenes por día</h2>
          <p class="panel-sub">Últimos 14 días</p>
        </div>
        <span class="panel-total">{{ last14Total }} órdenes</span>
      </header>
      <div class="panel-body">
        <div class="col-chart" role="img" :aria-label="`Órdenes por día, últimos 14 días: ${last14Total} en total`">
          <div class="col-grid" aria-hidden="true">
            <span v-for="t in yTicks" :key="t" class="col-grid-line" :style="{ bottom: `${(t / yMax) * 100}%` }">
              <span class="col-grid-label">{{ t }}</span>
            </span>
          </div>
          <div class="col-bars">
            <div v-for="d in last14" :key="d.key" class="col-slot" :class="{ 'is-today': d.isToday }" tabindex="0">
              <div class="col-bar" :style="{ height: d.count ? `${(d.count / yMax) * 100}%` : '0' }"></div>
              <div class="col-tip">
                <strong>{{ d.count }} {{ d.count === 1 ? 'orden' : 'órdenes' }}</strong>
                <span>{{ d.long }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-axis" aria-hidden="true">
          <span v-for="d in last14" :key="d.key" :class="{ 'is-today': d.isToday }">{{ d.short }}</span>
        </div>
      </div>
    </section>

    <div class="est-grid">

      <!-- Revisión del día -->
      <section class="panel">
        <header class="panel-head">
          <div>
            <h2 class="panel-title">Revisión del día</h2>
            <p class="panel-sub">Órdenes de hoy revisadas por el administrador</p>
          </div>
        </header>
        <div class="panel-body review">
          <div class="ring-container">
            <svg viewBox="0 0 120 120" class="ring-svg" aria-hidden="true">
              <circle cx="60" cy="60" r="46" class="ring-bg" />
              <circle cx="60" cy="60" r="46" class="ring-fg" :stroke-dasharray="`${reviewPct * 2.89} 289`" />
            </svg>
            <div class="ring-label">
              <span class="ring-num">{{ reviewPct }}<small>%</small></span>
              <span class="ring-cap">revisado</span>
            </div>
          </div>
          <dl class="review-legend">
            <div><dt><span class="legend-dot is-good"></span>Revisadas</dt><dd>{{ kpis.revisadas }}</dd></div>
            <div><dt><span class="legend-dot is-pending"></span>Por revisar</dt><dd>{{ kpis.porRevisar }}</dd></div>
          </dl>
        </div>
      </section>

      <!-- Hoy por sede -->
      <section class="panel">
        <header class="panel-head">
          <div>
            <h2 class="panel-title">Hoy por sede</h2>
            <p class="panel-sub">Distribución de las órdenes de hoy</p>
          </div>
        </header>
        <div class="panel-body">
          <p v-if="!sedeHoy.length" class="empty-msg">Sin órdenes hoy.</p>
          <div v-else class="bar-list">
            <div v-for="s in sedeHoy" :key="s.code" class="bar-row" :title="`${s.name}: ${s.total} (${s.porRevisar} por revisar)`">
              <div class="bar-top">
                <span class="bar-label"><span class="bar-dot" :style="{ background: sedeColor(s.code) }"></span>{{ s.name }}</span>
                <span class="bar-count">
                  {{ s.total }}
                  <span v-if="s.porRevisar" class="bar-pending">· {{ s.porRevisar }} por revisar</span>
                </span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${(s.total / maxSede) * 100}%`, background: sedeColor(s.code) }"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Historial por sede -->
      <section class="panel">
        <header class="panel-head">
          <div>
            <h2 class="panel-title">Historial por sede</h2>
            <p class="panel-sub">Órdenes de días anteriores</p>
          </div>
        </header>
        <div class="panel-body">
          <p v-if="!sedeHist.length" class="empty-msg">Sin historial aún.</p>
          <div v-else class="bar-list">
            <div v-for="s in sedeHist" :key="s.code" class="bar-row" :title="`${s.name}: ${s.total}`">
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
      </section>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useOrdersStore } from '../stores/orders'
import PageHeader from '../components/PageHeader.vue'

const store = useOrdersStore()
const { orders, todayOrders, historicalOrders, sedes } = storeToRefs(store)

// Al entrar directo a esta vista las órdenes aún no estaban cargadas
onMounted(() => store.fetchOrders())

const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/* KPIs */
const kpis = computed(() => ({
  hoy:        todayOrders.value.length,
  porRevisar: todayOrders.value.filter(o => o.pendingReview).length,
  revisadas:  todayOrders.value.filter(o => !o.pendingReview).length,
  historial:  historicalOrders.value.length,
  total:      orders.value.length,
}))

/* Últimos 14 días (incluye días sin órdenes, para que el eje sea continuo) */
const dateOf = (o) => new Date(o.scannedAt || o.scheduledAt)
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

const last14 = computed(() => {
  const counts = {}
  orders.value.forEach(o => { const k = dayKey(dateOf(o)); counts[k] = (counts[k] || 0) + 1 })
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (13 - i))
    const k = dayKey(d)
    return {
      key: k,
      count: counts[k] || 0,
      isToday: i === 13,
      short: i === 13 ? 'Hoy' : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', ''),
      long: d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }),
    }
  })
})
const last14Total = computed(() => last14.value.reduce((s, d) => s + d.count, 0))
const dailyAvg = computed(() => (last14Total.value / 14).toLocaleString('es-CO', { maximumFractionDigits: 1 }))

// Escala "bonita": 4 divisiones con paso entero
const yMax = computed(() => {
  const max = Math.max(...last14.value.map(d => d.count), 1)
  const step = Math.max(1, Math.ceil(max / 4))
  return step * 4
})
const yTicks = computed(() => [0, 1, 2, 3, 4].map(i => (yMax.value / 4) * i))

/* Órdenes hoy por sede */
const sedeHoy = computed(() => {
  const map = {}
  todayOrders.value.forEach(o => {
    if (!map[o.sede]) map[o.sede] = { code: o.sede, name: o.sedeInfo.name, total: 0, porRevisar: 0 }
    map[o.sede].total++
    if (o.pendingReview) map[o.sede].porRevisar++
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
</script>

<style scoped>
.est-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
@media (max-width: 1099.98px) { .est-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 767.98px)  { .est-grid { grid-template-columns: 1fr; } }

.panel-total { font-size: 0.82rem; font-weight: 600; color: var(--ink-700); font-variant-numeric: tabular-nums; }
.empty-msg { margin: 0; padding: 1.5rem 0; text-align: center; font-size: 0.85rem; color: var(--ink-500); }

/* ── Columnas ── */
.col-chart { position: relative; height: 220px; margin-left: 2rem; }
.col-grid { position: absolute; inset: 0; pointer-events: none; }
.col-grid-line { position: absolute; left: 0; right: 0; height: 0; border-top: 1px dashed var(--line); }
.col-grid-line:first-child { border-top-style: solid; border-color: var(--line-strong); }
.col-grid-label {
  position: absolute; right: calc(100% + 0.5rem); top: -0.5rem;
  font-size: 0.7rem; color: var(--ink-400); font-variant-numeric: tabular-nums;
}
.col-bars { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(14, 1fr); gap: 2px; }
.col-slot { position: relative; display: flex; align-items: flex-end; justify-content: center; height: 100%; outline: none; cursor: default; }
.col-slot:hover, .col-slot:focus-visible { background: color-mix(in srgb, var(--surface) 70%, transparent); border-radius: 4px; }
.col-bar {
  width: min(60%, 28px);
  border-radius: 4px 4px 0 0;
  background: color-mix(in srgb, var(--accent) 70%, var(--paper));
  transition: height 0.5s ease, background 0.14s;
}
.col-slot.is-today .col-bar,
.col-slot:hover .col-bar { background: var(--accent); }
.col-tip {
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  display: none; flex-direction: column; align-items: center; gap: 0.1rem;
  padding: 0.4rem 0.6rem; border-radius: 0.45rem; white-space: nowrap; z-index: 2;
  background: var(--ink-900); color: var(--paper);
  font-size: 0.75rem; box-shadow: var(--shadow-md);
}
.col-tip span { opacity: 0.75; }
.col-slot:hover .col-tip, .col-slot:focus-visible .col-tip { display: flex; }
.col-axis {
  display: grid; grid-template-columns: repeat(14, 1fr); gap: 2px;
  margin: 0.5rem 0 0 2rem;
  font-size: 0.68rem; color: var(--ink-500); text-align: center; white-space: nowrap;
}
.col-axis .is-today { color: var(--ink-900); font-weight: 600; }
@media (max-width: 767.98px) { .col-axis span:nth-child(even) { visibility: hidden; } }

/* ── Revisión del día ── */
.review { display: flex; align-items: center; gap: 1.5rem; }
.ring-container { position: relative; width: 132px; height: 132px; flex-shrink: 0; }
.ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring-bg  { fill: none; stroke: var(--surface-2); stroke-width: 10; }
.ring-fg  { fill: none; stroke: var(--success); stroke-width: 10; stroke-linecap: round; transition: stroke-dasharray 0.6s ease; }
.ring-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.ring-num { font-size: 1.6rem; font-weight: 700; color: var(--ink-900); line-height: 1; font-variant-numeric: tabular-nums; }
.ring-num small { font-size: 0.8rem; font-weight: 600; color: var(--ink-500); margin-left: 1px; }
.ring-cap { font-size: 0.7rem; color: var(--ink-500); margin-top: 0.2rem; }

.review-legend { flex: 1; margin: 0; display: flex; flex-direction: column; gap: 0.6rem; }
.review-legend > div { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.6rem; border-bottom: 1px solid var(--line); }
.review-legend > div:last-child { border-bottom: none; padding-bottom: 0; }
.review-legend dt { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.84rem; font-weight: 500; color: var(--ink-700); }
.review-legend dd { margin: 0; font-size: 1rem; font-weight: 700; color: var(--ink-900); font-variant-numeric: tabular-nums; }
.legend-dot { width: 0.55rem; height: 0.55rem; border-radius: 50%; }
.legend-dot.is-good { background: var(--success); }
.legend-dot.is-pending { background: var(--surface-2); border: 1px solid var(--line-strong); }

/* ── Barras por sede ── */
.bar-list { display: flex; flex-direction: column; gap: 0.95rem; }
.bar-row  { display: flex; flex-direction: column; gap: 0.4rem; }
.bar-top  { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.bar-label { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.84rem; font-weight: 500; color: var(--ink-700); }
.bar-dot   { width: 0.55rem; height: 0.55rem; min-width: 0.55rem; border-radius: 50%; }
.bar-count { font-size: 0.84rem; font-weight: 600; color: var(--ink-900); font-variant-numeric: tabular-nums; white-space: nowrap; }
.bar-pending { font-weight: 500; color: var(--warning); font-size: 0.76rem; }
.bar-track { height: 6px; background: var(--surface); border-radius: 999px; overflow: hidden; }
.bar-fill  { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
</style>
