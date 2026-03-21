import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';

const DeliveryOrdersToDeliver = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState('');
  const [etaByOrder, setEtaByOrder] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/delivery/to-deliver');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load delivery requests');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const accept = async (orderId) => {
    setAcceptingId(orderId);
    try {
      const payload = {};
      if (etaByOrder[orderId]) {
        payload.estimatedArrivalAt = new Date(etaByOrder[orderId]).toISOString();
      }
      await api.put(`/orders/${orderId}/delivery/accept`, payload);
      toast.success('Delivery request accepted');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Accept failed');
    } finally {
      setAcceptingId('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-xl font-semibold">Orders to Deliver</h2>
        <button className="btn text-sm w-full sm:w-auto" onClick={load}>Refresh</button>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading delivery requests...</p>}
      {!loading && !orders.length && <p className="text-sm text-gray-500">No orders waiting for acceptance.</p>}

      {orders.map((order) => (
        <div key={order._id} className="card space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div className="text-sm space-y-1">
              <p className="font-semibold">Order #{order._id.slice(-6)}</p>
              <p className="text-xs text-gray-500 break-all">Order ID: {order._id}</p>
              <p>Customer: <span className="font-medium">{order.customerId?.name || 'N/A'}</span></p>
              <p>Phone: <span className="font-medium">{order.customerId?.phone || 'N/A'}</span></p>
              <p>Email: <span className="font-medium">{order.customerId?.email || 'N/A'}</span></p>
              <p>Address: <span className="font-medium">{order.shippingAddress || order.customerId?.address || 'N/A'}</span></p>
            </div>
            <div className="text-sm space-y-1">
              <p>Farmer: <span className="font-medium">{order.farmerId?.name || 'N/A'}</span></p>
              <p>Payment: <span className="font-medium">{order.paymentMethod} • {order.paymentStatus}</span></p>
              <p>Total: <span className="font-medium">{formatCurrency(order.totalAmount || 0)}</span></p>
              <p>Status: <span className="inline-flex rounded-full bg-[#eaf6ef] px-2 py-0.5 text-xs font-semibold text-[#1f7a4d]">{order.orderStatus}</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#315744]">Items</p>
            <div className="space-y-1">
              {Array.isArray(order.products) && order.products.map((item, idx) => (
                <div key={(item._id || idx).toString()} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                  <span>{item.productId?.productName || 'Product'}</span>
                  <span>Qty {Number(item.quantity || 0)}</span>
                  <span>{formatCurrency(item.price || 0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr,auto]">
            <input
              type="datetime-local"
              className="auth-input"
              value={etaByOrder[order._id] || ''}
              onChange={(event) => setEtaByOrder((prev) => ({ ...prev, [order._id]: event.target.value }))}
            />
            <button
              className="btn"
              disabled={acceptingId === order._id}
              onClick={() => accept(order._id)}
            >
              {acceptingId === order._id ? 'Accepting...' : 'Accept Delivery'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeliveryOrdersToDeliver;
