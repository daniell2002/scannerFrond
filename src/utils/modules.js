/*
 * Módulos de la aplicación: una sola definición para el menú lateral, las rutas
 * y los permisos del formulario de usuarios.
 *
 * Todos son asignables por usuario. Las claves deben coincidir con MODULES del
 * backend (scannerBack/src/middlewares/auth.js). El admin tiene acceso a todo.
 */

export const MODULE_GROUPS = [
  { label: 'General', modules: [
    { key: 'inicio',        to: '/',              icon: 'fa-house',             label: 'Inicio',          desc: 'Resumen del día' },
  ] },
  { label: 'Operación', modules: [
    { key: 'scanner',       to: '/scanner',       icon: 'fa-qrcode',            label: 'Registrar orden', desc: 'Escanear y registrar órdenes' },
    { key: 'ordenes',       to: '/ordenes',       icon: 'fa-layer-group',       label: 'Órdenes del día', desc: 'Órdenes de hoy y su detalle' },
    // El admin no tiene bandeja: ve la retroalimentación en cada orden
    { key: 'observaciones', to: '/observaciones', icon: 'fa-comment-dots',      label: 'Observaciones',   desc: 'Comentarios del administrador', operarioOnly: true, badge: 'feedback' },
    { key: 'historial',     to: '/historial',     icon: 'fa-clock-rotate-left', label: 'Historial',       desc: 'Órdenes anteriores' },
    { key: 'estadisticas',  to: '/estadisticas',  icon: 'fa-chart-column',      label: 'Estadísticas',    desc: 'Indicadores de producción' },
  ] },
  { label: 'Administración', modules: [
    { key: 'sedes',         to: '/sedes',         icon: 'fa-building',          label: 'Sedes',           desc: 'Crear y editar sedes' },
    { key: 'usuarios',      to: '/usuarios',      icon: 'fa-users',             label: 'Usuarios',        desc: 'Gestionar operarios de su sede', sensitive: true },
  ] },
]

export const ALL_MODULES = MODULE_GROUPS.flatMap(g => g.modules)

// Permisos con los que se crea un operario nuevo
export const DEFAULT_OPERARIO_PERMISSIONS = ['inicio', 'scanner', 'ordenes', 'observaciones', 'historial']

export const moduleByKey = (key) => ALL_MODULES.find(m => m.key === key)

/** ¿El usuario puede ver este módulo? */
export function canAccess(user, mod) {
  if (!user || !mod) return false
  if (user.role === 'admin') return !mod.operarioOnly
  return (user.permissions || []).includes(mod.key)
}

/** Primera página a la que el usuario tiene acceso (para redirigir). */
export function firstAccessible(user) {
  return ALL_MODULES.find(m => canAccess(user, m))?.to || null
}
