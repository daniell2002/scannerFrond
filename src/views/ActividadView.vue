<template>
  <section class="act-page">
    <div class="act-container">

      <PageHeader title="Registro de actividad" subtitle="Quién creó, editó o eliminó cada elemento y cuándo">
        <template #action>
          <button class="btn-add-outline" :disabled="exporting || !items.length" @click="exportExcel">
            <i class="fas" :class="exporting ? 'fa-spinner fa-spin' : 'fa-file-excel'"></i>{{ exporting ? 'Generando…' : 'Exportar a Excel' }}
          </button>
        </template>
      </PageHeader>

      <div class="table-card">
        <div class="table-card-head">
          <span class="table-card-head-title">
            <i class="fas fa-list-check"></i>
            Movimientos
            <span class="table-card-count">{{ total }}</span>
          </span>
          <div class="table-card-search">
            <div class="search-box">
              <i class="fas fa-search search-box-icon"></i>
              <input v-model="filters.q" type="text" class="form-control" placeholder="Buscar orden, usuario o sede…" @input="onSearch" />
            </div>
            <BaseSelect v-model="filters.entity" :options="entityOptions" icon="fa-layer-group" size="sm" style="min-width:160px" />
            <BaseSelect v-model="filters.action" :options="actionOptions" icon="fa-bolt" size="sm" style="min-width:160px" />
            <BaseSelect v-model="filters.actorId" :options="actorOptions" searchable icon="fa-user" size="sm" style="min-width:200px" />
            <input v-model="filters.from" type="date" class="form-control form-control-sm act-date" title="Desde" :max="filters.to || today" />
            <input v-model="filters.to" type="date" class="form-control form-control-sm act-date" title="Hasta" :min="filters.from" :max="today" />
          </div>
        </div>

        <div v-if="loading && !items.length" class="log-empty">
          <i class="fas fa-spinner fa-spin log-empty-icon"></i>
        </div>

        <div v-else-if="!items.length" class="log-empty">
          <div class="log-empty-icon"><i class="fas fa-clipboard-list"></i></div>
          <p class="log-empty-title">{{ hasFilters ? 'Sin resultados' : 'Sin actividad registrada' }}</p>
          <p class="log-empty-sub">
            {{ hasFilters ? 'No hay movimientos para los filtros seleccionados.' : 'Aquí aparecerán los cambios que hagan los usuarios desde ahora.' }}
          </p>
        </div>

        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Detalle</th>
                <th>Sede</th>
                <th>Cambios</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in items" :key="i.id">
                <td>
                  <span class="h-date">{{ fmtDate(i.createdAt) }}</span>
                  <span class="h-time">{{ fmtTime(i.createdAt) }}</span>
                </td>
                <td>
                  <span class="act-actor">{{ i.actorName }}</span>
                  <span class="h-time">{{ roleText(i.actorRole) }}</span>
                </td>
                <td>
                  <span class="act-chip" :class="`is-${actionTone(i.action)}`">
                    <i class="fas" :class="ENTITY_ICON[i.entity] || 'fa-circle'"></i>{{ actionText(i.action) }} {{ entityText(i.entity).toLowerCase() }}
                  </span>
                </td>
                <td>
                  <RouterLink v-if="i.entity === 'orden' && i.action !== 'eliminar'" :to="`/orden/${i.entityId}`" class="code-tag">{{ i.label }}</RouterLink>
                  <span v-else class="act-label">{{ i.label || '—' }}</span>
                </td>
                <td class="cell-muted">{{ sedeText(i.sede) || '—' }}</td>
                <td class="act-changes">
                  <template v-if="i.changes">
                    <div v-for="(c, field) in i.changes" :key="field">
                      <strong>{{ fieldText(field) }}:</strong> {{ valueText(c.from) }} <i class="fas fa-arrow-right"></i> {{ valueText(c.to) }}
                    </div>
                  </template>
                  <span v-else class="cell-muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="pages > 1" class="act-pager">
          <button class="btn-icon" :disabled="page <= 1 || loading" title="Anterior" @click="go(page - 1)"><i class="fas fa-chevron-left"></i></button>
          <span>Página {{ page }} de {{ pages }}</span>
          <button class="btn-icon" :disabled="page >= pages || loading" title="Siguiente" @click="go(page + 1)"><i class="fas fa-chevron-right"></i></button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../api'
