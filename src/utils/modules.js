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

// Permisos con los que se crea un operario nuevo (= plantilla del rol operario)
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

/*
 * Roles. El rol define el ALCANCE (qué datos ve dentro de cada módulo);
 * los módulos definen QUÉ secciones abre. Cada rol trae su plantilla de
 * módulos, que luego se puede ajustar usuario por usuario.
 */
export const ROLES = [
  {
    value: 'operario', label: 'Operario', icon: 'fa-user',
    desc: 'Registra órdenes y ve solo las suyas',
    preset: ['inicio', 'scanner', 'ordenes', 'observaciones', 'historial'],
  },
  {
    value: 'supervisor', label: 'Supervisor', icon: 'fa-user-tie',
    desc: 'Jefe de sede: ve y revisa a su equipo',
    preset: ['inicio', 'scanner', 'ordenes', 'historial', 'estadisticas', 'usuarios'],
  },
  {
    value: 'admin', label: 'Administrador', icon: 'fa-shield-halved',
    desc: 'Acceso total a todas las sedes',
    preset: ALL_MODULES.map(m => m.key),
  },
]

export const roleByValue = (value) => ROLES.find(r => r.value === value)
export const roleLabel   = (value) => roleByValue(value)?.label || value

/**
 * Resumen en palabras de lo que verá un usuario con este rol, sede y módulos.
 * Se muestra en el formulario de usuarios para no tener que adivinar.
 */
export function accessSummary({ role, sedeName, permissions = [] }) {
  const has  = (k) => role === 'admin' || permissions.includes(k)
  const sede = sedeName || 'su sede'
  const lines = []

  if (role === 'admin') {
    lines.push({ icon: 'fa-globe', text: 'Ve las órdenes, estadísticas e historial de todas las sedes.' })
    lines.push({ icon: 'fa-clipboard-check', text: 'Revisa órdenes y envía observaciones a cualquier operario.' })
    lines.push({ icon: 'fa-gear', text: 'Administra sedes, usuarios, supervisores y administradores.' })
    return lines
  }

  if (has('scanner')) lines.push({ icon: 'fa-qrcode', text: `Registra órdenes en ${sede}.` })

  if (role === 'supervisor') {
    if (has('ordenes') || has('historial'))
      lines.push({ icon: 'fa-people-group', text: `Ve las órdenes de todo el equipo de ${sede}.` })
    lines.push({ icon: 'fa-clipboard-check', text: `Revisa las órdenes de ${sede} y envía observaciones a sus operarios.` })
    if (has('estadisticas')) lines.push({ icon: 'fa-chart-column', text: `Consulta las estadísticas de ${sede}.` })
    if (has('usuarios')) lines.push({ icon: 'fa-users', text: `Crea y edita operarios de ${sede}.` })
  } else {
    if (has('ordenes') || has('historial'))
      lines.push({ icon: 'fa-user', text: 'Ve solo las órdenes que él mismo registra.' })
    if (has('observaciones')) lines.push({ icon: 'fa-comment-dots', text: 'Recibe y atiende las observaciones sobre sus órdenes.' })
    if (has('estadisticas')) lines.push({ icon: 'fa-chart-column', text: `Consulta las estadísticas de ${sede}.` })
    if (has('usuarios')) lines.push({ icon: 'fa-users', text: `Crea y edita operarios de ${sede}.` })
  }
  if (has('sedes')) lines.push({ icon: 'fa-building', text: 'Crea y edita sedes.' })
  if (!permissions.length) lines.push({ icon: 'fa-lock', text: 'Sin módulos: no podrá usar el sistema.', warn: true })
  return lines
}
