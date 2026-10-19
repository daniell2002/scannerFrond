<template>
  <div class="page-wrap">

    <!-- Cabecera -->
    <PageHeader
      :breadcrumb="['Conexa', 'Administración', 'Usuarios']"
      icon="fa-users"
      title="Usuarios del sistema"
      subtitle="Cuentas de acceso, roles, permisos y vendedores"
    >
      <template #action>
        <!-- El rol (supervisor, vendedor o admin) se elige dentro del formulario.
             Quien no es admin solo puede registrar vendedores. -->
        <button class="btn-add" @click="openCreate">
          <i class="fas me-2" :class="isAdmin ? 'fa-user-plus' : 'fa-user-tag'"></i>{{ isAdmin ? 'Nuevo usuario' : 'Nuevo vendedor' }}
        </button>
      </template>
    </PageHeader>

    <!-- Estado -->
    <div v-if="error" class="state-error"><i class="fas fa-exclamation-triangle me-2"></i>{{ error }}</div>
    <div v-else-if="loading" class="state-loading"><i class="fas fa-spinner fa-spin me-2"></i>Cargando usuarios…</div>

    <template v-else>
      <!-- Resumen -->
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-head"><span class="kpi-label">Usuarios</span><i class="fas fa-users kpi-icon"></i></div>
          <span class="kpi-value">{{ users.length }}</span>
        </div>
        <div class="kpi">
          <div class="kpi-head"><span class="kpi-label">Activos</span><i class="fas fa-user-check kpi-icon"></i></div>
          <span class="kpi-value">{{ counts.active }}</span>
        </div>
        <div class="kpi">
          <div class="kpi-head"><span class="kpi-label">Vendedores</span><i class="fas fa-user-tag kpi-icon"></i></div>
          <span class="kpi-value">{{ counts.vendors }}</span>
          <span class="kpi-foot">Para "Atendido por"; no ingresan al sistema</span>
        </div>
        <div class="kpi">
          <div class="kpi-head"><span class="kpi-label">Sin correo</span><i class="fas fa-envelope kpi-icon"></i></div>
          <span class="kpi-value" :class="{ 'is-warn': counts.noEmail }">{{ counts.noEmail }}</span>
          <span v-if="counts.noEmail" class="kpi-foot">Agrégales correo para que ingresen con él</span>
        </div>
      </div>

      <!-- Tabla -->
      <div class="table-card">
        <div class="table-card-head">
          <span class="table-card-head-title">
            <i class="fas fa-users"></i>Usuarios <span class="table-card-count">{{ filtered.length }}</span>
          </span>
          <div class="table-card-search">
            <div class="search-box">
              <i class="fas fa-search search-box-icon"></i>
              <input v-model="query" type="text" class="form-control" placeholder="Buscar por nombre o correo…" />
            </div>
            <BaseSelect v-model="roleFilter" :options="roleFilterOptions" icon="fa-user-tag" size="sm" style="min-width:170px" />
            <BaseSelect v-model="statusFilter" :options="statusFilterOptions" icon="fa-toggle-on" size="sm" style="min-width:150px" />
          </div>
        </div>

        <div v-if="!filtered.length" class="table-empty">
          <i class="fas fa-user-slash"></i>
          <p>{{ users.length ? 'Ningún usuario coincide con la búsqueda.' : 'No hay usuarios. Crea el primero con el botón de arriba.' }}</p>
        </div>

        <div v-else class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Sede</th>
                <th>Módulos</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in filtered" :key="u.id" :class="{ 'is-inactive': !u.active }">
                <td>
                  <div class="us-person">
                    <span class="us-avatar" :class="{ 'is-admin': u.role === 'admin' }">{{ initials(u.name) }}</span>
                    <div class="us-person-info">
                      <span class="us-name">
                        {{ u.name }}
                        <span v-if="u.id === me" class="us-you">Tú</span>
                      </span>
                      <span v-if="u.role === 'vendedor'" class="us-email"><i class="fas fa-lock me-1"></i>Sin acceso al sistema</span>
                      <span v-else-if="u.email" class="us-email">{{ u.email }}</span>
                      <span v-else class="us-email is-missing" :title="`Ingresa con el usuario «${u.username}»`"><i class="fas fa-exclamation-circle"></i>Sin correo · usuario {{ u.username }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge-pill" :class="`role-${u.role}`">
                    <i class="fas" :class="roleByValue(u.role)?.icon || 'fa-user'"></i>
                    {{ roleLabel(u.role) }}
                  </span>
                </td>
                <td>
                  <span v-if="u.sede" class="cell-strong">{{ sedeName(u.sede) }}</span>
                  <span v-else class="cell-muted">{{ u.role === 'admin' ? 'Todas' : 'Sin sede' }}</span>
                </td>
                <td>
                  <span v-if="u.role === 'admin'" class="cell-muted">Acceso total</span>
                  <span v-else-if="u.role === 'vendedor'" class="cell-muted">—</span>
                  <div v-else-if="u.permissions?.length" class="us-mods">
                    <span v-for="p in u.permissions" :key="p" class="us-mod" :title="moduleLabel(p)">
                      <i class="fas" :class="moduleIcon(p)"></i>
                    </span>
                  </div>
                  <span v-else class="cell-muted">Ninguno</span>
                </td>
                <td>
                  <span v-if="!u.active" class="status-chip is-off"><i class="fas fa-circle"></i>Inactivo</span>
                  <span v-else-if="u.mustChangePassword && u.role !== 'vendedor'" class="status-chip is-pending" title="Debe cambiar su contraseña temporal al ingresar">
                    <i class="fas fa-key"></i>Clave temporal
                  </span>
                  <span v-else class="status-chip is-on"><i class="fas fa-circle"></i>Activo</span>
                </td>
                <td class="cell-muted us-last">{{ u.role === 'vendedor' ? '—' : fmtLastLogin(u.lastLoginAt) }}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn-icon btn-edit" :disabled="!canManage(u)" @click="openEdit(u)" :title="canManage(u) ? 'Editar usuario' : 'Solo un administrador puede editar esta cuenta'">
                      <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn-icon btn-warn" :disabled="!canManage(u) || u.role === 'vendedor'" @click="askReset(u)" :title="u.role === 'vendedor' ? 'Los vendedores no tienen contraseña' : 'Restablecer contraseña'">
                      <i class="fas fa-key"></i>
                    </button>
                    <button
                      class="btn-icon"
                      :class="u.active ? 'btn-off' : 'btn-on'"
                      :disabled="u.id === me || !canManage(u)"
                      :title="u.id === me ? 'No puedes desactivar tu propia cuenta' : u.active ? 'Desactivar acceso' : 'Reactivar acceso'"
                      @click="askToggle(u)"
                    >
                      <i class="fas" :class="u.active ? 'fa-user-slash' : 'fa-user-check'"></i>
                    </button>
                    <button
                      class="btn-icon btn-del"
                      :disabled="u.id === me || !canManage(u)"
                      :title="u.id === me ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'"
                      @click="askDelete(u)"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>

  <!-- ── Crear / editar usuario ── -->
  <BaseModal
    v-model="modal"
    :icon="isVendorForm ? 'fa-user-tag' : editing ? 'fa-user-edit' : 'fa-user-plus'"
    :title="isVendorForm ? (editing ? 'Editar vendedor' : 'Nuevo vendedor') : (editing ? 'Editar usuario' : 'Nuevo usuario')"
    :subtitle="isVendorForm
      ? 'Aparecerá en «Atendido por» al registrar órdenes de su sede'
      : editing ? editing.email || editing.name : 'Se creará el acceso con su correo electrónico'"
    max-width="1100px"
  >
    <div class="uf-grid">

      <!-- ── Columna izquierda: persona + contraseña / cuenta ── -->
      <section class="uf-col">
        <p class="us-section">Datos de la persona</p>
        <div class="mf-field">
          <label class="mf-label">Nombre completo <span class="mf-req">*</span></label>
          <div class="mf-wrap">
            <i class="fas fa-user mf-icon"></i>
            <input v-model="form.name" type="text" class="mf-inp" placeholder="Juan Pérez" autocomplete="off" />
          </div>
        </div>
        <div class="mf-field">
          <label class="mf-label">Correo electrónico <span v-if="!isVendorForm" class="mf-req">*</span><small v-else class="text-muted"> (opcional)</small></label>
          <div class="mf-wrap">
            <i class="fas fa-envelope mf-icon"></i>
            <input v-model="form.email" type="email" class="mf-inp" placeholder="juan.perez@empresa.com" autocomplete="off" />
          </div>
          <span class="mf-hint">{{ isVendorForm ? 'Solo como dato de contacto: el vendedor no ingresa al sistema.' : 'Ingresará al sistema con su correo.' }}</span>
        </div>
        <div v-if="form.role !== 'admin'" class="mf-field">
          <label class="mf-label">Sede asignada <span class="mf-req">*</span></label>
          <BaseSelect
            v-model="form.sede"
            :options="sedeOptions"
            icon="fa-building"
            placeholder="Selecciona una sede…"
          />
          <span class="mf-hint">{{ isVendorForm ? 'Solo aparecerá al registrar órdenes de esta sede.' : 'Trabajará solo con las órdenes de esta sede.' }}</span>
        </div>

        <!-- Crear: contraseña inicial (el vendedor no tiene) -->
        <template v-if="!editing && !isVendorForm">
          <p class="us-section">Contraseña de acceso</p>
          <div class="pw-seg" role="radiogroup" aria-label="Contraseña inicial">
            <button type="button" role="radio" :aria-checked="form.passwordMode === 'auto'" :class="{ 'is-active': form.passwordMode === 'auto' }" @click="form.passwordMode = 'auto'">
              <i class="fas fa-wand-magic-sparkles"></i>Generar
            </button>
            <button type="button" role="radio" :aria-checked="form.passwordMode === 'manual'" :class="{ 'is-active': form.passwordMode === 'manual' }" @click="form.passwordMode = 'manual'">
              <i class="fas fa-keyboard"></i>Escribirla
            </button>
          </div>
          <div v-if="form.passwordMode === 'manual'" class="mf-field">
            <div class="mf-wrap">
              <i class="fas fa-lock mf-icon"></i>
              <input v-model="form.password" :type="showPass ? 'text' : 'password'" class="mf-inp"
                placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
              <button type="button" class="mf-eye" @click="showPass = !showPass">
                <i class="fas" :class="showPass ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </div>
            <PasswordStrength :password="form.password" />
          </div>
          <p v-else class="mf-hint">Se mostrará una sola vez para que se la compartas. Deberá cambiarla en su primer ingreso.</p>
        </template>

        <!-- Editar: información de la cuenta -->
        <template v-else-if="editing && !isVendorForm">
          <p class="us-section">Cuenta</p>
          <dl class="uf-account">
            <div><dt>Usuario interno</dt><dd>{{ editing.username }}</dd></div>
            <div><dt>Estado</dt><dd>{{ !editing.active ? 'Inactivo' : editing.mustChangePassword ? 'Clave temporal pendiente' : 'Activo' }}</dd></div>
            <div><dt>Creado</dt><dd>{{ editing.createdAt ? fmtDate(editing.createdAt) : '—' }}</dd></div>
            <div><dt>Último acceso</dt><dd>{{ fmtLastLogin(editing.lastLoginAt) }}</dd></div>
          </dl>
        </template>

      </section>

      <!-- ── Columna central: rol y lo que verá ── -->
      <section class="uf-col">
        <p class="us-section">Rol</p>
        <div class="uf-roles">
          <button
            v-for="opt in visibleRoles" :key="opt.value"
            type="button"
            class="role-card"
            :class="{ 'is-active': form.role === opt.value }"
            :disabled="roleLocked(opt.value)"
            :title="roleLocked(opt.value) && editing?.id !== me ? 'Un vendedor no tiene cuenta de acceso: crea un usuario aparte' : ''"
            @click="setRole(opt.value)"
          >
            <span class="role-card-icon"><i class="fas" :class="opt.icon"></i></span>
            <span class="role-card-body">
              <span class="role-card-name">{{ opt.label }}</span>
              <span class="role-card-desc">{{ opt.desc }}</span>
            </span>
            <i v-if="form.role === opt.value" class="fas fa-check-circle role-card-check"></i>
          </button>
        </div>

        <!-- Resumen de acceso -->
        <div class="uf-summary">
          <p class="uf-summary-title"><i class="fas fa-eye"></i>Lo que verá {{ form.name.trim().split(' ')[0] || 'este usuario' }}</p>
          <ul>
            <li v-for="(l, i) in summary" :key="i" :class="{ 'is-warn': l.warn }">
              <i class="fas" :class="l.icon"></i><span>{{ l.text }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- ── Columna derecha: módulos ── -->
      <section class="uf-col">

        <div v-if="isVendorForm" class="uf-admin-note">
          <i class="fas fa-user-tag"></i>
          <span>El vendedor no tiene módulos ni contraseña. Solo se registra para elegirlo en <strong>Atendido por</strong> y filtrar las órdenes por él.</span>
        </div>

        <template v-else-if="form.role !== 'admin'">
          <div class="uf-mods-head">
            <p class="us-section">Módulos habilitados</p>
            <span class="uf-mods-actions">
              <button type="button" @click="setAllPermissions(true)">Todos</button>
              <span>·</span>
              <button type="button" @click="setAllPermissions(false)">Ninguno</button>
            </span>
          </div>
          <div v-for="g in MODULE_GROUPS" :key="g.label" class="uf-group">
            <span class="uf-group-label">{{ g.label }}</span>
            <div class="uf-mods">
              <button
                v-for="mod in g.modules" :key="mod.key"
                type="button"
                class="uf-mod"
                :class="{ 'is-active': form.permissions.includes(mod.key), 'is-locked': !canGrant(mod.key) }"
                :disabled="!canGrant(mod.key)"
                :title="canGrant(mod.key) ? mod.desc : 'No puedes otorgar un módulo que tú no tienes'"
                @click="togglePermission(mod.key)"
              >
                <span class="uf-mod-icon"><i class="fas" :class="mod.icon"></i></span>
                <span class="uf-mod-body">
                  <span class="uf-mod-name">{{ mod.label }}</span>
                  <span class="uf-mod-desc">{{ mod.desc }}</span>
                </span>
                <span class="uf-mod-check"><i class="fas" :class="canGrant(mod.key) ? 'fa-check' : 'fa-lock'"></i></span>
              </button>
            </div>
          </div>
        </template>

        <div v-else class="uf-admin-note">
          <i class="fas fa-shield-alt"></i>
          <span>El administrador tiene todos los módulos en todas las sedes; no hace falta elegirlos.</span>
        </div>
      </section>
    </div>

    <div v-if="modalError" class="mf-error">
      <i class="fas fa-exclamation-circle"></i>{{ modalError }}
    </div>

    <template #footer>
      <button class="btn-cancel" @click="modal = false">Cancelar</button>
      <button class="btn-save" :disabled="saving" @click="save">
        <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-check'"></i>
        {{ saving ? 'Guardando…' : editing ? 'Guardar cambios' : isVendorForm ? 'Registrar vendedor' : 'Crear usuario' }}
      </button>
    </template>
  </BaseModal>

  <!-- ── Credenciales (se muestran una sola vez) ── -->
  <BaseModal
    v-model="credModal"
    icon="fa-key"
    tone="success"
    :title="cred?.isNew ? 'Usuario creado' : 'Contraseña restablecida'"
    :subtitle="cred?.name"
    max-width="480px"
  >
    <template v-if="cred">
      <p class="cred-intro">Comparte estos datos con <strong>{{ cred.name }}</strong>. Al ingresar se le pedirá crear su propia contraseña.</p>
      <div class="cred-box">
        <div class="cred-row">
          <span class="cred-label">{{ cred.email ? 'Correo' : 'Usuario' }}</span>
          <span class="cred-val">{{ cred.email || cred.username }}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Contraseña temporal</span>
          <span class="cred-val cred-pass">{{ cred.tempPassword }}</span>
          <button type="button" class="btn-icon" title="Copiar contraseña" @click="copy(cred.tempPassword, 'Contraseña copiada')">
            <i class="fas fa-copy"></i>
          </button>
        </div>
      </div>
      <p class="cred-warn"><i class="fas fa-exclamation-triangle"></i>Esta contraseña no se volverá a mostrar.</p>
    </template>
    <template #footer>
      <button class="btn-cancel" @click="copy(credText, 'Datos de acceso copiados')"><i class="fas fa-copy me-2"></i>Copiar todo</button>
      <button class="btn-save" @click="credModal = false"><i class="fas fa-check"></i>Listo</button>
    </template>
  </BaseModal>

  <!-- ── Confirmación ── -->
  <BaseModal
    v-model="confirmModal"
    :icon="confirmCfg.icon"
    :title="confirmCfg.title"
    :tone="confirmCfg.danger ? 'danger' : 'accent'"
    max-width="440px"
  >
    <p class="confirm-text" v-html="confirmCfg.text"></p>
    <template #footer>
      <button class="btn-cancel" @click="confirmModal = false">Cancelar</button>
      <button :class="confirmCfg.danger ? 'btn-danger' : 'btn-save'" :disabled="confirmBusy" @click="runConfirm">
        <i class="fas" :class="confirmBusy ? 'fa-spinner fa-spin' : confirmCfg.icon"></i>{{ confirmCfg.action }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../api'
import { useNotificationsStore } from '../stores/notifications'
import { useAuthStore } from '../stores/auth'
import BaseModal from '../components/BaseModal.vue'
import BaseSelect from '../components/BaseSelect.vue'
import PageHeader from '../components/PageHeader.vue'
import PasswordStrength from '../components/PasswordStrength.vue'
import { MODULE_GROUPS, ALL_MODULES, ROLES, moduleByKey, roleByValue, roleLabel, accessSummary } from '../utils/modules'

const users   = ref([])
const sedes   = ref([])
const loading = ref(true)
const error   = ref('')
const notify  = useNotificationsStore()
const auth    = useAuthStore()
const me      = computed(() => auth.user?.id)

// Solo el admin asigna roles de supervisor o administrador
const visibleRoles = computed(() => ROLES.filter(r => r.value === 'vendedor' || isAdmin.value))

// Misma definición que el menú lateral (utils/modules.js)
const moduleLabel = (k) => moduleByKey(k)?.label || k
const moduleIcon  = (k) => moduleByKey(k)?.icon || 'fa-puzzle-piece'

/* Delegación: quien gestiona usuarios sin ser admin solo maneja los vendedores
   de su sede (el backend lo valida igual). */
const isAdmin  = computed(() => auth.user?.role === 'admin')
const canGrant = (key) => isAdmin.value || (auth.user?.permissions || []).includes(key)
const canManage = (u) => isAdmin.value || (u.role === 'vendedor' && u.sede === auth.user?.sede)
const sedeOptions = computed(() => sedes.value
  .filter(s => isAdmin.value || s.code === auth.user?.sede)
  .map(s => ({ value: s.code, label: `${s.name} — ${s.city}` })))

function setAllPermissions(on) {
  form.value.permissions = on
    ? ALL_MODULES.map(m => m.key).filter(k => canGrant(k) || form.value.permissions.includes(k))
    : form.value.permissions.filter(k => !canGrant(k))
}

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

const replaceUser = (u) => {
  const idx = users.value.findIndex(x => x.id === u.id)
  if (idx >= 0) users.value[idx] = u
}

/* ── Filtros ── */
const query        = ref('')
const roleFilter   = ref('all')
const statusFilter = ref('all')
const roleFilterOptions = [
  { value: 'all', label: 'Todos los roles' },
  { value: 'admin', label: 'Administradores' },
  { value: 'supervisor', label: 'Supervisores' },
  { value: 'vendedor', label: 'Vendedores' },
]
const statusFilterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return users.value.filter(u =>
    (!q || u.name.toLowerCase().includes(q) || (u.email || '').includes(q) || u.username.includes(q)) &&
    (roleFilter.value === 'all' || u.role === roleFilter.value) &&
    (statusFilter.value === 'all' || (statusFilter.value === 'active') === u.active)
  )
})

const counts = computed(() => ({
  active:  users.value.filter(u => u.active).length,
  vendors: users.value.filter(u => u.role === 'vendedor').length,
  noEmail: users.value.filter(u => !u.email && u.role !== 'vendedor').length,
}))

/* ── Crear / editar ── */
const modal      = ref(false)
const editing    = ref(null)
const saving     = ref(false)
const modalError = ref('')
const showPass   = ref(false)
const emptyForm  = (role = isAdmin.value ? 'supervisor' : 'vendedor') => ({
  name: '', email: '', role,
  permissions: (roleByValue(role)?.preset || []).filter(k => canGrant(k)),
  sede: isAdmin.value ? '' : (auth.user?.sede || ''),
  passwordMode: 'auto', password: '',
})
const form = ref(emptyForm())
const isVendorForm = computed(() => form.value.role === 'vendedor')

/* Un vendedor no tiene cuenta de acceso: al editar no cambia a otro rol ni al revés.
   Tampoco puedes quitarte a ti mismo el rol de administrador. */
const roleLocked = (role) => !!editing.value && (
  (editing.value.id === me.value && role !== 'admin') ||
  ((editing.value.role === 'vendedor') !== (role === 'vendedor'))
)

function openCreate() {
  editing.value    = null
  showPass.value   = false
  form.value       = emptyForm()
  modalError.value = ''
  modal.value      = true
}

function openEdit(u) {
  editing.value    = u
  form.value       = {
    ...emptyForm(),
    name: u.name, email: u.email || '', role: u.role, sede: u.sede || '',
    permissions: [...(u.permissions || [])],
  }
  modalError.value = ''
  modal.value      = true
}

// Al elegir un rol se aplica su plantilla de módulos (luego se puede ajustar)
function setRole(role) {
  if (form.value.role === role) return
  form.value.role = role
  if (role === 'admin') form.value.sede = ''
  form.value.permissions = (roleByValue(role)?.preset || []).filter(k => canGrant(k))
}

const summary = computed(() => accessSummary({
  role: form.value.role,
  sedeName: sedeName(form.value.sede) !== '—' ? sedeName(form.value.sede) : '',
  permissions: form.value.permissions,
}))

function togglePermission(key) {
  const list = form.value.permissions
  const idx = list.indexOf(key)
  idx >= 0 ? list.splice(idx, 1) : list.push(key)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

async function save() {
  modalError.value = ''
  const f = form.value
  const email = f.email.trim().toLowerCase()

  const vendor = f.role === 'vendedor'
  if (!f.name.trim())        return (modalError.value = 'Ingresa el nombre completo.')
  if ((!vendor || email) && !EMAIL_RE.test(email)) return (modalError.value = 'Ingresa un correo electrónico válido.')
  if (f.role !== 'admin' && !f.sede) return (modalError.value = `Selecciona la sede del ${roleLabel(f.role).toLowerCase()}.`)
  if (!editing.value && !vendor && f.passwordMode === 'manual' && f.password.length < 8)
    return (modalError.value = 'La contraseña debe tener al menos 8 caracteres.')

  const payload = {
    name: f.name.trim(),
    email,
    role: f.role,
    sede: f.role !== 'admin' ? f.sede : null,
    permissions: f.role !== 'admin' && !vendor ? f.permissions : [],
  }

  saving.value = true
  try {
    if (editing.value) {
      const updated = await api.patch(`/api/users/${editing.value.id}`, payload)
      replaceUser(updated)
      notify.success(`Los datos de ${updated.name} fueron actualizados.`, { title: 'Usuario actualizado' })
      modal.value = false
    } else {
      if (f.passwordMode === 'manual' && !vendor) payload.password = f.password
      const { tempPassword, ...user } = await api.post('/api/users', payload)
      users.value.push(user)
      users.value.sort((a, b) => a.name.localeCompare(b.name))
      modal.value = false
      if (vendor) notify.success(`${user.name} ya aparece en «Atendido por» de ${sedeName(user.sede)}.`, { title: 'Vendedor registrado' })
      else if (tempPassword) showCredentials(user, tempPassword, true)
      else notify.success(`${user.name} ya puede ingresar con su correo.`, { title: 'Usuario creado' })
    }
  } catch (e) { modalError.value = e.message }
  finally     { saving.value = false }
}

/* ── Credenciales ── */
const credModal = ref(false)
const cred      = ref(null)

function showCredentials(user, tempPassword, isNew) {
  cred.value = { ...user, tempPassword, isNew }
  credModal.value = true
}

const credText = computed(() => cred.value
  ? `Acceso a Conexa\nIngreso: ${window.location.origin}\n${cred.value.email ? 'Correo' : 'Usuario'}: ${cred.value.email || cred.value.username}\nContraseña temporal: ${cred.value.tempPassword}\n\nAl ingresar se te pedirá crear tu propia contraseña.`
  : '')

async function copy(text, msg) {
  try {
    await navigator.clipboard.writeText(text)
    notify.success(msg, { title: 'Copiado', timeout: 2000 })
  } catch {
    notify.warning('No fue posible copiar; selecciona el texto manualmente.', { title: 'Portapapeles' })
  }
}

/* ── Confirmaciones ── */
const confirmModal = ref(false)
const confirmBusy  = ref(false)
const confirmCfg   = ref({})

function confirmAction(cfg) {
  confirmCfg.value = cfg
  confirmModal.value = true
}

async function runConfirm() {
  confirmBusy.value = true
  try {
    await confirmCfg.value.run()
    confirmModal.value = false
  } catch (e) {
    notify.error(e.message || 'No fue posible completar la acción.', { title: 'Error' })
  } finally {
    confirmBusy.value = false
  }
}

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function askReset(u) {
  confirmAction({
    icon: 'fa-key', title: 'Restablecer contraseña', action: 'Restablecer',
    text: `Se generará una contraseña temporal nueva para <strong>${esc(u.name)}</strong>. La actual dejará de funcionar.`,
    run: async () => {
      const { tempPassword, ...user } = await api.post(`/api/users/${u.id}/reset-password`)
      replaceUser(user)
      showCredentials(user, tempPassword, false)
    },
  })
}

function askToggle(u) {
  const off = u.active
  confirmAction({
    icon: off ? 'fa-user-slash' : 'fa-user-check',
    title: off ? 'Desactivar acceso' : 'Reactivar acceso',
    action: off ? 'Desactivar' : 'Reactivar',
    danger: off,
    text: u.role === 'vendedor'
      ? (off
        ? `<strong>${esc(u.name)}</strong> dejará de aparecer en «Atendido por». Las órdenes que atendió se conservan y se pueden seguir filtrando.`
        : `<strong>${esc(u.name)}</strong> volverá a aparecer en «Atendido por».`)
      : off
        ? `<strong>${esc(u.name)}</strong> no podrá ingresar y su sesión actual se cerrará. Sus órdenes y su historial se conservan.`
        : `<strong>${esc(u.name)}</strong> podrá volver a ingresar con su correo y contraseña.`,
    run: async () => {
      const updated = await api.patch(`/api/users/${u.id}`, { active: !off })
      replaceUser(updated)
      notify.success(`${updated.name} fue ${off ? 'desactivado' : 'reactivado'}.`, { title: off ? 'Acceso desactivado' : 'Acceso reactivado' })
    },
  })
}

function askDelete(u) {
  confirmAction({
    icon: 'fa-trash', title: 'Eliminar usuario', action: 'Eliminar', danger: true,
    text: `¿Eliminar definitivamente a <strong>${esc(u.name)}</strong>? Esta acción no se puede deshacer.<br><br>Si solo quieres quitarle el acceso, usa <strong>Desactivar</strong>.`,
    run: async () => {
      await api.del(`/api/users/${u.id}`)
      users.value = users.value.filter(x => x.id !== u.id)
      notify.warning(`${u.name} fue eliminado.`, { title: 'Usuario eliminado' })
    },
  })
}

/* ── Formato ── */
const sedeName = (code) => sedes.value.find(s => s.code === code)?.name || code || '—'
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'

const fmtDate = (d) => new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

function fmtLastLogin(d) {
  if (!d) return 'Nunca'
  const date = new Date(d)
  const mins = Math.round((Date.now() - date) / 60000)
  if (mins < 1)  return 'Hace un momento'
  if (mins < 60) return `Hace ${mins} min`
  const time = date.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  if (date.toDateString() === new Date().toDateString()) return `Hoy, ${time}`
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>

.search-box { position:relative; flex:1 1 220px; max-width:300px; }
.search-box-icon { position:absolute; left:0.8rem; top:50%; transform:translateY(-50%); color:var(--ink-500); font-size:0.8rem; pointer-events:none; }
.search-box .form-control { padding-left:2.15rem; }

/* Persona */
.us-person { display:flex; align-items:center; gap:0.75rem; min-width:220px; }
.us-avatar {
  width:2.4rem; height:2.4rem; min-width:2.4rem; border-radius:50%;
  display:grid; place-items:center; font-size:0.78rem; font-weight:700;
  color:var(--accent-strong); background:color-mix(in srgb, var(--accent) 14%, transparent);
}
.us-avatar.is-admin { color:#fff; background:linear-gradient(135deg, var(--accent), var(--accent-strong)); }
.us-person-info { display:flex; flex-direction:column; min-width:0; }
.us-name  { display:flex; align-items:center; gap:0.4rem; font-weight:700; color:var(--ink-900); font-size:0.875rem; }
.us-you   { font-size:0.6rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05rem; padding:0.1rem 0.4rem; border-radius:999px; background:var(--surface); color:var(--ink-500); }
.us-email { font-size:0.78rem; color:var(--ink-500); }
.us-email.is-missing { display:inline-flex; align-items:center; gap:0.3rem; color:var(--warning); white-space:nowrap; }

tr.is-inactive td { opacity:0.55; }
tr.is-inactive td:last-child { opacity:1; }

.cell-strong { font-weight:600; color:var(--ink-900); font-size:0.85rem; white-space:nowrap; }
.us-last { white-space:nowrap; font-size:0.8rem; }

.us-mods { display:flex; gap:0.3rem; }
.us-mod {
  width:1.7rem; height:1.7rem; border-radius:0.4rem; display:grid; place-items:center;
  font-size:0.72rem; color:var(--accent-strong); background:color-mix(in srgb, var(--accent) 10%, transparent);
}

.badge-pill { display:inline-flex; align-items:center; gap:0.35rem; font-size:0.75rem; font-weight:600; padding:0.28rem 0.65rem; border-radius:999px; white-space:nowrap; }
.badge-pill-primary { background:rgba(42,120,214,0.1); color:var(--accent-strong); }
.badge-pill-neutral { background:var(--surface); color:var(--ink-700); }

.status-chip { display:inline-flex; align-items:center; gap:0.35rem; font-size:0.72rem; font-weight:700; padding:0.25rem 0.65rem; border-radius:999px; white-space:nowrap; }
.status-chip .fa-circle { font-size:0.42rem; }
.status-chip.is-on      { color:var(--success); background:color-mix(in srgb, var(--success) 12%, transparent); }
.status-chip.is-off     { color:var(--ink-500); background:var(--surface); }
.status-chip.is-pending { color:#b7770b; background:rgba(225,161,26,0.14); }

.btn-icon:disabled { opacity:0.35; cursor:not-allowed; }
.btn-warn:hover:not(:disabled) { background:var(--secondary); color:#fff; border-color:var(--secondary); }
.btn-off:hover:not(:disabled)  { background:var(--ink-700); color:#fff; border-color:var(--ink-700); }
.btn-on:hover:not(:disabled)   { background:var(--success); color:#fff; border-color:var(--success); }

/* Formulario */
.us-section {
  margin:1.1rem 0 0.6rem; padding-bottom:0.4rem; border-bottom:1px solid var(--line);
  font-size:0.68rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08rem; color:var(--ink-500);
}
.us-section:first-child { margin-top:0; }

/* Formulario en dos columnas */
.uf-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:0 1.75rem; }
@media (max-width: 1150px) { .uf-grid { grid-template-columns:1fr 1fr; } .uf-grid > .uf-col:last-child { grid-column:1 / -1; } }
.uf-col  { display:flex; flex-direction:column; gap:0.9rem; min-width:0; }
.uf-col .us-section { margin:0 0 -0.2rem; }
.uf-col .us-section:not(:first-child) { margin-top:0.6rem; }
@media (max-width: 820px) {
  .uf-grid { grid-template-columns:1fr; }
  .uf-col + .uf-col { margin-top:0.9rem; }
}

/* Nombre y correo en una fila; módulos compactos (la descripción va en el title) */
.uf-mods .uf-mod { padding:0.3rem 0.5rem; gap:0.5rem; }
.uf-mods .uf-mod-icon { width:1.5rem; height:1.5rem; min-width:1.5rem; font-size:0.68rem; }
.uf-mods .uf-mod-desc { display:none; }
.uf-mods .uf-mod-name { font-size:0.8rem; }
.uf-group { gap:0.3rem !important; }
.uf-roles { display:flex; flex-direction:column; gap:0.45rem; }
.uf-roles .role-card { min-width:0; padding:0.55rem 0.7rem; gap:0.65rem; }
.uf-roles .role-card-icon { width:2rem; height:2rem; min-width:2rem; font-size:0.8rem; }
.uf-roles .role-card-name { font-size:0.84rem; }
.uf-roles .role-card-desc { font-size:0.72rem; }

.pw-seg { display:grid; grid-template-columns:1fr 1fr; padding:0.2rem; gap:0.2rem; background:var(--surface); border:1px solid var(--line); border-radius:0.6rem; }
.pw-seg button { display:inline-flex; align-items:center; justify-content:center; gap:0.45rem; padding:0.5rem 0.6rem; border:none; border-radius:0.45rem; background:transparent; color:var(--ink-500); font-family:var(--font-body); font-size:0.8rem; font-weight:600; cursor:pointer; transition:background 0.14s, color 0.14s; }
.pw-seg button:hover { color:var(--ink-900); }
.pw-seg button.is-active { background:var(--paper); color:var(--ink-900); box-shadow:var(--shadow-sm); }

.uf-summary { margin-top:0.35rem; padding:0.85rem 1rem; border-radius:0.65rem; background:color-mix(in srgb, var(--accent) 5%, var(--paper)); border:1px solid color-mix(in srgb, var(--accent) 18%, var(--line)); }
.uf-summary-title { display:flex; align-items:center; gap:0.45rem; margin:0 0 0.5rem; font-size:0.8rem; font-weight:700; color:var(--accent-strong); }
html.dark .uf-summary-title { color:#93c5fd; }
.uf-summary ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:0.35rem; }
.uf-summary li { display:flex; gap:0.55rem; font-size:0.8rem; line-height:1.4; color:var(--ink-700); }
.uf-summary li i { width:0.95rem; min-width:0.95rem; margin-top:0.18rem; text-align:center; font-size:0.72rem; color:var(--ink-400); }
.uf-summary li.is-warn, .uf-summary li.is-warn i { color:var(--warning); }

.badge-pill.role-admin      { background:var(--accent-soft); color:var(--accent-strong); }
.badge-pill.role-supervisor { background:color-mix(in srgb, var(--series-7) 12%, transparent); color:var(--series-7); }
.badge-pill.role-vendedor   { background:var(--surface); color:var(--ink-700); }
.uf-roles .role-card { min-width:0; }
@media (max-width: 480px) { .uf-roles { grid-template-columns:1fr; } }

.uf-mods { display:grid; grid-template-columns:1fr; gap:0.22rem; }
@media (max-width: 1150px) { .uf-mods { grid-template-columns:repeat(2, minmax(0, 1fr)); } }
.uf-mod {
  position:relative; display:flex; align-items:center; gap:0.6rem; min-width:0;
  padding:0.6rem 0.7rem; border-radius:0.6rem; text-align:left;
  border:1.5px solid var(--line); background:var(--paper); cursor:pointer; transition:all 0.14s;
}
.uf-mod:hover { border-color:var(--ink-300); }
.uf-mod.is-active { border-color:var(--accent); background:rgba(42,120,214,0.05); }
.uf-mod-icon {
  width:2rem; height:2rem; min-width:2rem; border-radius:0.45rem; display:grid; place-items:center;
  font-size:0.8rem; background:var(--surface); color:var(--ink-500); transition:all 0.14s;
}
.uf-mod.is-active .uf-mod-icon { background:var(--accent); color:#fff; }
.uf-mod-body { flex:1; min-width:0; display:flex; flex-direction:column; }
.uf-mod-name { font-size:0.82rem; font-weight:700; color:var(--ink-900); }
.uf-mod-desc { font-size:0.7rem; color:var(--ink-500); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.uf-mods-head { display:flex; align-items:center; justify-content:space-between; gap:0.5rem; }
.uf-mods-head .us-section { flex:1; }
.uf-mods-actions { display:inline-flex; align-items:center; gap:0.35rem; margin-top:0.35rem; font-size:0.75rem; color:var(--ink-400); }
.uf-mods-actions button { border:none; background:none; padding:0; font-family:var(--font-body); font-size:0.75rem; font-weight:600; color:var(--accent); cursor:pointer; }
.uf-mods-actions button:hover { text-decoration:underline; }
.uf-group { display:flex; flex-direction:column; gap:0.35rem; }
.uf-group-label { font-size:0.7rem; font-weight:600; color:var(--ink-500); }
.uf-mod.is-locked { opacity:0.5; cursor:not-allowed; }
.uf-mod-check {
  width:1.1rem; height:1.1rem; min-width:1.1rem; border-radius:0.3rem; display:grid; place-items:center;
  font-size:0.55rem; color:transparent; border:1.5px solid var(--ink-300); transition:all 0.14s;
}
.uf-mod.is-active .uf-mod-check { background:var(--accent); border-color:var(--accent); color:#fff; }
@media (max-width: 480px) { .uf-mods { grid-template-columns:1fr; } }

.uf-admin-note {
  display:flex; gap:0.6rem; padding:0.85rem 1rem; border-radius:0.6rem;
  font-size:0.8rem; line-height:1.5; color:var(--accent-strong);
  background:rgba(42,120,214,0.06); border:1px solid rgba(42,120,214,0.15);
}
.uf-admin-note i { margin-top:0.2rem; }

.uf-account {
  display:grid; grid-template-columns:1fr 1fr; gap:0.75rem 1rem; margin:0;
  padding:0.85rem 1rem; border:1px solid var(--line); border-radius:0.6rem;
}
.uf-account dt { font-size:0.62rem; font-weight:700; text-transform:uppercase; letter-spacing:0.07rem; color:var(--ink-500); }
.uf-account dd { margin:0.15rem 0 0; font-size:0.84rem; font-weight:600; color:var(--ink-900); word-break:break-word; }

.chip-toggle {
  display:inline-flex; align-items:center; gap:0.5rem;
  padding:0.45rem 0.85rem; border-radius:999px;
  border:1.5px solid var(--line); background:var(--paper); color:var(--ink-700);
  font-size:0.8rem; font-weight:600; cursor:pointer; transition:all 0.14s;
}
.chip-toggle:hover { border-color:var(--ink-300); }
.chip-toggle.is-active { background:rgba(42,120,214,0.1); border-color:var(--accent); color:var(--accent-strong); }

.role-card {
  flex:1; min-width:220px; display:flex; align-items:center; gap:0.75rem;
  padding:0.75rem; border-radius:0.65rem; border:1.5px solid var(--line);
  background:var(--paper); cursor:pointer; text-align:left; transition:all 0.14s;
}
.role-card:hover:not(:disabled) { border-color:var(--ink-300); }
.role-card:disabled { opacity:0.5; cursor:not-allowed; }
.role-card.is-active { border-color:var(--accent); background:rgba(42,120,214,0.06); }
.role-card-icon {
  width:2.5rem; height:2.5rem; min-width:2.5rem; border-radius:0.5rem;
  display:grid; place-items:center; background:var(--surface); color:var(--ink-700); font-size:0.9rem;
}
.role-card.is-active .role-card-icon { background:var(--accent); color:#fff; }
.role-card-body { flex:1; min-width:0; }
.role-card-name { display:block; font-size:0.85rem; font-weight:700; color:var(--ink-900); }
.role-card-desc { display:block; font-size:0.7rem; color:var(--ink-500); line-height:1.3; }
.role-card-check { color:var(--accent); font-size:1rem; flex-shrink:0; }


/* Credenciales */
.cred-intro { margin:0 0 1rem; font-size:0.85rem; line-height:1.55; color:var(--ink-700); }
.cred-box { border:1px solid var(--line); border-radius:0.65rem; overflow:hidden; }
.cred-row { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; }
.cred-row + .cred-row { border-top:1px solid var(--line); }
.cred-label { width:9rem; flex-shrink:0; font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05rem; color:var(--ink-500); }
.cred-val   { flex:1; font-weight:600; color:var(--ink-900); word-break:break-all; }
.cred-pass  { font-family:ui-monospace, 'Cascadia Mono', Consolas, monospace; font-size:1.05rem; letter-spacing:0.06rem; }
.cred-warn  { display:flex; align-items:center; gap:0.45rem; margin:0.85rem 0 0; font-size:0.78rem; font-weight:600; color:#b7770b; }

.confirm-text { margin:0; font-size:0.875rem; line-height:1.6; color:var(--ink-700); }
</style>
