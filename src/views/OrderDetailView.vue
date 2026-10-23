<template>
  <div class="page-wrap">

    <!-- Cargando (entrada directa por enlace) -->
    <div v-if="!order && !loaded" class="state-loading"><i class="fas fa-spinner fa-spin me-2"></i>Cargando orden…</div>

    <!-- 404 -->
    <div v-else-if="!order" class="nf-card">
      <div class="nf">
        <div class="nf-icon-wrap"><i class="fas fa-inbox"></i></div>
        <h2 class="nf-title">Orden no encontrada</h2>
        <p class="nf-sub">La orden {{ route.params.code }} no existe o no tienes acceso a ella.</p>
        <button type="button" class="btn-save" @click="goBack">
          <i class="fas fa-arrow-left"></i>Volver
        </button>
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
          <div class="det-actions">
            <button
              v-if="isAdmin || feedbackList.length"
              class="btn-add-outline fb-btn"
              :title="unseenCount ? unseenTitle : 'Ver retroalimentación'"
              @click="openFeedbackHistory"
            >
              <i class="fas fa-comment-dots"></i>Retroalimentación
              <span v-if="feedbackList.length" class="fb-btn-count">{{ feedbackList.length }}</span>
              <span v-if="unseenCount" class="fb-btn-dot" aria-hidden="true"></span>
            </button>
            <button v-if="canEdit" class="btn-add-outline" @click="editOpen = true">
              <i class="fas fa-pen-to-square"></i>Corregir
            </button>
            <button v-if="canDelete" class="btn-add-outline do-btn" @click="deleteOpen = true">
              <i class="fas fa-trash"></i>Eliminar
            </button>
            <button class="btn-add-outline" @click="goBack">
              <i class="fas fa-arrow-left"></i>Volver
            </button>
          </div>
        </template>
      </PageHeader>

      <!-- Detalles + Sede a la izquierda, evidencia a la derecha -->
      <div class="row mb-4">

        <div class="col-12 det-cols-left" :class="photoList.length ? 'col-md-4' : 'col-md-12'">

          <!-- Detalles -->
          <div class="det-card mb-4">
            <div class="det-card-head">
              <div class="det-card-head-icon"><i class="fas fa-file-alt"></i></div>
              <span class="det-card-head-title">Detalles de la orden</span>
            </div>
            <div class="det-card-body">
              <div class="field-row">
                <span class="field-k">Atendido por</span>
                <span class="field-v">{{ order.attendedBy || '—' }}</span>
              </div>
              <div class="field-row">
                <span class="field-k">Registrada por</span>
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
        <div v-if="photoList.length" class="col-12 col-md-8">
          <div class="det-card h-100">
            <div class="det-card-head">
              <div class="det-card-head-icon"><i class="fas fa-camera"></i></div>
              <span class="det-card-head-title">Evidencia fotográfica</span>
              <span v-if="photoList.length > 1" class="table-card-count ms-2">{{ photoList.length }} fotos</span>
              <button class="btn-icon ms-auto" @click="openPhotoModal" title="Expandir evidencia">
                <i class="fas fa-expand"></i>
              </button>
            </div>
            <div class="det-photo-wrap">
              <img :src="photoFullUrl" :alt="`Evidencia ${photoIdx + 1} de la orden`" class="det-photo" @click="openPhotoModal" />
            </div>
            <div v-if="photoList.length > 1" class="det-strip">
              <button
                v-for="(src, i) in photoList"
                :key="src"
                type="button"
                class="det-thumb"
                :class="{ 'is-active': i === photoIdx }"
                :title="`Foto ${i + 1}`"
                @click="photoIdx = i"
              >
                <img :src="src" :alt="`Foto ${i + 1}`" />
                <span>{{ i + 1 }}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Trazabilidad: correcciones hechas a la orden -->
      <div v-if="order.edits?.length" class="det-card mb-4">
        <div class="det-card-head">
          <div class="det-card-head-icon"><i class="fas fa-clock-rotate-left"></i></div>
          <span class="det-card-head-title">Historial de cambios</span>
          <span class="table-card-count ms-2">{{ order.edits.length }}</span>
        </div>
        <div class="ed-body"><OrderEditsList :edits="order.edits" /></div>
      </div>

    </template>

  </div>

  <!-- Modal: historial de retroalimentación -->
  <BaseModal
    v-model="fbHistoryOpen"
    icon="fa-comments"
    :title="order ? `Retroalimentación · orden ${order.code}` : 'Retroalimentación'"
    :subtitle="feedbackList.length
      ? `${feedbackList.length} ${feedbackList.length === 1 ? 'comentario' : 'comentarios'}`
      : 'Sin comentarios aún'"
    max-width="600px"
  >
    <div v-if="!feedbackList.length" class="fb-empty">
      <i class="fas fa-comment-slash"></i>
      <p>Esta orden aún no tiene retroalimentación.</p>
    </div>

    <div class="fb-list">
      <article v-for="f in feedbackList" :key="f.id" class="fb-item" :class="{ 'is-new': newIds.has(f.id) }">

        <!-- Quién, para quién y cuándo -->
        <header class="fb-head">
          <span class="fb-avatar">{{ initials(f.authorName) }}</span>
          <div class="fb-who">
            <span class="fb-author">
              {{ f.authorName }}
              <span v-if="newIds.has(f.id)" class="fb-new">Nueva</span>
            </span>
            <span class="fb-recipient">Para <strong>{{ f.recipientName || 'Sin destinatario' }}</strong></span>
          </div>
          <time class="fb-date" :datetime="f.createdAt">
            <span>{{ fmtFbDate(f.createdAt) }}</span>
            <span class="fb-time">{{ fmtFbTime(f.createdAt) }}</span>
          </time>
        </header>

        <!-- Contenido -->
        <div class="fb-body">
          <p class="fb-label">Observaciones</p>
          <p class="fb-comment">{{ f.comment }}</p>

          <template v-if="f.evidences.length">
            <p class="fb-label mt-3">Evidencias ({{ f.evidences.length }})</p>
            <div class="fb-grid">
              <a v-for="(src, i) in f.evidences" :key="src" :href="BASE + src" target="_blank" rel="noopener" class="fb-thumb" :title="`Abrir evidencia ${i + 1}`">
                <img :src="BASE + src" :alt="`Evidencia ${i + 1}`" />
              </a>
            </div>
          </template>
        </div>

        <!-- Estado: corregida > vista > sin ver -->
        <footer class="fb-foot" :class="f.resolvedAt ? 'is-resolved' : f.seenAt ? 'is-seen' : 'is-pending'">
          <i class="fas" :class="f.resolvedAt ? 'fa-circle-check' : f.seenAt ? 'fa-check-double' : 'fa-clock'"></i>
          <span v-if="f.resolvedAt">
            Corregida por {{ f.recipientName }} el {{ fmtFbDate(f.resolvedAt) }} a las {{ fmtFbTime(f.resolvedAt) }}
          </span>
          <span v-else-if="f.seenAt">
            Vista por {{ f.recipientName }} el {{ fmtFbDate(f.seenAt) }} a las {{ fmtFbTime(f.seenAt) }} · aún sin corregir
          </span>
          <span v-else>{{ f.recipientName || 'El supervisor' }} aún no la ha visto</span>
        </footer>
      </article>
    </div>

    <template v-if="isAdmin" #footer>
      <button class="btn-save" @click="openFeedbackModal">
        <i class="fas fa-plus"></i>Nueva retroalimentación
      </button>
    </template>
  </BaseModal>

  <!-- Modal: nueva retroalimentación (admin) -->
  <BaseModal
    v-model="fbModalOpen"
    icon="fa-comment-dots"
    title="Retroalimentación"
    :subtitle="order ? `${order.code} · para ${order.operator}` : ''"
    max-width="560px"
  >
    <label class="mf-label">Comentario <span class="freq">*</span></label>
    <textarea
      v-model="fbComment"
      class="form-control fb-textarea"
      rows="4"
      maxlength="1000"
      placeholder="Describe lo que se debe corregir o tener en cuenta…"
    ></textarea>
    <div class="fb-counter">{{ fbComment.length }}/1000</div>

    <label class="mf-label mt-3">Evidencias <small class="text-muted">(opcional, máx. 5 imágenes)</small></label>
    <div class="fb-upload-grid">
      <div v-for="(p, i) in fbPreviews" :key="p.url" class="fb-thumb fb-thumb-edit">
        <img :src="p.url" :alt="p.file.name" />
        <button type="button" class="fb-remove" title="Quitar" @click="removeEvidence(i)">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <label v-if="fbPreviews.length < 5" class="fb-add">
        <input type="file" accept="image/*" multiple hidden @change="onEvidence" />
        <i class="fas fa-camera"></i>
        <span>Agregar</span>
      </label>
    </div>

    <template #footer>
      <button class="btn-cancel" @click="fbModalOpen = false">Cancelar</button>
      <button class="btn-save" :disabled="!fbComment.trim() || fbSending" @click="sendFeedback">
        <i class="fas" :class="fbSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
        {{ fbSending ? 'Enviando…' : 'Enviar al supervisor' }}
      </button>
    </template>
  </BaseModal>

  <!-- Modal de evidencia: zoom + arrastre -->
  <BaseModal
    v-model="photoModalOpen"
    icon="fa-camera"
    title="Evidencia fotográfica"
    :subtitle="photoList.length > 1 ? `Foto ${photoIdx + 1} de ${photoList.length}` : ''"
    max-width="900px"
  >
    <div class="photo-modal-controls">
      <button v-if="photoList.length > 1" class="btn-icon" @click="prevPhoto" title="Foto anterior"><i class="fas fa-chevron-left"></i></button>
      <button class="btn-icon" @click="zoomOut" title="Alejar"><i class="fas fa-search-minus"></i></button>
      <button class="btn-icon" @click="resetView" title="Restablecer"><i class="fas fa-compress"></i></button>
      <button class="btn-icon" @click="zoomIn" title="Acercar"><i class="fas fa-search-plus"></i></button>
      <button v-if="photoList.length > 1" class="btn-icon" @click="nextPhoto" title="Foto siguiente"><i class="fas fa-chevron-right"></i></button>
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

  <EditOrderModal v-model="editOpen" :order="order" @saved="onCorrected" />
  <DeleteOrderModal v-model="deleteOpen" :order="order" @deleted="goBack" />
