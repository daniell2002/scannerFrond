<template>
  <div class="page-wrap">

    <!-- Cabecera -->
    <PageHeader
      :breadcrumb="['Conexa', 'Administración', 'Usuarios']"
      icon="fa-users"
      title="Usuarios del sistema"
      subtitle="Administra los accesos y roles de cada usuario"
    >
      <template #action>
        <button class="btn-add" @click="openCreate"><i class="fas fa-user-plus me-2"></i>Nuevo usuario</button>
      </template>
    </PageHeader>

    <!-- Estado -->
    <div v-if="error" class="state-error"><i class="fas fa-exclamation-triangle me-2"></i>{{ error }}</div>
    <div v-else-if="loading" class="state-loading"><i class="fas fa-spinner fa-spin me-2"></i>Cargando usuarios…</div>

    <!-- Tabla -->
    <div v-else class="table-card">
      <div class="table-card-head">
        <span class="table-card-head-title"><i class="fas fa-users"></i>Usuarios <span class="table-card-count">{{ users.length }}</span></span>
      </div>
      <div v-if="!users.length" class="table-empty">
        <i class="fas fa-user-slash"></i>
        <p>No hay usuarios. Crea el primero con el botón de arriba.</p>
      </div>
      <div v-else class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Sede asignada</th>
              <th class="text-center">Módulos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td class="cell-bold">{{ u.name }}</td>
              <td><span class="username-tag">{{ u.username }}</span></td>
              <td>
                <span class="badge-pill" :class="u.role === 'admin' ? 'badge-pill-primary' : 'badge-pill-neutral'">
                  <i class="fas" :class="u.role === 'admin' ? 'fa-shield-alt' : 'fa-user'"></i>
                  {{ u.role === 'admin' ? 'Administrador' : 'Operario' }}
                </span>
              </td>
              <td>
                <span v-if="u.sede" class="badge-pill badge-pill-primary"><i class="fas fa-building"></i>{{ sedeName(u.sede) }}</span>
                <span v-else class="cell-muted">Sin sede</span>
              </td>
              <td class="text-center">
                <span v-if="u.role === 'admin'" class="badge-pill badge-pill-success">Acceso total</span>
                <span v-else-if="u.permissions?.length" class="badge-pill badge-pill-neutral"><i class="fas fa-puzzle-piece"></i>{{ u.permissions.length }}</span>
                <span v-else class="cell-muted">Sin acceso</span>
              </td>
              <td>
                <div class="row-actions">
                  <button v-if="u.role !== 'admin'" class="btn-icon btn-warn" @click="openPermissions(u)" title="Gestionar permisos">
                    <i class="fas fa-key"></i>
                  </button>
                  <button class="btn-icon btn-edit" @click="openEdit(u)" title="Editar usuario">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button class="btn-icon btn-del" @click="deleteUser(u.id)" title="Eliminar usuario">
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

  <!-- ── Modal Permisos ── -->
  <BaseModal
    v-model="permModal"
    icon="fa-key"
    title="Permisos de módulos"
    :subtitle="permUser?.username"
    max-width="520px"
  >
    <p class="perm-hint">Selecciona los módulos a los que puede acceder este usuario:</p>
    <div class="d-flex flex-wrap gap-2">
      <button
        v-for="mod in ALL_MODULES" :key="mod.key"
        type="button"
        class="chip-toggle"
        :class="{ 'is-active': permChecked.includes(mod.key) }"
        @click="togglePermission(mod.key)"
      >
        <i class="fas" :class="mod.icon"></i>{{ mod.label }}
      </button>
    </div>
    <div v-if="permError" class="mf-error mt-3">
      <i class="fas fa-exclamation-circle"></i>{{ permError }}
    </div>
    <template #footer>
      <button class="btn-cancel" @click="permModal = false">Cancelar</button>
      <button class="btn-save" :disabled="permSaving" @click="savePermissions">
        <i class="fas" :class="permSaving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
        {{ permSaving ? 'Guardando…' : 'Guardar permisos' }}
      </button>
    </template>
  </BaseModal>

  <!-- ── Modal usuario ── -->
  <BaseModal
    v-model="modal"
    :icon="editing ? 'fa-user-edit' : 'fa-user-plus'"
    :title="editing ? 'Editar usuario' : 'Nuevo usuario'"
    :subtitle="editing ? editing.username : 'Completa los datos del nuevo acceso'"
    max-width="580px"
  >
    <div class="mf-field">
      <label class="mf-label">Nombre completo <span class="mf-req">*</span></label>
      <div class="mf-wrap">
        <i class="fas fa-user mf-icon"></i>
        <input v-model="form.name" type="text" class="mf-inp" placeholder="Juan Pérez" />
      </div>
    </div>

    <div class="mrow">
      <div v-if="!editing" class="mf-field" style="flex:1; min-width:200px">
        <label class="mf-label">Usuario <span class="mf-req">*</span></label>
        <div class="mf-wrap">
          <i class="fas fa-at mf-icon"></i>
          <input v-model="form.username" type="text" class="mf-inp" placeholder="bog_op2" autocomplete="off" />
        </div>
      </div>
      <div class="mf-field" style="flex:1; min-width:200px">
        <label class="mf-label">{{ editing ? 'Nueva contraseña — opcional' : 'Contraseña *' }}</label>
        <div class="mf-wrap">
          <i class="fas fa-lock mf-icon"></i>
          <input v-model="form.password" :type="showPass ? 'text' : 'password'" class="mf-inp"
            :placeholder="editing ? 'Vacío = sin cambio' : 'Mínimo 6 caracteres'" autocomplete="new-password" />
          <button type="button" class="mf-eye" @click="showPass = !showPass">
            <i class="fas" :class="showPass ? 'fa-eye-slash' : 'fa-eye'"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="mf-field">
      <label class="mf-label">Rol <span class="mf-req">*</span></label>
      <div class="d-flex flex-wrap gap-3">
        <button
          v-for="opt in roleOptions" :key="opt.value"
          type="button"
          class="role-card"
          :class="{ 'is-active': form.role === opt.value }"
          @click="form.role = opt.value; form.sede = ''"
        >
          <span class="role-card-icon"><i class="fas" :class="opt.icon"></i></span>
          <span class="role-card-body">
            <span class="role-card-name">{{ opt.label }}</span>
            <span class="role-card-desc">{{ opt.desc }}</span>
          </span>
          <i v-if="form.role === opt.value" class="fas fa-check-circle role-card-check"></i>
        </button>
      </div>
    </div>

    <div v-if="form.role === 'operario'" class="mf-field">
      <label class="mf-label">Sede asignada <span class="mf-req">*</span></label>
      <BaseSelect
        v-model="form.sede"
        :options="sedes.map(s => ({ value: s.code, label: `${s.name} — ${s.city}` }))"
        icon="fa-building"
        placeholder="Selecciona una sede…"
      />
      <div v-if="form.sede" class="mf-sede-note mt-2">
        <i class="fas fa-info-circle"></i>Solo verá órdenes de <strong>{{ sedeName(form.sede) }}</strong>
      </div>
    </div>

    <div v-if="modalError" class="mf-error">
      <i class="fas fa-exclamation-circle"></i>{{ modalError }}
    </div>

    <template #footer>
      <button class="btn-cancel" @click="modal = false">Cancelar</button>
      <button class="btn-save" :disabled="saving" @click="save">
        <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
        {{ saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear usuario' }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'
import { useNotificationsStore } from '../stores/notifications'
import BaseModal from '../components/BaseModal.vue'
import BaseSelect from '../components/BaseSelect.vue'
import PageHeader from '../components/PageHeader.vue'

const users   = ref([])
const sedes   = ref([])
const loading = ref(true)
const error   = ref('')
const notify  = useNotificationsStore()

const roleOptions = [
  { value: 'operario', label: 'Operario',       desc: 'Accede al Scanner de su sede', icon: 'fa-user' },
  { value: 'admin',    label: 'Administrador',  desc: 'Acceso completo al sistema',   icon: 'fa-shield-alt' },
]

const ALL_MODULES = [
  { key: 'scanner',      label: 'Scanner',       icon: 'fa-qrcode'      },
  { key: 'ordenes',      label: 'Órdenes',       icon: 'fa-layer-group' },
  { key: 'historial',    label: 'Historial',     icon: 'fa-history'     },
  { key: 'estadisticas', label: 'Estadísticas',  icon: 'fa-chart-bar'   },
  { key: 'sedes',        label: 'Sedes',         icon: 'fa-building'    },
  { key: 'usuarios',     label: 'Usuarios',      icon: 'fa-users'       },
]

const permModal   = ref(false)
const permUser    = ref(null)
const permChecked = ref([])
const permSaving  = ref(false)
const permError   = ref('')

function openPermissions(u) {
  permUser.value    = u
  permChecked.value = [...(u.permissions || [])]
  permError.value   = ''
  permModal.value   = true
}

function togglePermission(key) {
  const idx = permChecked.value.indexOf(key)
  if (idx >= 0) permChecked.value.splice(idx, 1)
  else permChecked.value.push(key)
}

async function savePermissions() {
  permSaving.value = true
  permError.value  = ''
  try {
    const updated = await api.patch(`/api/users/${permUser.value.id}`, { permissions: permChecked.value })
    const idx = users.value.findIndex(u => u.id === permUser.value.id)
    if (idx >= 0) users.value[idx] = updated
    notify.success(`Permisos de ${permUser.value.username} actualizados.`, { title: 'Permisos guardados' })
    permModal.value = false
    permUser.value  = null
  } catch (e) { permError.value = e.message }
  finally { permSaving.value = false }
}

const modal      = ref(false)
const editing    = ref(null)
const saving     = ref(false)
const modalError = ref('')
const showPass   = ref(false)
const form       = ref({ username: '', password: '', name: '', role: 'operario', sede: '' })

onMounted(async () => {
  try {
    ;[users.value, sedes.value] = await Promise.all([
      api.get('/api/users'),
      api.get('/api/sedes'),
    ])
  } catch (e) {
    error.value = e.message
    notify.error(e.message || 'No fue posible cargar los usuarios.', { title: 'Error de carga' })
  } finally { loading.value = false }
})

function openCreate() {
  editing.value    = null
  showPass.value   = false
  form.value       = { username: '', password: '', name: '', role: 'operario', sede: '' }
  modalError.value = ''
  modal.value      = true
}

function openEdit(u) {
  editing.value    = u
  showPass.value   = false
  form.value       = { username: u.username, password: '', name: u.name, role: u.role, sede: u.sede || '' }
  modalError.value = ''
  modal.value      = true
}

async function save() {
  modalError.value = ''
  const f = form.value

  if (editing.value) {
    if (!f.name.trim())
      return (modalError.value = 'El nombre es obligatorio.')
    if (f.role === 'operario' && !f.sede)
      return (modalError.value = 'Selecciona una sede para el operario.')
    saving.value = true
    try {
      const payload = { name: f.name, role: f.role, sede: f.role === 'operario' ? f.sede : null }
      if (f.password.trim()) payload.password = f.password.trim()
      const updated = await api.patch(`/api/users/${editing.value.id}`, payload)
      const idx = users.value.findIndex(u => u.id === editing.value.id)
      if (idx >= 0) users.value[idx] = updated
      notify.success(`El usuario ${updated.username} fue actualizado.`, { title: 'Usuario actualizado' })
      modal.value = false
    } catch (e) { modalError.value = e.message }
    finally     { saving.value = false }
  } else {
    if (!f.username.trim() || !f.password.trim() || !f.name.trim())
      return (modalError.value = 'Nombre, usuario y contraseña son obligatorios.')
    if (f.role === 'operario' && !f.sede)
      return (modalError.value = 'Selecciona una sede para el operario.')
    saving.value = true
    try {
      const user = await api.post('/api/users', f)
      users.value.push(user)
      notify.success(`El usuario ${user.username} fue creado.`, { title: 'Usuario creado' })
      modal.value = false
    } catch (e) { modalError.value = e.message }
    finally     { saving.value = false }
  }
}

async function deleteUser(id) {
  if (!confirm('¿Eliminar este usuario?')) return
  try {
    const user = users.value.find(u => u.id === id)
    await api.del(`/api/users/${id}`)
    users.value = users.value.filter(u => u.id !== id)
    notify.warning(`El usuario ${user?.username || ''} fue eliminado.`, { title: 'Usuario eliminado' })
  } catch (e) {
    notify.error(e.message || 'No fue posible eliminar el usuario.', { title: 'Error al eliminar' })
  }
}

const sedeName = (code) => sedes.value.find(s => s.code === code)?.name || code || '—'
</script>

<style scoped>
.username-tag { font-size: 0.78rem; font-weight: 700; color: var(--ink-500); background: var(--surface); border: 1px solid var(--line); padding: 0.2rem 0.6rem; border-radius: 0.45rem; font-family: monospace; }

.badge-pill { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 600; padding: 0.28rem 0.65rem; border-radius: 999px; }
.badge-pill-primary { background: rgba(42,120,214,0.1); color: var(--accent-strong); }
.badge-pill-neutral { background: var(--surface); color: var(--ink-700); }
.badge-pill-success { background: rgba(46,139,87,0.12); color: var(--success); }

.btn-warn:hover { background: var(--secondary); color: #fff; border-color: var(--secondary); }

/* Permisos */
.perm-hint { font-size: 0.82rem; color: var(--ink-500); margin: 0 0 0.75rem; }

.chip-toggle {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.9rem; border-radius: 999px;
  border: 1.5px solid var(--line); background: var(--paper); color: var(--ink-700);
  font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.14s;
}
.chip-toggle:hover { border-color: var(--ink-300); }
.chip-toggle.is-active { background: rgba(42,120,214,0.1); border-color: var(--accent); color: var(--accent-strong); }

/* Rol cards */
.role-card {
  flex: 1; min-width: 220px; display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem; border-radius: 0.65rem; border: 1.5px solid var(--line);
  background: var(--paper); cursor: pointer; text-align: left; transition: all 0.14s;
}
.role-card:hover { border-color: var(--ink-300); }
.role-card.is-active { border-color: var(--accent); background: rgba(42,120,214,0.06); }
.role-card-icon {
  width: 2.5rem; height: 2.5rem; min-width: 2.5rem; border-radius: 0.5rem;
  display: grid; place-items: center; background: var(--surface); color: var(--ink-700); font-size: 0.9rem;
}
.role-card.is-active .role-card-icon { background: var(--accent); color: #fff; }
.role-card-body { flex: 1; min-width: 0; }
.role-card-name { display: block; font-size: 0.85rem; font-weight: 700; color: var(--ink-900); }
.role-card-desc { display: block; font-size: 0.7rem; color: var(--ink-500); line-height: 1.3; }
.role-card-check { color: var(--accent); font-size: 1rem; flex-shrink: 0; }
</style>
