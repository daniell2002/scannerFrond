<template>
  <section class="scanner-page">
    <div class="scanner-container">
      <div class="scanner-layout" :class="{ 'result-only': lastOrder }">

        <!-- ══ PANEL IZQUIERDO ══ -->
        <div v-if="!lastOrder" class="left-panel">

          <!-- Cabecera -->
          <div class="left-header">
            <div class="left-header-icon">
              <i class="fas fa-qrcode"></i>
            </div>
            <div>
              <h2 class="left-header-title">Registrar orden</h2>
              <p class="left-header-sub">
                {{ fixedSede ? sedeNombre : 'Captura el documento y completa los datos' }}
              </p>
            </div>
          </div>

          <!-- Cuerpo del formulario -->
          <div class="left-body">

            <div class="scan-alert">
              <i class="fas fa-circle-info"></i>
              <span>{{ lastScanMessage }}</span>
            </div>

            <button
              type="button"
              class="doccam-btn"
              :disabled="photos.length >= MAX_PHOTOS"
              @click="docCamOpen = true"
            >
              <i class="fas" :class="photos.length ? 'fa-plus' : 'fa-camera-retro'"></i>
              {{ photos.length >= MAX_PHOTOS  ? `Máximo ${MAX_PHOTOS} páginas`
                 : photos.length              ? `Agregar otra página (${photos.length + 1})`
                 :                             'Capturar con escáner de documentos' }}
            </button>

            <!-- Campos -->
            <div class="fields-block">

              <div class="field">
                <label class="flabel">Orden de producción <span class="freq">&nbsp;*</span></label>
                <div class="mf-wrap">
                  <i class="fas fa-barcode mf-icon"></i>
                  <input
                    v-model="orderCode"
                    type="text"
                    class="mf-inp"
                    placeholder="OP-240501 ó 7465"
                  />
                  <button
                    v-if="orderCode"
                    type="button"
                    class="mf-eye"
                    title="Limpiar"
                    @click="orderCode = ''"
                  ><i class="fas fa-times"></i></button>
                </div>
              </div>

              <div class="field">
                <label class="flabel">Cliente <span class="freq">&nbsp;*</span></label>
                <div class="mf-wrap">
                  <i class="fas fa-user mf-icon"></i>
                  <input
                    v-model="orderName"
                    type="text"
                    class="mf-inp"
                    placeholder="Nombre del cliente"
                  />
                </div>
              </div>

              <div class="field">
                <!-- Supervisor: sede fija -->
                <template v-if="fixedSede">
                  <label class="flabel">Sede de producción</label>
                  <div class="mf-wrap">
                    <i class="fas fa-map-marker-alt mf-icon"></i>
                    <input :value="sedeNombre" type="text" class="mf-inp" readonly />
                    <i class="fas fa-lock mf-icon"></i>
                  </div>
                </template>
                <!-- Admin: selector libre -->
                <template v-else>
                  <label class="flabel">Sede de producción</label>
                  <BaseSelect
                    v-model="orderSede"
                    :options="ordersStore.sedes.map(s => ({ value: s.code, label: s.name }))"
                    icon="fa-building"
                  />
                </template>
              </div>

              <!-- Vendedor que atendió al cliente: solo los de la sede de la orden -->
              <div class="field">
                <label class="flabel">Atendido por <span class="freq">&nbsp;*</span></label>
                <BaseSelect
                  v-model="attendedBy"
                  :options="vendorOptions"
                  icon="fa-user-tag"
                  :placeholder="vendorsLoading ? 'Cargando vendedores…' : vendorOptions.length ? 'Selecciona el vendedor…' : 'Sin vendedores en esta sede'"
                  :disabled="!vendorOptions.length"
                />
                <span v-if="!vendorsLoading && !vendorOptions.length" class="fhint">
                  <i class="fas fa-info-circle me-1"></i>No hay vendedores registrados en esta sede.
                  <RouterLink v-if="auth.hasPermission('usuarios')" to="/usuarios">Registrar vendedor</RouterLink>
                  <template v-else>Pide a un administrador que los registre.</template>
                </span>
              </div>

            </div>

            <!-- CTA -->
            <button
              type="button"
              class="btn-save btn-cta w-100"
              :disabled="!canSubmit || submitting"
              @click="submit()"
            >
              <i class="fas me-2" :class="submitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'"></i>
              {{ submitting ? 'Registrando…' : 'Registrar en órdenes del día' }}
            </button>
            <p v-if="missingHint" class="btn-cta-hint">
              {{ missingHint }}
            </p>

          </div>
        </div>

        <!-- ══ PANEL DERECHO ══ -->
        <div class="right-panel">

          <!-- Vacío -->
          <div v-if="!lastOrder && !orderPhoto" class="right-empty">
            <div class="empty-icon-wrap">
              <i class="fas fa-file-invoice"></i>
            </div>
            <p class="empty-title">Sin orden cargada</p>
            <p class="empty-body">Captura la orden de producción con el escáner de documentos e ingresa su código, el cliente y quién la atendió.</p>
          </div>

          <!-- Foto sin registrar -->
          <div v-else-if="!lastOrder && orderPhoto" class="photo-viewer">
            <div class="photo-viewer-bar">
              <span>
                <i class="fas fa-file-image me-2"></i>Vista previa
                <template v-if="photos.length > 1"> · página {{ selectedIdx + 1 }} de {{ photos.length }}</template>
              </span>
            </div>
            <img :src="orderPhoto" class="photo-viewer-img" alt="Orden" />

            <!-- Páginas capturadas -->
            <div class="pv-strip">
              <div
                v-for="(p, i) in photos"
                :key="p.url"
                class="pv-thumb"
                :class="{ 'is-active': i === selectedIdx }"
                @click="selectedIdx = i"
              >
                <img :src="p.url" :alt="`Página ${i + 1}`" />
                <span class="pv-num">{{ i + 1 }}</span>
                <button type="button" class="pv-remove" title="Quitar página" @click.stop="removePhoto(i)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <button
                v-if="photos.length < MAX_PHOTOS"
                type="button"
                class="pv-add"
                title="Agregar otra página"
                @click="docCamOpen = true"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>

          <!-- Orden registrada -->
          <div v-else-if="lastOrder" :key="lastScannedCode" class="order-result">

            <!-- Estado -->
            <div class="result-hero">
              <div class="result-check-wrap">
                <svg viewBox="0 0 52 52" class="result-check" aria-hidden="true">
                  <circle class="check-circle" cx="26" cy="26" r="24" />
                  <path class="check-mark" d="M16 27l7 7 13-14" />
                </svg>
              </div>
              <h3 class="result-title">Orden registrada</h3>
              <p v-if="registeredAt" class="result-sub">{{ registeredAt }}</p>
            </div>

            <!-- Resumen -->
            <div class="result-summary">
              <div class="result-summary-head">
                <span class="result-label">Orden de producción</span>
                <p class="result-code">{{ lastOrder.code }}</p>
              </div>
              <dl class="result-rows">
                <div class="result-row">
                  <dt>Cliente</dt>
                  <dd>{{ lastOrder.product }}</dd>
                </div>
                <div class="result-row">
                  <dt>Sede</dt>
                  <dd>{{ lastOrder.sedeInfo?.name || lastOrder.sede }}</dd>
                </div>
                <div class="result-row">
                  <dt>Atendido por</dt>
                  <dd>{{ lastOrder.attendedBy || '—' }}</dd>
                </div>
                <div class="result-row">
                  <dt>Registrada por</dt>
                  <dd>{{ lastOrder.operator }}</dd>
                </div>
                <div class="result-row">
                  <dt>Documento</dt>
                  <dd>{{ pagesLabel }}</dd>
                </div>
              </dl>
            </div>

            <!-- Acciones -->
            <div class="result-actions">
              <template v-if="auth.hasPermission('ordenes')">
                <button
                  type="button"
                  class="btn-cancel"
                  @click="clearScan"
                ><i class="fas fa-plus me-2"></i>Nueva orden</button>
                <RouterLink
                  :to="`/orden/${lastOrder.code}`"
                  class="btn-save"
                >Ver orden<i class="fas fa-arrow-right ms-2"></i></RouterLink>
              </template>
              <button
                v-else
                type="button"
                class="btn-save"
                @click="clearScan"
              ><i class="fas fa-camera-retro me-2"></i>Registrar otra orden</button>
            </div>

          </div>
        </div>

      </div>
    </div>

    <DocCameraModal v-model="docCamOpen" @capture="processPhoto" />

    <!-- Orden duplicada: confirmar antes de registrarla de nuevo -->
    <BaseModal
      v-model="dupOpen"
      icon="fa-copy"
      title="Orden ya registrada"
      :subtitle="dup?.message"
      max-width="460px"
    >
      <div v-if="dup" class="dup-box">
        <div class="dup-row"><span>Orden producción</span><strong>{{ dup.existing.code }}</strong></div>
        <div class="dup-row"><span>Cliente</span><strong>{{ dup.existing.product }}</strong></div>
        <div class="dup-row"><span>Atendido por</span><strong>{{ dup.existing.attendedBy || '—' }}</strong></div>
        <div class="dup-row"><span>Registrada por</span><strong>{{ dup.existing.operator }}</strong></div>
        <div class="dup-row"><span>Sede</span><strong>{{ sedes.find(s => s.code === dup.existing.sede)?.name || dup.existing.sede }}</strong></div>
        <div class="dup-row">
          <span>Registrada</span>
          <strong>{{ new Date(dup.existing.scannedAt || dup.existing.scheduledAt).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) }}</strong>
        </div>
        <p class="dup-note">
          <i class="fas fa-exclamation-triangle me-1"></i>
          Si continúas, la orden se registrará de nuevo a tu nombre con la fecha de hoy.
        </p>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="dupOpen = false">Cancelar</button>
        <button class="btn-save" :disabled="submitting" @click="confirmDuplicate">
          <i class="fas" :class="submitting ? 'fa-spinner fa-spin' : 'fa-redo'"></i>
          Registrar de nuevo
        </button>
      </template>
    </BaseModal>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore }   from '../stores/auth'