</template>


<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { useReviewsStore } from '../stores/reviews'
import { useFeedbackStore } from '../stores/feedback'
import { useAuthStore } from '../stores/auth'
import { BASE } from '../api'
import PageHeader from '../components/PageHeader.vue'
import EditOrderModal from '../components/EditOrderModal.vue'
import DeleteOrderModal from '../components/DeleteOrderModal.vue'
import OrderEditsList from '../components/OrderEditsList.vue'
import BaseModal from '../components/BaseModal.vue'

const route  = useRoute()
const router = useRouter()

// Vuelve a la vista anterior (Órdenes, Historial…); si se entró directo, a Órdenes
const goBack = () => window.history.state?.back ? router.back() : router.push('/ordenes')
const ordersStore = useOrdersStore()
const order = computed(() => ordersStore.getOrderByCode(route.params.code))

/* Corregir la orden (permiso "Editar órdenes") y su historial de cambios */
const editOpen = ref(false)
const canEdit  = computed(() => useAuthStore().hasPermission('editar_ordenes'))
// Si cambió el código, la URL se actualiza al nuevo
const onCorrected = (o) => { if (o.code !== route.params.code) router.replace(`/orden/${o.code}`) }

/* Eliminar la orden (permiso "Eliminar órdenes"); al terminar se vuelve a la tabla */
const deleteOpen = ref(false)
const canDelete  = computed(() => useAuthStore().hasPermission('eliminar_ordenes'))

