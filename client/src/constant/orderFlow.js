export const ORDER_FLOW_BY_PAYMENT = {
  COD: ['Placed', 'In Transit', 'Out for Delivery', 'Delivered'],
  ONLINE: ['Confirmed', 'In Transit', 'Out for Delivery', 'Delivered']
};

export const normalizeOrderStatus = (orderStatus, paymentMethod = 'COD') => {
  if (orderStatus === 'Pending') {
    return paymentMethod === 'ONLINE' ? 'Confirmed' : 'Placed';
  }
  return orderStatus;
};

export const getOrderFlow = (paymentMethod = 'COD') => {
  return ORDER_FLOW_BY_PAYMENT[paymentMethod] || ORDER_FLOW_BY_PAYMENT.COD;
};

export const getNextOrderStatus = (order) => {
  if (!order) return null;
  const flow = getOrderFlow(order.paymentMethod);
  const current = normalizeOrderStatus(order.orderStatus, order.paymentMethod);
  const index = flow.indexOf(current);
  if (index < 0) return null;
  return flow[index + 1] || null;
};

export const canRoleUpdateToStatus = (role, nextStatus) => {
  if (!nextStatus) return false;
  if (nextStatus === 'Out for Delivery' && role !== 'delivery') return false;
  if (nextStatus === 'Delivered' && role !== 'delivery') return false;
  return ['admin', 'farmer', 'delivery'].includes(role);
};
