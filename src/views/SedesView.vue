<template>
  <section class="py-3 py-lg-4">
    <div class="container-lg">

      <!-- Cabecera -->
      <div class="page-head mb-4">
        <div class="page-head-left">
          <div class="page-icon"><i class="fas fa-building"></i></div>
          <div>
            <h2 class="page-title">Sedes de producción</h2>
            <p class="page-sub">Registra y administra las plantas de producción</p>
          </div>
        </div>
        <button class="btn-add" @click="openCreate">
          <i class="fas fa-plus me-2"></i>Nueva sede
        </button>
      </div>

      <!-- Estado -->
      <div v-if="error" class="state-error"><i class="fas fa-exclamation-triangle me-2"></i>{{ error }}</div>
      <div v-else-if="loading" class="state-loading"><i class="fas fa-spinner fa-spin me-2"></i>Cargando sedes…</div>

      <!-- Tabla -->
      <div v-else class="table-card">
        <div class="table-card-head">
          <span><i class="fas fa-building me-2"></i>{{ sedes.length }} sede(s) registrada(s)</span>
        </div>
        <div v-if="!sedes.length" class="table-empty">
          <i class="fas fa-building"></i>
          <p>No hay sedes. Crea la primera con el botón de arriba.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Ciudad</th>
                <th>Coordinador</th>
                <th>Líneas</th>
                <th>Usuarios</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in sedes" :key="s.code">
                <td><span class="code-tag">{{ s.code }}</span></td>
                <td class="cell-bold">{{ s.name }}</td>
                <td class="cell-muted">{{ s.city }}, Colombia</td>
                <td class="cell-muted">{{ s.manager }}</td>
                <td class="cell-muted">{{ s.activeLines }}</td>
                <td><span class="count-badge">{{ countUsers(s.code) }}</span></td>
                <td>
                  <div class="row-actions">
                    <button class="btn-icon btn-edit" @click="openEdit(s)" title="Editar">
                      <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-icon btn-del" @click="deleteSede(s.code)" title="Eliminar">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </section>

  <!-- ── Modal ── -->
  <BaseModal
    v-model="modal"
    :icon="editing ? 'fa-pen' : 'fa-building'"
    :title="editing ? 'Editar sede' : 'Nueva sede'"
    :subtitle="editing ? editing.name : 'Registra una nueva planta de producción'"
    max-width="620px"
  >
    <div class="mrow">
      <div class="mf-field" style="flex:0 0 140px">
        <label class="mf-label">Código <span class="mf-req">*</span></label>
        <div class="mf-wrap">
          <i class="fas fa-tag mf-icon"></i>
          <input v-model="form.code" type="text" class="mf-inp" placeholder="BOG"
            :disabled="!!editing" style="text-transform:uppercase" maxlength="5" />
        </div>
        <span class="mf-hint">2–5 letras únicas</span>
      </div>
      <div class="mf-field" style="flex:1">
        <label class="mf-label">Nombre <span class="mf-req">*</span></label>
        <div class="mf-wrap">
          <i class="fas fa-building mf-icon"></i>
          <input v-model="form.name" type="text" class="mf-inp" placeholder="Bogotá Norte" />
        </div>
      </div>
    </div>

    <div class="mrow">
      <div class="mf-field" style="flex:1">
        <label class="mf-label">Ciudad <span class="mf-req">*</span></label>
        <div class="mf-wrap">
          <i class="fas fa-map-marker-alt mf-icon"></i>
          <input v-model="form.city" type="text" class="mf-inp" placeholder="Bogotá" />
        </div>
      </div>
      <div class="mf-field" style="flex:1">
        <label class="mf-label">Coordinador <span class="mf-req">*</span></label>
        <div class="mf-wrap">
          <i class="fas fa-user-tie mf-icon"></i>
          <input v-model="form.manager" type="text" class="mf-inp" placeholder="Laura Cardenas" />
        </div>
      </div>
    </div>

    <div class="mf-field" style="width:180px">
      <label class="mf-label">Líneas activas</label>
      <div class="mf-wrap">
        <i class="fas fa-layer-group mf-icon"></i>
        <input v-model.number="form.activeLines" type="number" class="mf-inp" min="0" max="20" />
      </div>
    </div>

    <div v-if="modalError" class="mf-error">
      <i class="fas fa-exclamation-circle"></i>{{ modalError }}
    </div>

    <template #footer>
      <button class="btn-cancel" @click="modal = false">Cancelar</button>
      <button class="btn-save" :disabled="saving" @click="save">
        <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
        {{ saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear sede' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'
import { useNotificationsStore } from '../stores/notifications'
import BaseModal from '../components/BaseModal.vue'

const sedes   = ref([])
const users   = ref([])
const loading = ref(true)
const error   = ref('')
const notify  = useNotificationsStore()

const modal      = ref(false)
const editing    = ref(null)
const saving     = ref(false)
const modalError = ref('')
const form       = ref({ code: '', name: '', city: '', manager: '', activeLines: 1 })

const countUsers = (code) => users.value.filter(u => u.sede === code).length

onMounted(async () => {
  try {
    ;[sedes.value, users.value] = await Promise.all([
      api.get('/api/sedes'),
      api.get('/api/users'),
    ])
  } catch (e) {
    error.value = e.message
    notify.error(e.message || 'No fue posible cargar las sedes.', { title: 'Error de carga' })
  } finally { loading.value = false }
})

function openCreate() {
  editing.value    = null
  form.value       = { code: '', name: '', city: '', manager: '', activeLines: 1 }
  modalError.value = ''
  modal.value      = true
}
function openEdit(s) {
  editing.value    = s
  form.value       = { code: s.code, name: s.name, city: s.city, manager: s.manager, activeLines: s.activeLines }
  modalError.value = ''
  modal.value      = true
}

async function save() {
  modalError.value = ''
  const f = form.value
  if (!f.code.trim() || !f.name.trim() || !f.city.trim() || !f.manager.trim())
    return (modalError.value = 'Completa todos los campos obligatorios.')
  saving.value = true
  try {
    if (editing.value) {
      const updated = await api.patch(`/api/sedes/${f.code}`, f)
      const idx = sedes.value.findIndex(s => s.code === f.code)
      if (idx >= 0) sedes.value[idx] = updated
      notify.success(`La sede ${f.code} fue actualizada.`, { title: 'Sede actualizada' })
    } else {
      const created = await api.post('/api/sedes', { ...f, code: f.code.toUpperCase() })
      sedes.value.push(created)
      notify.success(`La sede ${created.code} fue creada.`, { title: 'Sede creada' })
    }
    modal.value = false
  } catch (e) { modalError.value = e.message }
  finally     { saving.value = false }
}

async function deleteSede(code) {
  if (!confirm(`¿Eliminar sede ${code}?`)) return
  try {
    await api.del(`/api/sedes/${code}`)
    sedes.value = sedes.value.filter(s => s.code !== code)
    notify.warning(`La sede ${code} fue eliminada.`, { title: 'Sede eliminada' })
  } catch (e) {
    notify.error(e.message || 'No fue posible eliminar la sede.', { title: 'Error al eliminar' })
  }
}
</script>

<style scoped>
.page-head {
  display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap;
  background: var(--paper); border: 1px solid var(--line);
  border-radius: 0.375rem; padding: 1.25rem 1.5rem;
  box-shadow: var(--shadow-sm);
}
.page-head-left { display:flex; align-items:center; gap:1rem; }
.page-icon  { width:2.75rem; height:2.75rem; min-width:2.75rem; background:var(--accent); border-radius:0.375rem; display:grid; place-items:center; color:#fff; font-size:1rem; }
.page-title { font-family:var(--font-display); font-size:1.15rem; font-weight:700; margin:0 0 0.2rem; color:var(--ink-900); }
.page-sub   { font-size:0.8rem; color:var(--ink-500); margin:0; }
.btn-add { display:flex; align-items:center; gap:0.4rem; padding:0.55rem 1.1rem; background:var(--accent); color:#fff; border:none; border-radius:0.375rem; font-size:0.85rem; font-weight:600; cursor:pointer; transition:opacity 0.14s; white-space:nowrap; }
.btn-add:hover { opacity:0.88; }

.state-error   { background:rgba(196,69,54,0.07); border:1px solid rgba(196,69,54,0.2); border-radius:0.375rem; padding:1rem 1.25rem; color:var(--danger); font-size:0.85rem; }
.state-loading { text-align:center; padding:2rem; color:var(--ink-500); font-size:0.9rem; }

.table-card { background:var(--paper); border:1px solid var(--line); border-radius:0.375rem; overflow:hidden; box-shadow:var(--shadow-sm); }
.table-card-head { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.5rem; background:var(--surface); border-bottom:1px solid var(--line); font-size:0.8rem; font-weight:700; color:var(--ink-700); }
.table-empty { display:flex; flex-direction:column; align-items:center; gap:0.6rem; padding:2rem; color:var(--ink-500); font-size:0.85rem; text-align:center; }
.table-empty i { font-size:2rem; opacity:0.25; }
.table-empty p { margin:0; }
.data-table { width:100%; border-collapse:collapse; font-size:0.865rem; }
.data-table th { padding:0.8rem 1rem; text-align:left; font-size:0.62rem; text-transform:uppercase; letter-spacing:0.1rem; color:var(--ink-500); font-weight:700; border-bottom:1px solid var(--line); background:var(--surface); white-space:nowrap; }
.data-table td { padding:0.85rem 1rem; border-bottom:1px solid var(--line); vertical-align:middle; }
.data-table tbody tr:last-child td { border-bottom:none; }
.data-table tbody tr:hover { background:rgba(66,130,194,0.04); }
.code-tag    { font-size:0.75rem; font-weight:700; background:rgba(66,130,194,0.1); color:var(--accent); border:1px solid rgba(66,130,194,0.2); padding:0.25rem 0.65rem; border-radius:0.45rem; letter-spacing:0.06rem; }
.cell-bold   { font-weight:600; color:var(--ink-900); }
.cell-muted  { font-size:0.83rem; color:var(--ink-500); }
.count-badge { font-family:var(--font-display); font-size:1.1rem; font-weight:700; color:var(--accent); }
.row-actions { display:flex; gap:0.4rem; }
.btn-icon { width:2rem; height:2rem; display:grid; place-items:center; border:1px solid var(--line); border-radius:0.5rem; background:var(--surface); color:var(--ink-500); font-size:0.72rem; cursor:pointer; transition:background 0.12s, color 0.12s; }
.btn-edit:hover { background:var(--accent); color:#fff; border-color:var(--accent); }
.btn-del:hover  { background:var(--danger); color:#fff; border-color:var(--danger); }
</style>