// Si se entra directo por enlace, las órdenes aún no están cargadas
const loaded = ref(ordersStore.orders.length > 0)
onMounted(async () => {
  if (!order.value) await ordersStore.fetchOrders()
  loaded.value = true
})
/* Abrir la orden cuenta como revisada (solo admin) */
const reviews  = useReviewsStore()
const auth     = useAuthStore()
const feedback = useFeedbackStore()
// Solo el admin revisa órdenes y envía observaciones (el supervisor las registra)
const isAdmin  = computed(() => auth.user?.role === 'admin')
watch(order, o => {
  if (o?.pendingReview && isAdmin.value) reviews.markReviewed(o.code)
}, { immediate: true })

/* Retroalimentación: historial + modal de envío */
const feedbackList = ref([])
const loadFeedback = async () => {
  feedbackList.value = route.params.code ? await feedback.fetchForOrder(route.params.code) : []
}
watch(() => route.params.code, loadFeedback, { immediate: true })

/* Pendientes: el supervisor no las ha visto (para el admin: aún no las lee el supervisor) */
const unseenCount = computed(() => feedbackList.value.filter(f => !f.seenAt).length)
const unseenTitle = computed(() => isAdmin.value
  ? 'El supervisor aún no ha visto la retroalimentación'
  : 'Tienes retroalimentación sin revisar')

const initials  = (name = '') => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
const fmtFbDate = (d) => new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtFbTime = (d) => new Date(d).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })

const fbHistoryOpen = ref(false)
const newIds = ref(new Set())   // resaltadas como "Nueva" mientras el modal está abierto

function openFeedbackHistory() {
  newIds.value = new Set(feedbackList.value.filter(f => !f.seenAt).map(f => f.id))
  fbHistoryOpen.value = true
  // Solo el destinatario (supervisor) puede marcarlas como vistas
  if (!isAdmin.value) feedback.markSeen(feedbackList.value)
}

