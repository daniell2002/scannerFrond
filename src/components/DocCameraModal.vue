<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="v => { if (!v) close() }"
    :icon="STEPS[step].icon"
    :title="STEPS[step].title"
    :subtitle="STEPS[step].subtitle"
    fullscreen
  >
    <!-- ══ 1. Cámara en vivo ══ -->
    <template v-if="step === 'live'">
      <!-- Ayuda + selector de cámara en una sola fila para dejarle el alto a la imagen -->
      <div class="dc-toolbar">
        <p class="dc-hint">
          <i class="fas fa-circle-info me-1"></i>
          <template v-if="resolution">{{ resolution }} · </template>Encuadra la hoja completa sobre un fondo que contraste.
        </p>
        <BaseSelect
          v-if="devices.length > 1"
          :model-value="deviceId"
          @update:model-value="selectDevice"
          :options="devices.map(d => ({ value: d.deviceId, label: d.label || 'Cámara' }))"
          icon="fa-video"
          size="sm"
          style="flex:1; min-width:200px"
        />
        <button class="btn-icon" title="Girar 90°" :disabled="!streaming" @click="rotation = (rotation + 90) % 360">
          <i class="fas fa-redo"></i>
        </button>
      </div>
    </template>

    <!-- ══ 2. Bordes ══ -->
    <div v-else-if="step === 'edges'" class="dc-toolbar">
      <p class="dc-hint" :class="{ 'is-warn': !autoDetected }">
        <i class="fas me-1" :class="autoDetected ? 'fa-crop-simple' : 'fa-triangle-exclamation'"></i>
        {{ autoDetected
          ? 'Bordes detectados. Arrastra los puntos si hace falta ajustarlos.'
          : 'No se detectó la hoja: arrastra los 4 puntos hasta sus esquinas.' }}
      </p>
      <button class="btn-add-outline btn-sm-tool" :disabled="!!busy" @click="redetect" title="Volver a detectar los bordes">
        <i class="fas fa-wand-magic-sparkles"></i>Detectar
      </button>
      <button class="btn-add-outline btn-sm-tool" :disabled="!!busy" @click="useWholeImage" title="Usar toda la imagen">
        <i class="fas fa-expand"></i>Toda la imagen
      </button>
    </div>

    <!-- ══ 3. Filtro y nitidez (ambos opcionales y combinables) ══ -->
    <div v-else class="dc-toolbar dc-filters">
      <div class="dc-group" role="radiogroup" aria-label="Filtro">
        <span class="dc-group-label">Filtro</span>
        <button
          v-for="f in FILTERS" :key="f.key"
          type="button"
          role="radio"
          class="dc-filter"
          :class="{ 'is-active': filter === f.key }"
          :aria-checked="filter === f.key"
          :disabled="!!busy"
          @click="setFilter(f.key)"
        >
          <i class="fas" :class="f.icon"></i>{{ f.label }}
        </button>
      </div>
      <div class="dc-group" role="radiogroup" aria-label="Nitidez">
        <span class="dc-group-label"><i class="fas fa-bullseye me-1"></i>Nitidez</span>
        <button
          v-for="s in SHARPNESS" :key="s.key"
          type="button"
          role="radio"
          class="dc-filter"
          :class="{ 'is-active': sharpness === s.key }"
          :aria-checked="sharpness === s.key"
          :disabled="!!busy"
          @click="setSharpness(s.key)"
        >{{ s.label }}</button>
      </div>
    </div>

    <!-- Escenario: el video, la foto con sus bordes o el resultado -->
    <div class="dc-stage">
      <video
        v-show="step === 'live'"
        ref="video"
        class="dc-video"
        :class="{ 'is-sideways': rotation % 180 !== 0 }"
        :style="{ transform: `rotate(${rotation}deg)` }"
        autoplay
        playsinline
        muted
      ></video>

      <!-- Foto capturada + esquinas arrastrables -->
      <template v-if="step === 'edges' && shotUrl">
        <img :src="shotUrl" class="dc-img" alt="Foto capturada" draggable="false" />
        <svg
          ref="svg"
          class="dc-svg"
          :viewBox="`0 0 ${shotSize.w} ${shotSize.h}`"
          preserveAspectRatio="xMidYMid meet"
          @pointermove="onDrag"
          @pointerup="endDrag"
          @pointercancel="endDrag"
        >
          <!-- Fuera de la hoja se oscurece -->
          <path class="dc-shade" fill-rule="evenodd" :d="`M0 0H${shotSize.w}V${shotSize.h}H0Z ${polyPath}`" />
          <path class="dc-poly" :d="polyPath" :style="{ strokeWidth: handleR * 0.35 }" />
          <circle
            v-for="(c, i) in corners" :key="i"
            class="dc-handle"
            :class="{ 'is-dragging': dragging === i }"
            :cx="c.x" :cy="c.y" :r="handleR"
            :style="{ strokeWidth: handleR * 0.3 }"
            @pointerdown.prevent="startDrag(i, $event)"
          />
        </svg>
      </template>

      <!-- Resultado: hoja enderezada con el filtro -->
      <img v-if="step === 'filter' && previewUrl" :src="previewUrl" class="dc-img dc-result" alt="Documento procesado" />

      <div v-if="step === 'live' && !streaming" class="dc-overlay">
        <template v-if="error">
          <i class="fas fa-video-slash"></i>
          <p>{{ error }}</p>
          <button class="btn-cancel" @click="startStream">Reintentar</button>
        </template>
        <template v-else>
          <span class="spin-icon"></span>
          <p>Conectando con la cámara…</p>
        </template>
      </div>

      <div v-if="busy" class="dc-overlay is-busy">
        <span class="spin-icon"></span>
        <p>{{ busy }}</p>
      </div>
    </div>

    <template #footer>
      <template v-if="step === 'live'">
        <button class="btn-cancel" @click="close">Cancelar</button>
        <button class="btn-save" :disabled="!streaming || !!busy" @click="capture">
          <i class="fas fa-camera"></i>Capturar
        </button>
      </template>
      <template v-else-if="step === 'edges'">
        <button class="btn-cancel" :disabled="!!busy" @click="retake"><i class="fas fa-rotate-left"></i>Repetir foto</button>
        <button class="btn-save" :disabled="!!busy" @click="toFilters">
          Recortar<i class="fas fa-arrow-right ms-1"></i>
        </button>
      </template>
      <template v-else>
        <button class="btn-cancel" :disabled="!!busy" @click="backToEdges"><i class="fas fa-arrow-left"></i>Bordes</button>
        <button class="btn-save" :disabled="!!busy" @click="usePhoto">
          <i class="fas fa-check"></i>Usar foto
        </button>
      </template>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseSelect from './BaseSelect.vue'
