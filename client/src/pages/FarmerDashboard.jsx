import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { normalizeOrderStatus } from '../constants/orderFlow.js';
import { formatCurrency } from '../utils/currency.js';

const statusBadgeClass = (status) => {
  const value = String(status || '').toLowerCase();
  if (value.includes('delivered')) return 'bg-[#edf7f0] text-[#166a42] border-[#cce5d5]';
  if (value.includes('out for delivery') || value.includes('in transit')) return 'bg-[#ecf5ff] text-[#175cd3] border-[#c8ddff]';
  if (value.includes('cancel')) return 'bg-[#fff0ef] text-[#b42318] border-[#f4c7c2]';
  if (value.includes('refund')) return 'bg-[#f3f0ff] text-[#5b3cc4] border-[#d6ccff]';
  return 'bg-[#fff6ea] text-[#b54708] border-[#f1d3ab]';
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const FarmerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [productsRes, ordersRes, promotionsRes, notificationsRes] = await Promise.all([
        api.get('/products/farmer/my'),
        api.get('/orders/farmer'),
        api.get('/promotions/manage'),
        api.get('/notifications')
      ]);

      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setPromotions(Array.isArray(promotionsRes.data) ? promotionsRes.data : []);
      setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load farmer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.isAvailable && Number(product.quantity) > 0).length;
    const outOfStockProducts = products.filter((product) => Number(product.quantity) <= 0 || !product.isAvailable).length;
    const lowStockProducts = products.filter((product) => Number(product.quantity) > 0 && Number(product.quantity) < 5).length;
    const totalOrders = orders.length;
    const openOrders = orders.filter((order) =>
      !['Delivered', 'Cancelled', 'Refunded'].includes(order.orderStatus)
    ).length;
    const revenue = orders
      .filter((order) => order.paymentStatus === 'Paid' || order.orderStatus === 'Delivered')
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const activePromotions = promotions.filter((promotion) => promotion.isApproved && promotion.isActive).length;
    const pendingPromotions = promotions.filter((promotion) => !promotion.isApproved).length;
    return {
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      totalOrders,
      openOrders,
      revenue,
      activePromotions,
      pendingPromotions
    };
  }, [products, orders, promotions]);

  const lowStockList = useMemo(
    () =>
      products
        .filter((product) => Number(product.quantity) < 5)
        .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0))
        .slice(0, 5),
    [products]
  );

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
    [orders]
  );

  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 rounded-3xl bg-[#e7efe9]" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-24 rounded-2xl bg-[#e7efe9]" />
          ))}
        </div>
        <div className="h-72 rounded-3xl bg-[#e7efe9]" />
      </div>
    );
  }

  return (
    <div className="relative isolate overflow-hidden space-y-6">
      <div className="pointer-events-none absolute -top-14 -left-20 h-56 w-56 rounded-full bg-[#d9ebde] blur-3xl" />
      <div className="pointer-events-none absolute top-44 -right-20 h-52 w-52 rounded-full bg-[#f7ebd5] blur-3xl" />

      <section className="relative rounded-3xl border border-[#d8e7dd] bg-gradient-to-r from-[#f8fcf8] via-white to-[#f3f8f4] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1f7a4d]">Farmer control center</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-[#153a2b]">Farmer Dashboard</h1>
            <p className="mt-1 text-sm text-[#4f6d5c]">
              Manage product inventory, monitor customer orders, and optimize promotions from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/farmer/products" className="rounded-full border border-[#c8ddcf] bg-white px-4 py-2 text-sm font-semibold text-[#315744] hover:border-[#9fc5ad]">
              Manage Products
            </Link>
            <Link to="/farmer/orders" className="rounded-full border border-[#c8ddcf] bg-white px-4 py-2 text-sm font-semibold text-[#315744] hover:border-[#9fc5ad]">
              Manage Orders
            </Link>
            <Link to="/farmer/reviews" className="rounded-full border border-[#c8ddcf] bg-white px-4 py-2 text-sm font-semibold text-[#315744] hover:border-[#9fc5ad]">
              Manage Reviews
            </Link>
            <Link to="/farmer/promotions" className="rounded-full border border-[#1f7a4d] bg-[#1f7a4d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#18643f]">
              Manage Promotions
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Active products</p>
          <p className="mt-2 text-2xl font-bold text-[#166a42]">{stats.activeProducts}</p>
        </div>
        <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Low stock</p>
          <p className="mt-2 text-2xl font-bold text-[#b54708]">{stats.lowStockProducts}</p>
        </div>
        <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Out of stock</p>
          <p className="mt-2 text-2xl font-bold text-[#b42318]">{stats.outOfStockProducts}</p>
        </div>
        <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Revenue</p>
          <p className="mt-2 text-2xl font-bold text-[#153a2b]">{formatCurrency(stats.revenue)}</p>
        </div>
        <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Total orders</p>
          <p className="mt-2 text-2xl font-bold text-[#153a2b]">{stats.totalOrders}</p>
        </div>
        <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Open orders</p>
          <p className="mt-2 text-2xl font-bold text-[#175cd3]">{stats.openOrders}</p>
        </div>
        <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Active promotions</p>
          <p className="mt-2 text-2xl font-bold text-[#166a42]">{stats.activePromotions}</p>
        </div>
        <div className="rounded-2xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f7f6d]">Pending approval</p>
          <p className="mt-2 text-2xl font-bold text-[#b54708]">{stats.pendingPromotions}</p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
        <article className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[#153a2b]">Recent Orders</h2>
            <Link to="/farmer/orders" className="text-sm font-semibold text-[#1f7a4d] hover:text-[#153a2b]">
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {recentOrders.map((order) => {
              const displayStatus = normalizeOrderStatus(order.orderStatus, order.paymentMethod);
              return (
                <div key={order._id} className="flex flex-col gap-2 rounded-2xl border border-[#e4eee7] bg-[#fbfdfb] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-[#153a2b]">Order #{String(order._id).slice(-6)}</p>
                    <p className="text-xs text-[#5f7f6d]">{formatDate(order.createdAt)} • {order.paymentMethod}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(displayStatus)}`}>
                      {displayStatus}
                    </span>
                    <p className="text-sm font-semibold text-[#153a2b]">{formatCurrency(order.totalAmount || 0)}</p>
                    <Link to={`/orders/${order._id}`} className="rounded-full border border-[#c8ddcf] bg-white px-3 py-1 text-xs font-semibold text-[#315744] hover:border-[#9fc5ad]">
                      Details
                    </Link>
                  </div>
                </div>
              );
            })}
            {!recentOrders.length && (
              <p className="text-sm text-[#5f7f6d]">No orders yet. New customer orders will appear here.</p>
            )}
          </div>
        </article>

        <div className="space-y-5">
          <article className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#153a2b]">Inventory Alerts</h2>
            <div className="mt-3 space-y-2">
              {lowStockList.map((product) => (
                <div key={product._id} className="rounded-xl border border-[#f4d4a6] bg-[#fff8ef] px-3 py-2">
                  <p className="text-sm font-semibold text-[#7a5317]">{product.productName}</p>
                  <p className="text-xs text-[#8a6832]">
                    Stock: {product.quantity} {Number(product.quantity) <= 0 ? '(Out of stock)' : '(Low stock)'}
                  </p>
                </div>
              ))}
              {!lowStockList.length && (
                <p className="text-sm text-[#5f7f6d]">No low-stock products. Inventory looks healthy.</p>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#153a2b]">Latest Notifications</h2>
            <div className="mt-3 space-y-2">
              {recentNotifications.map((notification) => (
                <div key={notification._id} className="rounded-xl border border-[#e4eee7] bg-[#fbfdfb] px-3 py-2">
                  <p className="text-sm text-[#315744]">{notification.message}</p>
                  <p className="mt-1 text-xs text-[#5f7f6d]">{formatDate(notification.createdAt)}</p>
                </div>
              ))}
              {!recentNotifications.length && (
                <p className="text-sm text-[#5f7f6d]">No recent notifications.</p>
              )}
              <Link to="/notifications" className="inline-block pt-1 text-sm font-semibold text-[#1f7a4d] hover:text-[#153a2b]">
                Open notification center
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};

export default FarmerDashboard;
