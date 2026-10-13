<template>
  <BaseModal
    :model-value="!!item"
    @update:model-value="v => { if (!v) feedback.dismiss() }"
    icon="fa-comment-dots"
    :title="item ? `Revisión de la orden ${item.orderCode}` : ''"
    :subtitle="item ? `Enviada por ${item.authorName} · ${fmtDate(item.createdAt)}` : ''"
    max-width="520px"
  >
    <template v-if="item">
      <p class="fa-intro">
        {{ item.authorName }} revisó la orden de producción
        <strong>{{ item.orderCode }}</strong><template v-if="item.orderInfo?.client"> del cliente
        <strong>{{ item.orderInfo.client }}</strong></template> y te dejó estas observaciones.
      </p>

      <!-- Orden revisada -->
      <dl class="fa-order">
        <div>
          <dt>Orden de producción</dt>
          <dd class="fa-order-code">{{ item.orderCode }}</dd>
        </div>
        <div v-if="item.orderInfo?.client">
          <dt>Cliente</dt>
          <dd>{{ item.orderInfo.client }}</dd>
        </div>
        <div>
          <dt>Sede</dt>
          <dd>{{ item.orderInfo?.sedeName || item.sede }}</dd>
        </div>
        <div v-if="item.orderInfo?.registeredAt">
          <dt>Registrada</dt>
          <dd>{{ fmtDate(item.orderInfo.registeredAt) }}</dd>
        </div>
      </dl>

      <p class="fa-label"><i class="fas fa-comment-dots me-1"></i>Observaciones</p>
      <div class="fa-comment">{{ item.comment }}</div>

      <div v-if="item.evidences.length" class="fa-evidences">
        <p class="fa-label"><i class="fas fa-images me-1"></i>Evidencias ({{ item.evidences.length }})</p>
        <div class="fa-grid">
          <a
            v-for="(src, i) in item.evidences"
            :key="src"
            :href="BASE + src"
            target="_blank"
            rel="noopener"
            class="fa-thumb"
            :title="`Abrir evidencia ${i + 1}`"
          >
            <img :src="BASE + src" :alt="`Evidencia ${i + 1}`" />
          </a>
        </div>
      </div>

    </template>

    <template v-if="canOpenOrder" #footer>
      <button class="btn-save" @click="goToOrder">
        <i class="fas fa-file-alt me-1"></i>Ver orden {{ item?.orderCode }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { BASE } from '../api'
import { useFeedbackStore } from '../stores/feedback'
import { useAuthStore } from '../stores/auth'
import BaseModal from './BaseModal.vue'

const feedback = useFeedbackStore()
const auth     = useAuthStore()
const router   = useRouter()

const item = computed(() => feedback.showing)

// El detalle de la orden requiere el módulo "ordenes"
const canOpenOrder = computed(() =>
  auth.user?.role === 'admin' || (auth.user?.permissions || []).includes('ordenes')
)

const fmtDate = (d) =>
  new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })

function goToOrder() {
  const code = item.value?.orderCode
  feedback.dismiss()
  if (code) router.push(`/orden/${code}`)
}
</script>

<style scoped>
.fa-intro { margin: 0 0 1rem; font-size: 0.875rem; line-height: 1.55; color: var(--ink-700); }
.fa-intro strong { color: var(--ink-900); }

.fa-order {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem 1.25rem;
  margin: 0 0 1.1rem; padding: 0.9rem 1rem;
  border: 1px solid var(--line); border-radius: 0.65rem;
  background: color-mix(in srgb, var(--accent) 4%, var(--paper));
}
.fa-order dt {
  font-size: 0.62rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08rem; color: var(--ink-500);
}
.fa-order dd { margin: 0.2rem 0 0; font-size: 0.85rem; font-weight: 600; color: var(--ink-900); word-break: break-word; }
.fa-order-code { font-family: var(--font-display); font-size: 1.05rem !important; font-variant-numeric: tabular-nums; }
@media (max-width: 480px) { .fa-order { grid-template-columns: 1fr; } }
.fa-comment {
  white-space: pre-wrap; word-break: break-word;
  padding: 0.85rem 1rem; border-radius: 0.6rem;
  background: var(--surface); border-left: 3px solid var(--accent);
  font-size: 0.9rem; line-height: 1.55; color: var(--ink-900);
}
.fa-evidences { margin-top: 1rem; }
.fa-label { margin: 0 0 0.5rem; font-size: 0.78rem; font-weight: 600; color: var(--ink-500); }
.fa-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 0.5rem; }
.fa-thumb { display: block; aspect-ratio: 1; border-radius: 0.5rem; overflow: hidden; border: 1px solid var(--line); }
.fa-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.15s; }
.fa-thumb:hover img { transform: scale(1.05); }
</style>
