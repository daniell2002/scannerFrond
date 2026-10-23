<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="v => { if (!v) close() }"
    icon="fa-pen-to-square"
    title="Corregir orden"
    :subtitle="order ? `${order.code} · ${order.product}` : ''"
    max-width="760px"
  >
    <template v-if="order">
      <div class="eo-grid">
        <div class="mf-field">
          <label class="mf-label">Orden de producción <span class="mf-req">*</span></label>
          <div class="mf-wrap">
            <i class="fas fa-barcode mf-icon"></i>
            <input v-model="form.code" type="text" class="mf-inp" placeholder="OP-240501 ó 7465" />
          </div>
        </div>
        <div class="mf-field">
          <label class="mf-label">Cliente <span class="mf-req">*</span></label>
          <div class="mf-wrap">
            <i class="fas fa-user mf-icon"></i>
            <input v-model="form.product" type="text" class="mf-inp" placeholder="Nombre del cliente" />
          </div>
        </div>
        <div class="mf-field eo-full">
          <label class="mf-label">Atendido por <span class="mf-req">*</span></label>
          <BaseSelect
            v-model="form.attendedById"
            :options="vendorChoices"
            icon="fa-user-tag"
            :placeholder="vendorsLoading ? 'Cargando vendedores…' : 'Selecciona el vendedor…'"
          />
        </div>
      </div>

      <!-- Fotos: se pueden quitar las equivocadas y agregar las correctas -->
      <div class="mf-field">
        <label class="mf-label">
          Fotos de la orden <span class="mf-req">*</span>
          <span class="mf-optional">({{ totalPhotos }} de {{ MAX_PHOTOS }})</span>
        </label>
        <div class="eo-photos">
          <div v-for="(src, i) in keep" :key="src" class="eo-thumb">
            <img :src="BASE + src" :alt="`Foto ${i + 1}`" />
            <button type="button" class="eo-remove" title="Quitar foto" @click="keep.splice(i, 1)"><i class="fas fa-times"></i></button>
          </div>
          <div v-for="(p, i) in added" :key="p.url" class="eo-thumb is-new">
            <img :src="p.url" alt="Foto nueva" />
            <span class="eo-badge">Nueva</span>
            <button type="button" class="eo-remove" title="Quitar foto" @click="removeAdded(i)"><i class="fas fa-times"></i></button>
          </div>
          <template v-if="totalPhotos < MAX_PHOTOS">
            <button type="button" class="eo-add" title="Capturar con la cámara de documentos" @click="camOpen = true">
              <i class="fas fa-camera"></i><span>Cámara</span>
            </button>
            <label class="eo-add" title="Subir imagen desde el equipo">
              <input type="file" accept="image/*" multiple hidden @change="onFiles" />
              <i class="fas fa-upload"></i><span>Subir</span>
            </label>
          </template>
        </div>
        <span v-if="!totalPhotos" class="mf-hint is-warn">La orden debe tener al menos una foto.</span>
      </div>

      <div class="mf-field">
        <label class="mf-label">Motivo de la corrección <span class="mf-req">*</span></label>
        <textarea
          v-model="form.reason"
          class="form-control"
          rows="2"
          maxlength="300"
          placeholder="Ej.: el código quedó mal digitado / se subió la foto de otra orden"
        ></textarea>
      </div>

      <p class="eo-note">
        <i class="fas fa-shield-halved"></i>
        <span>
          El cambio queda registrado con tu nombre, la fecha y el motivo.
          <template v-if="!isAdmin">La orden vuelve a revisión del administrador.</template>
        </span>
      </p>

      <div v-if="error" class="mf-error"><i class="fas fa-exclamation-circle"></i>{{ error }}</div>
    </template>

    <template #footer>
      <button class="btn-cancel" :disabled="saving" @click="close">Cancelar</button>
      <button class="btn-save" :disabled="saving || !canSave" @click="save">
        <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
        {{ saving ? 'Guardando…' : 'Guardar corrección' }}
      </button>
    </template>
  </BaseModal>

  <DocCameraModal v-model="camOpen" @capture="addFile" />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { BASE } from '../api'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useVendedores } from '../utils/useVendedores'
import { compressImage } from '../utils/image'
import BaseModal from './BaseModal.vue'
import BaseSelect from './BaseSelect.vue'
import DocCameraModal from './DocCameraModal.vue'

