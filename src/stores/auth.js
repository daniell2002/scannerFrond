import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api'
import { useNotificationsStore } from './notifications'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('auth_user') || 'null'))
  const notify = useNotificationsStore()

  async function login(username, password) {
    try {
      const data = await api.post('/api/auth/login', { username, password })
      user.value = data.user
      localStorage.setItem('auth_user',  JSON.stringify(data.user))
      localStorage.setItem('auth_token', data.token)
      notify.success(`Bienvenido, ${data.user.name}.`, { title: 'Sesion iniciada' })
      return true
    } catch (e) {
      notify.error(e.message || 'No fue posible iniciar sesion.', { title: 'Error de acceso' })
      return false
    }
  }

  function logout() {
    user.value = null
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    notify.info('Sesion cerrada correctamente.', { title: 'Hasta pronto' })
  }

  const isAuthenticated = () => !!user.value
  const isAdmin         = () => user.value?.role === 'admin'
  const isOperario      = () => user.value?.role === 'operario'
  const hasPermission   = (module) => {
    if (!user.value) return false
    if (user.value.role === 'admin') return true
    return (user.value.permissions || []).includes(module)
  }

  return { user, login, logout, isAuthenticated, isAdmin, isOperario, hasPermission }
})
