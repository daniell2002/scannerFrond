<template>
  <section class="py-4 py-lg-5">
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
                    <button class="btn-3d" @click="openModal(o)" title="Ver modelo 3D">
                      <i class="fas fa-cube"></i>
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

    <!-- Modal 3D -->
    <Transition name="mfade">
      <div v-if="modal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box">

          <div class="modal-head">
            <div>
              <span class="modal-eyebrow"><i class="fas fa-cube me-2"></i>Modelo 3D</span>
              <h3 class="modal-title">{{ modal.code }}</h3>
              <p class="modal-sub">{{ modal.product }}</p>
            </div>
            <button class="modal-close" @click="closeModal"><i class="fas fa-times"></i></button>
          </div>

          <!-- Escena 3D genérica -->
          <div class="scene-wrap">
            <div class="scene-stage">
              <div class="rotator">
                <div class="plate">
                  <div class="pface pface-front"></div>
                  <div class="pface pface-back"></div>
                  <div class="pface pface-right"></div>
                  <div class="pface pface-left"></div>
                  <div class="pface pface-top"></div>
                  <div class="pface pface-bottom"></div>
                </div>
              </div>
            </div>
            <p class="scene-hint">
              <i class="fas fa-cube me-1"></i>
              Para el modelo de la pieza real, sube la foto en el Scanner
            </p>
          </div>

          <!-- Info -->
          <div class="modal-grid">
            <div class="modal-cell"><span class="mc-label">Sede</span><span class="mc-val">{{ modal.sedeInfo.name }}</span></div>
            <div class="modal-cell">
              <span class="mc-label">Estado</span>
              <span class="chip" :class="{'chip-proceso':modal.status==='En proceso','chip-completa':modal.status==='Completada','chip-pendiente':modal.status==='Pendiente','chip-bloqueada':modal.status==='Bloqueada'}">{{ modal.status }}</span>
            </div>
            <div class="modal-cell"><span class="mc-label">Lote</span><span class="mc-val">{{ modal.batch }}</span></div>
            <div class="modal-cell"><span class="mc-label">Línea</span><span class="mc-val">{{ modal.line }}</span></div>
            <div class="modal-cell"><span class="mc-label">Operador</span><span class="mc-val">{{ modal.operator }}</span></div>
            <div class="modal-cell">
              <span class="mc-label">Prioridad</span>
              <span class="chip" :class="{'chip-alta':modal.priority==='Alta','chip-media':modal.priority==='Media','chip-baja':modal.priority==='Baja'}">{{ modal.priority }}</span>
            </div>
            <div class="modal-cell modal-cell-full">
              <span class="mc-label">Avance</span>
              <div class="d-flex align-items-center gap-2 mt-1">
                <div class="avance-track flex-grow-1"><div class="avance-fill" :style="{ width:`${modal.completionRate}%` }"></div></div>
                <strong>{{ modal.completionRate }}%</strong>
              </div>
              <small class="text-secondary">{{ modal.completed.toLocaleString() }} / {{ modal.quantity.toLocaleString() }} unidades</small>
            </div>
          </div>

          <div class="modal-footer">
            <RouterLink :to="`/orden/${modal.code}`" class="btn btn-dark" @click="closeModal">
              <i class="fas fa-arrow-right me-2"></i>Ver detalle
            </RouterLink>
            <button class="btn btn-outline-secondary" @click="closeModal">Cerrar</button>
          </div>

        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'

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

const modal      = ref(null)
const openModal  = (order) => { modal.value = order }
const closeModal = () => { modal.value = null }
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
.ord-title    { font-family:var(--font-display); font-size:1.15rem; font-weight:700; margin:0 0 0.25rem; color:var(--ink-900); }
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

.ord-filters {
  display: flex; gap: 0.75rem; flex-wrap: wrap;
}
.ord-search-wrap {
  flex: 1; min-width: 220px;
  display: flex; align-items: center;
  background: var(--paper); border: 1.5px solid var(--line);
  border-radius: 0.375rem; overflow: hidden;
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
  border-radius: 0.375rem; overflow: hidden;
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

html.dark .ord-select {
  color-scheme: dark;
}

.ord-select option {
  color: var(--ink-900);
  background: var(--paper);
}

html.dark .ord-select option {
  color: var(--ink-900);
  background: var(--surface);
}

.ord-table-wrap { background:var(--paper); border:1px solid var(--line); border-radius:0.375rem; overflow:hidden; box-shadow:var(--shadow-sm); }
/* tabla */

.ord-table { width:100%; border-collapse:collapse; font-size:0.865rem; }
.ord-table th { padding:0.75rem 1rem; text-align:left; font-size:0.62rem; text-transform:uppercase; letter-spacing:0.1rem; color:var(--ink-500); font-weight:700; border-bottom:2px solid var(--line); background:var(--surface); white-space:nowrap; }
.ord-table td { padding:0.75rem 1rem; border-bottom:1px solid var(--line); vertical-align:middle; color:var(--ink-900); }
.ord-table tbody tr:last-child td { border-bottom:none; }
.ord-table tbody tr:hover { background:var(--surface); }
.ord-code    { font-weight:700; font-size:0.82rem; letter-spacing:0.04rem; color:var(--ink-500); }
.ord-product { max-width:170px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; }
.text-muted-sm { color:var(--ink-500); font-size:0.83rem; }
.ord-time { font-size:0.82rem; font-weight:600; color:var(--ink-700); font-variant-numeric:tabular-nums; white-space:nowrap; }

.chip { display:inline-block; font-size:0.68rem; font-weight:600; padding:0.22rem 0.6rem; border-radius:3px; white-space:nowrap; }
.chip-sede     { background:var(--surface); color:var(--ink-700); border:1px solid var(--line); }
.chip-proceso  { background:rgba(54,80,108,0.1);  color:var(--ink-700); }
.chip-completa { background:rgba(46,139,87,0.12); color:var(--success); }
.chip-pendiente{ background:rgba(239,176,54,0.15); color:var(--accent-strong); }
.chip-bloqueada{ background:rgba(196,69,54,0.1);  color:var(--danger); }
.chip-alta     { background:rgba(196,69,54,0.1);  color:var(--danger); }
.chip-media    { background:rgba(239,176,54,0.15); color:var(--accent-strong); }
.chip-baja     { background:rgba(46,139,87,0.12); color:var(--success); }

.empty-row { padding:2.5rem; text-align:center; color:var(--ink-500); font-size:0.88rem; }

.btn-3d { display:inline-flex; align-items:center; justify-content:center; width:2rem; height:2rem; background:linear-gradient(135deg,var(--sidebar-bg) 0%,var(--ink-700) 100%); color:var(--accent); border:none; border-radius:0.375rem; font-size:0.78rem; cursor:pointer; transition:opacity 0.14s,transform 0.14s; }
.btn-3d:hover { opacity:0.85; transform:scale(1.08); }

/* Modal */
.modal-overlay { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.55); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:1rem; }
.modal-box { background:var(--paper); border:1px solid var(--line); border-radius:0.5rem; width:100%; max-width:540px; box-shadow:0 24px 60px rgba(0,0,0,0.25); overflow:hidden; max-height:92vh; overflow-y:auto; }

