<template>
  <BaseModal
    :model-value="modelValue"
    @update:model-value="v => { if (!v) close() }"
    icon="fa-trash"
    tone="danger"
    title="Eliminar orden"
    :subtitle="order ? `${order.code} · ${order.product}` : ''"
    max-width="480px"
  >
    <template v-if="order">
      <p class="do-text">
        La orden <strong>{{ order.code }}</strong> dejará de aparecer en las tablas. Esta acción no se puede deshacer.
      </p>
      <div class="mf-field">
        <label class="mf-label">Motivo de la eliminación <span class="mf-req">*</span></label>
        <textarea
          v-model="reason"
          class="form-control"
          rows="2"
          maxlength="300"
          placeholder="Ej.: se registró dos veces / no era una orden de producción"
        ></textarea>
      </div>
      <p class="do-note">
        <i class="fas fa-shield-halved"></i>
        <span>Queda registrado quién la eliminó, cuándo, el motivo y una copia de sus datos y fotos.</span>
      </p>
      <div v-if="error" class="mf-error"><i class="fas fa-exclamation-circle"></i>{{ error }}</div>
    </template>

    <template #footer>
      <button class="btn-cancel" :disabled="busy" @click="close">Cancelar</button>
      <button class="btn-danger" :disabled="busy || !reason.trim()" @click="confirm">
        <i class="fas" :class="busy ? 'fa-spinner fa-spin' : 'fa-trash'"></i>
        {{ busy ? 'Eliminando…' : 'Eliminar' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useOrdersStore } from '../stores/orders'
import BaseModal from './BaseModal.vue'

const props = defineProps({
  modelValue: Boolean,
  order:      { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'deleted'])

const ordersStore = useOrdersStore()
const reason = ref('')
const busy   = ref(false)
const error  = ref('')

watch(() => props.modelValue, open => { if (open) { reason.value = ''; error.value = '' } })

async function confirm() {
  if (!reason.value.trim()) return
  busy.value = true
  error.value = ''
  try {
    const res = await ordersStore.deleteOrder(props.order.code, reason.value.trim())
    if (!res.ok) { error.value = res.message; return }
    emit('deleted', props.order)
    close()
  } finally {
    busy.value = false
  }
}

const close = () => emit('update:modelValue', false)
</script>

<style scoped>
.do-text { margin:0; font-size:0.88rem; color:var(--ink-700); }
.do-note {
  display:flex; gap:0.55rem; align-items:flex-start; margin:0; padding:0.65rem 0.8rem;
  border-radius:0.55rem; font-size:0.8rem; color:var(--ink-700);
  background:color-mix(in srgb, var(--accent) 8%, transparent);
}
.do-note i { color:var(--accent); margin-top:0.15rem; }
</style>
