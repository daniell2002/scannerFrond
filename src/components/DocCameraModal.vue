<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="v => { if (!v) close() }"
    icon="fa-camera"
    title="Capturar con escáner"
    subtitle="Coloca la orden bajo la cámara de documentos"
    fullscreen
  >
    <!-- Ayuda + selector de cámara en una sola fila para dejarle el alto a la imagen -->
    <div class="dc-toolbar">
      <p class="dc-hint">
        <i class="fas fa-circle-info me-1"></i>
        <template v-if="resolution">{{ resolution }} · </template>Encuadra la hoja completa y asegúrate de que se vea nítida.
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

    <!-- Vista en vivo -->
    <div class="dc-stage">
      <video
        ref="video"
        class="dc-video"
        :class="{ 'is-sideways': rotation % 180 !== 0 }"
        :style="{ transform: `rotate(${rotation}deg)` }"
        autoplay
        playsinline
        muted
      ></video>

      <div v-if="!streaming" class="dc-overlay">
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
    </div>

    <template #footer>
      <button class="btn-cancel" @click="close">Cancelar</button>
      <button class="btn-save" :disabled="!streaming" @click="capture">
        <i class="fas fa-camera"></i>Capturar
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import BaseModal from './BaseModal.vue'
import BaseSelect from './BaseSelect.vue'

const props = defineProps({ modelValue: Boolean })
const emit  = defineEmits(['update:modelValue', 'capture'])

const STORAGE_KEY = 'doc_camera_id'

const video      = ref(null)
const devices    = ref([])
const deviceId   = ref('')
const streaming  = ref(false)
const error      = ref('')
const rotation   = ref(0)
const resolution = ref('')
let stream = null

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

function capture() {
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

  canvas.toBlob(blob => {
    if (!blob) return
    if (deviceId.value) save(deviceId.value)
    emit('capture', new File([blob], `orden-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    close()
  }, 'image/jpeg', 0.92)
}

function close() {
  stopStream()
  emit('update:modelValue', false)
}

watch(() => props.modelValue, open => { open ? startStream() : stopStream() })
onBeforeUnmount(stopStream)
</script>

<style scoped>
.dc-toolbar { display:flex; align-items:center; gap:0.6rem; flex-shrink:0; }

/* La vista en vivo llena todo el alto libre del modal */
.dc-stage {
  position:relative; width:100%; flex:1; min-height:0; overflow:hidden;
  background:#0f172a; border-radius:0.5rem;
  display:grid; place-items:center;
  container-type:size;
}
.dc-video { width:100%; height:100%; object-fit:contain; transition:transform 0.2s; }
/* Girada 90°/270°: se intercambian ancho y alto para que siga cabiendo completa */
.dc-video.is-sideways { width:100cqh; height:100cqw; }

.dc-overlay {
  position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:0.6rem; padding:1.5rem; text-align:center; color:#cbd5e1; font-size:0.85rem;
}
.dc-overlay i { font-size:2rem; opacity:0.6; }
.dc-overlay p { margin:0; max-width:340px; }
.dc-overlay .btn-cancel { color:#fff; border-color:rgba(255,255,255,0.35); }

.dc-hint { flex:1; min-width:0; margin:0; font-size:0.75rem; color:var(--ink-500); }

.spin-icon {
  width:1.6rem; height:1.6rem; border-radius:50%;
  border:3px solid rgba(255,255,255,0.25); border-top-color:#fff;
  animation:dc-spin 0.8s linear infinite;
}
@keyframes dc-spin { to { transform:rotate(360deg); } }
</style>
