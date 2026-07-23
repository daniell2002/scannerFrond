<template>
  <section class="py-4 py-lg-5">
    <div class="container-lg">

      <!-- Cabecera -->
      <div class="est-header mb-4">
        <div class="est-header-icon"><i class="fas fa-chart-bar"></i></div>
        <div>
          <h2 class="est-title">Estadísticas</h2>
          <p class="est-sub">{{ new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) }}</p>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(66,130,194,0.1);color:var(--accent)">
            <i class="fas fa-layer-group"></i>
          </div>
          <div>
            <p class="kpi-label">Órdenes hoy</p>
            <p class="kpi-value">{{ kpis.hoy }}</p>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(66,130,194,0.1);color:var(--accent)">
            <i class="fas fa-qrcode"></i>
          </div>
          <div>
            <p class="kpi-label">Escaneadas hoy</p>
            <p class="kpi-value">{{ kpis.escaneadas }}</p>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(66,130,194,0.06);color:var(--ink-500)">
            <i class="fas fa-archive"></i>
          </div>
          <div>
            <p class="kpi-label">En historial</p>
            <p class="kpi-value">{{ kpis.historial }}</p>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:rgba(54,80,108,0.1);color:var(--ink-700)">
            <i class="fas fa-database"></i>
          </div>
          <div>
            <p class="kpi-label">Total general</p>
            <p class="kpi-value">{{ kpis.total }}</p>
          </div>
        </div>
      </div>

      <div class="charts-grid mb-4">

        <!-- Escaneo del día -->
        <div class="e-card">
          <div class="e-card-head">
            <div class="e-card-icon"><i class="fas fa-qrcode"></i></div>
            <div>
              <p class="e-card-title">Cobertura de escaneo</p>
              <p class="e-card-sub">Órdenes escaneadas vs total del día</p>
            </div>
          </div>
          <div class="scan-ring-wrap">
            <div class="ring-container">
              <svg viewBox="0 0 120 120" class="ring-svg">
                <circle cx="60" cy="60" r="46" class="ring-bg"/>
                <circle cx="60" cy="60" r="46" class="ring-fg"
                  :stroke-dasharray="`${scanPct * 2.89} 289`"/>
              </svg>
              <div class="ring-label">
                <span class="ring-num">{{ scanPct }}</span>
                <span class="ring-pct">%</span>
              </div>
            </div>
          </div>
          <div class="scan-row">
            <div class="scan-item">
              <span class="scan-n" style="color:var(--accent)">{{ kpis.escaneadas }}</span>
              <span class="scan-l">escaneadas</span>
            </div>
            <div class="scan-sep"></div>
            <div class="scan-item">
              <span class="scan-n" style="color:var(--ink-500)">{{ kpis.hoy - kpis.escaneadas }}</span>
              <span class="scan-l">sin escanear</span>
            </div>
          </div>
        </div>

        <!-- Órdenes hoy por sede -->
        <div class="e-card">
          <div class="e-card-head">
            <div class="e-card-icon"><i class="fas fa-building"></i></div>
            <div>
              <p class="e-card-title">Órdenes del día por sede</p>
              <p class="e-card-sub">Distribución de órdenes de hoy</p>
            </div>
          </div>
          <div v-if="!sedeHoy.length" class="empty-msg">Sin órdenes hoy.</div>
          <div v-else class="bar-list">
            <div class="bar-row" v-for="s in sedeHoy" :key="s.name">
              <div class="bar-top">
                <span class="bar-label">{{ s.name }}</span>
                <div class="bar-right">
                  <span class="bar-scan-badge" v-if="s.escaneadas">
                    <i class="fas fa-qrcode"></i> {{ s.escaneadas }}
                  </span>
                  <span class="bar-count">{{ s.total }}</span>
                </div>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${(s.total / maxSede) * 100}%` }"></div>
                <div class="bar-fill-scan" :style="{ width: `${(s.escaneadas / maxSede) * 100}%` }"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Segunda fila: historial -->
      <div class="charts-grid">

        <!-- Historial por día -->
        <div class="e-card">
          <div class="e-card-head">
            <div class="e-card-icon"><i class="fas fa-calendar-alt"></i></div>
            <div>
              <p class="e-card-title">Historial por día</p>
              <p class="e-card-sub">Órdenes de días anteriores</p>
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
                <div class="bar-fill" :style="{ width: `${(d.count / maxDay) * 100}%`, background: 'var(--ink-500)' }"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Historial por sede -->
        <div class="e-card">
          <div class="e-card-head">
            <div class="e-card-icon"><i class="fas fa-building"></i></div>
            <div>
              <p class="e-card-title">Historial por sede</p>
              <p class="e-card-sub">Órdenes anteriores por sede</p>
            </div>
          </div>
          <div v-if="!sedeHist.length" class="empty-msg">Sin historial aún.</div>
          <div v-else class="bar-list">
            <div class="bar-row" v-for="s in sedeHist" :key="s.name">
              <div class="bar-top">
                <span class="bar-label">{{ s.name }}</span>
                <span class="bar-count">{{ s.total }}</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: `${(s.total / maxHist) * 100}%`, background: 'var(--success)' }"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useOrdersStore } from '../stores/orders'

const store = useOrdersStore()
const { orders, todayOrders, historicalOrders } = storeToRefs(store)

/* KPIs */
const kpis = computed(() => ({
  hoy:        todayOrders.value.length,
  escaneadas: todayOrders.value.filter(o => o.scanCount > 0).length,
  historial:  historicalOrders.value.length,
  total:      orders.value.length,
}))

/* Órdenes hoy por sede */
const sedeHoy = computed(() => {
  const map = {}
  todayOrders.value.forEach(o => {
    if (!map[o.sede]) map[o.sede] = { name: o.sedeInfo.name, total: 0, escaneadas: 0 }
    map[o.sede].total++
    if (o.scanCount > 0) map[o.sede].escaneadas++
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
})
const maxSede = computed(() => Math.max(...sedeHoy.value.map(s => s.total), 1))

/* Historial por sede */
const sedeHist = computed(() => {
  const map = {}
  historicalOrders.value.forEach(o => {
    if (!map[o.sede]) map[o.sede] = { name: o.sedeInfo.name, total: 0 }
    map[o.sede].total++
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
})
const maxHist = computed(() => Math.max(...sedeHist.value.map(s => s.total), 1))

/* Escaneadas vs sin escanear (hoy) */
const scanPct = computed(() => {
  if (!kpis.value.hoy) return 0
  return Math.round((kpis.value.escaneadas / kpis.value.hoy) * 100)
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
/* Cabecera */
.est-header {
  display:flex; align-items:center; gap:1rem;
  background:var(--paper); border:1px solid var(--line);
  border-radius:0.375rem; padding:1.25rem 1.5rem; box-shadow:var(--shadow-sm);
}
.est-header-icon {
  width:2.75rem; height:2.75rem; min-width:2.75rem;
  background:var(--accent); border-radius:0.375rem;
  display:grid; place-items:center; color:#fff; font-size:1rem;
}
.est-title { font-family:var(--font-display); font-size:1.15rem; font-weight:700; margin:0 0 0.2rem; color:var(--ink-900); }
.est-sub   { font-size:0.8rem; color:var(--ink-500); margin:0; text-transform:capitalize; }

/* KPIs */
.kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:0.875rem; }
@media (max-width:767px) { .kpi-grid { grid-template-columns:repeat(2,1fr); } }

.kpi-card {
  background:var(--paper); border:1px solid var(--line);
  border-radius:0.375rem; padding:1.1rem 1.25rem;
  box-shadow:var(--shadow-sm); display:flex; align-items:center; gap:0.875rem;
}
.kpi-icon { width:2.5rem; height:2.5rem; min-width:2.5rem; border-radius:0.375rem; display:grid; place-items:center; font-size:1rem; }
.kpi-label { font-size:0.65rem; text-transform:uppercase; letter-spacing:0.08rem; color:var(--ink-500); margin:0 0 0.2rem; }
.kpi-value { font-family:var(--font-display); font-size:1.75rem; font-weight:700; color:var(--ink-900); margin:0; line-height:1; }

/* Charts grid */
.charts-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.875rem; }
@media (max-width:767px) { .charts-grid { grid-template-columns:1fr; } }

/* Card */
.e-card { background:var(--paper); border:1px solid var(--line); border-radius:0.375rem; padding:1.25rem; box-shadow:var(--shadow-sm); }
.e-card-head { display:flex; align-items:center; gap:0.75rem; margin-bottom:1.25rem; }
.e-card-icon { width:2rem; height:2rem; min-width:2rem; background:var(--accent); border-radius:3px; display:grid; place-items:center; color:#fff; font-size:0.8rem; }
.e-card-title { font-family:var(--font-display); font-size:0.9rem; font-weight:700; margin:0 0 0.1rem; color:var(--ink-900); }
.e-card-sub   { font-size:0.75rem; color:var(--ink-500); margin:0; }

.empty-msg { font-size:0.85rem; color:var(--ink-500); text-align:center; padding:2rem 0; }

/* Ring */
.scan-ring-wrap { display:flex; justify-content:center; margin-bottom:1.25rem; }
.ring-container { position:relative; width:120px; height:120px; }
.ring-svg { width:100%; height:100%; transform:rotate(-90deg); }
.ring-bg  { fill:none; stroke:var(--surface-2); stroke-width:10; }
.ring-fg  { fill:none; stroke:var(--accent); stroke-width:10; stroke-linecap:butt; transition:stroke-dasharray 0.6s ease; }
.ring-label { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:1px; }
.ring-num { font-family:var(--font-display); font-size:1.8rem; font-weight:700; color:var(--ink-900); }
.ring-pct { font-size:0.85rem; color:var(--ink-500); align-self:flex-end; margin-bottom:0.25rem; }

.scan-row { display:flex; align-items:center; gap:0; }
.scan-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.1rem; }
.scan-sep  { width:1px; height:2rem; background:var(--line); flex-shrink:0; }
.scan-n    { font-family:var(--font-display); font-size:1.25rem; font-weight:700; }
.scan-l    { font-size:0.6rem; text-transform:uppercase; letter-spacing:0.08rem; color:var(--ink-500); }

/* Bars */
.bar-list { display:flex; flex-direction:column; gap:0.875rem; }
.bar-row  { display:flex; flex-direction:column; gap:0.35rem; }
.bar-top  { display:flex; justify-content:space-between; align-items:center; }
.bar-label { font-size:0.82rem; font-weight:500; color:var(--ink-900); }
.bar-right { display:flex; align-items:center; gap:0.4rem; }
.bar-count { font-size:0.75rem; font-weight:700; color:var(--ink-500); background:var(--surface); border:1px solid var(--line); padding:0.05rem 0.4rem; border-radius:3px; }
.bar-scan-badge { font-size:0.65rem; font-weight:600; background:rgba(66,130,194,0.1); color:var(--accent); border:1px solid rgba(66,130,194,0.2); padding:0.05rem 0.4rem; border-radius:3px; }

.bar-track { position:relative; height:8px; background:var(--surface-2); border-radius:2px; overflow:hidden; }
.bar-fill  { position:absolute; top:0; left:0; height:100%; background:var(--accent); border-radius:2px; transition:width 0.5s ease; }
.bar-fill-scan { position:absolute; top:0; left:0; height:100%; background:rgba(66,130,194,0.35); border-radius:2px; transition:width 0.5s ease; }
</style>
