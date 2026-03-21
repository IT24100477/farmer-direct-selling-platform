import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { cancelOrder, fetchMyOrders } from '../redux/slices/orderSlice.js';
import { normalizeOrderStatus } from '../constants/orderFlow.js';
import { formatCurrency } from '../utils/currency.js';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric'
});

const statusPillClass = (status) => {
  const safe = String(status || '').toLowerCase();
  if (safe.includes('delivered')) return 'bg-[#edf7f0] text-[#166a42] border-[#cce5d5]';
  if (safe.includes('out for delivery') || safe.includes('in transit')) return 'bg-[#ecf5ff] text-[#175cd3] border-[#c8ddff]';
  if (safe.includes('cancel')) return 'bg-[#fff0ef] text-[#b42318] border-[#f4c7c2]';
  if (safe.includes('refund')) return 'bg-[#f3f0ff] text-[#5b3cc4] border-[#d6ccff]';
  return 'bg-[#fff6ea] text-[#b54708] border-[#f1d3ab]';
};

const buildDisplayStatus = (order) => normalizeOrderStatus(order.orderStatus, order.paymentMethod);

const isCancelledLike = (order) => ['Cancelled', 'Refunded'].includes(order.orderStatus);

const canCancelOrder = (order, role, userId) => {
  if (isCancelledLike(order) || order.orderStatus === 'Delivered') return false;
  if (role === 'admin') return true;
  if (role !== 'customer') return false;

  const ownerId = (order.customerId?._id || order.customerId || '').toString();
  if (!userId || ownerId !== userId.toString()) return false;

  const diffMins = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
  const currentStatus = buildDisplayStatus(order);
  const withinWindow = diffMins <= 30;
  const beforeTransit = currentStatus === 'Placed' || currentStatus === 'Confirmed';
  return withinWindow || beforeTransit || Boolean(order.isDeliveryDelayed);
};

