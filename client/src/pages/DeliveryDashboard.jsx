import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { getOrderFlow, normalizeOrderStatus } from '../constants/orderFlow.js';
import { formatCurrency } from '../utils/currency.js';

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [trackingByOrder, setTrackingByOrder] = useState({});
  const [etaByOrder, setEtaByOrder] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/delivery');
      const rows = Array.isArray(data) ? data : [];
      setOrders(rows);
      const trackingDefaults = {};
      const etaDefaults = {};
      rows.forEach((order) => {
        trackingDefaults[order._id] = order.deliveryTrackingStatus || 'On the Way';
        etaDefaults[order._id] = order.estimatedArrivalAt ? new Date(order.estimatedArrivalAt).toISOString().slice(0, 16) : '';
      });
      setTrackingByOrder(trackingDefaults);
      setEtaByOrder(etaDefaults);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load assigned orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingAcceptance = useMemo(
    () => orders.filter((order) => normalizeOrderStatus(order.orderStatus, order.paymentMethod) === 'In Transit'),
    [orders]
  );
  const activeDelivery = useMemo(
    () => orders.filter((order) => normalizeOrderStatus(order.orderStatus, order.paymentMethod) === 'Out for Delivery'),
    [orders]
  );

  const updateTracking = async (order) => {
    setUpdatingId(order._id);
    try {
      const payload = {
        trackingStatus: trackingByOrder[order._id]
      };
      if (etaByOrder[order._id]) {
        payload.estimatedArrivalAt = new Date(etaByOrder[order._id]).toISOString();
      }
      await api.put(`/orders/${order._id}/delivery/tracking`, payload);
      toast.success('Tracking updated');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Tracking update failed');
    } finally {
      setUpdatingId('');
    }
  };

  const markDelivered = async (order) => {
    setUpdatingId(order._id);
    try {
      await api.put(`/orders/${order._id}/status`, { status: 'Delivered' });
      toast.success('Order marked Delivered');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingId('');
    }
  };

  const renderStatusBadges = (order) => {
    const flow = getOrderFlow(order.paymentMethod);
    const current = normalizeOrderStatus(order.orderStatus, order.paymentMethod);
    const currentIndex = flow.indexOf(current);
    return (
      <div className="flex flex-wrap gap-2 text-xs">
        {flow.map((status) => (
          <span
            key={status}
            className={`rounded-full border px-2.5 py-1 ${
              current === status
                ? 'border-[#1f7a4d] bg-[#1f7a4d] text-white'
                : currentIndex > flow.indexOf(status)
                  ? 'border-[#93c7a9] bg-[#eaf6ef] text-[#1f7a4d]'
                  : 'border-gray-200 bg-white text-gray-500'
            }`}
          >
            {status}
          </span>
        ))}
        {order.orderStatus === 'Cancelled' && (
          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-600">Cancelled</span>
        )}
        {order.orderStatus === 'Refunded' && (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-blue-700">Refunded</span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-semibold">Delivery Dashboard</h2>
        <button className="btn text-sm w-full sm:w-auto" onClick={load}>Refresh</button>
      </div>

      <div className="card">
        <p className="text-sm font-semibold">Orders Waiting for Acceptance</p>
        <p className="text-xs text-gray-600 mt-1">
          {pendingAcceptance.length} order(s) are waiting in <span className="font-semibold">In Transit</span>.
        </p>
        <Link to="/delivery/orders-to-deliver" className="inline-block mt-3 btn text-sm">
          Open Orders to Deliver
        </Link>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Out for Delivery Orders</h3>
        {loading && <p className="text-sm text-gray-500">Loading orders...</p>}
        {!loading && !activeDelivery.length && <p className="text-sm text-gray-500">No active deliveries right now.</p>}

        {activeDelivery.map((order) => (
          <div key={order._id} className="card space-y-3">
            <div className="flex flex-col lg:flex-row lg:justify-between gap-2 text-sm">
              <div className="space-y-1">
                <p className="font-semibold">Order #{order._id.slice(-6)}</p>
                <p>Customer: <span className="font-medium">{order.customerId?.name || 'N/A'}</span></p>
                <p>Phone: <span className="font-medium">{order.customerId?.phone || 'N/A'}</span></p>
                <p>Address: <span className="font-medium">{order.shippingAddress || order.customerId?.address || 'N/A'}</span></p>
              </div>
              <div className="space-y-1">
                <p>Payment: <span className="font-medium">{order.paymentMethod} • {order.paymentStatus}</span></p>
                <p>Total: <span className="font-medium">{formatCurrency(order.totalAmount || 0)}</span></p>
                <p>Current Tracking: <span className="font-medium">{order.deliveryTrackingStatus || 'N/A'}</span></p>
                <p>ETA: <span className="font-medium">{order.estimatedArrivalAt ? new Date(order.estimatedArrivalAt).toLocaleString() : 'Not set'}</span></p>
              </div>
            </div>

            {renderStatusBadges(order)}

            <div className="grid gap-2 sm:grid-cols-2">
              <select
                className="auth-input"
                value={trackingByOrder[order._id] || 'On the Way'}
                onChange={(event) => setTrackingByOrder((prev) => ({ ...prev, [order._id]: event.target.value }))}
              >
                <option value="On the Way">On the Way</option>
                <option value="Near Delivery Location">Near Delivery Location</option>
                <option value="Delayed">Delayed</option>
              </select>
              <input
                type="datetime-local"
                className="auth-input"
                value={etaByOrder[order._id] || ''}
                onChange={(event) => setEtaByOrder((prev) => ({ ...prev, [order._id]: event.target.value }))}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="btn text-sm" disabled={updatingId === order._id} onClick={() => updateTracking(order)}>
                {updatingId === order._id ? 'Updating...' : 'Update Tracking'}
              </button>
              <button
                className="rounded-md bg-[#0f4f8a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d4476]"
                disabled={updatingId === order._id}
                onClick={() => markDelivered(order)}
              >
                {updatingId === order._id ? 'Updating...' : 'Mark Delivered'}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default DeliveryDashboard;
