import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import { useNotificationsStore } from './notifications'
import { markActivity, clearActivity } from '../utils/session'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('auth_user') || 'null'))
  const notify = useNotificationsStore()

  function setSession({ token, user: u }) {
    user.value = u
    localStorage.setItem('auth_user', JSON.stringify(u))
    if (token) {
      localStorage.setItem('auth_token', token)
      markActivity()
    }
  }

  /** Ingreso con correo (o usuario, para cuentas antiguas). Devuelve { ok, message }. */
  async function login(identifier, password) {
    try {
      const data = await api.post('/api/auth/login', { username: identifier, password })
      setSession(data)
      notify.success(`Bienvenido, ${data.user.name}.`, { title: 'Sesión iniciada' })
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e.message || 'No fue posible iniciar sesión.' }
    }
  }

  /** Cambia la contraseña propia; si era temporal no hace falta la actual. */
  async function changePassword(newPassword, currentPassword) {
    const data = await api.post('/api/auth/change-password', { newPassword, currentPassword })
    setSession(data)
    return data
  }

  /** Pide un token nuevo para la sesión vigente (ver utils/session.js). */
  async function refresh() {
    setSession(await api.post('/api/auth/refresh'))
  }

  /** Con `notice` (cierre forzado) el motivo se muestra en la pantalla de ingreso. */
  function logout({ notice } = {}) {
    user.value = null
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    clearActivity()
    if (notice) sessionStorage.setItem('auth_notice', notice)
    else notify.info('Sesión cerrada correctamente.', { title: 'Hasta pronto' })
  }

  const isAuthenticated = () => !!user.value
  const isAdmin         = () => user.value?.role === 'admin'
  const hasPermission   = (module) => {
    if (!user.value) return false
    if (user.value.role === 'admin') return true
    return (user.value.permissions || []).includes(module)
  }

  return { user, login, changePassword, setSession, refresh, logout, isAuthenticated, isAdmin, hasPermission }
})
