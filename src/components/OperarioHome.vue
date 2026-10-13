<template>
  <div class="page-wrap">

    <PageHeader :title="`Hola, ${firstName}`" :subtitle="`${sedeName} · ${hoy}`" />

    <!-- Acción principal -->
    <RouterLink v-if="canScan" to="/scanner" class="op-cta">
      <span class="op-cta-icon"><i class="fas fa-camera-retro"></i></span>
      <span class="op-cta-text">
        <span class="op-cta-title">Registrar una orden</span>
        <span class="op-cta-sub">Captura el documento con el escáner y el sistema leerá el código.</span>
      </span>
      <i class="fas fa-arrow-right op-cta-arrow"></i>
    </RouterLink>

    <!-- Mis indicadores -->
    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-head"><span class="kpi-label">Registraste hoy</span><i class="fas fa-calendar-day kpi-icon"></i></div>
        <span class="kpi-value">{{ stats.today }}</span>
        <span class="kpi-foot">
          <template v-if="stats.yesterday">Ayer: {{ stats.yesterday }}</template>
          <template v-else>Sin registros ayer</template>
        </span>
      </div>
      <div class="kpi">
        <div class="kpi-head"><span class="kpi-label">Esta semana</span><i class="fas fa-calendar-week kpi-icon"></i></div>
        <span class="kpi-value">{{ stats.week }}</span>
        <span class="kpi-foot">{{ stats.total }} en total</span>
      </div>
      <div class="kpi">
        <div class="kpi-head"><span class="kpi-label">Pendientes de revisión</span><i class="fas fa-hourglass-half kpi-icon"></i></div>
        <span class="kpi-value" :class="{ 'is-warn': stats.pending }">{{ stats.pending }}</span>
        <span class="kpi-foot">{{ stats.pending ? 'Esperando al administrador' : 'Todas revisadas' }}</span>
      </div>
      <RouterLink v-if="canObs" to="/observaciones" class="kpi kpi-link">
        <div class="kpi-head"><span class="kpi-label">Observaciones por atender</span><i class="fas fa-comment-dots kpi-icon"></i></div>
        <span class="kpi-value" :class="{ 'is-bad': feedback.openCount }">{{ feedback.openCount }}</span>
        <span class="kpi-foot">
          <template v-if="feedback.unseen">{{ feedback.unseen }} sin leer · Ver todas</template>
          <template v-else-if="feedback.openCount">Ver observaciones</template>
          <template v-else>Nada pendiente</template>
        </span>
      </RouterLink>
      <div v-else class="kpi">
        <div class="kpi-head"><span class="kpi-label">Total registradas</span><i class="fas fa-database kpi-icon"></i></div>
        <span class="kpi-value">{{ stats.total }}</span>
        <span class="kpi-foot">Desde que usas el sistema</span>
      </div>
    </div>

    <div class="op-grid" :class="{ 'is-single': !canObs }">

      <!-- Mis últimas órdenes -->
      <section class="panel">
        <header class="panel-head">
          <div>
            <h2 class="panel-title">Mis últimas órdenes</h2>
            <p class="panel-sub">Las 8 más recientes que registraste</p>
          </div>
          <RouterLink v-if="auth.hasPermission('historial')" to="/historial" class="panel-link">
            Ver historial <i class="fas fa-arrow-right ms-1"></i>
          </RouterLink>
        </header>
        <div v-if="!recent.length" class="table-empty">
          <i class="fas fa-inbox"></i>
          <p>Aún no has registrado órdenes.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="o in recent" :key="o.code"
                :class="{ 'is-clickable': canOpen }"
                @click="canOpen && router.push(`/orden/${o.code}`)"
              >
                <td><span class="code-tag">{{ o.code }}</span></td>
                <td class="cell-bold">{{ o.product }}</td>
                <td class="cell-muted">{{ fmtWhen(o.scannedAt || o.scheduledAt) }}</td>
                <td><OrderStatus :order="o" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Observaciones abiertas -->
      <section v-if="canObs" class="panel">
        <header class="panel-head">
          <div>
            <h2 class="panel-title">Observaciones por atender</h2>
            <p class="panel-sub">Lo que te señaló el administrador</p>
          </div>
          <RouterLink to="/observaciones" class="panel-link">Ver todas <i class="fas fa-arrow-right ms-1"></i></RouterLink>
        </header>
        <div v-if="!openFeedback.length" class="op-allgood">
          <span class="op-allgood-icon"><i class="fas fa-circle-check"></i></span>
          <p>No tienes observaciones pendientes.</p>
        </div>
        <ul v-else class="op-obs">
          <li v-for="f in openFeedback" :key="f.id">
            <RouterLink to="/observaciones" class="op-obs-item">
              <span class="op-obs-dot" :class="{ 'is-unread': !f.seenAt }"></span>
              <span class="op-obs-body">
                <span class="op-obs-top">
                  <span class="code-tag">{{ f.orderCode }}</span>
                  <span class="op-obs-date">{{ fmtWhen(f.createdAt) }}</span>
                </span>
                <span class="op-obs-text">{{ f.comment }}</span>
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, useRouter } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'
import { useFeedbackStore } from '../stores/feedback'
import { isOwnOrder } from '../utils/ownOrders'
import PageHeader from './PageHeader.vue'
import OrderStatus from './OrderStatus.vue'