import { loadCv, detectCorners, defaultCorners, orderCorners, warpMat, filterMat, FILTERS, SHARPNESS } from '../utils/docScanner'

const props = defineProps({ modelValue: Boolean })
const emit  = defineEmits(['update:modelValue', 'capture'])

const STORAGE_KEY = 'doc_camera_id'

const STEPS = {
  live:   { icon: 'fa-camera',     title: 'Capturar con escáner', subtitle: 'Coloca la orden bajo la cámara de documentos' },
  edges:  { icon: 'fa-crop-simple', title: 'Ajustar bordes',       subtitle: 'Verifica que los puntos estén en las esquinas de la hoja' },
  filter: { icon: 'fa-sliders',    title: 'Filtro (opcional)',    subtitle: 'La hoja ya está recortada y enderezada' },
}

const video      = ref(null)
const devices    = ref([])
const deviceId   = ref('')
const streaming  = ref(false)
const error      = ref('')
const rotation   = ref(0)
const resolution = ref('')
let stream = null

const step = ref('live')
const busy = ref('')   // texto mientras se procesa; '' = libre

const readSaved = () => { try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' } }
const save      = (id) => { try { localStorage.setItem(STORAGE_KEY, id) } catch { /* sin almacenamiento */ } }

// Las cámaras integradas del portátil se descartan al elegir por defecto
const isBuiltIn = (label) => /hp hd|integrated|integrada|facetime|built-?in/i.test(label)

function stopStream() {
  stream?.getTracks().forEach(t => t.stop())
  stream = null
  streaming.value = false
}

async function listDevices() {
  const all = await navigator.mediaDevices.enumerateDevices()
  devices.value = all.filter(d => d.kind === 'videoinput')
}

function pickDefault() {
  const saved = readSaved()
  if (saved && devices.value.some(d => d.deviceId === saved)) return saved
  const external = devices.value.find(d => !isBuiltIn(d.label))
  return (external || devices.value[0])?.deviceId || ''
}

async function startStream() {
  error.value = ''
  stopStream()
  if (!navigator.mediaDevices?.getUserMedia) {
    error.value = 'Este navegador no permite usar la cámara (se requiere HTTPS o localhost).'
    return
  }
  try {
    // Primer permiso: sin él, el navegador no expone los nombres de las cámaras
    if (!devices.value.some(d => d.label)) {
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true })
      tmp.getTracks().forEach(t => t.stop())
      await listDevices()
    }
    if (!deviceId.value) deviceId.value = pickDefault()

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: deviceId.value ? { exact: deviceId.value } : undefined,
        // La KB-700 entrega hasta 8 MP; se pide la mayor resolución disponible
        width:  { ideal: 3264 },
        height: { ideal: 2448 },
      },
    })
    await nextTick()
    video.value.srcObject = stream
    await video.value.play().catch(() => {})
    const s = stream.getVideoTracks()[0]?.getSettings() || {}
    resolution.value = s.width ? `${s.width}×${s.height}` : ''
    streaming.value = true
  } catch (e) {
    error.value = e?.name === 'NotAllowedError'
      ? 'Permiso de cámara denegado. Habilítalo en el candado de la barra de direcciones.'
      : e?.name === 'NotReadableError'
        ? 'La cámara está en uso por otra aplicación. Ciérrala e intenta de nuevo.'
        : 'No se encontró la cámara de documentos. Verifica que esté conectada por USB.'
  }
}

