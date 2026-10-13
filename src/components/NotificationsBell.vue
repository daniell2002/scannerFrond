<template>
  <div class="nbell" ref="root">
    <button
      class="theme-toggle nbell-trigger"
      :title="badgeTitle"
      @click="open = !open"
    >
      <i class="fas fa-bell"></i>
      <span v-if="badge" class="nbell-badge">{{ badge > 99 ? '99+' : badge }}</span>
    </button>

    <Transition name="user-menu-fade">
      <div v-if="open" class="nbell-dropdown">

        <!-- ── Admin: órdenes por revisar ── -->
        <template v-if="isAdmin">
          <div class="nbell-head">
            <span class="nbell-title">Órdenes por revisar</span>
            <button v-if="total" class="nbell-all" @click="reviews.markAllReviewed()">
              Marcar todas
            </button>
          </div>

          <div v-if="!orders.length" class="nbell-empty">
            <i class="fas fa-check-circle"></i>
            <p>Todo revisado. No hay órdenes nuevas.</p>
          </div>

          <ul v-else class="nbell-list">
            <li v-for="o in orders" :key="o.code">
              <button class="nbell-item" @click="openOrder(o)">
                <span class="nbell-dot"></span>
                <span class="nbell-body">
                  <span class="nbell-line">
                    <span class="code-tag">{{ o.code }}</span>
                    <span class="nbell-time">{{ timeAgo(o.scannedAt || o.scheduledAt) }}</span>
                  </span>
                  <span class="nbell-client">{{ o.product }}</span>
                  <span class="nbell-meta">
                    <i class="fas fa-user"></i>{{ o.operator }}
                    <span class="nbell-sep">·</span>
                    <i class="fas fa-building"></i>{{ sedeName(o.sede) }}
                  </span>
                </span>
              </button>
            </li>
          </ul>

          <p v-if="total > orders.length" class="nbell-more">
            y {{ total - orders.length }} más…
          </p>
        </template>

        <!-- ── Operario: retroalimentación recibida ── -->
        <template v-else>
          <div class="nbell-head">
            <span class="nbell-title">Retroalimentación</span>
          </div>

          <div v-if="!fbItems.length" class="nbell-empty">
            <i class="fas fa-check-circle"></i>
            <p>No tienes comentarios sobre tus órdenes.</p>
          </div>

          <ul v-else class="nbell-list">
            <li v-for="f in fbItems" :key="f.id">
              <button class="nbell-item" :class="{ 'is-read': f.seenAt }" @click="openFeedback(f)">
                <span class="nbell-dot"></span>
                <span class="nbell-body">
                  <span class="nbell-line">
                    <span class="code-tag">{{ f.orderCode }}</span>
                    <span class="nbell-time">{{ timeAgo(f.createdAt) }}</span>
                  </span>
                  <span class="nbell-client">{{ f.comment }}</span>
                  <span class="nbell-meta">
                    <i class="fas fa-user-shield"></i>{{ f.authorName }}
                    <template v-if="f.evidences.length">
                      <span class="nbell-sep">·</span>
                      <i class="fas fa-images"></i>{{ f.evidences.length }}
                    </template>
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </template>

      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useReviewsStore } from '../stores/reviews'
import { useFeedbackStore } from '../stores/feedback'
import { useOrdersStore } from '../stores/orders'
import { useAuthStore } from '../stores/auth'

const reviews     = useReviewsStore()
const feedback    = useFeedbackStore()
const ordersStore = useOrdersStore()
const auth        = useAuthStore()
const router      = useRouter()
const { total, orders } = storeToRefs(reviews)
const { items: fbItems, unseen } = storeToRefs(feedback)

// Admin y supervisor revisan órdenes; el operario recibe observaciones
const isAdmin = computed(() => ['admin', 'supervisor'].includes(auth.user?.role))

const root = ref(null)
const open = ref(false)