import BaseSelect from '../components/BaseSelect.vue'
import BaseModal from '../components/BaseModal.vue'
import DocCameraModal from '../components/DocCameraModal.vue'
import { useVendedores } from '../utils/useVendedores'

const ordersStore = useOrdersStore()
const auth        = useAuthStore()
const { lastScannedCode, lastScanMessage, orders, sedes } = storeToRefs(ordersStore)
const clearScan = () => {
  lastScannedCode.value = ''
  lastScanMessage.value = 'Escanea una orden para cargarla en el tablero operativo.'
}

onMounted(async () => {
  await ordersStore.fetchSedes({ silent: true })
  await ordersStore.fetchOrders()
})

// Todo el que no es admin registra en su propia sede
const fixedSede   = computed(() => auth.user?.role !== 'admin')
const sedeFija    = computed(() => auth.user?.sede || 'BOG')
const sedeNombre  = computed(() => sedes.value.find(s => s.code === sedeFija.value)?.name || sedeFija.value)

const orderCode  = ref('')
const orderName  = ref('')
const orderSede  = ref(sedeFija.value)
/* Una orden puede tener varias páginas/fotos */
const MAX_PHOTOS  = 10
const photos      = ref([])   // [{ file, url }]
const selectedIdx = ref(0)
const orderPhoto  = computed(() => photos.value[selectedIdx.value]?.url || '')
const submitting = ref(false)

