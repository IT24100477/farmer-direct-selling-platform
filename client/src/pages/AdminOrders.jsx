import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { canRoleUpdateToStatus, getNextOrderStatus, getOrderFlow, normalizeOrderStatus } from '../constants/orderFlow.js';
import { formatCurrency } from '../utils/currency.js';

const statusChipClass = (isCurrent, isComplete) => {
  if (isCurrent) return 'border-[#1f7a4d] bg-[#1f7a4d] text-white';
  if (isComplete) return 'border-[#93c7a9] bg-[#eaf6ef] text-[#1f7a4d]';
  return 'border-gray-200 bg-white text-gray-500';
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/admin');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleAdvance = async (order) => {
    const nextStatus = getNextOrderStatus(order);
    if (!canRoleUpdateToStatus('admin', nextStatus)) {
      toast.error('Final delivery confirmation must be completed by delivery personnel.');
      return;
    }

    setUpdatingOrderId(order._id);
    try {
      await api.put(`/orders/${order._id}/status`, { status: nextStatus });
      toast.success(`Order moved to ${nextStatus}`);
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const handleCancel = async (order) => {
    setUpdatingOrderId(order._id);
    try {
      await api.post(`/orders/${order._id}/cancel`);
      toast.success('Order cancelled');
      await loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel order failed');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-semibold">Order Management</h2>
        <button className="btn text-sm w-full sm:w-auto" onClick={loadOrders}>Refresh</button>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading orders...</p>}
      {!loading && !sortedOrders.length && <p className="text-sm text-gray-500">No orders found.</p>}

      {sortedOrders.map((order) => {
        const flow = getOrderFlow(order.paymentMethod);
        const currentStatus = normalizeOrderStatus(order.orderStatus, order.paymentMethod);
        const currentIndex = flow.indexOf(currentStatus);
        const nextStatus = getNextOrderStatus(order);
        const canAdvance = canRoleUpdateToStatus('admin', nextStatus);

        return (
          <div key={order._id} className="card space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Order #{order._id.slice(-6)}</p>
                <p className="text-xs text-gray-500 break-all">ID: {order._id}</p>
                <p>Customer: <span className="font-medium">{order.customerId?.name || 'N/A'}</span></p>
                <p>Farmer: <span className="font-medium">{order.farmerId?.name || 'N/A'}</span></p>
                <p>Delivery: <span className="font-medium">{order.deliveryPartnerId?.name || 'Unassigned'}</span></p>
                <p className="text-gray-600">
                  Payment: {order.paymentMethod} • {order.paymentStatus}
                </p>
                <p className="text-gray-600">Total: {formatCurrency(order.totalAmount || 0)}</p>
                {order.deliveryTrackingStatus && (
                  <p className="text-gray-600">Tracking: {order.deliveryTrackingStatus}</p>
                )}
                {order.estimatedArrivalAt && (
                  <p className="text-gray-600">ETA: {new Date(order.estimatedArrivalAt).toLocaleString()}</p>
                )}
              </div>

              <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col gap-2">
                <Link to={`/orders/${order._id}`} className="btn text-sm text-center">
                  View details
                </Link>
                {nextStatus && canAdvance && (
                  <button
                    className="btn text-sm bg-[#155e3a]"
                    disabled={updatingOrderId === order._id}
                    onClick={() => handleAdvance(order)}
                  >
                    {updatingOrderId === order._id ? 'Updating...' : `Move to ${nextStatus}`}
                  </button>
                )}
                {nextStatus && !canAdvance && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Awaiting delivery final update.
                  </p>
                )}
                {!['Delivered', 'Cancelled', 'Refunded'].includes(order.orderStatus) && (
                  <button
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    disabled={updatingOrderId === order._id}
                    onClick={() => handleCancel(order)}
                  >
                    {updatingOrderId === order._id ? 'Cancelling...' : 'Cancel order'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {flow.map((step, index) => (
                <span
                  key={step}
                  className={`rounded-full border px-2.5 py-1 ${statusChipClass(
                    currentStatus === step,
                    currentIndex > index
                  )}`}
                >
                  {step}
                </span>
              ))}
              {order.orderStatus === 'Cancelled' && (
                <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-600">
                  Cancelled
                </span>
              )}
              {order.orderStatus === 'Refunded' && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">
                  Refunded
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminOrders;