import PageHeader from '../components/PageHeader.vue'
import BaseSelect from '../components/BaseSelect.vue'
import { useOrdersStore } from '../stores/orders'
import { useNotificationsStore } from '../stores/notifications'
import { roleLabel, MODULE_GROUPS } from '../utils/modules'
import { exportActivity } from '../utils/exportExcel'
import { todayKey } from '../utils/dates'

const ordersStore = useOrdersStore()
const notify      = useNotificationsStore()

const items   = ref([])
const actors  = ref([])
const total   = ref(0)
const page    = ref(1)
const pages   = ref(1)
const loading = ref(false)
const filters = ref({ q: '', entity: 'all', action: 'all', actorId: 'all', from: '', to: '' })

/* ── Textos ── */
const ENTITIES = { orden: 'Orden', usuario: 'Usuario', sede: 'Sede', observacion: 'Observación', sesion: 'Sesión' }
const ENTITY_ICON = { orden: 'fa-file-lines', usuario: 'fa-user', sede: 'fa-building', observacion: 'fa-comment-dots', sesion: 'fa-right-to-bracket' }
const ACTIONS = {
  crear: 'Creó', editar: 'Editó', corregir: 'Corrigió', eliminar: 'Eliminó', reenviar: 'Reenvió',
  restablecer: 'Restableció contraseña de', 'cambiar contraseña': 'Cambió contraseña de',
  recuperar: 'Pidió recuperar contraseña de', ingresar: 'Inició',
}
const FIELDS = {
  product: 'Cliente', line: 'Línea', batch: 'Lote', status: 'Estado', priority: 'Prioridad', sede: 'Sede',
  quantity: 'Cantidad', completed: 'Completadas', operator: 'Registró', attendedBy: 'Atendido por',
  code: 'Código', photos: 'Fotos', reason: 'Motivo', scheduledAt: 'Fecha de la orden',
  name: 'Nombre', email: 'Correo', role: 'Rol', permissions: 'Módulos', active: 'Activo', password: 'Contraseña',
  city: 'Ciudad', manager: 'Encargado',
}
const MODULE_NAMES = Object.fromEntries(MODULE_GROUPS.flatMap(g => g.modules).map(m => [m.key, m.label]))

const entityText = (e) => ENTITIES[e] || e
const actionText = (a) => ACTIONS[a] || a
const fieldText  = (f) => FIELDS[f] || f
const roleText   = (r) => r ? roleLabel(r) : 'Sistema'
const sedeText   = (code) => code ? ordersStore.sedes.find(s => s.code === code)?.name || code : ''
const actionTone = (a) => a === 'eliminar' ? 'danger' : a === 'crear' ? 'ok' : a === 'ingresar' ? 'muted' : 'info'

function valueText(v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Sí' : 'No'
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
  // Fotos de una orden: se muestra la cantidad
  if (Array.isArray(v) && v.some(x => String(x).startsWith('/uploads/'))) return `${v.length} ${v.length === 1 ? 'foto' : 'fotos'}`
  if (Array.isArray(v)) return v.map(k => MODULE_NAMES[k] || k).join(', ') || '—'
  const sede = ordersStore.sedes.find(s => s.code === v)
  return sede ? sede.name : roleLabel(v) || String(v)
}

const changesText = (changes) => changes
  ? Object.entries(changes).map(([f, c]) => `${fieldText(f)}: ${valueText(c.from)} → ${valueText(c.to)}`).join(' · ')
  : ''

/* ── Filtros ── */
const entityOptions = [{ value: 'all', label: 'Todo' }, ...Object.entries(ENTITIES).map(([value, label]) => ({ value, label }))]
const actionOptions = [
  { value: 'all', label: 'Todas las acciones' },
  { value: 'crear', label: 'Crear' }, { value: 'editar', label: 'Editar' }, { value: 'corregir', label: 'Corregir orden' }, { value: 'eliminar', label: 'Eliminar' },
  { value: 'reenviar', label: 'Reenviar orden' }, { value: 'restablecer', label: 'Restablecer contraseña' },
  { value: 'cambiar contraseña', label: 'Cambiar contraseña' }, { value: 'recuperar', label: 'Recuperar por correo' },
  { value: 'ingresar', label: 'Inicios de sesión' },
]
const actorOptions = computed(() => [
  { value: 'all', label: 'Todos los usuarios' },
  ...actors.value.map(a => ({
    value: a.id,
    label: `${a.name} · ${roleText(a.role)}${a.deleted ? ' (eliminado)' : a.active === false ? ' (inactivo)' : ''}`,
  })),
])
const hasFilters = computed(() => Object.entries(filters.value).some(([k, v]) => v && v !== 'all' && (k !== 'q' || v.trim())))

