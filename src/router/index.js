import DashboardView    from '../views/DashboardView.vue'
import ScannerView      from '../views/ScannerView.vue'
import OrdenesView      from '../views/OrdenesView.vue'
import HistorialView    from '../views/HistorialView.vue'
import EstadisticasView from '../views/EstadisticasView.vue'
import OrderDetailView  from '../views/OrderDetailView.vue'
import SedesView        from '../views/SedesView.vue'
import UsuariosView     from '../views/UsuariosView.vue'
import ObservacionesView from '../views/ObservacionesView.vue'
import LoginView        from '../views/LoginView.vue'
import NoAccessView     from '../views/NoAccessView.vue'
import { firstAccessible } from '../utils/modules'

export const routes = [
  { path: '/login',         name: 'login',        component: LoginView,        meta: { public: true } },
  { path: '/',              name: 'dashboard',     component: DashboardView,    meta: { permission: 'inicio' } },
  { path: '/scanner',       name: 'scanner',       component: ScannerView,      meta: { permission: 'scanner' } },
  { path: '/ordenes',       name: 'ordenes',       component: OrdenesView,      meta: { permission: 'ordenes' } },
  { path: '/historial',     name: 'historial',     component: HistorialView,    meta: { permission: 'historial' } },
  // Bandeja de observaciones: solo operarios (el admin las ve en cada orden)
  { path: '/observaciones', name: 'observaciones', component: ObservacionesView, meta: { permission: 'observaciones', operarioOnly: true } },
  { path: '/estadisticas',  name: 'estadisticas',  component: EstadisticasView, meta: { permission: 'estadisticas' } },
  { path: '/orden/:code',   name: 'order-detail',  component: OrderDetailView,  meta: { permission: 'ordenes' } },
  { path: '/sedes',         name: 'sedes',         component: SedesView,        meta: { permission: 'sedes' } },
  { path: '/usuarios',      name: 'usuarios',      component: UsuariosView,     meta: { permission: 'usuarios' } },
  // Usuario sin ningún módulo asignado
  { path: '/sin-acceso',    name: 'sin-acceso',    component: NoAccessView,     meta: {} },
]

// Primera página permitida; si no tiene ningún módulo, una pantalla que lo explica
function firstAllowedRoute(user) {
  if (!user) return null
  const to = firstAccessible(user)
  return to ? { path: to } : { name: 'sin-acceso' }
}

export function setupGuard(router) {
  router.beforeEach((to) => {
    const user  = JSON.parse(localStorage.getItem('auth_user') || 'null')
    const token = localStorage.getItem('auth_token')

    // Sin sesión → login
    if (!to.meta.public && (!user || !token)) return { name: 'login' }

    // Ya logueado → redirigir al primer módulo permitido
    if (to.name === 'login' && user && token) {
      const dest = firstAllowedRoute(user)
      return dest ?? undefined
    }

    if (to.meta.operarioOnly && user?.role === 'admin') return firstAllowedRoute(user)

    // Verificar permiso del módulo (admin siempre pasa)
    if (to.meta.permission && user?.role !== 'admin') {
      const allowed = (user?.permissions || []).includes(to.meta.permission)
      if (!allowed) {
        const dest = firstAllowedRoute(user)
        // Evita redirigir a la misma ruta
        return dest?.path === to.path ? { name: 'sin-acceso' } : dest ?? { name: 'login' }
      }
    }
  })
}
