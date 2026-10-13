<template>
  <div class="page-wrap">

    <PageHeader
      title="Observaciones"
      subtitle="Comentarios del administrador sobre tus órdenes"
    />

    <!-- Filtros -->
    <div class="obs-toolbar">
      <div class="obs-tabs" role="tablist">
        <button
          v-for="t in tabs" :key="t.key"
          type="button"
          role="tab"
          class="obs-tab"
          :class="{ 'is-active': tab === t.key }"
          :aria-selected="tab === t.key"
          @click="tab = t.key"
        >
          {{ t.label }}<span class="obs-tab-count">{{ t.count }}</span>
        </button>
      </div>
      <div class="search-box">
        <i class="fas fa-search search-box-icon"></i>
        <input v-model="query" type="text" class="form-control" placeholder="Buscar por orden o cliente…" />
      </div>
    </div>

    <!-- Vacío -->
    <div v-if="!filtered.length" class="panel obs-empty">
      <span class="obs-empty-icon"><i class="fas" :class="tab === 'open' && !query ? 'fa-circle-check' : 'fa-comment-slash'"></i></span>
      <p class="obs-empty-title">
        {{ query ? 'Sin resultados' : tab === 'open' ? 'No tienes observaciones abiertas' : 'Aún no hay observaciones' }}
      </p>
      <p class="obs-empty-sub">
        {{ query ? 'Prueba con otro código de orden o cliente.' : tab === 'open' ? 'Todo lo que te señaló el administrador ya está atendido.' : 'Cuando el administrador comente una de tus órdenes, aparecerá aquí.' }}
      </p>
    </div>

    <!-- Lista -->
    <div v-else class="obs-list">
      <article
        v-for="f in filtered" :key="f.id"
        class="obs-card"
        :class="{ 'is-new': newIds.has(f.id), 'is-resolved': f.resolvedAt }"
      >
        <header class="obs-head">
          <span class="obs-avatar">{{ initials(f.authorName) }}</span>
          <div class="obs-who">
            <span class="obs-author">
              {{ f.authorName }}
              <span v-if="newIds.has(f.id)" class="obs-new">Nueva</span>
            </span>
            <span class="obs-about">
              Orden <span class="code-tag">{{ f.orderCode }}</span>
              <template v-if="f.orderInfo?.client"> · {{ f.orderInfo.client }}</template>
            </span>
          </div>
          <time class="obs-date" :datetime="f.createdAt" :title="fmtFull(f.createdAt)">{{ fmtRelative(f.createdAt) }}</time>
        </header>

        <div class="obs-body">
          <p class="obs-comment">{{ f.comment }}</p>
          <div v-if="f.evidences?.length" class="obs-grid">
            <a v-for="(src, i) in f.evidences" :key="src" :href="BASE + src" target="_blank" rel="noopener" class="obs-thumb" :title="`Abrir evidencia ${i + 1}`">
              <img :src="BASE + src" :alt="`Evidencia ${i + 1}`" />
            </a>
          </div>
        </div>

        <footer class="obs-foot">
          <span v-if="f.resolvedAt" class="obs-state is-done">
            <i class="fas fa-check-double"></i>Corregida el {{ fmtFull(f.resolvedAt) }}
          </span>
          <span v-else class="obs-state is-open">
            <i class="fas fa-circle-exclamation"></i>Por atender
          </span>

          <div class="obs-actions">
            <RouterLink v-if="canOpenOrder" :to="`/orden/${f.orderCode}`" class="btn-cancel btn-sm">
              <i class="fas fa-file-lines"></i>Ver orden
            </RouterLink>
            <button
              v-if="!f.resolvedAt"
              type="button" class="btn-save btn-sm"
              :disabled="busy === f.id"
              @click="setResolved(f, true)"
            >
              <i class="fas" :class="busy === f.id ? 'fa-spinner fa-spin' : 'fa-check'"></i>Marcar como corregida
            </button>
            <button
              v-else
              type="button" class="btn-cancel btn-sm"
              :disabled="busy === f.id"
              @click="setResolved(f, false)"
            >
              <i class="fas" :class="busy === f.id ? 'fa-spinner fa-spin' : 'fa-rotate-left'"></i>Reabrir
            </button>
          </div>
        </footer>
      </article>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { BASE } from '../api'
import { useFeedbackStore } from '../stores/feedback'
import { useAuthStore } from '../stores/auth'
import PageHeader from '../components/PageHeader.vue'

const feedback = useFeedbackStore()
const auth     = useAuthStore()
const { items } = storeToRefs(feedback)

const canOpenOrder = computed(() => auth.hasPermission('ordenes'))

const tab   = ref('open')
const query = ref('')
const busy  = ref(null)

// Las no vistas se resaltan como "Nueva" mientras se está en la página,
// y se marcan como vistas al entrar.
const newIds = ref(new Set())
onMounted(async () => {
  await feedback.fetchMine()
  newIds.value = new Set(items.value.filter(f => !f.seenAt).map(f => f.id))
  if (newIds.value.size) feedback.markSeen(items.value)
})

const counts = computed(() => ({
  open:     items.value.filter(f => !f.resolvedAt).length,
  resolved: items.value.filter(f => f.resolvedAt).length,
  all:      items.value.length,
}))
const tabs = computed(() => [
  { key: 'open',     label: 'Por atender', count: counts.value.open },
  { key: 'resolved', label: 'Corregidas',  count: counts.value.resolved },
  { key: 'all',      label: 'Todas',       count: counts.value.all },
])

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return items.value.filter(f =>
    (tab.value === 'all' || (tab.value === 'open') === !f.resolvedAt) &&
    (!q || f.orderCode.toLowerCase().includes(q) || (f.orderInfo?.client || '').toLowerCase().includes(q))
  )
})

