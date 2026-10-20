<template>
  <div class="page-wrap">

    <!-- Cabecera -->
    <PageHeader
      :breadcrumb="['Conexa', 'Administración', 'Sedes']"
      icon="fa-building"
      title="Sedes de producción"
      subtitle="Registra y administra las plantas de producción"
    >
      <template #action>
        <button class="btn-add" @click="openCreate"><i class="fas fa-plus me-2"></i>Nueva sede</button>
      </template>
    </PageHeader>

    <!-- Estado -->
    <div v-if="error" class="state-error"><i class="fas fa-exclamation-triangle me-2"></i>{{ error }}</div>
    <div v-else-if="loading" class="state-loading"><i class="fas fa-spinner fa-spin me-2"></i>Cargando sedes…</div>

    <!-- Tabla -->
    <div v-else class="table-card">
      <div class="table-card-head">
        <span class="table-card-head-title"><i class="fas fa-building"></i>Sedes <span class="table-card-count">{{ sedes.length }}</span></span>
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
              <th>Usuarios</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in sedes" :key="s.code">
              <td><span class="code-tag">{{ s.code }}</span></td>
              <td class="cell-bold">{{ s.name }}</td>
              <td class="cell-muted">{{ s.city }}, Colombia</td>
              <td class="cell-muted">{{ s.manager || 'Sin coordinador' }}</td>
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

  <!-- ── Modal ── -->
  <BaseModal
    v-model="modal"
    :icon="editing ? 'fa-pen' : 'fa-building'"
    :title="editing ? 'Editar sede' : 'Nueva sede'"
    :subtitle="editing ? editing.name : 'Registra una nueva planta de producción'"
    max-width="620px"
  >
    <div v-if="editing" class="mf-field" style="width:160px">
      <label class="mf-label">Código</label>
      <div class="mf-wrap">
        <i class="fas fa-tag mf-icon"></i>
        <input :value="editing.code" type="text" class="mf-inp" readonly />
      </div>
      <span class="mf-hint">Generado automáticamente</span>
    </div>

    <div class="mrow">
      <div class="mf-field" style="flex:1; min-width:220px">
        <label class="mf-label">Nombre <span class="mf-req">*</span></label>
        <div class="mf-wrap">
          <i class="fas fa-building mf-icon"></i>
          <input v-model="form.name" type="text" class="mf-inp" placeholder="Bogotá Norte" />
        </div>
      </div>
      <div class="mf-field" style="flex:1; min-width:220px">
        <label class="mf-label">Ciudad <span class="mf-req">*</span></label>
        <div class="mf-wrap">
          <i class="fas fa-map-marker-alt mf-icon"></i>
          <input v-model="form.city" type="text" class="mf-inp" placeholder="Bogotá" />
        </div>
      </div>
    </div>

    <div class="mf-field">
      <label class="mf-label">Coordinador</label>
      <BaseSelect v-model="form.managerId" :options="coordinatorOptions" icon="fa-user-tie" placeholder="Selecciona un supervisor" />
      <span v-if="!coordinators.length" class="mf-hint">
        Aún no hay supervisores. Crea la sede, luego crea el supervisor en Usuarios y vuelve a editarla para asignarlo.
      </span>
      <span v-else-if="legacyManager" class="mf-hint">
        Antes: “{{ legacyManager }}” (escrito a mano, no es un usuario). Elige el supervisor que corresponda.
      </span>
      <span v-else class="mf-hint">Solo aparecen los usuarios con rol supervisor activos.</span>

      <div v-if="needsMove" class="form-check mt-2">
        <input id="sede-move" v-model="form.assignManagerToSede" class="form-check-input" type="checkbox" />
        <label class="form-check-label" for="sede-move">
          Asignar a {{ selectedCoordinator.name }} a esta sede
          <span class="cell-muted">(hoy pertenece a {{ sedeName(selectedCoordinator.sede) }})</span>
        </label>
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
import { ref, computed, onMounted } from 'vue'
import { api } from '../api'
import { useNotificationsStore } from '../stores/notifications'
import BaseModal from '../components/BaseModal.vue'
import PageHeader from '../components/PageHeader.vue'
import BaseSelect from '../components/BaseSelect.vue'

