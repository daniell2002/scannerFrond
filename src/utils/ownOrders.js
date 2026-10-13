/**
 * ¿La orden fue registrada por este usuario?
 * Las órdenes antiguas no tienen operatorId, así que se comparan por nombre.
 */
export const isOwnOrder = (order, user) =>
  order.operatorId
    ? String(order.operatorId) === String(user?.id)
    : order.operator === user?.name