// La sede fija del supervisor o el fallback 'BOG' pueden no existir entre las sedes reales
// (los códigos ahora se autogeneran); si no hay match, cae a la primera sede disponible.
watch(sedes, (list) => {
  if (!fixedSede.value && list.length && !list.some(s => s.code === orderSede.value)) {
    orderSede.value = list[0].code
  }
}, { immediate: true })

const lastOrder = computed(() =>
  lastScannedCode.value
    ? orders.value.find(o => o.code.toUpperCase() === lastScannedCode.value.toUpperCase())
    : null
)

const registeredAt = computed(() => {
  const d = lastOrder.value?.scannedAt || lastOrder.value?.scheduledAt
  if (!d) return ''
  const date = new Date(d)
  return `${date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })} · ${date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`
})

const pagesLabel = computed(() => {
  const o = lastOrder.value
  const n = o?.photos?.length || (o?.photoUrl ? 1 : 0)
  return n ? `${n} ${n === 1 ? 'página escaneada' : 'páginas escaneadas'}` : 'Sin documento'
})

/* "Atendido por": vendedores activos de la sede donde se registra la orden */
const attendedBy = ref('')
const effectiveSede = computed(() => fixedSede.value ? sedeFija.value : orderSede.value)
const { options: vendorOptions, loading: vendorsLoading } = useVendedores(effectiveSede)
// Si cambia la sede (admin), el vendedor elegido puede no pertenecer a ella
watch(vendorOptions, (opts) => {
  if (!opts.some(o => o.value === attendedBy.value)) attendedBy.value = opts.length === 1 ? opts[0].value : ''
})

