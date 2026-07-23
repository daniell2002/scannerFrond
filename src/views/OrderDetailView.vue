<template>
  <section class="py-3 py-lg-4">
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
          <div class="det-head-left">
            <div class="det-head-icon"><i class="fas fa-file-invoice"></i></div>
            <div>
              <h1 class="det-title">Información de la orden</h1>
              <p class="det-sub">{{ order.code }} · {{ order.product }}</p>
            </div>
          </div>
          <RouterLink to="/ordenes" class="det-back">
            <i class="fas fa-arrow-left me-1"></i>Órdenes
          </RouterLink>
        </div>

        <!-- Detalles + Sede a la izquierda, evidencia a la derecha -->
        <div class="det-cols mb-4" :class="{ 'det-cols-single': !order.photoUrl }">

          <div class="det-cols-left">

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
                  <span class="field-k">Fecha creación</span>
                  <span class="field-v">
                    {{ order.scannedAt
                      ? new Date(order.scannedAt).toLocaleDateString('es-CO')
                      : 'Sin escaneo' }}
                  </span>
                </div>
                <div class="field-row" v-if="order.scannedAt">
                  <span class="field-k">Hora creación</span>
                  <span class="field-v">{{ new Date(order.scannedAt).toLocaleTimeString('es-CO') }}</span>
                </div>
              </div>
            </div>

            <!-- Sede -->
            <div class="det-card">
              <div class="det-card-head">
                <div class="det-card-icon"><i class="fas fa-building"></i></div>
                <span>Sede de producción</span>
              </div>
              <div class="det-card-body">
                <div class="sede-row">
                  <p class="sede-name">{{ order.sedeInfo.name }}</p>
                  <p class="sede-city"><i class="fas fa-location-dot me-1"></i>{{ order.sedeInfo.city }}, Colombia</p>
                </div>
                <div class="field-row">
                  <span class="field-k">Coordinador</span>
                  <span class="field-v">{{ order.sedeInfo.manager }}</span>
                </div>
                <div class="field-row">
                  <span class="field-k">Código sede</span>
                  <span class="field-v">{{ order.sede }}</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Evidencia fotográfica -->
          <div v-if="order.photoUrl" class="det-card">
            <div class="det-card-head">
              <div class="det-card-icon"><i class="fas fa-camera"></i></div>
              <span>Evidencia fotográfica</span>
              <button class="det-photo-expand" @click="openPhotoModal" title="Expandir evidencia">
                <i class="fas fa-expand"></i>
              </button>
            </div>
            <div class="det-photo-wrap">
              <img :src="photoFullUrl" alt="Evidencia de la orden" class="det-photo" @click="openPhotoModal" />
            </div>
          </div>

        </div>

      </template>
    </div>

    <!-- Modal de evidencia: zoom + arrastre -->
    <Transition name="photo-fade">
      <div v-if="photoModalOpen" class="photo-modal-overlay" @click.self="closePhotoModal">
        <div class="photo-modal-box">
          <div class="photo-modal-head">
            <span><i class="fas fa-camera me-2"></i>Evidencia fotográfica</span>
            <div class="photo-modal-actions">
              <button class="photo-modal-btn" @click="zoomOut" title="Alejar"><i class="fas fa-search-minus"></i></button>
              <button class="photo-modal-btn" @click="resetView" title="Restablecer"><i class="fas fa-compress"></i></button>
              <button class="photo-modal-btn" @click="zoomIn" title="Acercar"><i class="fas fa-search-plus"></i></button>
              <button class="photo-modal-btn photo-modal-close" @click="closePhotoModal" title="Cerrar"><i class="fas fa-times"></i></button>
            </div>
          </div>
          <div
            class="photo-modal-stage"
            :class="{ 'is-dragging': dragging }"
            @mousedown="startDrag"
            @mousemove="onDrag"
            @mouseup="endDrag"
            @mouseleave="endDrag"
            @touchstart="startDrag"
            @touchmove="onDrag"
            @touchend="endDrag"
            @wheel.prevent="onWheel"
          >
            <img
              :src="photoFullUrl" alt="Evidencia de la orden" class="photo-modal-img"
              :style="{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }"
              draggable="false"
            />
          </div>
          <p class="photo-modal-hint">Arrastra para mover · rueda del mouse o los botones para acercar/alejar</p>
        </div>
      </div>
    </Transition>
  </section>
</template>


