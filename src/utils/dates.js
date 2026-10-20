// Fechas como texto 'AAAA-MM-DD' en hora local (el formato de <input type="date">)

export function dayKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const shift = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return dayKey(d) }

export const todayKey = () => dayKey(new Date())

/** Rangos rápidos para el filtro de fechas. */
export const DATE_PRESETS = [
  { value: 'all',    label: 'Cualquier fecha' },
  { value: 'yday',   label: 'Ayer',            range: () => ({ from: shift(-1), to: shift(-1) }) },
  { value: '7d',     label: 'Últimos 7 días',  range: () => ({ from: shift(-7), to: shift(-1) }) },
  { value: '30d',    label: 'Últimos 30 días', range: () => ({ from: shift(-30), to: shift(-1) }) },
  { value: 'month',  label: 'Este mes',        range: () => { const d = new Date(); return { from: dayKey(new Date(d.getFullYear(), d.getMonth(), 1)), to: shift(0) } } },
  { value: 'pmonth', label: 'Mes anterior',    range: () => { const d = new Date(); return { from: dayKey(new Date(d.getFullYear(), d.getMonth() - 1, 1)), to: dayKey(new Date(d.getFullYear(), d.getMonth(), 0)) } } },
  { value: 'custom', label: 'Elegir fechas…' },
]

/** ¿La fecha cae dentro del rango? (límites incluidos; vacío = sin límite) */
export function inRange(date, from, to) {
  if (!date) return !from && !to
  const k = dayKey(date)
  return (!from || k >= from) && (!to || k <= to)
}