const canSubmit = computed(() => orderCode.value.trim() && orderName.value.trim() && attendedBy.value)
const missingHint = computed(() => {
  if (!orderCode.value.trim()) return ''
  const missing = [!orderName.value.trim() && 'el cliente', !attendedBy.value && 'quién atendió'].filter(Boolean)
  return missing.length ? `falta ${missing.join(' y ')}` : ''
})

/* Duplicados: el backend responde 409 y aquí se pide confirmación */
const dup     = ref(null)
const dupOpen = ref(false)

const submit = async (confirm = false) => {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const result = await ordersStore.registerOrder(
      orderCode.value,
      orderName.value,
      effectiveSede.value,
      attendedBy.value,
      photos.value.map(p => p.file),
      { confirmDuplicate: confirm === true }
    )

    if (result?.reason === 'duplicate') {
      dup.value = result
      dupOpen.value = true
      return
    }
    if (!result?.ok) return
    dupOpen.value = false

    orderCode.value = ''; orderName.value = ''
    attendedBy.value = vendorOptions.value.length === 1 ? vendorOptions.value[0].value : ''
    if (!fixedSede.value) orderSede.value = sedes.value[0]?.code || ''
    clearPhotos()
  } finally {
    submitting.value = false
  }
}

const confirmDuplicate = () => submit(true)

/* Cámara de documentos (KB-700 u otra webcam USB) */
const docCamOpen = ref(false)

function clearPhotos() {
  photos.value.forEach(p => URL.revokeObjectURL(p.url))
  photos.value = []
  selectedIdx.value = 0
}

function removePhoto(i) {
  URL.revokeObjectURL(photos.value[i].url)
  photos.value.splice(i, 1)
  if (selectedIdx.value >= photos.value.length) selectedIdx.value = Math.max(0, photos.value.length - 1)
}

const processPhoto = (file) => {
  if (photos.value.length >= MAX_PHOTOS) return
  const url = URL.createObjectURL(file)
  photos.value.push({ file, url })
  selectedIdx.value = photos.value.length - 1
}

</script>

