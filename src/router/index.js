import LoginView from '../views/LoginView.vue'

// Cada pantalla se descarga al abrirla por primera vez: la carga inicial es más liviana
const DashboardView     = () => import('../views/DashboardView.vue')
const ScannerView       = () => import('../views/ScannerView.vue')
const OrdenesView       = () => import('../views/OrdenesView.vue')
const HistorialView     = () => import('../views/HistorialView.vue')
const EstadisticasView  = () => import('../views/EstadisticasView.vue')
const OrderDetailView   = () => import('../views/OrderDetailView.vue')
const SedesView         = () => import('../views/SedesView.vue')
const UsuariosView      = () => import('../views/UsuariosView.vue')
const ObservacionesView = () => import('../views/ObservacionesView.vue')
const ActividadView     = () => import('../views/ActividadView.vue')
const NoAccessView      = () => import('../views/NoAccessView.vue')
import { firstAccessible } from '../utils/modules'

export const routes = [
  { path: '/login',         name: 'login',        component: LoginView,        meta: { public: true } },
  // Enlace del correo de "¿Olvidaste tu contraseña?"
  { path: '/restablecer',   name: 'reset-password', component: LoginView,      meta: { public: true } },
  { path: '/',              name: 'dashboard',     component: DashboardView,    meta: { permission: 'inicio' } },
  { path: '/scanner',       name: 'scanner',       component: ScannerView,      meta: { permission: 'scanner' } },
  { path: '/ordenes',       name: 'ordenes',       component: OrdenesView,      meta: { permission: 'ordenes' } },
  { path: '/historial',     name: 'historial',     component: HistorialView,    meta: { permission: 'historial' } },
  // Bandeja de observaciones: la recibe quien registra órdenes (el admin las ve en cada orden)
  { path: '/observaciones', name: 'observaciones', component: ObservacionesView, meta: { permission: 'observaciones', hiddenForAdmin: true } },
  { path: '/estadisticas',  name: 'estadisticas',  component: EstadisticasView, meta: { permission: 'estadisticas' } },
  { path: '/orden/:code',   name: 'order-detail',  component: OrderDetailView,  meta: { permission: 'ordenes' } },
  { path: '/sedes',         name: 'sedes',         component: SedesView,        meta: { permission: 'sedes' } },
  { path: '/usuarios',      name: 'usuarios',      component: UsuariosView,     meta: { permission: 'usuarios' } },
  { path: '/actividad',     name: 'actividad',     component: ActividadView,    meta: { adminOnly: true } },
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

    if (to.meta.hiddenForAdmin && user?.role === 'admin') return firstAllowedRoute(user)
    if (to.meta.adminOnly && user?.role !== 'admin') return firstAllowedRoute(user) ?? { name: 'sin-acceso' }

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
