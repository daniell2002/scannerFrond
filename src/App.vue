<template>

  <NotificationsTray />
  <PasswordChangeRequired v-if="!isLogin && auth.user?.mustChangePassword" />
  <SessionTimeout v-if="!isLogin && auth.user" />
  <FeedbackAlert v-if="!isLogin && auth.user && auth.user.role !== 'admin' && auth.hasPermission('observaciones') && !auth.user.mustChangePassword" />

  <!-- ── Login: sin layout ── -->
  <div v-if="isLogin">
    <RouterView />
  </div>

  <!-- ── Sesión activa: layout unificado con sidebar dinámico ── -->
  <div v-else class="app-layout" :class="{ 'sidebar-open': sidebarOpen }">

    <div class="sidebar-overlay" :class="{ 'is-active': sidebarOpen }" @click="sidebarOpen = false"></div>

    <!-- ── Menú lateral ── -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <RouterLink to="/" class="sidebar-brand-link" title="Ir al inicio" @click="closeOnMobile">
          <span class="sidebar-logo-clip">
            <img src="/img/logo2-01.png" alt="Láminas & Dobleces" class="sidebar-logo" />
          </span>
        </RouterLink>
      </div>

      <nav class="sidebar-scroll" aria-label="Navegación principal">
        <div v-for="section in navSections" :key="section.label" class="sidebar-section">
          <span class="sidebar-section-label">{{ section.label }}</span>
          <RouterLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="sidebar-link"
            :class="{ 'is-exact-active': item.to === '/' && route.path === '/' }"
            :active-class="item.to === '/' ? '' : 'router-link-active'"
            :title="sidebarOpen ? '' : item.label"
            @click="closeOnMobile"
          >
            <span class="sidebar-link-icon"><i class="fas" :class="item.icon"></i></span>
            <span class="sidebar-link-text">{{ item.label }}</span>
            <span v-if="badgeFor(item)" class="sidebar-badge">{{ badgeFor(item) > 99 ? '99+' : badgeFor(item) }}</span>
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar-foot">
        <button class="sidebar-collapse" type="button" @click="sidebarOpen = !sidebarOpen">
          <i class="fas fa-angles-left"></i><span>Contraer menú</span>
        </button>
      </div>
    </aside>

    <div class="main-area">
      <!-- ── Barra superior ── -->
      <header class="topbar">
        <button class="hamburger-btn" aria-label="Abrir menú" @click="sidebarOpen = !sidebarOpen">
          <i class="fas fa-bars"></i>
        </button>

        <div class="topbar-crumbs">
          <span class="crumb-section">{{ currentPage.section }}</span>
          <i class="fas fa-chevron-right"></i>
          <strong>{{ currentPage.title }}</strong>
        </div>

        <div class="topbar-right">
          <span class="topbar-date d-none d-lg-inline-flex">
            <i class="far fa-calendar"></i>{{ today }}
          </span>
          <NotificationsBell v-if="auth.user" :key="auth.user.id" />
          <button class="theme-toggle" @click="toggleDark" :title="darkMode ? 'Modo claro' : 'Modo oscuro'">
            <i class="fas" :class="darkMode ? 'fa-sun' : 'fa-moon'"></i>
          </button>
          <span class="topbar-sep"></span>

          <div class="user-menu" ref="userMenuRoot">
            <button class="user-menu-trigger" @click="userMenuOpen = !userMenuOpen">
              <span class="user-avatar">{{ initials }}</span>
              <span class="user-menu-info d-none d-md-flex">
                <span class="user-menu-name">{{ auth.user?.name || 'Usuario' }}</span>
                <span class="user-menu-role">{{ roleLabel }}</span>
              </span>
              <i class="fas fa-chevron-down"></i>
            </button>
            <Transition name="user-menu-fade">
              <div v-if="userMenuOpen" class="user-menu-dropdown">
                <div class="user-menu-head">
                  <strong>{{ auth.user?.name }}</strong>
                  <span>{{ auth.user?.email || roleLabel }}</span>
                </div>
                <button class="user-menu-item" @click="openSettings">
                  <i class="fas fa-user-gear"></i>Ajustes de la cuenta
                </button>
                <button class="user-menu-item is-danger" @click="doLogout">
                  <i class="fas fa-arrow-right-from-bracket"></i>Cerrar sesión
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <main class="page-main">
        <RouterView />
      </main>
    </div>

  </div>

  <BaseModal v-model="settingsOpen" icon="fa-cog" title="Ajustes de la cuenta" subtitle="Actualiza tu correo o contraseña">
    <div class="mf-field">
      <label class="mf-label">Correo</label>
      <div class="mf-wrap">
        <i class="fas fa-envelope mf-icon"></i>
        <input v-model="settingsForm.email" type="email" class="mf-inp" placeholder="correo@ejemplo.com" />
      </div>
    </div>
    <div class="mf-field">
      <label class="mf-label">Contraseña actual</label>
      <div class="mf-wrap">
        <i class="fas fa-lock mf-icon"></i>
        <input v-model="settingsForm.currentPassword" type="password" class="mf-inp" />
      </div>
      <span class="mf-hint">Requerida solo si vas a cambiar la contraseña</span>
    </div>
    <div class="mf-field">
      <label class="mf-label">Nueva contraseña</label>
      <div class="mf-wrap">
        <i class="fas fa-key mf-icon"></i>
        <input v-model="settingsForm.newPassword" type="password" class="mf-inp" placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
      </div>
      <PasswordStrength :password="settingsForm.newPassword" />
    </div>
    <div v-if="settingsError" class="mf-error">
      <i class="fas fa-exclamation-circle"></i>{{ settingsError }}
    </div>

    <template #footer>
      <button class="btn-cancel" @click="settingsOpen = false">Cancelar</button>
      <button class="btn-save" :disabled="savingSettings" @click="saveSettings">
        <i class="fas" :class="savingSettings ? 'fa-spinner fa-spin' : 'fa-check'"></i>
        {{ savingSettings ? 'Guardando…' : 'Guardar' }}
      </button>
    </template>
  </BaseModal>