<script setup>
import { computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { BASE } from '../api'

const route = useRoute()
const order = computed(() => useOrdersStore().getOrderByCode(route.params.code))
const photoFullUrl = computed(() => order.value?.photoUrl ? `${BASE}${order.value.photoUrl}` : '')

/* Modal de evidencia: zoom + arrastre */
const photoModalOpen = ref(false)
const zoom = ref(1)
const pan  = ref({ x: 0, y: 0 })
const dragging = ref(false)
let dragStart = { x: 0, y: 0 }
let panStart  = { x: 0, y: 0 }

const openPhotoModal  = () => { photoModalOpen.value = true; resetView() }
const closePhotoModal = () => { photoModalOpen.value = false }
const resetView = () => { zoom.value = 1; pan.value = { x: 0, y: 0 } }
const zoomIn  = () => { zoom.value = Math.min(4, +(zoom.value + 0.25).toFixed(2)) }
const zoomOut = () => { zoom.value = Math.max(0.5, +(zoom.value - 0.25).toFixed(2)) }
const onWheel = (e) => { e.deltaY < 0 ? zoomIn() : zoomOut() }

const pointerPos = (e) => e.touches ? e.touches[0] : e

const startDrag = (e) => {
  dragging.value = true
  const p = pointerPos(e)
  dragStart = { x: p.clientX, y: p.clientY }
  panStart  = { ...pan.value }
}
const onDrag = (e) => {
  if (!dragging.value) return
  const p = pointerPos(e)
  pan.value = {
    x: panStart.x + (p.clientX - dragStart.x),
    y: panStart.y + (p.clientY - dragStart.y),
  }
}
const endDrag = () => { dragging.value = false }
</script>

<style scoped>
/* 404 */
.nf { display:flex; flex-direction:column; align-items:center; min-height:300px; justify-content:center; gap:0.75rem; text-align:center; }
.nf-icon-wrap { width:4rem; height:4rem; border-radius:50%; background:var(--surface); border:1px solid var(--line); display:grid; place-items:center; font-size:1.5rem; color:var(--ink-500); margin-bottom:0.5rem; }
.nf-title { font-family:var(--font-display); font-size:1.1rem; font-weight:700; margin:0; }
.nf-sub   { color:var(--ink-500); font-size:0.85rem; margin:0; }
.nf-btn   { display:inline-flex; align-items:center; padding:0.6rem 1.25rem; background:var(--accent); color:#fff; border-radius:0.375rem; font-size:0.875rem; font-weight:600; transition:opacity 0.14s; }
.nf-btn:hover { opacity:0.85; }

/* Cabecera — mismo patrón que Órdenes/Historial: icono + título + subtítulo */
.det-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 0.375rem;
  padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
}
.det-head-left { display:flex; align-items:center; gap:1rem; min-width:0; }
.det-head-icon {
  width: 2.75rem; height: 2.75rem; min-width: 2.75rem;
  background: var(--accent); border-radius: 0.375rem;
  display: grid; place-items: center;
  color: #fff; font-size: 1rem;
}

.det-title { font-family:var(--font-display); font-size:1.15rem; font-weight:700; margin:0 0 0.2rem; color:var(--ink-900); }
.det-sub   { font-size:0.8rem; color:var(--ink-500); margin:0; }

.det-back {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.45rem 0.875rem;
  background: var(--surface); border: 1px solid var(--line);
  border-radius: 0.375rem; font-size: 0.8rem; font-weight: 600;
  color: var(--ink-700);
  transition: background 0.14s, color 0.14s;
}
.det-back:hover { background: var(--accent); color: #fff; border-color: var(--accent); }

/* Columnas */
.det-cols { display:grid; grid-template-columns: 260px 1fr; gap:1rem; align-items:start; }
.det-cols.det-cols-single { grid-template-columns: 1fr; }
.det-cols-left { display:flex; flex-direction:column; gap:1rem; min-width:0; }
@media (max-width:900px) { .det-cols { grid-template-columns:1fr; } }

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

/* Evidencia fotográfica */
.det-card-head { position: relative; }
.det-photo-expand {
  margin-left: auto;
  width: 1.75rem; height: 1.75rem; flex-shrink: 0;
  display: grid; place-items: center;
  background: var(--paper); border: 1px solid var(--line);
  border-radius: 3px; color: var(--ink-500);
  font-size: 0.68rem; cursor: pointer;
  transition: background 0.14s, color 0.14s, border-color 0.14s;
}
.det-photo-expand:hover { background: var(--accent); color: #fff; border-color: var(--accent); }

.det-photo-wrap { padding: 1.25rem; background: var(--surface); }
.det-photo {
  display: block; margin: 0 auto;
  width: 100%; max-height: 620px; object-fit: contain;
  border-radius: 0.375rem; border: 1px solid var(--line);
  background: var(--paper);
  cursor: zoom-in;
}

/* Modal de evidencia: zoom + arrastre */
.photo-modal-overlay {
  position: fixed; inset: 0; z-index: 600;
  background: rgba(0,0,0,0.72); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 1.5rem;
}
.photo-modal-box {
  background: var(--paper);
  border-radius: 0.5rem;
  overflow: hidden;
  width: 100%; max-width: 900px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.4);
  display: flex; flex-direction: column;
}
.photo-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem; padding: 0.875rem 1.25rem;
  background: var(--accent); color: #fff;
  font-size: 0.85rem; font-weight: 700;
}
.photo-modal-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }
.photo-modal-btn {
  width: 1.85rem; height: 1.85rem;
  display: grid; place-items: center;
  background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
  border-radius: 0.375rem; color: #fff; font-size: 0.72rem; cursor: pointer;
  transition: background 0.14s, border-color 0.14s;
}
.photo-modal-btn:hover { background: rgba(255,255,255,0.28); }
.photo-modal-close:hover { background: var(--danger); border-color: var(--danger); }

.photo-modal-stage {
  position: relative;
  height: min(75vh, 640px);
  overflow: hidden;
  background:
    linear-gradient(45deg, var(--surface) 25%, transparent 25%, transparent 75%, var(--surface) 75%) 0 0/20px 20px,
    linear-gradient(45deg, var(--surface) 25%, var(--paper) 25%, var(--paper) 75%, var(--surface) 75%) 10px 10px/20px 20px;
  cursor: grab;
  touch-action: none;
  display: flex; align-items: center; justify-content: center;
}
.photo-modal-stage.is-dragging { cursor: grabbing; }
.photo-modal-img {
  max-width: 100%; max-height: 100%;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}
.photo-modal-hint {
  text-align: center; font-size: 0.7rem; color: var(--ink-500);
  padding: 0.6rem; margin: 0; background: var(--paper);
  border-top: 1px solid var(--line);
}

.photo-fade-enter-active, .photo-fade-leave-active { transition: opacity 0.2s ease; }
.photo-fade-enter-from, .photo-fade-leave-to { opacity: 0; }
</style>
