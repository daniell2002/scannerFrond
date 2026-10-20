import { ref, computed, onMounted, unref } from 'vue'
import { api } from '../api'
import { useOrdersStore } from '../stores/orders'

/*
 * Vendedores registrados (rol "vendedor"): las opciones de "Atendido por" al
 * registrar una orden y del filtro de las tablas de órdenes.
 * El backend ya limita al supervisor a los de su sede.
 *
 * - sedeRef: código de sede o 'all'.
 * - includeInactive: también los desactivados (para filtrar órdenes antiguas).
 */
export function useVendedores(sedeRef, { includeInactive = false } = {}) {
  const ordersStore = useOrdersStore()
  const vendors = ref([])
  const loading = ref(true)

  async function load() {
    loading.value = true
    try {
      vendors.value = await api.get(`/api/users/vendedores${includeInactive ? '?all=true' : ''}`)
    } catch {
      vendors.value = []
    } finally {
      loading.value = false
    }
  }
  onMounted(load)

  const inSede = computed(() => {
    const sede = unref(sedeRef)
    return vendors.value.filter(v => !sede || sede === 'all' || v.sede === sede)
  })

  // Con todas las sedes (admin) se indica la sede: puede haber nombres repetidos
  const sedeName = (code) => ordersStore.sedes.find(s => s.code === code)?.name || code
  const allSedes = computed(() => { const s = unref(sedeRef); return !s || s === 'all' })
  const labelOf  = (v) => {
    const base = allSedes.value && v.sede ? `${v.name} · ${sedeName(v.sede)}` : v.name
    return v.active ? base : `${base} (inactivo)`
  }

  /** Opciones para el filtro de las tablas (incluye "Todos"). */
  const filterOptions = computed(() => [
    { value: 'all', label: 'Todos los vendedores' },
    ...[...inSede.value].sort((a, b) => a.name.localeCompare(b.name, 'es')).map(v => ({ value: v.id, label: labelOf(v) })),
  ])

  /** Opciones para el select "Atendido por". */
  const options = computed(() => [...inSede.value]
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map(v => ({ value: v.id, label: v.name })))

  return { vendors, loading, options, filterOptions, reload: load }
}
