<template>
  <section class="py-4 py-lg-5">
    <div class="container-lg">

      <!-- Cabecera -->
      <div class="page-head mb-4">
        <div class="page-head-left">
          <div class="page-icon"><i class="fas fa-users"></i></div>
          <div>
            <h2 class="page-title">Usuarios del sistema</h2>
            <p class="page-sub">Administra los accesos y roles de cada usuario</p>
          </div>
        </div>
        <button class="btn-add" @click="openCreate">
          <i class="fas fa-user-plus me-2"></i>Nuevo usuario
        </button>
      </div>

      <!-- Estado -->
      <div v-if="error" class="state-error"><i class="fas fa-exclamation-triangle me-2"></i>{{ error }}</div>
      <div v-else-if="loading" class="state-loading"><i class="fas fa-spinner fa-spin me-2"></i>Cargando usuarios…</div>

      <!-- Tabla -->
      <div v-else class="table-card">
        <div class="table-card-head">
          <span><i class="fas fa-users me-2"></i>{{ users.length }} usuario(s) registrado(s)</span>
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
                <th>Módulos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td class="cell-bold">{{ u.name }}</td>
                <td><span class="username-tag">{{ u.username }}</span></td>
                <td>
                  <span class="role-badge" :class="u.role === 'admin' ? 'role-admin' : 'role-op'">
                    <i class="fas" :class="u.role === 'admin' ? 'fa-shield-alt' : 'fa-user'"></i>
                    {{ u.role === 'admin' ? 'Administrador' : 'Operario' }}
                  </span>
                </td>
                <td>
                  <span v-if="u.sede" class="sede-pill">
                    <i class="fas fa-building me-1"></i>{{ sedeName(u.sede) }}
                  </span>
                  <span v-else class="cell-muted">Sin sede</span>
                </td>
                <td>
                  <span v-if="u.role === 'admin'" class="perm-all">Acceso total</span>
                  <span v-else-if="u.permissions?.length" class="perm-count">
                    <i class="fas fa-puzzle-piece me-1"></i>{{ u.permissions.length }}
                  </span>
                  <span v-else class="cell-muted">Sin acceso</span>
                </td>
                <td>
                  <div class="row-actions">
                    <button v-if="u.role !== 'admin'" class="btn-icon btn-perm" @click="openPermissions(u)" title="Gestionar permisos">
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
  </section>

  <!-- ── Modal Permisos ── -->
  <Transition name="modal-fade">
    <div v-if="permModal" class="modal-backdrop" @click.self="closePermModal">
      <div class="modal-box">
        <div class="modal-head">
          <div class="modal-head-icon"><i class="fas fa-key"></i></div>
          <div class="modal-head-text">
            <h3 class="modal-title">Permisos de módulos</h3>
            <p class="modal-sub">{{ permUser?.username }}</p>
          </div>
          <button class="modal-close" @click="closePermModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <p class="perm-hint">Selecciona los módulos a los que puede acceder este usuario:</p>
          <div class="perm-grid">
            <label v-for="mod in ALL_MODULES" :key="mod.key" class="perm-item">
              <input type="checkbox" :value="mod.key" v-model="permChecked" class="perm-check" />
              <span class="perm-item-box" :class="{ 'perm-item-on': permChecked.includes(mod.key) }">
                <i class="fas" :class="mod.icon"></i>
                <span>{{ mod.label }}</span>
              </span>
            </label>
          </div>
          <div v-if="permError" class="mf-error"><i class="fas fa-exclamation-circle me-1"></i>{{ permError }}</div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" @click="closePermModal">Cancelar</button>
          <button class="btn-save" :disabled="permSaving" @click="savePermissions">
            <i class="fas" :class="permSaving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
            {{ permSaving ? 'Guardando…' : 'Guardar permisos' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ── Modal usuario ── -->
  <Transition name="modal-fade">
    <div v-if="modal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box">

        <!-- Cabecera azul -->
        <div class="modal-head">
          <div class="modal-head-icon">
            <i class="fas" :class="editing ? 'fa-user-edit' : 'fa-user-plus'"></i>
          </div>
          <div class="modal-head-text">
            <h3 class="modal-title">{{ editing ? 'Editar usuario' : 'Nuevo usuario' }}</h3>
            <p class="modal-sub">{{ editing ? editing.username : 'Completa los datos del nuevo acceso' }}</p>
          </div>
          <button class="modal-close" @click="closeModal"><i class="fas fa-times"></i></button>
        </div>

        <div class="modal-body">

          <!-- Nombre completo -->
          <div class="mf-field">
            <label class="mf-label">Nombre completo <span class="mf-req">*</span></label>
            <div class="mf-wrap">
              <i class="fas fa-user mf-icon"></i>
              <input v-model="form.name" type="text" class="mf-inp" placeholder="Juan Pérez" />
            </div>
          </div>

          <!-- Usuario + Contraseña en fila -->
          <div class="mrow">
            <div class="mf-field" style="flex:1" v-if="!editing">
              <label class="mf-label">Usuario <span class="mf-req">*</span></label>
              <div class="mf-wrap">
                <i class="fas fa-at mf-icon"></i>
                <input v-model="form.username" type="text" class="mf-inp" placeholder="bog_op2" autocomplete="off" />
              </div>
            </div>
            <div class="mf-field" style="flex:1">
              <label class="mf-label">
                {{ editing ? 'Nueva contraseña' : 'Contraseña' }}
                <span class="mf-req" v-if="!editing">*</span>
                <span class="mf-optional" v-else>— opcional</span>
              </label>
              <div class="mf-wrap">
                <i class="fas fa-lock mf-icon"></i>
                <input v-model="form.password"
                  :type="showPass ? 'text' : 'password'"
                  class="mf-inp"
                  :placeholder="editing ? 'Vacío = sin cambio' : 'Mínimo 6 caracteres'"
                  autocomplete="new-password" />
                <button type="button" class="mf-eye" @click="showPass = !showPass" tabindex="-1">
                  <i class="fas" :class="showPass ? 'fa-eye-slash' : 'fa-eye'"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Rol -->
          <div class="mf-field">
            <label class="mf-label">Rol <span class="mf-req">*</span></label>
            <div class="role-cards">
              <button type="button" class="role-card" :class="{ 'role-card-active': form.role === 'operario' }"
                @click="form.role = 'operario'; form.sede = ''">
                <div class="role-card-icon rc-op"><i class="fas fa-user"></i></div>
                <div>
                  <p class="role-card-name">Operario</p>
                  <p class="role-card-desc">Accede al Scanner de su sede</p>
                </div>
                <i v-if="form.role === 'operario'" class="fas fa-check-circle role-card-check"></i>
              </button>
              <button type="button" class="role-card" :class="{ 'role-card-active': form.role === 'admin' }"
                @click="form.role = 'admin'; form.sede = ''">
                <div class="role-card-icon rc-admin"><i class="fas fa-shield-alt"></i></div>
                <div>
                  <p class="role-card-name">Administrador</p>
                  <p class="role-card-desc">Acceso completo al sistema</p>
                </div>
                <i v-if="form.role === 'admin'" class="fas fa-check-circle role-card-check"></i>
              </button>
            </div>
          </div>

          <!-- Sede (solo operario) -->
          <div class="mf-field" v-if="form.role === 'operario'">
            <label class="mf-label">Sede asignada <span class="mf-req">*</span></label>
            <div class="mf-wrap">
              <i class="fas fa-building mf-icon"></i>
              <select v-model="form.sede" class="mf-inp mf-sel">
                <option value="">Selecciona una sede…</option>
                <option v-for="s in sedes" :key="s.code" :value="s.code">{{ s.name }} — {{ s.city }}</option>
              </select>
            </div>
            <div v-if="form.sede" class="mf-sede-note">
              <i class="fas fa-info-circle"></i>
              Solo verá órdenes de <strong>{{ sedeName(form.sede) }}</strong>
            </div>
          </div>

          <div v-if="modalError" class="mf-error">
            <i class="fas fa-exclamation-circle"></i>{{ modalError }}
          </div>

        </div>

        <div class="modal-foot">
          <button class="btn-cancel" @click="closeModal">Cancelar</button>
          <button class="btn-save" :disabled="saving" @click="save">
            <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
            {{ saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear usuario' }}
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'
import { useNotificationsStore } from '../stores/notifications'

const users   = ref([])
const sedes   = ref([])
const loading = ref(true)
const error   = ref('')
const notify  = useNotificationsStore()

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
function closePermModal() { permModal.value = false; permUser.value = null }

async function savePermissions() {
  permSaving.value = true
  permError.value  = ''
  try {
    const updated = await api.patch(`/api/users/${permUser.value.id}`, { permissions: permChecked.value })
    const idx = users.value.findIndex(u => u.id === permUser.value.id)
    if (idx >= 0) users.value[idx] = updated
    notify.success(`Permisos de ${permUser.value.username} actualizados.`, { title: 'Permisos guardados' })
    closePermModal()
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
  }
  finally     { loading.value = false }
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

function closeModal() { modal.value = false; editing.value = null; showPass.value = false }

async function save() {
  modalError.value = ''
  const f = form.value

  if (editing.value) {
    // Editar — nombre, rol, sede y contraseña opcionales
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
      closeModal()
    } catch (e) { modalError.value = e.message }
    finally     { saving.value = false }
  } else {
    // Crear — todos los campos obligatorios
    if (!f.username.trim() || !f.password.trim() || !f.name.trim())
      return (modalError.value = 'Nombre, usuario y contraseña son obligatorios.')
    if (f.role === 'operario' && !f.sede)
      return (modalError.value = 'Selecciona una sede para el operario.')
    saving.value = true
    try {
      const user = await api.post('/api/users', f)
      users.value.push(user)
      notify.success(`El usuario ${user.username} fue creado.`, { title: 'Usuario creado' })
      closeModal()
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
.page-head { display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; background:var(--paper); border:1px solid var(--line); border-radius:0.375rem; padding:1.25rem 1.5rem; box-shadow:var(--shadow-sm); }
.page-head-left { display:flex; align-items:center; gap:1rem; }
.page-icon  { width:2.75rem; height:2.75rem; min-width:2.75rem; background:var(--accent); border-radius:0.375rem; display:grid; place-items:center; color:#fff; font-size:1rem; }
.page-title { font-family:var(--font-display); font-size:1.15rem; font-weight:700; margin:0 0 0.2rem; color:var(--ink-900); }
.page-sub   { font-size:0.8rem; color:var(--ink-500); margin:0; }
.btn-add { display:flex; align-items:center; padding:0.55rem 1.1rem; background:var(--accent); color:#fff; border:none; border-radius:0.375rem; font-size:0.85rem; font-weight:600; cursor:pointer; transition:opacity 0.14s; white-space:nowrap; }
.btn-add:hover { opacity:0.85; }

.state-error   { background:rgba(196,69,54,0.07); border:1px solid rgba(196,69,54,0.2); border-radius:0.375rem; padding:1rem 1.25rem; color:var(--danger); font-size:0.85rem; }
.state-loading { text-align:center; padding:3rem; color:var(--ink-500); font-size:0.9rem; }

.table-card { background:var(--paper); border:1px solid var(--line); border-radius:0.375rem; overflow:hidden; box-shadow:var(--shadow-sm); }
.table-card-head { display:flex; align-items:center; justify-content:space-between; padding:0.875rem 1.25rem; background:var(--surface); border-bottom:1px solid var(--line); font-size:0.8rem; font-weight:700; color:var(--ink-700); }
.table-empty { display:flex; flex-direction:column; align-items:center; gap:0.75rem; padding:3.5rem; color:var(--ink-500); font-size:0.85rem; text-align:center; }
.table-empty i { font-size:2rem; opacity:0.25; }
.table-empty p { margin:0; }

.data-table { width:100%; border-collapse:collapse; font-size:0.865rem; }
.data-table th { padding:0.75rem 1rem; text-align:left; font-size:0.62rem; text-transform:uppercase; letter-spacing:0.1rem; color:var(--ink-500); font-weight:700; border-bottom:2px solid var(--line); background:var(--surface); white-space:nowrap; }
.data-table td { padding:0.75rem 1rem; border-bottom:1px solid var(--line); vertical-align:middle; }
.data-table tbody tr:last-child td { border-bottom:none; }
.data-table tbody tr:hover { background:var(--surface); }

.cell-bold   { font-weight:600; color:var(--ink-900); }
.cell-muted  { font-size:0.83rem; color:var(--ink-500); }
.username-tag { font-size:0.78rem; font-weight:700; color:var(--ink-500); background:var(--surface); border:1px solid var(--line); padding:0.15rem 0.5rem; border-radius:3px; font-family:monospace; }
.role-badge { font-size:0.68rem; font-weight:700; padding:0.25rem 0.65rem; border-radius:3px; display:inline-flex; align-items:center; gap:0.35rem; }
.role-admin { background:rgba(66,130,194,0.12); color:var(--accent); }
.role-op    { background:rgba(54,80,108,0.1);   color:var(--ink-700); }
.sede-pill  { font-size:0.72rem; font-weight:600; background:rgba(66,130,194,0.08); color:var(--accent); border:1px solid rgba(66,130,194,0.18); padding:0.2rem 0.6rem; border-radius:3px; display:inline-flex; align-items:center; }

.row-actions { display:flex; gap:0.35rem; }
.btn-icon  { width:1.75rem; height:1.75rem; display:grid; place-items:center; border:1px solid var(--line); border-radius:3px; background:var(--surface); color:var(--ink-500); font-size:0.7rem; cursor:pointer; transition:background 0.12s, color 0.12s; }
.btn-edit:hover { background:var(--accent); color:#fff; border-color:var(--accent); }
.btn-del:hover  { background:var(--danger); color:#fff; border-color:var(--danger); }
.btn-perm:hover { background:#f59e0b; color:#fff; border-color:#f59e0b; }
.form-optional  { font-size:0.62rem; color:var(--ink-500); font-weight:400; text-transform:none; letter-spacing:0; margin-left:0.25rem; }

/* Columna módulos */
.perm-all   { font-size:0.68rem; font-weight:700; color:var(--accent); background:rgba(66,130,194,0.1); border:1px solid rgba(66,130,194,0.2); padding:0.18rem 0.55rem; border-radius:3px; }
.perm-count { font-size:0.78rem; font-weight:600; color:var(--ink-700); }

/* Grid de permisos */
.perm-hint { font-size:0.82rem; color:var(--ink-500); margin:0 0 0.875rem; }
.perm-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:0.6rem; }
.perm-item { cursor:pointer; }
.perm-check { display:none; }
.perm-item-box {
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.4rem;
  padding:0.875rem 0.5rem; border:1.5px solid var(--line); border-radius:0.375rem;
  background:var(--paper); font-size:0.78rem; font-weight:600; color:var(--ink-500);
  transition:all 0.14s; text-align:center; line-height:1.2; user-select:none;
}
.perm-item-box i { font-size:1.1rem; }
.perm-item:hover .perm-item-box { border-color:var(--accent); color:var(--accent); background:rgba(66,130,194,0.04); }
.perm-item-on { border-color:var(--accent) !important; background:rgba(66,130,194,0.1) !important; color:var(--accent) !important; }

/* ── Modal ── */
.modal-backdrop { position:fixed; inset:0; z-index:500; background:rgba(0,0,0,0.55); backdrop-filter:blur(5px); display:flex; align-items:center; justify-content:center; padding:1rem; }
.modal-box { background:var(--paper); border:1px solid var(--line); border-radius:0.5rem; width:100%; max-width:620px; box-shadow:0 32px 80px rgba(0,0,0,0.25); overflow:hidden; }

/* Cabecera azul */
.modal-head { display:flex; align-items:center; gap:1rem; padding:1.25rem 1.5rem; background:var(--accent); }
.modal-head-icon { width:2.5rem; height:2.5rem; min-width:2.5rem; background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3); border-radius:0.375rem; display:grid; place-items:center; color:#fff; font-size:1rem; }
.modal-head-text { flex:1; min-width:0; }
.modal-title { font-family:var(--font-display); font-size:1rem; font-weight:700; margin:0 0 0.1rem; color:#fff; }
.modal-sub   { font-size:0.72rem; color:rgba(255,255,255,0.65); margin:0; }
.modal-close { width:2rem; height:2rem; min-width:2rem; display:grid; place-items:center; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); border-radius:0.375rem; color:#fff; cursor:pointer; font-size:0.8rem; transition:background 0.12s; }
.modal-close:hover { background:rgba(0,0,0,0.2); }

.modal-body { padding:1.25rem 1.5rem; display:flex; flex-direction:column; }
.modal-foot { display:flex; gap:0.75rem; justify-content:flex-end; padding:0.875rem 1.5rem; border-top:1px solid var(--line); background:var(--surface); }

/* Fila horizontal */
.mrow { display:flex; gap:1rem; flex-wrap:wrap; }

/* Campos */
.mf-field { display:flex; flex-direction:column; gap:0.35rem; margin-bottom:0.875rem; }
.mf-field:last-child { margin-bottom:0; }
.mf-label { font-size:0.65rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08rem; color:var(--ink-500); display:flex; align-items:center; gap:0.25rem; }
.mf-req      { color:var(--danger); }
.mf-optional { font-size:0.62rem; color:var(--ink-500); font-weight:400; text-transform:none; letter-spacing:0; }
.mf-hint     { font-size:0.68rem; color:var(--ink-500); }

.mf-wrap { display:flex; align-items:center; border:1.5px solid var(--line); border-radius:0.375rem; background:var(--paper); overflow:hidden; transition:border-color 0.15s, box-shadow 0.15s; }
.mf-wrap:focus-within { border-color:var(--accent); box-shadow:0 0 0 3px rgba(66,130,194,0.12); }
.mf-icon { padding:0 0.875rem; color:var(--ink-500); font-size:0.85rem; flex-shrink:0; }
.mf-inp  { flex:1; border:none; outline:none; padding:0.75rem 0.5rem 0.75rem 0; font-size:0.875rem; color:var(--ink-900); background:transparent; font-family:var(--font-body); }
.mf-inp::placeholder { color:var(--ink-500); opacity:0.55; }
.mf-sel  { cursor:pointer; }
.mf-eye  { background:none; border:none; padding:0 0.75rem; color:var(--ink-500); cursor:pointer; font-size:0.85rem; flex-shrink:0; line-height:1; transition:color 0.14s; }
.mf-eye:hover { color:var(--ink-900); }

/* Sede note */
.mf-sede-note { display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; color:var(--accent); background:rgba(66,130,194,0.07); border:1px solid rgba(66,130,194,0.18); border-radius:0.375rem; padding:0.5rem 0.75rem; }
.mf-sede-note i { flex-shrink:0; }

/* Error */
.mf-error { display:flex; align-items:center; gap:0.5rem; font-size:0.82rem; color:var(--danger); background:rgba(196,69,54,0.07); border:1px solid rgba(196,69,54,0.2); border-radius:0.375rem; padding:0.6rem 0.875rem; }

/* Rol cards */
.role-cards { display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; }
.role-card {
  display:flex; align-items:center; gap:0.75rem;
  padding:0.875rem 1rem; border:1.5px solid var(--line);
  border-radius:0.375rem; background:var(--paper);
  cursor:pointer; text-align:left; transition:border-color 0.14s, background 0.14s;
  position:relative;
}
.role-card:hover { border-color:var(--accent); background:rgba(66,130,194,0.03); }
.role-card-active { border-color:var(--accent); background:rgba(66,130,194,0.07); }

.role-card-icon { width:2.25rem; height:2.25rem; min-width:2.25rem; border-radius:0.375rem; display:grid; place-items:center; font-size:0.95rem; flex-shrink:0; }
.rc-op    { background:rgba(54,80,108,0.1);   color:var(--ink-700); }
.rc-admin { background:rgba(66,130,194,0.12); color:var(--accent); }
.role-card-active .rc-op    { background:rgba(54,80,108,0.18); }
.role-card-active .rc-admin { background:rgba(66,130,194,0.2); }

.role-card-name { font-size:0.85rem; font-weight:700; color:var(--ink-900); margin:0 0 0.1rem; }
.role-card-desc { font-size:0.7rem; color:var(--ink-500); margin:0; line-height:1.3; }
.role-card-check { position:absolute; top:0.5rem; right:0.5rem; color:var(--accent); font-size:0.85rem; }

/* Botones footer */
.btn-cancel { background:none; border:1px solid var(--line); border-radius:0.375rem; padding:0.6rem 1.1rem; font-size:0.875rem; color:var(--ink-700); cursor:pointer; transition:background 0.14s; }
.btn-cancel:hover { background:var(--surface-2); }
.btn-save { display:flex; align-items:center; gap:0.5rem; padding:0.6rem 1.25rem; background:var(--accent); color:#fff; border:none; border-radius:0.375rem; font-size:0.875rem; font-weight:600; cursor:pointer; transition:opacity 0.14s; }
.btn-save:hover:not(:disabled) { opacity:0.85; }
.btn-save:disabled { opacity:0.6; cursor:not-allowed; }

.modal-fade-enter-active, .modal-fade-leave-active { transition:opacity 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity:0; }
</style>
