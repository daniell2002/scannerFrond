import ScannerView      from '../views/ScannerView.vue'
import OrdenesView      from '../views/OrdenesView.vue'
import HistorialView    from '../views/HistorialView.vue'
import EstadisticasView from '../views/EstadisticasView.vue'
import OrderDetailView  from '../views/OrderDetailView.vue'
import SedesView        from '../views/SedesView.vue'
import UsuariosView     from '../views/UsuariosView.vue'
import LoginView        from '../views/LoginView.vue'

export const routes = [
  { path: '/login',         name: 'login',        component: LoginView,        meta: { public: true } },
  { path: '/',              name: 'scanner',       component: ScannerView,      meta: { permission: 'scanner' } },
  { path: '/ordenes',       name: 'ordenes',       component: OrdenesView,      meta: { permission: 'ordenes' } },
  { path: '/historial',     name: 'historial',     component: HistorialView,    meta: { permission: 'historial' } },
  { path: '/estadisticas',  name: 'estadisticas',  component: EstadisticasView, meta: { permission: 'estadisticas' } },
  { path: '/orden/:code',   name: 'order-detail',  component: OrderDetailView,  meta: { permission: 'ordenes' } },
  { path: '/sedes',         name: 'sedes',         component: SedesView,        meta: { permission: 'sedes' } },
  { path: '/usuarios',      name: 'usuarios',      component: UsuariosView,     meta: { permission: 'usuarios' } },
]

const MODULE_PRIORITY = ['ordenes', 'scanner', 'historial', 'estadisticas', 'sedes', 'usuarios']

function firstAllowedRoute(user) {
  if (user?.role === 'admin') return { name: 'ordenes' }
  const perms = user?.permissions || []
  const key = MODULE_PRIORITY.find(p => perms.includes(p))
  return key ? { name: key } : null
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

    // Verificar permiso del módulo (admin siempre pasa)
    if (to.meta.permission && user?.role !== 'admin') {
      const allowed = (user?.permissions || []).includes(to.meta.permission)
      if (!allowed) {
        return firstAllowedRoute(user) ?? { name: 'login' }
      }
    }
  })
}