const fbModalOpen = ref(false)
const fbComment   = ref('')
const fbPreviews  = ref([])   // [{ file, url }]
const fbSending   = ref(false)

function clearPreviews() {
  fbPreviews.value.forEach(p => URL.revokeObjectURL(p.url))
  fbPreviews.value = []
}

function openFeedbackModal() {
  fbComment.value = ''
  clearPreviews()
  fbHistoryOpen.value = false
  fbModalOpen.value = true
}

function onEvidence(e) {
  const files = [...(e.target.files || [])].filter(f => f.type.startsWith('image/'))
  e.target.value = ''
  const room = 5 - fbPreviews.value.length
  files.slice(0, room).forEach(file => fbPreviews.value.push({ file, url: URL.createObjectURL(file) }))
}

function removeEvidence(i) {
  URL.revokeObjectURL(fbPreviews.value[i].url)
  fbPreviews.value.splice(i, 1)
}

async function sendFeedback() {
  if (!fbComment.value.trim() || fbSending.value) return
  fbSending.value = true
  try {
    const fb = await feedback.send(order.value.code, fbComment.value.trim(), fbPreviews.value.map(p => p.file))
    if (fb) {
      fbModalOpen.value = false
      clearPreviews()
      loadFeedback()
    }
  } finally {
    fbSending.value = false
  }
}

/* Fotos de la orden (puede tener varias páginas) */
const photoList    = computed(() => (order.value?.photos?.length ? order.value.photos : (order.value?.photoUrl ? [order.value.photoUrl] : [])).map(p => `${BASE}${p}`))
const photoIdx     = ref(0)
const photoFullUrl = computed(() => photoList.value[photoIdx.value] || photoList.value[0] || '')
watch(() => route.params.code, () => { photoIdx.value = 0 })
const prevPhoto = () => { photoIdx.value = (photoIdx.value - 1 + photoList.value.length) % photoList.value.length; resetView() }
const nextPhoto = () => { photoIdx.value = (photoIdx.value + 1) % photoList.value.length; resetView() }

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
/* Historial de cambios */
.ed-body { padding:0.75rem 1.25rem 1rem; }

/* Acciones de cabecera */
.do-btn:hover { color:var(--danger); border-color:var(--danger); }
.det-actions { display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap; }