function selectDevice(id) {
  deviceId.value = id
  save(id)
  startStream()
}

/* ── Foto capturada ── */

let shot = null              // <canvas> con la foto a resolución completa
const shotUrl  = ref('')
const shotSize = ref({ w: 1, h: 1 })

const toBlob = (canvas, quality = 0.92) =>
  new Promise(r => canvas.toBlob(r, 'image/jpeg', quality))

const asFile = (blob) => new File([blob], `orden-${Date.now()}.jpg`, { type: 'image/jpeg' })

async function capture() {
  const v = video.value
  if (!v?.videoWidth) return
  const rotated = rotation.value % 180 !== 0
  const canvas = document.createElement('canvas')
  canvas.width  = rotated ? v.videoHeight : v.videoWidth
  canvas.height = rotated ? v.videoWidth  : v.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((rotation.value * Math.PI) / 180)
  ctx.drawImage(v, -v.videoWidth / 2, -v.videoHeight / 2)
  if (deviceId.value) save(deviceId.value)

  busy.value = 'Detectando los bordes de la hoja…'
  let cv
  try {
    cv = await loadCv()
  } catch {
    // Sin el detector (p. ej. sin conexión al descargarlo) se usa la foto tal cual
    busy.value = ''
    const blob = await toBlob(canvas)
    if (blob) emit('capture', asFile(blob))
    close()
    return
  }

  shot = canvas
  shotSize.value = { w: canvas.width, h: canvas.height }
  revoke('shot')
  shotUrl.value = URL.createObjectURL(await toBlob(canvas, 0.85))
  runDetection(cv)
  step.value = 'edges'
  busy.value = ''
}

/* ── Paso 2: esquinas ── */

const corners      = ref([])
const autoDetected = ref(false)
const svg          = ref(null)
const dragging     = ref(-1)

