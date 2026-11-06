// Búsqueda de órdenes por código o cliente, sin distinguir mayúsculas ni tildes

const fold = (v) => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()

/** ¿La orden coincide con el texto buscado? (vacío = todas) */
export function matchesOrder(order, query) {
  const q = fold(query).trim()
  return !q || fold(order.code).includes(q) || fold(order.product).includes(q)
}
