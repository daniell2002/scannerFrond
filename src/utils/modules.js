/*
 * Módulos de la aplicación: una sola definición para el menú lateral y para
 * los permisos del formulario de usuarios.
 *
 * - PERMISSION_MODULES: se asignan por usuario. Sus claves deben coincidir con
 *   MODULES del backend (scannerBack/src/middlewares/auth.js) y de la app móvil.
 * - ALWAYS_MODULES: todo operario los tiene; no requieren permiso.
 * - ADMIN_MODULES: exclusivos de administradores (el backend usa requireAdmin).
 */

export const PERMISSION_MODULES = [
  { key: 'scanner',      to: '/scanner',      icon: 'fa-qrcode',            label: 'Registrar orden',  desc: 'Escanear y registrar órdenes' },
  { key: 'ordenes',      to: '/ordenes',      icon: 'fa-layer-group',       label: 'Órdenes del día',  desc: 'Sus órdenes de hoy y su detalle' },
  { key: 'historial',    to: '/historial',    icon: 'fa-clock-rotate-left', label: 'Historial',        desc: 'Sus órdenes anteriores' },
  { key: 'estadisticas', to: '/estadisticas', icon: 'fa-chart-column',      label: 'Estadísticas',     desc: 'Indicadores de producción' },
]

export const ALWAYS_MODULES = [
  { key: null, to: '/',              icon: 'fa-house',         label: 'Inicio',        desc: 'Su resumen del día' },
  { key: null, to: '/observaciones', icon: 'fa-comment-dots',  label: 'Observaciones', desc: 'Comentarios del administrador', operarioOnly: true, badge: 'feedback' },
]

export const ADMIN_MODULES = [
  { key: 'sedes',    to: '/sedes',    icon: 'fa-building', label: 'Sedes',    desc: 'Plantas de producción' },
  { key: 'usuarios', to: '/usuarios', icon: 'fa-users',    label: 'Usuarios', desc: 'Cuentas, roles y permisos' },
]

const byTo = (to) => [...ALWAYS_MODULES, ...PERMISSION_MODULES].find(m => m.to === to)

// Menú lateral agrupado
export const NAV_SECTIONS = [
  { label: 'General',        items: [byTo('/')] },
  { label: 'Operación',      items: ['/scanner', '/ordenes', '/observaciones', '/historial', '/estadisticas'].map(byTo) },
  { label: 'Administración', adminOnly: true, items: ADMIN_MODULES },
]

export const moduleByKey = (key) => [...PERMISSION_MODULES, ...ADMIN_MODULES].find(m => m.key === key)