<style scoped>
/* Botón cámara de documentos */
.doccam-btn { display:flex; align-items:center; justify-content:center; gap:0.55rem; width:100%; padding:0.7rem 1rem; border:1.5px solid var(--accent); border-radius:0.65rem; background:color-mix(in srgb, var(--accent) 8%, transparent); color:var(--accent-strong); font-size:0.85rem; font-weight:600; cursor:pointer; transition:background 0.14s; }
.doccam-btn:hover:not(:disabled) { background:color-mix(in srgb, var(--accent) 16%, transparent); }
.doccam-btn:disabled { opacity:0.55; cursor:not-allowed; }
html.dark .doccam-btn { color:#bcd6f7; }

/* Tira de páginas capturadas */
.pv-strip { display:flex; gap:0.5rem; padding:0.65rem; overflow-x:auto; border-top:1px solid var(--line); }
.pv-thumb { position:relative; flex:0 0 auto; width:64px; height:80px; border-radius:0.45rem; overflow:hidden; border:2px solid transparent; cursor:pointer; background:var(--surface); }
.pv-thumb.is-active { border-color:var(--accent); }
.pv-thumb img { width:100%; height:100%; object-fit:cover; }
.pv-num { position:absolute; left:0.2rem; bottom:0.2rem; min-width:1.1rem; padding:0 0.25rem; border-radius:999px; background:rgba(0,0,0,0.6); color:#fff; font-size:0.62rem; font-weight:700; text-align:center; }
.pv-remove { position:absolute; top:0.15rem; right:0.15rem; width:1.2rem; height:1.2rem; display:grid; place-items:center; border:none; border-radius:50%; background:rgba(0,0,0,0.6); color:#fff; font-size:0.6rem; cursor:pointer; }
.pv-add { flex:0 0 auto; width:64px; height:80px; display:grid; place-items:center; border:1.5px dashed var(--line); border-radius:0.45rem; background:none; color:var(--ink-500); cursor:pointer; }
.pv-add:hover:not(:disabled) { border-color:var(--accent); color:var(--accent); }
.pv-add:disabled { opacity:0.5; cursor:not-allowed; }

/* Modal de duplicado */
.dup-box { display:flex; flex-direction:column; gap:0.1rem; }
.dup-row { display:flex; justify-content:space-between; gap:1rem; padding:0.5rem 0; border-bottom:1px dashed var(--line); font-size:0.85rem; }
.dup-row span { color:var(--ink-500); }
.dup-row strong { color:var(--ink-900); text-align:right; }
.dup-note { margin:0.9rem 0 0; padding:0.65rem 0.8rem; border-radius:0.55rem; font-size:0.8rem; color:var(--ink-700); background:color-mix(in srgb, var(--warning, #d99a1e) 14%, transparent); }

.scanner-page { padding: 1.25rem 0; }

.scanner-container {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 1rem;
}

.scanner-layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.25rem;
  align-items: start;
}
@media (max-width: 991px) {
  .scanner-layout { grid-template-columns: 1fr; }
}

/* Sin formulario: el resultado ocupa todo el espacio disponible */
.scanner-layout.result-only {
  grid-template-columns: 1fr;
}
.scanner-layout.result-only .right-panel {
  width: 100%;
  min-height: calc(100vh - var(--topbar-h) - 2.5rem);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ══ PANEL IZQUIERDO ══ */
.left-panel {
  overflow: hidden;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-sm);
}

.left-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--line);
}

.left-header-icon {
  width: 2.25rem;
  height: 2.25rem;
  min-width: 2.25rem;
  border-radius: 0.5rem;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  color: var(--accent);
  background: var(--accent-soft);
}

.left-header-title { font-size:1rem; font-weight:700; margin:0; color:var(--ink-900); letter-spacing:-0.01em; }
.left-header-sub   { font-size:0.78rem; color:var(--ink-500); margin:0.1rem 0 0; }

.left-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.scan-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--ink-700);
  background: var(--surface);
  border-radius: 0.5rem;
  padding: 0.65rem 0.85rem;
}
.scan-alert i { color: var(--ink-400); margin-top: 0.15rem; }

/* Campos */
.fields-block { display: flex; flex-direction: column; gap: 0.9rem; }
.field        { display: flex; flex-direction: column; gap: 0.3rem; }
.fhint        { font-size: 0.75rem; color: var(--ink-500); }
.fhint a      { margin-left: 0.25rem; font-weight: 600; color: var(--accent); }

.flabel {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ink-700);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.freq  { color: var(--danger); }

/* CTA */
.btn-cta { margin-top: 0.25rem; letter-spacing: 0.01rem; font-weight: 700; justify-content: center; }

.btn-cta-hint {
  text-align: center; font-size: 0.68rem;
  color: var(--danger); margin: 0.35rem 0 0;
}

/* ══ PANEL DERECHO ══ */
.right-panel { min-height: 380px; }

/* Vacío */
.right-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 380px; text-align: center;
  padding: 2rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
}
.empty-icon-wrap {
  width: 4.5rem; height: 4.5rem; border-radius: 50%;
  background: rgba(42,120,214,0.08);
  border: 1px solid rgba(42,120,214,0.2);
  display: grid; place-items: center;
  color: var(--accent);
  font-size: 1.65rem;
  margin: 0 auto 1.25rem;
}
.empty-title { font-family:var(--font-display); font-size:1rem; font-weight:700; margin:0 0 0.5rem; color:var(--ink-900); }
.empty-body  { font-size:0.82rem; color:var(--ink-500); max-width:280px; line-height:1.75; margin:0 auto; }