const badge = computed(() => isAdmin.value ? total.value : unseen.value)
const badgeTitle = computed(() => {
  if (isAdmin.value) return total.value ? `${total.value} órdenes por revisar` : 'Sin órdenes por revisar'
  return unseen.value ? `${unseen.value} comentarios nuevos` : 'Sin comentarios nuevos'
})

const sedeName = (code) => ordersStore.sedes.find(s => s.code === code)?.name || code

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (mins < 1)  return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `hace ${hrs} h`
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function openOrder(o) {
  open.value = false
  reviews.markReviewed(o.code)
  router.push(`/orden/${o.code}`)
}

function openFeedback(f) {
  open.value = false
  feedback.open(f)
}

function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false
}

onMounted(() => {
  // Sin el módulo de observaciones el operario no recibe retroalimentación
  if (isAdmin.value) reviews.start()
  else if (auth.hasPermission('observaciones')) feedback.start()
  document.addEventListener('mousedown', onClickOutside)
})
onBeforeUnmount(() => {
  reviews.stop()
  feedback.stop()
  document.removeEventListener('mousedown', onClickOutside)
})
</script>

<style scoped>
.nbell { position: relative; }
.nbell-trigger { position: relative; }

.nbell-badge {
  position: absolute; top: -0.35rem; right: -0.35rem;
  min-width: 1.15rem; height: 1.15rem; padding: 0 0.3rem;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--danger); color: #fff;
  border-radius: 999px; font-size: 0.65rem; font-weight: 700; line-height: 1;
  box-shadow: 0 0 0 2px var(--accent-strong, #1f5fae);
}

.nbell-dropdown {
  position: absolute; top: calc(100% + 0.5rem); right: 0; z-index: 400;
  width: min(22rem, calc(100vw - 2rem));
  background: var(--paper); border: 1px solid var(--line); border-radius: 0.65rem;
  box-shadow: 0 16px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
}

.nbell-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.7rem 0.9rem; border-bottom: 1px solid var(--line);
}
.nbell-title { font-size: 0.82rem; font-weight: 700; color: var(--ink-900); }
.nbell-all {
  border: none; background: none; padding: 0; cursor: pointer;
  font-size: 0.75rem; font-weight: 600; color: var(--accent);
}
.nbell-all:hover { text-decoration: underline; }

.nbell-empty { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 1.75rem 1rem; color: var(--ink-500); font-size: 0.82rem; text-align: center; }
.nbell-empty i { font-size: 1.5rem; color: var(--success); opacity: 0.7; }
.nbell-empty p { margin: 0; }

.nbell-list { list-style: none; margin: 0; padding: 0.3rem; max-height: 22rem; overflow-y: auto; }

.nbell-item {
  display: flex; gap: 0.6rem; width: 100%; text-align: left;
  border: none; background: none; padding: 0.6rem; border-radius: 0.5rem; cursor: pointer;
  transition: background 0.12s;
}
.nbell-item:hover { background: var(--surface); }

.nbell-dot { flex-shrink: 0; width: 0.5rem; height: 0.5rem; margin-top: 0.45rem; border-radius: 50%; background: var(--accent); }
.nbell-item.is-read .nbell-dot { background: transparent; }
.nbell-item.is-read .nbell-client { font-weight: 500; color: var(--ink-700); }

.nbell-body { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; flex: 1; }
.nbell-line { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.nbell-time { font-size: 0.7rem; color: var(--ink-500); white-space: nowrap; }
.nbell-client { font-size: 0.82rem; font-weight: 600; color: var(--ink-900); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nbell-meta { font-size: 0.72rem; color: var(--ink-500); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nbell-meta i { margin-right: 0.25rem; font-size: 0.65rem; }
.nbell-sep { margin: 0 0.35rem; }

.nbell-more { margin: 0; padding: 0.5rem 0.9rem 0.7rem; font-size: 0.75rem; color: var(--ink-500); text-align: center; }
</style>