// Radio de los puntos proporcional a la foto, para que se vean igual en cualquier resolución
const handleR  = computed(() => Math.max(shotSize.value.w, shotSize.value.h) * 0.014)
const polyPath = computed(() =>
  corners.value.length ? `M${corners.value.map(c => `${c.x} ${c.y}`).join('L')}Z` : '')

function runDetection(cv) {
  const found = detectCorners(cv, shot)
  autoDetected.value = !!found
  corners.value = found || defaultCorners(shot.width, shot.height)
}

async function redetect() {
  busy.value = 'Detectando los bordes de la hoja…'
  await nextTick()
  try { runDetection(await loadCv()) } finally { busy.value = '' }
}

function useWholeImage() {
  corners.value = defaultCorners(shot.width, shot.height, 0)
}

/** Posición del puntero en coordenadas de la foto. */
function toImagePoint(e) {
  const el = svg.value
  const pt = el.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const p = pt.matrixTransform(el.getScreenCTM().inverse())
  return {
    x: Math.min(shotSize.value.w, Math.max(0, p.x)),
    y: Math.min(shotSize.value.h, Math.max(0, p.y)),
  }
}

function startDrag(i, e) {
  dragging.value = i
  svg.value?.setPointerCapture?.(e.pointerId)
}

function onDrag(e) {
  if (dragging.value < 0) return
  corners.value[dragging.value] = toImagePoint(e)
}

function endDrag(e) {
  if (dragging.value < 0) return
  svg.value?.releasePointerCapture?.(e.pointerId)
  dragging.value = -1
}

function retake() {
  resetShot()
  step.value = 'live'
  if (!streaming.value) startStream()
}

/* ── Paso 3: filtro ── */

let warped = null                // cv.Mat de la hoja enderezada (se libera al salir)
// Sin filtro por defecto: solo se aplica si el usuario lo elige
const filter     = ref('original')
const sharpness  = ref('none')
const previewUrl = ref('')
let resultCanvas = null

async function renderFilter(cv) {
  const out = filterMat(cv, warped, filter.value, sharpness.value)
  resultCanvas ??= document.createElement('canvas')
  cv.imshow(resultCanvas, out)
  out.delete()
  revoke('preview')
  previewUrl.value = URL.createObjectURL(await toBlob(resultCanvas, 0.85))
}

async function toFilters() {
  busy.value = 'Recortando y enderezando la hoja…'
  await nextTick()
  try {
    const cv = await loadCv()
    // Las esquinas pueden haberse cruzado al arrastrarlas: se reordenan
    const src = cv.imread(shot)
    warped?.delete()
    warped = warpMat(cv, src, orderCorners(corners.value))
    src.delete()
    await renderFilter(cv)
    step.value = 'filter'
  } finally {
    busy.value = ''
  }
}

async function setFilter(key) {
  if (filter.value === key) return
  filter.value = key
  busy.value = 'Aplicando filtro…'
  await nextTick()
  try { await renderFilter(await loadCv()) } finally { busy.value = '' }
}

async function setSharpness(key) {
  if (sharpness.value === key) return
  sharpness.value = key
  busy.value = 'Ajustando nitidez…'
  await nextTick()
  try { await renderFilter(await loadCv()) } finally { busy.value = '' }
}

function backToEdges() {
  freeWarped()
  step.value = 'edges'
}

async function usePhoto() {
  if (!resultCanvas) return
  busy.value = 'Guardando…'
  try {
    const blob = await toBlob(resultCanvas, 0.9)
    if (blob) emit('capture', asFile(blob))
    close()
  } finally {
    busy.value = ''
  }
}

/* ── Limpieza ── */

function revoke(which) {
  if (which === 'shot' && shotUrl.value)    { URL.revokeObjectURL(shotUrl.value); shotUrl.value = '' }
  if (which === 'preview' && previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = '' }
}

function freeWarped() {
  warped?.delete()
  warped = null
  revoke('preview')
}

function resetShot() {
  freeWarped()
  revoke('shot')
  shot = null
  resultCanvas = null
  corners.value = []
  dragging.value = -1
  filter.value = 'original'
  sharpness.value = 'none'
}

