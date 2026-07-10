<template>
  <section class="py-4 py-lg-5">
    <div class="container-lg">

      <!-- Cabecera -->
      <div class="hist-header mb-4">
        <div class="hist-title-icon"><i class="fas fa-history"></i></div>
        <div class="hist-title-info">
          <h2 class="hist-title">Historial de órdenes</h2>
          <p class="hist-sub">{{ hoy }}</p>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="stats-row mb-4">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(66,130,194,0.1);color:var(--accent)">
            <i class="fas fa-archive"></i>
          </div>
          <div>
            <p class="stat-label">En historial</p>
            <p class="stat-num">{{ stats.total }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(46,139,87,0.1);color:var(--success)">
            <i class="fas fa-check-circle"></i>
          </div>
          <div>
            <p class="stat-label">Completadas</p>
            <p class="stat-num">{{ stats.completadas }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(54,80,108,0.1);color:var(--ink-700)">
            <i class="fas fa-spinner"></i>
          </div>
          <div>
            <p class="stat-label">En proceso</p>
            <p class="stat-num">{{ stats.enProceso }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(196,69,54,0.1);color:var(--danger)">
            <i class="fas fa-ban"></i>
          </div>
          <div>
            <p class="stat-label">Bloqueadas</p>
            <p class="stat-num">{{ stats.bloqueadas }}</p>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="hist-table-wrap">

        <div class="hist-table-head">
          <div class="hist-table-head-left">
            <i class="fas fa-archive"></i>
            <span>Órdenes anteriores</span>
          </div>
          <span class="hist-badge">{{ historicalOrders.length }} orden(es)</span>
        </div>

        <!-- Vacío -->
        <div v-if="!historicalOrders.length" class="log-empty">
          <div class="log-empty-icon"><i class="fas fa-clipboard-list"></i></div>
          <p class="log-empty-title">Sin historial aún</p>
          <p class="log-empty-sub">Las órdenes de días anteriores aparecen aquí automáticamente.</p>
          <RouterLink to="/" class="log-empty-btn">
            <i class="fas fa-qrcode me-2"></i>Ir al Scanner
          </RouterLink>
        </div>

        <!-- Tabla -->
        <div v-else class="table-responsive">
          <table class="hist-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Sede</th>
                <th>Operador</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in historicalOrders" :key="o.code">
                <td><span class="h-code">{{ o.code }}</span></td>
                <td class="h-product">{{ o.product }}</td>
                <td><span class="h-chip">{{ o.sedeInfo.name }}</span></td>
                <td class="h-muted">{{ o.operator }}</td>
                <td class="h-date">{{ fmtDate(o.scheduledAt) }}</td>
                <td>
                  <RouterLink :to="`/orden/${o.code}`" class="h-btn">
                    <i class="fas fa-arrow-right"></i>
                  </RouterLink>
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
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useOrdersStore } from '../stores/orders'

const store = useOrdersStore()
const { historicalOrders } = storeToRefs(store)

onMounted(() => store.fetchOrders())

const stats = computed(() => ({
  total:       historicalOrders.value.length,
  completadas: historicalOrders.value.filter(o => o.status === 'Completada').length,
  enProceso:   historicalOrders.value.filter(o => o.status === 'En proceso').length,
  bloqueadas:  historicalOrders.value.filter(o => o.status === 'Bloqueada').length,
}))

const hoy = new Date().toLocaleDateString('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

const fmtDate = (iso) => new Date(iso).toLocaleDateString('es-CO', {
  day: 'numeric', month: 'short', year: 'numeric',
})

const fmt = (iso) => iso
  ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  : '—'
</script>

<style scoped>
/* Cabecera */
.hist-header {
  display: flex; align-items: center; gap: 1rem;
  background: linear-gradient(135deg, #14213d 0%, #1e3a62 100%);
  border: none; border-radius: 1rem; padding: 1.5rem 1.75rem;
  box-shadow: 0 8px 24px rgba(15,23,42,0.18);
}
.hist-title-icon {
  width: 2.75rem; height: 2.75rem; min-width: 2.75rem;
  background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2);
  border-radius: 0.65rem; display: grid; place-items: center; color: #fff; font-size: 1rem;
}
.hist-title { font-family:var(--font-display); font-size:1.15rem; font-weight:700; margin:0 0 0.2rem; color:#fff; }
.hist-sub   { font-size:0.8rem; color:rgba(255,255,255,0.65); margin:0; text-transform:capitalize; }

/* Stat cards */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
@media (max-width: 767px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }

.stat-card {
  background: var(--paper); border: 1px solid var(--line);
  border-radius: 1rem; padding: 1.25rem 1.4rem;
  box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 1rem;
  transition: box-shadow 0.18s, transform 0.18s;
}
.stat-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.stat-icon { width: 2.75rem; height: 2.75rem; min-width: 2.75rem; border-radius: 0.65rem; display: grid; place-items: center; font-size: 1rem; }
.stat-label { font-size:0.65rem; text-transform:uppercase; letter-spacing:0.08rem; color:var(--ink-500); margin:0 0 0.2rem; }
.stat-num   { font-family:var(--font-display); font-size:1.85rem; font-weight:700; color:var(--ink-900); margin:0; line-height:1; }

/* Tabla historial */
.hist-table-wrap {
  background: var(--paper); border: 1px solid var(--line);
  border-radius: 1rem; overflow: hidden; box-shadow: var(--shadow-sm);
}
.hist-table-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.5rem; background: var(--surface); border-bottom: 1px solid var(--line);
  font-size: 0.8rem; font-weight: 700; color: var(--ink-700); gap: 0.5rem; flex-wrap: wrap;
}
.hist-table-head-left { display:flex; align-items:center; gap:0.5rem; }
.hist-badge {
  font-size:0.7rem; font-weight:600;
  background:rgba(66,130,194,0.1); color:var(--accent);
  border:1px solid rgba(66,130,194,0.2); padding:0.2rem 0.65rem; border-radius:0.45rem;
}

/* Empty */
.log-empty { display:flex; flex-direction:column; align-items:center; text-align:center; padding:3.5rem 2rem; }
.log-empty-icon { width:4rem; height:4rem; border-radius:1rem; background:var(--surface); border:1px solid var(--line); display:grid; place-items:center; font-size:1.5rem; color:var(--ink-500); margin-bottom:1rem; }
.log-empty-title { font-size:0.95rem; font-weight:600; color:var(--ink-900); margin:0 0 0.35rem; }
.log-empty-sub   { font-size:0.82rem; color:var(--ink-500); max-width:300px; line-height:1.7; margin:0 0 1rem; }
.log-empty-btn { display:inline-flex; align-items:center; padding:0.6rem 1.35rem; background:linear-gradient(135deg,var(--accent),var(--accent-strong)); color:#fff; border-radius:0.65rem; font-size:0.85rem; font-weight:600; transition:opacity 0.14s, transform 0.14s; box-shadow:0 4px 14px rgba(66,130,194,0.28); }
.log-empty-btn:hover { opacity:0.9; transform:translateY(-1px); }

/* Tabla */
.hist-table { width:100%; border-collapse:collapse; font-size:0.865rem; }
.hist-table th { padding:0.8rem 1rem; text-align:left; font-size:0.62rem; text-transform:uppercase; letter-spacing:0.1rem; color:var(--ink-500); font-weight:700; border-bottom:1px solid var(--line); background:var(--surface); white-space:nowrap; }
.hist-table td { padding:0.85rem 1rem; border-bottom:1px solid var(--line); vertical-align:middle; color:var(--ink-900); }
.hist-table tbody tr:last-child td { border-bottom:none; }
.hist-table tbody tr:hover { background:rgba(66,130,194,0.04); }

.h-code    { font-weight:700; font-size:0.82rem; letter-spacing:0.04rem; color:var(--ink-500); }
.h-product { max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; }
.h-chip    { display:inline-flex; align-items:center; font-size:0.7rem; font-weight:600; padding:0.28rem 0.65rem; border-radius:0.45rem; background:var(--surface); color:var(--ink-700); border:1px solid var(--line); white-space:nowrap; }
.h-muted   { color:var(--ink-500); font-size:0.83rem; }
.h-date    { font-size:0.82rem; font-weight:600; color:var(--ink-700); white-space:nowrap; }
.h-btn     { display:inline-flex; align-items:center; justify-content:center; width:1.9rem; height:1.9rem; border-radius:0.5rem; border:1px solid var(--line); background:var(--surface); color:var(--ink-500); font-size:0.72rem; transition:background 0.12s, color 0.12s; }
.h-btn:hover { background:var(--accent); color:#fff; border-color:var(--accent); }
</style>
