<template>
  <section class="py-4 py-lg-5">
    <div class="container-lg">

      <!-- 404 -->
      <div v-if="!order" class="nf">
        <div class="nf-icon-wrap"><i class="fas fa-inbox"></i></div>
        <h2 class="nf-title">Orden no encontrada</h2>
        <p class="nf-sub">Regresa y carga una OP válida desde el Scanner.</p>
        <RouterLink to="/" class="nf-btn">
          <i class="fas fa-arrow-left me-2"></i>Ir al Scanner
        </RouterLink>
      </div>

      <template v-else>

        <!-- Cabecera -->
        <div class="det-head mb-4">
          <div class="det-head-accent"></div>
          <div class="det-head-body">
            <div class="det-head-top">
              <RouterLink to="/ordenes" class="det-back">
                <i class="fas fa-arrow-left me-1"></i>Órdenes
              </RouterLink>
              <div class="det-head-badges">
                <span class="det-badge" :class="{
                  'db-proceso':   order.status === 'En proceso',
                  'db-completa':  order.status === 'Completada',
                  'db-pendiente': order.status === 'Pendiente',
                  'db-bloqueada': order.status === 'Bloqueada',
                }">{{ order.status }}</span>
                <span class="det-badge" :class="{
                  'db-alta':  order.priority === 'Alta',
                  'db-media': order.priority === 'Media',
                  'db-baja':  order.priority === 'Baja',
                }">{{ order.priority }}</span>
              </div>
            </div>
            <h1 class="det-title">{{ order.product }}</h1>
            <div class="det-meta">
              <span class="det-code">{{ order.code }}</span>
              <span class="det-dot"></span>
              <span class="det-sede">{{ order.sedeInfo.name }}</span>
              <span class="det-dot"></span>
              <span class="det-sede">Línea {{ order.line }}</span>
            </div>
          </div>
        </div>

        <!-- Progreso -->
        <div class="prog-card mb-4">
          <div class="prog-nums">
            <div class="prog-num-item">
              <span class="prog-n">{{ order.quantity.toLocaleString() }}</span>
              <span class="prog-l">Programadas</span>
            </div>
            <div class="prog-divider"></div>
            <div class="prog-num-item">
              <span class="prog-n prog-n-done">{{ order.completed.toLocaleString() }}</span>
              <span class="prog-l">Completadas</span>
            </div>
            <div class="prog-divider"></div>
            <div class="prog-num-item">
              <span class="prog-n">{{ (order.quantity - order.completed).toLocaleString() }}</span>
              <span class="prog-l">Restantes</span>
            </div>
          </div>
          <div class="prog-bar-row">
            <div class="prog-track">
              <div class="prog-fill" :style="{ width: `${order.completionRate}%` }"></div>
            </div>
            <span class="prog-pct">{{ order.completionRate }}%</span>
          </div>
        </div>

        <!-- Dos columnas -->
        <div class="det-cols">

          <!-- Detalles -->
          <div class="det-card">
            <div class="det-card-head">
              <div class="det-card-icon"><i class="fas fa-file-alt"></i></div>
              <span>Detalles de la orden</span>
            </div>
            <div class="det-card-body">
              <div class="field-row">
                <span class="field-k">Responsable</span>
                <span class="field-v">{{ order.operator }}</span>
              </div>
              <div class="field-row">
                <span class="field-k">Lote</span>
                <span class="field-v">{{ order.batch }}</span>
              </div>
              <div class="field-row">
                <span class="field-k">Línea</span>
                <span class="field-v">{{ order.line }}</span>
              </div>
              <div class="field-row">
                <span class="field-k">Última lectura</span>
                <span class="field-v">
                  {{ order.scannedAt
                    ? new Date(order.scannedAt).toLocaleString('es-CO')
                    : 'Sin escaneo' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Sede -->
          <div class="det-card">
            <div class="det-card-head">
              <div class="det-card-icon"><i class="fas fa-industry"></i></div>
              <span>Sede de producción</span>
            </div>
            <div class="det-card-body">
              <div class="sede-row">
                <div>
                  <p class="sede-name">{{ order.sedeInfo.name }}</p>
                  <p class="sede-city"><i class="fas fa-location-dot me-1"></i>{{ order.sedeInfo.city }}, Colombia</p>
                </div>
              </div>
              <div class="field-row">
                <span class="field-k">Coordinador</span>
                <span class="field-v">{{ order.sedeInfo.manager }}</span>
              </div>
              <div class="field-row">
                <span class="field-k">Código sede</span>
                <span class="field-v">{{ order.sede }}</span>
              </div>
              <div class="field-row">
                <span class="field-k">Líneas activas</span>
                <span class="field-v">{{ order.sedeInfo.activeLines }}</span>
              </div>
              <div class="lines-row">
                <span v-for="n in order.sedeInfo.activeLines" :key="n"
                  class="line-pill"
                  :class="{ 'line-active': order.line === `L-0${n}` }">
                  L-0{{ n }}
                </span>
              </div>
            </div>
          </div>

        </div>
      </template>
    </div>
  </section>
</template>


<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useOrdersStore } from '../stores/orders'

const route = useRoute()
const order = computed(() => useOrdersStore().getOrderByCode(route.params.code))
</script>

<style scoped>
/* 404 */
.nf { display:flex; flex-direction:column; align-items:center; min-height:300px; justify-content:center; gap:0.75rem; text-align:center; }
.nf-icon-wrap { width:4rem; height:4rem; border-radius:50%; background:var(--surface); border:1px solid var(--line); display:grid; place-items:center; font-size:1.5rem; color:var(--ink-500); margin-bottom:0.5rem; }
.nf-title { font-family:var(--font-display); font-size:1.1rem; font-weight:700; margin:0; }
.nf-sub   { color:var(--ink-500); font-size:0.85rem; margin:0; }
.nf-btn   { display:inline-flex; align-items:center; padding:0.6rem 1.25rem; background:var(--accent); color:#fff; border-radius:0.375rem; font-size:0.875rem; font-weight:600; transition:opacity 0.14s; }
.nf-btn:hover { opacity:0.85; }

/* Cabecera */
.det-head {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 0.375rem;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: flex;
}
.det-head-accent {
  width: 4px;
  min-width: 4px;
  background: var(--accent);
}
.det-head-body {
  flex: 1;
  padding: 1.25rem 1.5rem;
  min-width: 0;
}
.det-head-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
.det-back {
  display: inline-flex; align-items: center; gap: 0.35rem;
  font-size: 0.78rem; font-weight: 600; color: var(--ink-500);
  padding: 0.3rem 0.75rem;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 0.375rem;
  transition: background 0.12s, color 0.12s;
}
.det-back:hover { background: var(--accent); color: #fff; border-color: var(--accent); }

.det-head-badges { display:flex; gap:0.4rem; flex-wrap:wrap; }

.det-badge {
  font-size: 0.68rem; font-weight: 700;
  padding: 0.28rem 0.7rem; border-radius: 3px;
}
.db-proceso  { background:rgba(54,80,108,0.1);   color:var(--ink-700); }
.db-completa { background:rgba(46,139,87,0.12);  color:var(--success); }
.db-pendiente{ background:rgba(66,130,194,0.12); color:var(--accent); }
.db-bloqueada{ background:rgba(196,69,54,0.1);   color:var(--danger); }
.db-alta     { background:rgba(196,69,54,0.1);   color:var(--danger); }
.db-media    { background:rgba(66,130,194,0.1);  color:var(--accent); }
.db-baja     { background:rgba(46,139,87,0.12);  color:var(--success); }

.det-title { font-family:var(--font-display); font-size:1.5rem; font-weight:700; color:var(--ink-900); margin:0 0 0.5rem; }
.det-meta  { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; }
.det-code  { font-size:0.75rem; font-weight:700; color:var(--ink-500); background:var(--surface); border:1px solid var(--line); padding:0.2rem 0.6rem; border-radius:3px; letter-spacing:0.05rem; }
.det-sede  { font-size:0.78rem; color:var(--ink-500); }
.det-dot   { width:3px; height:3px; border-radius:50%; background:var(--ink-500); opacity:0.4; }

/* Progreso */
.prog-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 0.375rem;
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
}
.prog-nums   { display:flex; align-items:center; margin-bottom:1rem; }
.prog-num-item { flex:1; display:flex; flex-direction:column; align-items:center; gap:0.25rem; }
.prog-divider  { width:1px; height:2.5rem; background:var(--line); flex-shrink:0; }
.prog-n        { font-family:var(--font-display); font-size:1.6rem; font-weight:700; color:var(--ink-900); }
.prog-n-done   { color:var(--accent); }
.prog-l        { font-size:0.6rem; text-transform:uppercase; letter-spacing:0.1rem; color:var(--ink-500); }

.prog-bar-row  { display:flex; align-items:center; gap:0.875rem; }
.prog-track    { flex:1; height:8px; background:var(--surface-2); border-radius:2px; overflow:hidden; }
.prog-fill     { height:100%; background:linear-gradient(90deg,var(--accent) 0%,rgba(66,130,194,0.6) 100%); border-radius:2px; transition:width 0.6s ease; }
.prog-pct      { font-family:var(--font-display); font-size:1rem; font-weight:700; color:var(--ink-900); min-width:44px; text-align:right; }

/* Columnas */
.det-cols { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
@media (max-width:767px) { .det-cols { grid-template-columns:1fr; } }

.det-card { background:var(--paper); border:1px solid var(--line); border-radius:0.375rem; overflow:hidden; box-shadow:var(--shadow-sm); }

.det-card-head {
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.75rem 1.25rem;
  background: var(--surface); border-bottom: 1px solid var(--line);
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08rem; color: var(--ink-700);
}
.det-card-icon {
  width: 1.5rem; height: 1.5rem;
  background: var(--accent); border-radius: 3px;
  display: grid; place-items: center;
  color: #fff; font-size: 0.7rem;
}

.det-card-body { padding: 0.25rem 1.25rem; }

/* Field rows */
.field-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.65rem 0; border-bottom: 1px solid var(--line); gap: 1rem;
}
.field-row:last-child { border-bottom: none; }
.field-k { font-size:0.78rem; color:var(--ink-500); flex-shrink:0; }
.field-v { font-size:0.875rem; font-weight:600; color:var(--ink-900); text-align:right; }

/* Sede */
.sede-row { padding: 0.875rem 0; border-bottom: 1px solid var(--line); }
.sede-name { font-weight:700; font-size:0.95rem; color:var(--ink-900); margin:0 0 0.2rem; }
.sede-city { font-size:0.78rem; color:var(--ink-500); margin:0; }

.lines-row { display:flex; gap:0.4rem; flex-wrap:wrap; padding:0.875rem 0 0.5rem; }
.line-pill { font-size:0.7rem; font-weight:700; padding:0.28rem 0.6rem; border-radius:3px; background:var(--surface); color:var(--ink-500); border:1px solid var(--line); }
.line-active { background:var(--accent); color:#fff; border-color:var(--accent); }
</style>
