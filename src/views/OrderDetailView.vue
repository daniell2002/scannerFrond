<template>
  <div class="page-wrap">

    <!-- 404 -->
    <div v-if="!order" class="nf-card">
      <div class="nf">
        <div class="nf-icon-wrap"><i class="fas fa-inbox"></i></div>
        <h2 class="nf-title">Orden no encontrada</h2>
        <p class="nf-sub">Regresa y carga una OP válida desde el Scanner.</p>
        <RouterLink to="/scanner" class="btn btn-primary">
          <i class="fas fa-arrow-left me-2"></i>Ir al Scanner
        </RouterLink>
      </div>
    </div>

    <template v-else>

      <!-- Cabecera -->
      <PageHeader
        :breadcrumb="['Conexa', 'Órdenes', order.code]"
        icon="fa-file-invoice"
        title="Información de la orden"
        :subtitle="`${order.code} · ${order.product}`"
      >
        <template #action>
          <RouterLink to="/ordenes" class="btn-add-outline">
            <i class="fas fa-arrow-left"></i>Órdenes
          </RouterLink>
        </template>
      </PageHeader>

      <!-- Detalles + Sede a la izquierda, evidencia a la derecha -->
      <div class="row mb-4">

        <div class="col-12 det-cols-left" :class="order.photoUrl ? 'col-md-4' : 'col-md-12'">

          <!-- Detalles -->
          <div class="det-card mb-4">
            <div class="det-card-head">
              <div class="det-card-head-icon"><i class="fas fa-file-alt"></i></div>
              <span class="det-card-head-title">Detalles de la orden</span>
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
              <div class="det-card-head-icon"><i class="fas fa-building"></i></div>
              <span class="det-card-head-title">Sede de producción</span>
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
        <div v-if="order.photoUrl" class="col-12 col-md-8">
          <div class="det-card h-100">
            <div class="det-card-head">
              <div class="det-card-head-icon"><i class="fas fa-camera"></i></div>
              <span class="det-card-head-title">Evidencia fotográfica</span>
              <button class="btn-icon ms-auto" @click="openPhotoModal" title="Expandir evidencia">
                <i class="fas fa-expand"></i>
              </button>
            </div>
            <div class="det-photo-wrap">
              <img :src="photoFullUrl" alt="Evidencia de la orden" class="det-photo" @click="openPhotoModal" />
            </div>
          </div>
        </div>

      </div>

    </template>

  </div>

  <!-- Modal de evidencia: zoom + arrastre -->
  <BaseModal
    v-model="photoModalOpen"
    icon="fa-camera"
    title="Evidencia fotográfica"
    max-width="900px"
  >
    <div class="photo-modal-controls">
      <button class="btn-icon" @click="zoomOut" title="Alejar"><i class="fas fa-search-minus"></i></button>
      <button class="btn-icon" @click="resetView" title="Restablecer"><i class="fas fa-compress"></i></button>
      <button class="btn-icon" @click="zoomIn" title="Acercar"><i class="fas fa-search-plus"></i></button>
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
  </BaseModal>
</template>


<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { BASE } from '../api'
import PageHeader from '../components/PageHeader.vue'
import BaseModal from '../components/BaseModal.vue'

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
.nf-card {
  max-width: 460px; margin: 2rem auto;
  background: var(--paper); border: 1px solid var(--line);
  border-radius: 0.65rem; box-shadow: var(--shadow-sm);
}
.nf { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.75rem; text-align:center; padding: 2.5rem 1.5rem; }
.nf-icon-wrap {
  width: 64px; height: 64px; border-radius: 50%;
  background: var(--surface);
  display: grid; place-items: center;
  font-size:1.5rem; color:var(--ink-500); margin-bottom:0.5rem;
}
.nf-title { font-family:var(--font-display); font-size:1.1rem; font-weight:700; margin:0; }
.nf-sub   { color:var(--ink-500); font-size:0.85rem; margin:0 0 0.5rem; }

/* Columnas */
.det-cols-left { display:flex; flex-direction:column; }

/* Tarjetas de detalle */
.det-card {
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 0.65rem;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.det-card-head {
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid var(--line);
}
.det-card-head-icon {
  width: 30px; height: 30px; min-width: 30px;
  background: var(--accent);
  border-radius: 0.5rem;
  display: grid; place-items: center;
  color: #fff; font-size: 0.75rem;
}
.det-card-head-title {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08rem; color: var(--ink-700);
}
.det-card-body { padding: 0.25rem 1.1rem; }

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
.det-photo-wrap { padding: 1.25rem; background: var(--surface); }
.det-photo {
  display: block; margin: 0 auto;
  width: 100%; max-height: 620px; object-fit: contain;
  border-radius: 0.375rem; border: 1px solid var(--line);
  background: var(--paper);
  cursor: zoom-in;
}

/* Modal de evidencia: zoom + arrastre */
.photo-modal-controls { display: flex; gap: 0.5rem; justify-content: flex-end; }

.photo-modal-stage {
  position: relative;
  height: min(70vh, 560px);
  overflow: hidden;
  border-radius: 0.5rem;
  border: 1px solid var(--line);
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
  margin: 0;
}
</style>