function close() {
  stopStream()
  resetShot()
  step.value = 'live'
  busy.value = ''
  emit('update:modelValue', false)
}

watch(() => props.modelValue, open => {
  if (open) {
    startStream()
    // Se descarga el detector mientras se encuadra la hoja; si falla, se reintenta al capturar
    loadCv().catch(() => {})
  } else {
    stopStream()
  }
})
onBeforeUnmount(() => { stopStream(); resetShot() })
</script>

<style scoped>
.dc-toolbar { display:flex; align-items:center; gap:0.6rem; flex-shrink:0; flex-wrap:wrap; }
.btn-sm-tool { padding:0.35rem 0.75rem; font-size:0.78rem; }

/* La vista en vivo / la foto llenan todo el alto libre del modal */
.dc-stage {
  position:relative; width:100%; flex:1; min-height:0; overflow:hidden;
  background:#0f172a; border-radius:0.5rem;
  /* Una celda de tamaño fijo (100 %): así el video y la foto se ajustan al
     escenario y se ven completos, en vez de crecer a su tamaño natural */
  display:grid; grid-template:100% / 100%; place-items:center;
  container-type:size;
}
.dc-stage > * { grid-area:1 / 1; }
.dc-video { width:100%; height:100%; object-fit:contain; transition:transform 0.2s; }
/* Girada 90°/270°: se intercambian ancho y alto para que siga cabiendo completa */
.dc-video.is-sideways { width:100cqh; height:100cqw; }

.dc-img { width:100%; height:100%; object-fit:contain; user-select:none; }
.dc-result { background:#fff; }

/* Esquinas sobre la foto: el SVG usa las mismas proporciones que la imagen */
.dc-svg { width:100%; height:100%; touch-action:none; }
.dc-shade { fill:rgba(15, 23, 42, 0.55); }
.dc-poly  { fill:none; stroke:var(--accent); stroke-linejoin:round; }
.dc-handle {
  fill:rgba(255, 255, 255, 0.9); stroke:var(--accent);
  cursor:grab; transition:r 0.1s;
}
.dc-handle.is-dragging { cursor:grabbing; fill:var(--accent); }

/* Filtros */
.dc-filters { gap:0.4rem 1.25rem; }
.dc-group { display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap; }
.dc-group-label { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05rem; color:var(--ink-500); margin-right:0.15rem; }
.dc-filter {
  display:inline-flex; align-items:center; gap:0.4rem;
  padding:0.4rem 0.8rem; border-radius:999px;
  border:1px solid var(--line); background:var(--paper); color:var(--ink-700);
  font-size:0.8rem; font-weight:600; cursor:pointer;
  transition:background 0.14s, border-color 0.14s, color 0.14s;
}
.dc-filter:hover:not(:disabled):not(.is-active) { border-color:var(--accent); color:var(--accent-strong); }
.dc-filter.is-active { background:var(--accent); border-color:var(--accent); color:#fff; }
.dc-filter:disabled { opacity:0.6; cursor:wait; }

.dc-overlay {
  position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:0.6rem; padding:1.5rem; text-align:center; color:#cbd5e1; font-size:0.85rem;
}
.dc-overlay.is-busy { background:rgba(15, 23, 42, 0.55); color:#fff; }
.dc-overlay i { font-size:2rem; opacity:0.6; }
.dc-overlay p { margin:0; max-width:340px; }
.dc-overlay .btn-cancel { color:#fff; border-color:rgba(255,255,255,0.35); }

.dc-hint { flex:1; min-width:0; margin:0; font-size:0.75rem; color:var(--ink-500); }
.dc-hint.is-warn { color:var(--warning, #b7791f); }

.spin-icon {
  width:1.6rem; height:1.6rem; border-radius:50%;
  border:3px solid rgba(255,255,255,0.25); border-top-color:#fff;
  animation:dc-spin 0.8s linear infinite;
}
@keyframes dc-spin { to { transform:rotate(360deg); } }
</style>