/* Botón de retroalimentación con aviso de pendientes */
.fb-btn { position:relative; }
.fb-btn-count {
  display:inline-grid; place-items:center; min-width:1.25rem; height:1.25rem; padding:0 0.35rem;
  border-radius:999px; font-size:0.68rem; font-weight:700;
  background:color-mix(in srgb, var(--accent) 14%, transparent); color:var(--accent-strong);
}
.fb-btn-dot {
  position:absolute; top:-4px; right:-4px;
  width:12px; height:12px; border-radius:50%;
  background:#e5322d; border:2px solid var(--paper);
  animation:fb-blink 1.2s ease-in-out infinite;
}
.fb-btn-dot::after {
  content:''; position:absolute; inset:-2px; border-radius:50%;
  border:2px solid #e5322d;
  animation:fb-ping 1.2s ease-out infinite;
}
@keyframes fb-blink { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
@keyframes fb-ping  { from { transform:scale(1); opacity:0.8; } to { transform:scale(2.2); opacity:0; } }
@media (prefers-reduced-motion: reduce) {
  .fb-btn-dot, .fb-btn-dot::after { animation:none; }
}

/* Retroalimentación: historial (modal) */
.fb-empty { display:flex; flex-direction:column; align-items:center; gap:0.5rem; padding:1.5rem 0; color:var(--ink-500); font-size:0.85rem; }
.fb-empty i { font-size:1.5rem; }
.fb-empty p { margin:0; }
.fb-list { display:flex; flex-direction:column; gap:0.9rem; }
.fb-item { border:1px solid var(--line); border-radius:0.75rem; overflow:hidden; background:var(--paper); }
.fb-item.is-new { border-color:color-mix(in srgb, #e5322d 45%, transparent); box-shadow:0 0 0 3px color-mix(in srgb, #e5322d 10%, transparent); }

.fb-head { display:flex; align-items:center; gap:0.75rem; padding:0.85rem 1rem; border-bottom:1px solid var(--line); }
.fb-avatar {
  width:2.25rem; height:2.25rem; min-width:2.25rem; border-radius:50%;
  display:grid; place-items:center; font-size:0.75rem; font-weight:700;
  color:#fff; background:linear-gradient(135deg, var(--accent), var(--accent-strong));
}
.fb-who { display:flex; flex-direction:column; min-width:0; }
.fb-author { display:flex; align-items:center; gap:0.45rem; font-size:0.875rem; font-weight:700; color:var(--ink-900); }
.fb-recipient { font-size:0.75rem; color:var(--ink-500); }
.fb-recipient strong { color:var(--ink-700); font-weight:600; }
.fb-new { font-size:0.58rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05rem; color:#fff; background:#e5322d; padding:0.1rem 0.45rem; border-radius:999px; }
.fb-date { margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; font-size:0.75rem; font-weight:600; color:var(--ink-700); white-space:nowrap; }
.fb-time { font-size:0.7rem; font-weight:500; color:var(--ink-500); }

.fb-body { padding:0.9rem 1rem 1rem; }
.fb-label { margin:0 0 0.35rem; font-size:0.62rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08rem; color:var(--ink-500); }
.fb-comment {
  margin:0; padding:0.7rem 0.85rem; border-radius:0.5rem;
  background:color-mix(in srgb, var(--accent) 5%, var(--paper)); border-left:3px solid var(--accent);
  white-space:pre-wrap; word-break:break-word; font-size:0.875rem; line-height:1.55; color:var(--ink-900);
}
.fb-grid { display:flex; flex-wrap:wrap; gap:0.5rem; }
.fb-thumb { position:relative; display:block; width:72px; height:72px; border-radius:0.5rem; overflow:hidden; border:1px solid var(--line); }
.fb-thumb img { width:100%; height:100%; object-fit:cover; transition:transform 0.15s; }
.fb-thumb:hover img { transform:scale(1.05); }

.fb-foot { display:flex; align-items:center; gap:0.45rem; padding:0.6rem 1rem; font-size:0.75rem; font-weight:600; border-top:1px solid var(--line); }
.fb-foot.is-seen    { color:var(--success); background:color-mix(in srgb, var(--success) 6%, transparent); }
.fb-foot.is-pending { color:#b7770b; background:rgba(225,161,26,0.08); }
.fb-foot.is-resolved { color:var(--accent-strong); background:var(--accent-soft); }

@media (max-width: 480px) {
  .fb-head { flex-wrap:wrap; }
  .fb-date { margin-left:3rem; flex-direction:row; gap:0.35rem; align-items:center; }
}

/* Retroalimentación: modal */
.fb-textarea { margin-top:0.4rem; resize:vertical; font-size:0.875rem; }
.fb-counter { text-align:right; font-size:0.7rem; color:var(--ink-500); margin-top:0.2rem; }
.fb-upload-grid { display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.45rem; }
.fb-thumb-edit { width:80px; height:80px; }
.fb-remove { position:absolute; top:0.2rem; right:0.2rem; width:1.35rem; height:1.35rem; display:grid; place-items:center; border:none; border-radius:50%; background:rgba(0,0,0,0.6); color:#fff; font-size:0.65rem; cursor:pointer; }
.fb-add { width:80px; height:80px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.25rem; border:1.5px dashed var(--line); border-radius:0.5rem; color:var(--ink-500); font-size:0.72rem; cursor:pointer; transition:border-color 0.14s, color 0.14s; }
.fb-add:hover { border-color:var(--accent); color:var(--accent); }
.fb-add i { font-size:1.1rem; }
.freq { color:var(--danger); }
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
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--line);
}
.det-card-head-icon {
  width: 1rem; min-width: 1rem;
  display: grid; place-items: center;
  color: var(--ink-400); font-size: 0.85rem;
}
.det-card-head-title { font-size: 0.9rem; font-weight: 600; color: var(--ink-900); }
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
.det-photo-wrap { padding: 1.25rem; background: var(--surface); }
.det-strip { display:flex; gap:0.5rem; padding:0.75rem 1.25rem; overflow-x:auto; border-top:1px solid var(--line); }
.det-thumb { position:relative; flex:0 0 auto; width:64px; height:80px; padding:0; border:2px solid transparent; border-radius:0.45rem; overflow:hidden; background:var(--surface); cursor:pointer; }
.det-thumb.is-active { border-color:var(--accent); }
.det-thumb img { width:100%; height:100%; object-fit:cover; }
.det-thumb span { position:absolute; left:0.2rem; bottom:0.2rem; min-width:1.1rem; padding:0 0.25rem; border-radius:999px; background:rgba(0,0,0,0.6); color:#fff; font-size:0.62rem; font-weight:700; text-align:center; }
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