.modal-head { display:flex; justify-content:space-between; align-items:flex-start; padding:1.25rem 1.5rem; border-bottom:1px solid var(--line); background:var(--surface); }
.modal-eyebrow { font-size:0.65rem; text-transform:uppercase; letter-spacing:0.12rem; color:var(--ink-500); display:block; margin-bottom:0.25rem; }
.modal-title   { font-family:var(--font-display); font-size:1.2rem; font-weight:700; margin:0 0 0.15rem; }
.modal-sub     { font-size:0.84rem; color:var(--ink-700); margin:0; }
.modal-close { width:2rem; height:2rem; flex-shrink:0; background:var(--surface-2); border:1px solid var(--line); border-radius:0.375rem; color:var(--ink-500); cursor:pointer; font-size:0.8rem; display:grid; place-items:center; transition:background 0.12s; }
.modal-close:hover { background:var(--danger); color:#fff; border-color:var(--danger); }

/* Escena 3D */
.scene-wrap  { padding:1.5rem; background:linear-gradient(180deg,var(--surface) 0%,var(--paper) 100%); border-bottom:1px solid var(--line); display:flex; flex-direction:column; align-items:center; }
.scene-stage { perspective:900px; width:200px; height:200px; display:flex; align-items:center; justify-content:center; }
.scene-hint  { font-size:0.72rem; color:var(--ink-500); margin:0.75rem 0 0; text-align:center; }

.rotator { transform-style:preserve-3d; animation:rot3d 9s linear infinite; }
@keyframes rot3d { from { transform:rotateX(22deg) rotateY(0deg); } to { transform:rotateX(22deg) rotateY(360deg); } }

.plate { width:160px; height:160px; position:relative; transform-style:preserve-3d; }
.pface { position:absolute; }
.pface-front,.pface-back { width:160px; height:160px; left:0; top:0; }
.pface-front {
  transform:translateZ(7px);
  background:
    repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(80,110,150,0.07) 19px, rgba(80,110,150,0.07) 20px),
    repeating-linear-gradient(90deg,transparent,transparent 19px,rgba(80,110,150,0.07) 19px,rgba(80,110,150,0.07) 20px),
    linear-gradient(145deg,#c8cfd8 0%,#dde3ec 40%,#edf1f7 60%,#cdd4dd 100%);
  border:1px solid rgba(100,120,160,0.2);
}
.pface-back  { transform:rotateY(180deg) translateZ(7px); background:linear-gradient(145deg,#8a9099,#a0a8b5); }
.pface-right,.pface-left { width:14px; height:160px; left:73px; top:0; }
.pface-right { transform:rotateY(90deg)  translateZ(80px); background:linear-gradient(180deg,#b0b8c4,#6b7280); }
.pface-left  { transform:rotateY(-90deg) translateZ(80px); background:linear-gradient(180deg,#c5cad4,#8a9099); }
.pface-top,.pface-bottom { width:160px; height:14px; left:0; top:73px; }
.pface-top    { transform:rotateX(90deg)  translateZ(80px); background:linear-gradient(90deg,#c0c8d4,#d4dbe6 50%,#c0c8d4); }
.pface-bottom { transform:rotateX(-90deg) translateZ(80px); background:linear-gradient(90deg,#6b7280,#8a9099 50%,#6b7280); }

.modal-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:1rem; padding:1.25rem 1.5rem; border-bottom:1px solid var(--line); }
.modal-cell { display:flex; flex-direction:column; gap:0.3rem; }
.modal-cell-full { grid-column:1/-1; }
.mc-label { font-size:0.62rem; text-transform:uppercase; letter-spacing:0.1rem; color:var(--ink-500); }
.mc-val   { font-size:0.9rem; font-weight:600; color:var(--ink-900); }
.modal-footer { display:flex; gap:0.75rem; justify-content:flex-end; padding:1rem 1.5rem; }

.mfade-enter-active,.mfade-leave-active { transition:opacity 0.2s ease; }
.mfade-enter-from,.mfade-leave-to { opacity:0; }
</style>