</template>


<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useOrdersStore } from './stores/orders'
import { useNotificationsStore } from './stores/notifications'
import { useFeedbackStore } from './stores/feedback'
import { MODULE_GROUPS, canAccess, roleLabel as roleName } from './utils/modules'
import { api } from './api'
import NotificationsTray from './components/NotificationsTray.vue'
import NotificationsBell from './components/NotificationsBell.vue'
import FeedbackAlert from './components/FeedbackAlert.vue'
import PasswordChangeRequired from './components/PasswordChangeRequired.vue'
import SessionTimeout from './components/SessionTimeout.vue'
import PasswordStrength from './components/PasswordStrength.vue'
import BaseModal from './components/BaseModal.vue'

const DESKTOP_BREAKPOINT = 1200

const route       = useRoute()
const router      = useRouter()
const auth        = useAuthStore()
const ordersStore = useOrdersStore()
const notify      = useNotificationsStore()
const feedbackStore = useFeedbackStore()
// En escritorio se recuerda si el usuario dejó el menú contraído
const sidebarOpen = ref(window.innerWidth >= DESKTOP_BREAKPOINT && localStorage.getItem('sidebar_collapsed') !== 'true')
const darkMode    = ref(localStorage.getItem('dark') === 'true')

const userMenuOpen = ref(false)
const userMenuRoot = ref(null)
function onClickOutsideUserMenu(e) {
  if (userMenuRoot.value && !userMenuRoot.value.contains(e.target)) userMenuOpen.value = false
}

const settingsOpen    = ref(false)
const savingSettings  = ref(false)
const settingsError   = ref('')
const settingsForm    = ref({ email: '', currentPassword: '', newPassword: '' })

function openSettings() {
  userMenuOpen.value = false
  settingsError.value = ''
  settingsForm.value = { email: auth.user?.email || '', currentPassword: '', newPassword: '' }
  settingsOpen.value = true
}

