<template>
  <!-- Trazabilidad de una orden desde las tablas: sus correcciones -->
  <BaseModal
    :model-value="modelValue"
    @update:model-value="v => emit('update:modelValue', v)"
    icon="fa-clock-rotate-left"
    title="Trazabilidad"
    :subtitle="order ? `${order.code} · ${count} ${count === 1 ? 'corrección' : 'correcciones'}` : ''"
    max-width="640px"
  >
    <OrderEditsList v-if="order" :edits="order.edits || []" />
    <template #footer>
      <RouterLink v-if="order" :to="`/orden/${order.code}`" class="btn-cancel" @click="emit('update:modelValue', false)">
        Ver orden<i class="fas fa-arrow-right ms-1"></i>
      </RouterLink>
      <button class="btn-save" @click="emit('update:modelValue', false)"><i class="fas fa-check"></i>Cerrar</button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import BaseModal from './BaseModal.vue'
import OrderEditsList from './OrderEditsList.vue'

const props = defineProps({
  modelValue: Boolean,
  order:      { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

const count = computed(() => props.order?.edits?.length || 0)
</script>
