import { ref, computed, onMounted } from 'vue'
import { api } from '../api'

/*
 * Opciones del select "Responsable" (admin y supervisor).
 * Une los usuarios registrados con los nombres que ya aparecen en las órdenes,
 * para que salgan tanto operarios sin órdenes aún como nombres antiguos.
 * Las órdenes guardan el nombre del usuario (user.name) en `operator`.
 */
export function useResponsables(ordersRef, sedeRef, enabledRef) {
  const users = ref([])

  onMounted(async () => {
    if (!enabledRef.value) return
    try {
      users.value = await api.get('/api/users')
    } catch {
      users.value = []
    }
  })

  const options = computed(() => {
    const sede = sedeRef.value
    const inSede = (s) => sede === 'all' || s === sede

    const names = new Set(
      users.value.filter(u => u.role !== 'admin' && inSede(u.sede)).map(u => u.name)
    )
    // Los administradores no son responsables de sede: no se listan.
    const adminNames = new Set(users.value.filter(u => u.role === 'admin').map(u => u.name))
    ordersRef.value
      .filter(o => o.operator && inSede(o.sede) && !adminNames.has(o.operator))
      .forEach(o => names.add(o.operator))

    return [
      { value: 'all', label: 'Todos los responsables' },
      ...[...names].sort((a, b) => a.localeCompare(b, 'es')).map(n => ({ value: n, label: n })),
    ]
  })

  return { options }
}