/* Foto viewer */
.photo-viewer {
  overflow:hidden;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-sm);
}
.photo-viewer-bar {
  display:flex; justify-content:space-between; align-items:center;
  padding:0.75rem 1rem; background:var(--surface); border-bottom:1px solid var(--line);
  font-size:0.72rem; font-weight:700; color:var(--ink-700);
  text-transform:uppercase; letter-spacing:0.07rem; flex-wrap:wrap; gap:0.5rem;
}
.photo-viewer-img { width:100%; max-height:520px; object-fit: contain; display: block; }

/* Orden registrada */
.order-result {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 2.5rem 2rem 2rem;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
  animation: result-in 0.4s cubic-bezier(.2,.8,.2,1) both;
}

.result-hero { text-align: center; }
.result-check-wrap {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1.1rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--success) 10%, transparent);
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--success) 5%, transparent);
  animation: pop 0.45s cubic-bezier(.34,1.56,.64,1) 0.1s both;
}
.result-check { width: 2.6rem; height: 2.6rem; }
.check-circle {
  fill: var(--success);
  stroke: var(--success);
  stroke-width: 2;
}
.check-mark {
  fill: none;
  stroke: #fff;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 32;
  stroke-dashoffset: 32;
  animation: draw 0.35s ease-out 0.45s forwards;
}
.result-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--ink-900);
  margin: 0 0 0.3rem;
}
.result-sub { font-size: 0.85rem; color: var(--ink-500); margin: 0; }

.result-summary {
  margin-top: 1.75rem;
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  overflow: hidden;
  animation: fade-up 0.4s ease-out 0.25s both;
}
.result-summary-head {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--accent) 4%, var(--paper));
}
.result-label {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08rem;
  color: var(--ink-500);
}
.result-code {
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--ink-900);
  margin: 0.15rem 0 0;
  word-break: break-all;
}

.result-rows { margin: 0; padding: 0.4rem 1.25rem; }
.result-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0.7rem 0;
  font-size: 0.875rem;
}
.result-row + .result-row { border-top: 1px solid var(--line); }
.result-row dt { color: var(--ink-500); font-weight: 500; white-space: nowrap; }
.result-row dd { margin: 0; color: var(--ink-900); font-weight: 600; text-align: right; word-break: break-word; }

.result-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1.5rem;
  animation: fade-up 0.4s ease-out 0.35s both;
}
.result-actions > * { justify-content: center; display: inline-flex; align-items: center; }
.result-actions > :only-child { grid-column: 1 / -1; }
.result-actions a.btn-save { text-decoration: none; }

@keyframes result-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes fade-up   { from { opacity: 0; transform: translateY(6px); }  to { opacity: 1; transform: none; } }
@keyframes pop       { from { transform: scale(0.6); opacity: 0; }        to { transform: scale(1); opacity: 1; } }
@keyframes draw      { to { stroke-dashoffset: 0; } }

@media (max-width: 575px) {
  .order-result { padding: 2rem 1.25rem 1.25rem; }
  .result-actions { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .order-result, .result-check-wrap, .result-summary, .result-actions { animation: none; }
  .check-mark { animation: none; stroke-dashoffset: 0; }
}
</style>