const sedes   = ref([])
const users   = ref([])
const loading = ref(true)
const error   = ref('')
const notify  = useNotificationsStore()

const modal      = ref(false)
const editing    = ref(null)
const saving     = ref(false)
const modalError = ref('')
const form       = ref({ name: '', city: '', managerId: '', assignManagerToSede: true })
const coordinators  = ref([])   // supervisores activos
const legacyManager = ref('')   // coordinador antiguo escrito como texto

const countUsers = (code) => users.value.filter(u => u.sede === code).length
const sedeName   = (code) => sedes.value.find(s => s.code === code)?.name || code || 'ninguna sede'

const coordinatorOptions = computed(() => [
  { value: '', label: 'Sin coordinador' },
  ...coordinators.value.map(c => ({ value: c.id, label: `${c.name} · ${sedeName(c.sede)}` })),
])
const selectedCoordinator = computed(() => coordinators.value.find(c => c.id === form.value.managerId) || null)
// El supervisor elegido es de otra sede: se ofrece moverlo a esta
const needsMove = computed(() =>
  !!selectedCoordinator.value && selectedCoordinator.value.sede !== editing.value?.code)

// La lista de usuarios solo sirve para el conteo: sin el módulo "usuarios" se omite
const loadUsers        = () => api.get('/api/users').then(u => { users.value = u }).catch(() => {})
const loadCoordinators = () => api.get('/api/sedes/coordinators').then(c => { coordinators.value = c })

onMounted(async () => {
  try {
    ;[sedes.value] = await Promise.all([
      api.get('/api/sedes'),
      loadCoordinators(),
      loadUsers(),
    ])
  } catch (e) {
    error.value = e.message
    notify.error(e.message || 'No fue posible cargar las sedes.', { title: 'Error de carga' })
  } finally { loading.value = false }
})

function openCreate() {
  editing.value    = null
  legacyManager.value = ''
  form.value       = { name: '', city: '', managerId: '', assignManagerToSede: true }
  modalError.value = ''
  modal.value      = true
}
function openEdit(s) {
  editing.value    = s
  // Sedes antiguas solo guardaban el nombre: se busca el supervisor con ese nombre
  const match = s.managerId
    ? coordinators.value.find(c => c.id === s.managerId)
    : coordinators.value.find(c => c.name.trim().toLowerCase() === (s.manager || '').trim().toLowerCase())
  legacyManager.value = !s.managerId && s.manager && !match ? s.manager : ''
  form.value       = { name: s.name, city: s.city, managerId: match?.id || '', assignManagerToSede: true }
  modalError.value = ''
  modal.value      = true
}

async function save() {
  modalError.value = ''
  const f = form.value
  if (!f.name.trim() || !f.city.trim())
    return (modalError.value = 'Completa todos los campos obligatorios.')
  saving.value = true
  const payload = {
    name: f.name, city: f.city, managerId: f.managerId || null,
    assignManagerToSede: needsMove.value && f.assignManagerToSede,
  }
  try {
    if (editing.value) {
      const updated = await api.patch(`/api/sedes/${editing.value.code}`, payload)
      const idx = sedes.value.findIndex(s => s.code === editing.value.code)
      if (idx >= 0) sedes.value[idx] = updated
      notify.success(`La sede ${updated.code} fue actualizada.`, { title: 'Sede actualizada' })
    } else {
      const created = await api.post('/api/sedes', payload)
      sedes.value.push(created)
      notify.success(`La sede ${created.code} fue creada.`, { title: 'Sede creada' })
    }
    // El supervisor pudo cambiar de sede: se refrescan los conteos y la lista
    if (payload.assignManagerToSede) await Promise.all([loadCoordinators(), loadUsers()])
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