const props = defineProps({
  modelValue: Boolean,
  order:      { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const MAX_PHOTOS = 10
const auth        = useAuthStore()
const ordersStore = useOrdersStore()
const isAdmin     = computed(() => auth.user?.role === 'admin')

const form   = ref({ code: '', product: '', attendedById: '', reason: '' })
const keep   = ref([])   // fotos actuales que se conservan (URLs)
const added  = ref([])   // fotos nuevas: [{ file, url }]
const saving = ref(false)
const error  = ref('')
const camOpen = ref(false)

// Vendedores de la sede de la orden (el de la orden se muestra aunque esté inactivo)
const { vendors, loading: vendorsLoading } = useVendedores(computed(() => props.order?.sede), { includeInactive: true })
const vendorChoices = computed(() => vendors.value
  .filter(v => v.sede === props.order?.sede && (v.active || String(v.id) === String(props.order?.attendedById)))
  .map(v => ({ value: String(v.id), label: v.active ? v.name : `${v.name} (inactivo)` })))

const totalPhotos = computed(() => keep.value.length + added.value.length)

// Al abrir: se cargan los datos actuales de la orden
watch(() => props.modelValue, open => {
  if (!open || !props.order) return
  const o = props.order
  form.value = { code: o.code, product: o.product, attendedById: o.attendedById ? String(o.attendedById) : '', reason: '' }
  keep.value = [...(o.photos?.length ? o.photos : o.photoUrl ? [o.photoUrl] : [])]
  clearAdded()
  error.value = ''
}, { immediate: true })

const normCode = (c) => c.trim().toUpperCase()
const changed = computed(() => {
  const o = props.order
  if (!o) return false
  const photosNow = o.photos?.length ? o.photos : o.photoUrl ? [o.photoUrl] : []
  return normCode(form.value.code) !== o.code
    || form.value.product.trim() !== o.product
    || form.value.attendedById !== (o.attendedById ? String(o.attendedById) : '')
    || added.value.length > 0
    || JSON.stringify(keep.value) !== JSON.stringify(photosNow)
})

const canSave = computed(() =>
  changed.value && normCode(form.value.code) && form.value.product.trim() &&
  form.value.attendedById && totalPhotos.value > 0 && form.value.reason.trim())

async function addFile(raw) {
  if (totalPhotos.value >= MAX_PHOTOS) return
  const file = await compressImage(raw)
  added.value.push({ file, url: URL.createObjectURL(file) })
}

async function onFiles(e) {
  for (const f of [...e.target.files]) await addFile(f)
  e.target.value = ''
}

function removeAdded(i) {
  URL.revokeObjectURL(added.value[i].url)
  added.value.splice(i, 1)
}

function clearAdded() {
  added.value.forEach(p => URL.revokeObjectURL(p.url))
  added.value = []
}

async function save() {
  if (!canSave.value) return
  saving.value = true
  error.value = ''
  try {
    const res = await ordersStore.correctOrder(props.order.code, {
      code: normCode(form.value.code),
      product: form.value.product.trim(),
      attendedById: form.value.attendedById,
      keepPhotos: keep.value,
      files: added.value.map(p => p.file),
      reason: form.value.reason.trim(),
    })
    if (!res.ok) { error.value = res.message; return }
    emit('saved', res.order)
    close()
  } finally {
    saving.value = false
  }
}

function close() {
  clearAdded()
  emit('update:modelValue', false)
}
</script>

<style scoped>
.eo-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.9rem; }
.eo-full { grid-column:1 / -1; }
@media (max-width: 575px) { .eo-grid { grid-template-columns:1fr; } }

.eo-photos { display:flex; flex-wrap:wrap; gap:0.55rem; }
.eo-thumb {
  position:relative; width:84px; height:104px; border-radius:0.5rem; overflow:hidden;
  border:1px solid var(--line); background:var(--surface);
}
.eo-thumb.is-new { border:2px solid var(--accent); }
.eo-thumb img { width:100%; height:100%; object-fit:cover; }
.eo-badge {
  position:absolute; left:0.25rem; bottom:0.25rem; padding:0 0.35rem; border-radius:999px;
  background:var(--accent); color:#fff; font-size:0.6rem; font-weight:700;
}
.eo-remove {
  position:absolute; top:0.2rem; right:0.2rem; width:1.35rem; height:1.35rem;
  display:grid; place-items:center; border:none; border-radius:50%;
  background:rgba(0,0,0,0.6); color:#fff; font-size:0.65rem; cursor:pointer;
}
.eo-add {
  width:84px; height:104px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.3rem;
  border:1.5px dashed var(--line-strong); border-radius:0.5rem; background:none; color:var(--ink-500);
  font-size:0.75rem; cursor:pointer; margin:0;
}
.eo-add:hover { border-color:var(--accent); color:var(--accent); }

.mf-hint.is-warn { color:var(--danger); }

.eo-note {
  display:flex; gap:0.55rem; align-items:flex-start; margin:0; padding:0.65rem 0.8rem;
  border-radius:0.55rem; font-size:0.8rem; color:var(--ink-700);
  background:color-mix(in srgb, var(--accent) 8%, transparent);
}
.eo-note i { color:var(--accent); margin-top:0.15rem; }
</style>