const ordersStore = useOrdersStore()
const auth        = useAuthStore()
const feedback    = useFeedbackStore()
const router      = useRouter()
const { orders, sedes } = storeToRefs(ordersStore)

onMounted(() => {
  ordersStore.fetchOrders()
  if (canObs.value) feedback.fetchMine()
})

const canScan = computed(() => auth.hasPermission('scanner'))
const canOpen = computed(() => auth.hasPermission('ordenes'))
const canObs  = computed(() => auth.hasPermission('observaciones'))

const firstName = computed(() => (auth.user?.name || 'operario').split(' ')[0])
const sedeName  = computed(() => sedes.value.find(s => s.code === auth.user?.sede)?.name || auth.user?.sede || 'Sin sede')
const hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

const dateOf = (o) => new Date(o.scannedAt || o.scheduledAt)
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

const mine = computed(() =>
  orders.value.filter(o => isOwnOrder(o, auth.user)).sort((a, b) => dateOf(b) - dateOf(a))
)

const stats = computed(() => {
  const today = startOfDay(new Date())
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  const list = mine.value
  return {
    today:     list.filter(o => dateOf(o) >= today).length,
    yesterday: list.filter(o => { const d = dateOf(o); return d >= yesterday && d < today }).length,
    week:      list.filter(o => dateOf(o) >= monday).length,
    pending:   list.filter(o => o.pendingReview).length,
    total:     list.length,
  }
})

const recent = computed(() => mine.value.slice(0, 8))
const openFeedback = computed(() => feedback.items.filter(f => !f.resolvedAt).slice(0, 5))

function fmtWhen(iso) {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  if (d >= startOfDay(new Date())) return `Hoy, ${time}`
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
/* Acción principal */
.op-cta {
  display: flex; align-items: center; gap: 1rem;
  margin-bottom: 1.25rem; padding: 1.1rem 1.35rem;
  border-radius: 0.85rem;
  color: #fff;
  background: radial-gradient(120% 120% at 0% 0%, #2f84e6 0%, transparent 55%), linear-gradient(135deg, var(--accent), var(--accent-strong));
  box-shadow: 0 8px 22px color-mix(in srgb, var(--accent) 28%, transparent);
  transition: transform 0.15s, box-shadow 0.15s;
}
.op-cta:hover { transform: translateY(-1px); box-shadow: 0 12px 28px color-mix(in srgb, var(--accent) 34%, transparent); color: #fff; }
.op-cta-icon {
  width: 3rem; height: 3rem; min-width: 3rem;
  display: grid; place-items: center; border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.16); font-size: 1.2rem;
}
.op-cta-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
.op-cta-title { font-size: 1.05rem; font-weight: 700; }
.op-cta-sub { font-size: 0.85rem; opacity: 0.85; }
.op-cta-arrow { font-size: 1rem; opacity: 0.85; transition: transform 0.15s; }
.op-cta:hover .op-cta-arrow { transform: translateX(3px); }
@media (max-width: 575.98px) { .op-cta-sub { display: none; } }

/* Tarjeta KPI enlazada */
.kpi-link { transition: border-color 0.14s, box-shadow 0.14s; }
.kpi-link:hover { border-color: var(--line-strong); box-shadow: var(--shadow-md); }
.kpi-value.is-bad { color: var(--danger); }

.op-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 1rem; align-items: start; }
@media (max-width: 1099.98px) { .op-grid { grid-template-columns: 1fr; } }
.op-grid.is-single { grid-template-columns: 1fr; }

.is-clickable { cursor: pointer; }

/* Todo en orden */
.op-allgood { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem 1.25rem; text-align: center; }
.op-allgood-icon { width: 2.75rem; height: 2.75rem; display: grid; place-items: center; border-radius: 50%; color: var(--success); background: color-mix(in srgb, var(--success) 10%, transparent); font-size: 1.15rem; }
.op-allgood p { margin: 0; font-size: 0.85rem; color: var(--ink-500); }

/* Observaciones abiertas */
.op-obs { list-style: none; margin: 0; padding: 0.35rem; }
.op-obs-item { display: flex; gap: 0.7rem; padding: 0.7rem 0.75rem; border-radius: 0.55rem; transition: background 0.12s; }
.op-obs-item:hover { background: var(--surface); }
.op-obs-dot { width: 0.5rem; height: 0.5rem; min-width: 0.5rem; margin-top: 0.45rem; border-radius: 50%; background: var(--line-strong); }
.op-obs-dot.is-unread { background: var(--danger); box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 18%, transparent); }
.op-obs-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.3rem; }
.op-obs-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.op-obs-top .code-tag { font-size: 0.74rem; padding: 0.05rem 0.4rem; }
.op-obs-date { font-size: 0.74rem; color: var(--ink-500); white-space: nowrap; }
.op-obs-text {
  font-size: 0.84rem; line-height: 1.45; color: var(--ink-700);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
</style>
