<template>

  <NotificationsTray />
  <PasswordChangeRequired v-if="!isLogin && auth.user?.mustChangePassword" />
  <FeedbackAlert v-if="!isLogin && auth.user && auth.user.role !== 'admin' && !auth.user.mustChangePassword" />

  <!-- ── Login: sin layout ── -->
  <div v-if="isLogin">
    <RouterView />
  </div>

  <!-- ── Sesión activa: layout unificado con sidebar dinámico ── -->
  <div v-else class="app-layout" :class="{ 'sidebar-open': sidebarOpen }">

    <header class="topbar">
      <button class="hamburger-btn" @click="sidebarOpen = !sidebarOpen">
        <i class="fas fa-bars"></i>
      </button>
      <RouterLink to="/" class="topbar-brand" title="Ir al inicio">
        <img src="/img/logo2-01.png" alt="Láminas & Dobleces" class="topbar-logo" />
        <span class="topbar-brand-title d-none d-sm-inline-flex">
          <span class="topbar-divider"></span>
          <small>Órdenes</small>
        </span>
      </RouterLink>
      <div class="topbar-right ms-auto">
        <span class="topbar-date d-none d-md-inline">
          <i class="fas fa-calendar-day me-2"></i>{{ today }}
        </span>
        <NotificationsBell v-if="auth.user" :key="auth.user.id" />
        <button class="theme-toggle" @click="toggleDark" :title="darkMode ? 'Modo claro' : 'Modo oscuro'">
          <i class="fas" :class="darkMode ? 'fa-sun' : 'fa-moon'"></i>
        </button>

        <div class="user-menu" ref="userMenuRoot">
          <button class="user-menu-trigger" @click="userMenuOpen = !userMenuOpen">
            <span class="user-avatar">{{ initials }}</span>
            <span class="user-menu-name d-none d-sm-inline">{{ auth.user?.name || 'Usuario' }}</span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <Transition name="user-menu-fade">
            <div v-if="userMenuOpen" class="user-menu-dropdown">
              <button class="user-menu-item" @click="openSettings">
                <i class="fas fa-cog"></i>Ajustes
              </button>
              <button class="user-menu-item is-danger" @click="doLogout">
                <i class="fas fa-sign-out-alt"></i>Cerrar sesión
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <div class="sidebar-overlay" :class="{ 'is-active': sidebarOpen }" @click="sidebarOpen = false"></div>

    <aside class="sidebar">
      <div class="sidebar-scroll">
        <RouterLink to="/" exact-active-class="" class="sidebar-dashboard" @click="closeOnMobile">
          <span class="sidebar-dashboard-icon"><i class="fas fa-th-large"></i></span>
          <span class="sidebar-dashboard-text">Dashboard</span>
        </RouterLink>

        <nav class="sidebar-nav">
          <span class="sidebar-section-label">Módulos</span>
          <RouterLink
            v-for="item in sidebarItems"
            :key="item.key"
            :to="item.to"
            class="sidebar-link"
            active-class="router-link-active"
            @click="closeOnMobile"
          >
            <span class="sidebar-link-icon"><i class="fas" :class="item.icon"></i></span>
            <span class="sidebar-link-text">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>
    </aside>

    <div class="main-area">
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
import { api } from './api'
import NotificationsTray from './components/NotificationsTray.vue'
import NotificationsBell from './components/NotificationsBell.vue'
import FeedbackAlert from './components/FeedbackAlert.vue'
import PasswordChangeRequired from './components/PasswordChangeRequired.vue'
import PasswordStrength from './components/PasswordStrength.vue'
import BaseModal from './components/BaseModal.vue'

const DESKTOP_BREAKPOINT = 1200

const route       = useRoute()
const router      = useRouter()
const auth        = useAuthStore()
const ordersStore = useOrdersStore()
const notify      = useNotificationsStore()
const sidebarOpen = ref(window.innerWidth >= DESKTOP_BREAKPOINT)
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
    sidebarOpen.value = nowDesktop
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

const isLogin = computed(() => route.name === 'login')

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'OP'
})

watch(darkMode, v => {
  document.documentElement.classList.toggle('dark', v)
  localStorage.setItem('dark', v)
}, { immediate: true })

const toggleDark    = () => { darkMode.value = !darkMode.value }
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

// El Dashboard es la página de inicio: siempre visible, sin permiso propio.
const ALL_MODULES = [
  { key: 'scanner',      to: '/scanner',       icon: 'fa-qrcode',      label: 'Scanner'       },
  { key: 'ordenes',      to: '/ordenes',       icon: 'fa-layer-group', label: 'Órdenes'       },
  { key: 'historial',    to: '/historial',     icon: 'fa-history',     label: 'Historial'     },
  { key: 'estadisticas', to: '/estadisticas',  icon: 'fa-chart-bar',   label: 'Estadísticas'  },
  { key: 'sedes',        to: '/sedes',         icon: 'fa-building',    label: 'Sedes'         },
  { key: 'usuarios',     to: '/usuarios',      icon: 'fa-users',       label: 'Usuarios'      },
]

const sidebarItems = computed(() => {
  if (auth.user?.role === 'admin') return ALL_MODULES
  return ALL_MODULES.filter(m => (auth.user?.permissions || []).includes(m.key))
})
</script>