// Las fechas se envían como instantes del día local del usuario (el servidor puede estar en UTC)
const startOf = (day) => new Date(`${day}T00:00:00`).toISOString()
const nextDay = (day) => { const d = new Date(`${day}T00:00:00`); d.setDate(d.getDate() + 1); return d.toISOString() }

function query(extra = {}) {
  const { from, to, ...rest } = filters.value
  const params = new URLSearchParams()
  Object.entries({ ...rest, ...extra }).forEach(([k, v]) => { if (v && v !== 'all') params.set(k, String(v).trim()) })
  if (from) params.set('from', startOf(from))
  if (to)   params.set('to', nextDay(to))
  return params.toString()
}

async function load() {
  loading.value = true
  try {
    const data = await api.get(`/api/audit?${query({ page: page.value, limit: 50 })}`)
    items.value  = data.items
    total.value  = data.total
    pages.value  = data.pages
    actors.value = data.actors
  } catch (e) {
    notify.error(e.message || 'No fue posible cargar la actividad.')
  } finally {
    loading.value = false
  }
}

function go(p) { page.value = p; load() }

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, 350)
}
watch(() => [filters.value.entity, filters.value.action, filters.value.actorId, filters.value.from, filters.value.to], () => {
  page.value = 1
  load()
})

/* ── Exportar: todos los registros con los filtros actuales (hasta 5.000) ── */
const exporting = ref(false)
async function exportExcel() {
  exporting.value = true
  try {
    const all = []
    for (let p = 1; p <= 25; p++) {
      const data = await api.get(`/api/audit?${query({ page: p, limit: 200 })}`)
      all.push(...data.items)
      if (p >= data.pages) break
    }
    await exportActivity(all, { role: roleText, action: actionText, entity: entityText, sede: sedeText, changes: changesText })
  } catch {
    notify.error('No fue posible generar el archivo de Excel.')
  } finally {
    exporting.value = false
  }
}

const today = todayKey()
const fmtDate = (iso) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })

onMounted(() => {
  if (!ordersStore.sedes.length) ordersStore.fetchSedes({ silent: true })
  load()
})
</script>

<style scoped>
.act-page { padding: 1rem 0 1.5rem; }
.act-container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }

.search-box { position:relative; flex:1 1 220px; max-width:320px; }
.search-box-icon { position:absolute; left:0.8rem; top:50%; transform:translateY(-50%); color:var(--ink-500); font-size:0.8rem; pointer-events:none; }
.search-box .form-control { padding-left:2.15rem; }
.act-date { width: auto; min-width: 140px; }

.log-empty { display:flex; flex-direction:column; align-items:center; text-align:center; padding:3.5rem 2rem; }
.log-empty-icon { width:56px; height:56px; display:grid; place-items:center; font-size:1.4rem; color:var(--ink-500); background:var(--surface); border-radius:0.75rem; margin-bottom:1rem; }
.log-empty-title { font-size:0.95rem; font-weight:600; color:var(--ink-900); margin:0 0 0.35rem; }
.log-empty-sub   { font-size:0.82rem; color:var(--ink-500); max-width:320px; line-height:1.7; margin:0; }

.h-date { font-size:0.82rem; font-weight:600; color:var(--ink-700); white-space:nowrap; }
.h-time { display:block; font-size:0.72rem; color:var(--ink-500); margin-top:0.1rem; }
.act-actor { font-weight:600; color:var(--ink-900); white-space:nowrap; }
.act-label { font-weight:500; }

.act-chip {
  display:inline-flex; align-items:center; gap:0.4rem; white-space:nowrap;
  font-size:0.75rem; font-weight:600; padding:0.28rem 0.7rem; border-radius:999px;
  color: var(--tone); background: color-mix(in srgb, var(--tone) 12%, transparent);
}
.act-chip.is-ok     { --tone: var(--success, #16a34a); }
.act-chip.is-danger { --tone: var(--danger); }
.act-chip.is-info   { --tone: var(--accent); }
.act-chip.is-muted  { --tone: var(--ink-500); }

.act-changes { font-size:0.78rem; color:var(--ink-700); min-width:220px; max-width:380px; }
.act-changes > div + div { margin-top:0.15rem; }
.act-changes i { font-size:0.6rem; color:var(--ink-400); margin:0 0.2rem; }

.act-pager {
  display:flex; align-items:center; justify-content:center; gap:0.75rem;
  padding:0.85rem; border-top:1px solid var(--line);
  font-size:0.82rem; color:var(--ink-500);
}
</style>