async function saveSettings() {
  settingsError.value = ''
  savingSettings.value = true
  try {
    const { user } = await api.patch('/api/auth/profile', {
      email: settingsForm.value.email,
      currentPassword: settingsForm.value.newPassword ? settingsForm.value.currentPassword : undefined,
      newPassword: settingsForm.value.newPassword || undefined,
    })
    auth.user = user
    localStorage.setItem('auth_user', JSON.stringify(user))
    notify.success('Tu perfil fue actualizado.', { title: 'Ajustes guardados' })
    settingsOpen.value = false
  } catch (e) {
    settingsError.value = e.message || 'No fue posible guardar los cambios.'
  } finally {
    savingSettings.value = false
  }
}

let isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT
function handleResize() {
  const nowDesktop = window.innerWidth >= DESKTOP_BREAKPOINT
  if (nowDesktop !== isDesktop) {
    isDesktop = nowDesktop
    sidebarOpen.value = nowDesktop && localStorage.getItem('sidebar_collapsed') !== 'true'
  }
}

onMounted(() => {
  ordersStore.fetchSedes({ silent: true })
  window.addEventListener('resize', handleResize)
  document.addEventListener('mousedown', onClickOutsideUserMenu)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('mousedown', onClickOutsideUserMenu)
})

// Ingreso y restablecer contraseña se muestran sin el menú
const isLogin = computed(() => !!route.meta.public)

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'OP'
})

// El ingreso (y restablecer contraseña) siempre se ve en modo claro;
// la preferencia se guarda y se aplica al entrar al sistema
watch(darkMode, v => localStorage.setItem('dark', v))
// (route.matched vacío = la ruta aún no se resuelve al recargar: se espera para no parpadear)
watch([darkMode, isLogin, () => route.matched.length], ([dark, login, resolved]) => {
  document.documentElement.classList.toggle('dark', dark && !login && resolved > 0)
}, { immediate: true })

const toggleDark    = () => { darkMode.value = !darkMode.value }
watch(sidebarOpen, v => {
  if (window.innerWidth >= DESKTOP_BREAKPOINT) localStorage.setItem('sidebar_collapsed', String(!v))
})
const closeOnMobile = () => { if (window.innerWidth < DESKTOP_BREAKPOINT) sidebarOpen.value = false }

function doLogout() {
  userMenuOpen.value = false
  auth.logout()
  router.push('/login')
}

const today = computed(() =>
  new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
)

// Menú: los grupos de utils/modules.js filtrados por los permisos del usuario
const isAdmin = computed(() => auth.user?.role === 'admin')

// Contador junto a un elemento del menú (observaciones sin leer)
const badgeFor = (item) => item.badge === 'feedback' ? feedbackStore.unseen : 0

const navSections = computed(() =>
  MODULE_GROUPS
    .map(g => ({ label: g.label, items: g.modules.filter(m => canAccess(auth.user, m)) }))
    .filter(g => g.items.length)
)

const roleLabel = computed(() => roleName(auth.user?.role))

// Ubicación actual para la barra superior
const PAGES = {
  dashboard:      { section: 'General',        title: 'Inicio' },
  scanner:        { section: 'Operación',      title: 'Registrar orden' },
  ordenes:        { section: 'Operación',      title: 'Órdenes del día' },
  historial:      { section: 'Operación',      title: 'Historial' },
  estadisticas:   { section: 'Operación',      title: 'Estadísticas' },
  'order-detail': { section: 'Órdenes',        title: 'Detalle de orden' },
  sedes:          { section: 'Administración', title: 'Sedes' },
  usuarios:       { section: 'Administración', title: 'Usuarios' },
  observaciones:  { section: 'Operación',      title: 'Observaciones' },
  'sin-acceso':   { section: 'Cuenta',         title: 'Sin acceso' },
  actividad:      { section: 'Administración', title: 'Actividad' },
}
const currentPage = computed(() => {
  const page = PAGES[route.name] || { section: 'Conexa', title: '' }
  return route.name === 'order-detail' && route.params.code
    ? { ...page, title: `Orden ${route.params.code}` }
    : page
})
</script>
