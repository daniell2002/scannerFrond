import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import { useNotificationsStore } from './notifications'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('auth_user') || 'null'))
  const notify = useNotificationsStore()

  function setSession({ token, user: u }) {
    user.value = u
    localStorage.setItem('auth_user', JSON.stringify(u))
    if (token) localStorage.setItem('auth_token', token)
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

  function logout() {
    user.value = null
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    notify.info('Sesión cerrada correctamente.', { title: 'Hasta pronto' })
  }

  const isAuthenticated = () => !!user.value
  const isAdmin         = () => user.value?.role === 'admin'
  const isOperario      = () => user.value?.role === 'operario'
  const hasPermission   = (module) => {
    if (!user.value) return false
    if (user.value.role === 'admin') return true
    return (user.value.permissions || []).includes(module)
  }

  return { user, login, changePassword, setSession, logout, isAuthenticated, isAdmin, isOperario, hasPermission }
})