const Orders = () => {
  const dispatch = useDispatch();
  const { list, error, status } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const safeList = Array.isArray(list) ? list : [];

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [cancellingId, setCancellingId] = useState('');

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const allStatuses = useMemo(() => {
    const set = new Set(safeList.map((order) => buildDisplayStatus(order)));
    return Array.from(set);
  }, [safeList]);

  const filteredOrders = useMemo(() => {
    let items = [...safeList];
    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter((order) => {
        const id = order._id?.toLowerCase() || '';
        const shortId = order._id?.slice(-6).toLowerCase() || '';
        const customer = order.customerId?.name?.toLowerCase() || '';
        const farmer = order.farmerId?.name?.toLowerCase() || '';
        return id.includes(q) || shortId.includes(q) || customer.includes(q) || farmer.includes(q);
      });
    }

    if (statusFilter !== 'all') {
      items = items.filter((order) => buildDisplayStatus(order) === statusFilter);
    }
    if (paymentFilter !== 'all') {
      items = items.filter((order) => order.paymentMethod === paymentFilter);
    }

    if (sortBy === 'latest') items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest') items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === 'amount_desc') items.sort((a, b) => Number(b.totalAmount || 0) - Number(a.totalAmount || 0));
    if (sortBy === 'amount_asc') items.sort((a, b) => Number(a.totalAmount || 0) - Number(b.totalAmount || 0));
    if (sortBy === 'status') items.sort((a, b) => buildDisplayStatus(a).localeCompare(buildDisplayStatus(b)));

    return items;
  }, [query, safeList, statusFilter, paymentFilter, sortBy]);

  const metrics = useMemo(() => {
    const totalOrders = safeList.length;
    const totalSpend = safeList.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const activeCount = safeList.filter((order) => !isCancelledLike(order) && order.orderStatus !== 'Delivered').length;
    const deliveredCount = safeList.filter((order) => order.orderStatus === 'Delivered').length;
    return { totalOrders, totalSpend, activeCount, deliveredCount };
  }, [safeList]);

  const handleCancel = async (orderId) => {
    setCancellingId(orderId);
    const result = await dispatch(cancelOrder(orderId));
    setCancellingId('');
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Order cancelled');
    } else {
      toast.error(result.payload || 'Cancel order failed');
    }
  };

  const roleTitle = user?.role === 'admin'
    ? 'All Orders'
    : user?.role === 'farmer'
      ? 'Farmer Orders'
      : user?.role === 'delivery'
        ? 'Delivery Orders'
        : 'My Orders';

  return (
    <div className="relative isolate overflow-hidden bg-[#f4f7f2]">
      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-[#d9ebde] blur-3xl" />
      <div className="pointer-events-none absolute top-72 -right-20 h-64 w-64 rounded-full bg-[#f7ebd5] blur-3xl" />

      <main className="relative max-w-7xl mx-auto px-4 py-8 space-y-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-[#d8e7dd] bg-gradient-to-r from-[#f8fcf8] via-white to-[#f3f8f4] p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1f7a4d]">Order management</p>
              <h1 className="mt-1 font-display text-3xl font-semibold text-[#153a2b]">{roleTitle}</h1>
              <p className="mt-1 text-sm text-[#4f6d5c]">Search, filter, and track order progress with quick actions.</p>
            </div>
            <button
              type="button"
              onClick={() => dispatch(fetchMyOrders())}
              className="rounded-full border border-[#c8ddcf] bg-white px-4 py-2 text-sm font-semibold text-[#315744] transition hover:-translate-y-0.5 hover:border-[#9fc5ad]"
            >
              Refresh
            </button>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Total orders</p>
            <p className="mt-2 text-2xl font-bold text-[#153a2b]">{metrics.totalOrders}</p>
          </div>
          <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Total value</p>
            <p className="mt-2 text-2xl font-bold text-[#153a2b]">{formatCurrency(metrics.totalSpend)}</p>
          </div>
          <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Active</p>
            <p className="mt-2 text-2xl font-bold text-[#175cd3]">{metrics.activeCount}</p>
          </div>
          <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Delivered</p>
            <p className="mt-2 text-2xl font-bold text-[#166a42]">{metrics.deliveredCount}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order ID, customer, farmer"
              className="auth-input"
            />
            <select className="auth-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {allStatuses.map((statusLabel) => (
                <option key={statusLabel} value={statusLabel}>{statusLabel}</option>
              ))}
            </select>
            <select className="auth-input" value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
              <option value="all">All payment methods</option>
              <option value="COD">Cash on Delivery</option>
              <option value="ONLINE">Online Payment</option>
            </select>
            <select className="auth-input" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount_desc">Highest amount</option>
              <option value="amount_asc">Lowest amount</option>
              <option value="status">Status</option>
            </select>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {status === 'loading' && <p className="text-sm text-[#4f6d5c]">Loading orders...</p>}

        {!!filteredOrders.length && (
          <section className="hidden lg:block rounded-3xl border border-[#d8e7dd] bg-white shadow-sm overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f5faf6] text-[#315744]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Order</th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-left font-semibold">Payment</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const displayStatus = buildDisplayStatus(order);
                  const canCancel = canCancelOrder(order, user?.role, user?._id);
                  return (
                    <tr key={order._id} className="border-t border-[#eef4ef]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#153a2b]">#{order._id.slice(-6)}</p>
                        <p className="text-xs text-[#6f8679]">{order._id}</p>
                      </td>
                      <td className="px-4 py-3 text-[#4f6d5c]">
                        {order.createdAt ? dateFormatter.format(new Date(order.createdAt)) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-[#4f6d5c]">
                        {order.paymentMethod} • {order.paymentStatus}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#153a2b]">
                        {formatCurrency(order.totalAmount || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPillClass(displayStatus)}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/orders/${order._id}`}
                            className="rounded-full border border-[#c8ddcf] bg-white px-3 py-1.5 text-xs font-semibold text-[#315744] hover:border-[#9fc5ad]"
                          >
                            View Details
                          </Link>
                          <Link
                            to={`/orders/${order._id}?tab=timeline`}
                            className="rounded-full border border-[#c8ddcf] bg-white px-3 py-1.5 text-xs font-semibold text-[#315744] hover:border-[#9fc5ad]"
                          >
                            Track Order
                          </Link>
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => handleCancel(order._id)}
                              disabled={cancellingId === order._id}
                              className="rounded-full border border-[#f0c7c1] bg-[#fff1f0] px-3 py-1.5 text-xs font-semibold text-[#b42318] hover:bg-[#ffe7e5] disabled:opacity-50"
                            >
                              {cancellingId === order._id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        <section className="grid gap-3 lg:hidden">
          {filteredOrders.map((order) => {
            const displayStatus = buildDisplayStatus(order);
            const canCancel = canCancelOrder(order, user?.role, user?._id);
            return (
              <article key={order._id} className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#153a2b]">Order #{order._id.slice(-6)}</p>
                    <p className="text-xs text-[#6f8679]">{order.createdAt ? dateFormatter.format(new Date(order.createdAt)) : 'N/A'}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPillClass(displayStatus)}`}>
                    {displayStatus}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#4f6d5c]">
                  <p>Payment: {order.paymentMethod}</p>
                  <p className="text-right">{order.paymentStatus}</p>
                  <p className="col-span-2 font-semibold text-[#153a2b]">Total: {formatCurrency(order.totalAmount || 0)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/orders/${order._id}`}
                    className="rounded-full border border-[#c8ddcf] bg-white px-3 py-1.5 text-xs font-semibold text-[#315744]"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/orders/${order._id}?tab=timeline`}
                    className="rounded-full border border-[#c8ddcf] bg-white px-3 py-1.5 text-xs font-semibold text-[#315744]"
                  >
                    Track Order
                  </Link>
                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => handleCancel(order._id)}
                      disabled={cancellingId === order._id}
                      className="rounded-full border border-[#f0c7c1] bg-[#fff1f0] px-3 py-1.5 text-xs font-semibold text-[#b42318]"
                    >
                      {cancellingId === order._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {!filteredOrders.length && status !== 'loading' && (
          <div className="rounded-3xl border border-dashed border-[#c8ddcf] bg-white/80 p-8 text-center text-sm text-[#5f7f6d]">
            No orders match your current filters.
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders;
