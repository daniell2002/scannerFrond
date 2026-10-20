// Cierre de sesión por inactividad.
// La última actividad se guarda en localStorage para que todas las pestañas
// compartan el mismo reloj: si el usuario trabaja en una, las demás no lo sacan.

const minutes = (name, fallback) => (Number(import.meta.env[name]) || fallback) * 60_000

/** Tiempo sin actividad tras el cual se cierra la sesión (por defecto 2 horas). */
export const IDLE_MS    = minutes('VITE_SESSION_IDLE_MINUTES', 120)
/** Antelación con la que se muestra el aviso "¿Sigues ahí?". */
export const WARN_MS    = minutes('VITE_SESSION_WARN_MINUTES', 2)
/** Cada cuánto se renueva el token mientras el usuario está activo. */
export const REFRESH_MS = 30 * 60_000

const KEY = 'last_activity'

export function markActivity() {
  try { localStorage.setItem(KEY, String(Date.now())) } catch { /* sin almacenamiento */ }
}

export function clearActivity() {
  try { localStorage.removeItem(KEY) } catch { /* sin almacenamiento */ }
}

/** Milisegundos desde la última actividad en cualquier pestaña. */
export function idleFor() {
  const last = Number(localStorage.getItem(KEY))
  return last ? Date.now() - last : 0
}

/** Momento (ms) en que se emitió el token actual, o 0 si no se puede leer. */
export function tokenIssuedAt() {
  try {
    const payload = localStorage.getItem('auth_token')?.split('.')[1]
    const { iat } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return iat * 1000
  } catch {
    return 0
  }
}