async function setResolved(f, resolved) {
  busy.value = f.id
  await feedback.resolve(f, resolved)
  busy.value = null
}

const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
const fmtFull = (d) => new Date(d).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
function fmtRelative(d) {
  const date = new Date(d)
  const mins = Math.round((Date.now() - date) / 60000)
  if (mins < 1)  return 'Hace un momento'
  if (mins < 60) return `Hace ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24 && date.toDateString() === new Date().toDateString()) return `Hace ${hours} h`
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
/* Barra de filtros */
.obs-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem; }
.obs-tabs { display: inline-flex; padding: 0.2rem; gap: 0.2rem; background: var(--surface); border: 1px solid var(--line); border-radius: 0.6rem; }
.obs-tab {
  display: inline-flex; align-items: center; gap: 0.45rem;
  padding: 0.4rem 0.8rem; border: none; border-radius: 0.45rem;
  background: transparent; color: var(--ink-500);
  font-family: var(--font-body); font-size: 0.84rem; font-weight: 600; cursor: pointer;
  transition: background 0.14s, color 0.14s;
}
.obs-tab:hover { color: var(--ink-900); }
.obs-tab.is-active { background: var(--paper); color: var(--ink-900); box-shadow: var(--shadow-sm); }
.obs-tab-count { min-width: 1.3rem; padding: 0 0.35rem; border-radius: 999px; font-size: 0.7rem; background: var(--surface-2); color: var(--ink-700); font-variant-numeric: tabular-nums; }
.obs-tab.is-active .obs-tab-count { background: var(--accent-soft); color: var(--accent-strong); }

.search-box { position: relative; flex: 0 1 300px; }
.search-box-icon { position: absolute; left: 0.8rem; top: 50%; transform: translateY(-50%); color: var(--ink-400); font-size: 0.78rem; pointer-events: none; }
.search-box .form-control { padding-left: 2.15rem; min-height: 2.375rem; font-size: 0.85rem; }
@media (max-width: 575.98px) { .search-box { flex: 1 1 100%; } .obs-tabs { width: 100%; } .obs-tab { flex: 1; justify-content: center; } }

/* Vacío */
.obs-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 3rem 1.5rem; }
.obs-empty-icon { width: 3rem; height: 3rem; display: grid; place-items: center; border-radius: 50%; background: var(--surface); color: var(--ink-400); font-size: 1.2rem; margin-bottom: 0.9rem; }
.obs-empty-title { margin: 0 0 0.3rem; font-weight: 600; color: var(--ink-900); }
.obs-empty-sub { margin: 0; font-size: 0.85rem; color: var(--ink-500); max-width: 360px; }

/* Tarjetas */
.obs-list { display: flex; flex-direction: column; gap: 0.85rem; }
.obs-card { background: var(--paper); border: 1px solid var(--line); border-radius: 0.75rem; box-shadow: var(--shadow-sm); overflow: hidden; }
.obs-card.is-new { border-color: color-mix(in srgb, var(--danger) 40%, transparent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 8%, transparent); }

.obs-head { display: flex; align-items: center; gap: 0.75rem; padding: 0.9rem 1.25rem; border-bottom: 1px solid var(--line); }
.obs-avatar {
  width: 2.25rem; height: 2.25rem; min-width: 2.25rem; border-radius: 50%;
  display: grid; place-items: center; font-size: 0.75rem; font-weight: 700;
  color: #fff; background: linear-gradient(135deg, var(--accent), var(--accent-strong));
}
.obs-who { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.obs-author { display: flex; align-items: center; gap: 0.45rem; font-size: 0.875rem; font-weight: 600; color: var(--ink-900); }
.obs-about { font-size: 0.8rem; color: var(--ink-500); }
.obs-about .code-tag { font-size: 0.74rem; padding: 0.05rem 0.4rem; }
.obs-new { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04rem; color: #fff; background: var(--danger); padding: 0.1rem 0.45rem; border-radius: 999px; }
.obs-date { margin-left: auto; font-size: 0.78rem; color: var(--ink-500); white-space: nowrap; }

.obs-body { padding: 1rem 1.25rem; }
.obs-comment { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 0.9rem; line-height: 1.6; color: var(--ink-900); }
.obs-card.is-resolved .obs-comment { color: var(--ink-700); }
.obs-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.85rem; }
.obs-thumb { display: block; width: 76px; height: 76px; border-radius: 0.5rem; overflow: hidden; border: 1px solid var(--line); }
.obs-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.15s; }
.obs-thumb:hover img { transform: scale(1.05); }

.obs-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;
  padding: 0.7rem 1.25rem; border-top: 1px solid var(--line);
  background: color-mix(in srgb, var(--surface) 50%, var(--paper));
}
.obs-state { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 600; }
.obs-state.is-open { color: var(--danger); }
.obs-state.is-done { color: var(--success); }
.obs-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.btn-sm { min-height: 2.1rem !important; padding: 0 0.85rem !important; font-size: 0.8rem !important; }

@media (max-width: 575.98px) {
  .obs-head { flex-wrap: wrap; }
  .obs-date { margin-left: 3rem; }
  .obs-actions { width: 100%; }
  .obs-actions > * { flex: 1; }
}
</style>
