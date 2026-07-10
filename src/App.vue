<template>

  <NotificationsTray />

  <!-- ── Login: sin layout ── -->
  <div v-if="isLogin">
    <RouterView />
  </div>

  <!-- ── Sesión activa: layout unificado con sidebar dinámico ── -->
  <div v-else class="app-layout" :class="{ 'sidebar-open': sidebarOpen }">

    <div class="sidebar-overlay" :class="{ 'is-active': sidebarOpen }" @click="sidebarOpen = false"></div>

    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon"><i class="fas fa-industry"></i></div>
        <div class="sidebar-brand-text">
          <p class="sidebar-brand-sub">LOGICONNET</p>
          <span class="sidebar-brand-title">Ordenes</span>
        </div>
      </div>

      <div class="sidebar-scroll">
        <nav class="sidebar-nav">
          <span class="sidebar-section-label">Módulos</span>
          <RouterLink
            v-for="item in sidebarItems"
            :key="item.key"
            :to="item.to"
            class="sidebar-link"
            :exact-active-class="item.exact ? 'router-link-exact-active' : ''"
            :active-class="item.exact ? '' : 'router-link-active'"
            @click="closeOnMobile"
          >
            <span class="sidebar-link-icon"><i class="fas" :class="item.icon"></i></span>
            <span class="sidebar-link-text">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <div class="op-user-card">
        <div class="op-avatar">{{ initials }}</div>
        <div class="op-user-info">
          <span class="op-user-name">{{ auth.user?.name || 'Usuario' }}</span>
          <span class="op-user-sede" v-if="sedeNombre">
            <i class="fas fa-map-marker-alt"></i>{{ sedeNombre }}
          </span>
          <span class="op-user-sede" v-else-if="auth.user?.role === 'admin'">
            <i class="fas fa-shield-alt"></i>Administrador
          </span>
        </div>
      </div>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <button class="hamburger-btn" @click="sidebarOpen = !sidebarOpen">
          <i class="fas fa-bars"></i>
        </button>
        <h2 class="topbar-heading">{{ pageTitle }}</h2>
        <div class="topbar-right ms-auto">
          <span class="topbar-date d-none d-md-inline">
            <i class="fas fa-calendar-day me-2"></i>{{ today }}
          </span>
          <button class="theme-toggle" @click="toggleDark" :title="darkMode ? 'Modo claro' : 'Modo oscuro'">
            <i class="fas" :class="darkMode ? 'fa-sun' : 'fa-moon'"></i>
          </button>
          <button class="theme-toggle" @click="doLogout" title="Cerrar sesión">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </header>

      <main class="page-main">
        <RouterView />
      </main>
    </div>

  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useOrdersStore } from './stores/orders'
import NotificationsTray from './components/NotificationsTray.vue'

const route       = useRoute()
const router      = useRouter()
const auth        = useAuthStore()
const ordersStore = useOrdersStore()
const sidebarOpen = ref(true)
const darkMode    = ref(localStorage.getItem('dark') === 'true')

onMounted(() => {
  ordersStore.fetchSedes({ silent: true })
})

const isLogin = computed(() => route.name === 'login')

const sedeNombre = computed(() => {
  if (!auth.user?.sede) return ''
  return ordersStore.sedes.find(s => s.code === auth.user.sede)?.name || auth.user.sede
})

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'OP'
})

watch(darkMode, v => {
  document.documentElement.classList.toggle('dark', v)
  localStorage.setItem('dark', v)
}, { immediate: true })

const toggleDark    = () => { darkMode.value = !darkMode.value }
const closeOnMobile = () => { if (window.innerWidth < 1200) sidebarOpen.value = false }

function doLogout() {
  auth.logout()
  router.push('/login')
}

const pageTitle = computed(() => {
  const titles = {
    scanner:        'Scanner',
    ordenes:        'Órdenes de Producción',
    historial:      'Historial de Escaneos',
    estadisticas:   'Estadísticas',
    sedes:          'Sedes de Producción',
    usuarios:       'Usuarios del Sistema',
    'order-detail': `Orden ${route.params.code}`,
    'mis-ordenes':  'Mis Órdenes del Día',
    'mi-historial': 'Mi Historial',
  }
  return titles[route.name] || 'LOGICONNET'
})

const today = computed(() =>
  new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
)

const ALL_MODULES = [
  { key: 'scanner',      to: '/',              icon: 'fa-qrcode',      label: 'Scanner',       exact: true  },
  { key: 'ordenes',      to: '/ordenes',       icon: 'fa-layer-group', label: 'Órdenes',       exact: false },
  { key: 'historial',    to: '/historial',     icon: 'fa-history',     label: 'Historial',     exact: false },
  { key: 'estadisticas', to: '/estadisticas',  icon: 'fa-chart-bar',   label: 'Estadísticas',  exact: false },
  { key: 'sedes',        to: '/sedes',         icon: 'fa-building',    label: 'Sedes',         exact: false },
  { key: 'usuarios',     to: '/usuarios',      icon: 'fa-users',       label: 'Usuarios',      exact: false },
]

const sidebarItems = computed(() => {
  if (auth.user?.role === 'admin') return ALL_MODULES
  return ALL_MODULES.filter(m => (auth.user?.permissions || []).includes(m.key))
})
</script>

<style scoped>
/* ── User card footer del sidebar oscuro ── */
.op-user-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255,255,255,0.06);
  background: rgba(0,0,0,0.2);
  flex-shrink: 0;
  min-width: 0;
}

.op-avatar {
  width: 2.4rem;
  height: 2.4rem;
  min-width: 2.4rem;
  border-radius: 0.6rem;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04rem;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(66,130,194,0.35);
}

.op-user-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  max-width: 160px;
  opacity: 1;
  transition: max-width 0.28s ease, opacity 0.2s ease;
}

.op-user-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(255,255,255,0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.op-user-sede {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 500;
  color: rgba(255,255,255,0.42);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.op-user-sede i {
  font-size: 0.58rem;
  color: rgba(66,130,194,0.7);
  flex-shrink: 0;
}

@media (min-width: 1200px) {
  .op-user-card { justify-content: center; padding: 0.875rem; transition: padding 0.28s ease; }
  .sidebar-open .op-user-card { justify-content: flex-start; padding: 1rem 1.25rem; }
  .op-user-info { max-width: 0; opacity: 0; }
  .sidebar-open .op-user-info { max-width: 160px; opacity: 1; }
}
</style>
