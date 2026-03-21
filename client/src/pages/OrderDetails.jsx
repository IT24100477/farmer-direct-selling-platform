import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { cancelOrder, fetchOrder } from '../redux/slices/orderSlice.js';
import { canRoleUpdateToStatus, getNextOrderStatus, getOrderFlow, normalizeOrderStatus } from '../constants/orderFlow.js';
import api from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return dateFormatter.format(date);
};

const shortId = (value) => String(value || '').slice(-6) || 'N/A';

const statusPillClass = (status) => {
  const safe = String(status || '').toLowerCase();
  if (safe.includes('delivered')) return 'bg-[#edf7f0] text-[#166a42] border-[#cce5d5]';
  if (safe.includes('out for delivery') || safe.includes('in transit')) return 'bg-[#ecf5ff] text-[#175cd3] border-[#c8ddff]';
  if (safe.includes('cancel')) return 'bg-[#fff0ef] text-[#b42318] border-[#f4c7c2]';
  if (safe.includes('refund')) return 'bg-[#f3f0ff] text-[#5b3cc4] border-[#d6ccff]';
  return 'bg-[#fff6ea] text-[#b54708] border-[#f1d3ab]';
};

const OrderDetailsSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 space-y-5 animate-pulse">
    <div className="h-24 rounded-3xl bg-[#e7efe9]" />
    <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
      <div className="space-y-4">
        <div className="h-56 rounded-3xl bg-[#e7efe9]" />
        <div className="h-72 rounded-3xl bg-[#e7efe9]" />
      </div>
      <div className="space-y-4">
        <div className="h-56 rounded-3xl bg-[#e7efe9]" />
        <div className="h-72 rounded-3xl bg-[#e7efe9]" />
      </div>
    </div>
  </div>
);

const OrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const order = useSelector((state) => state.orders.selected);
  const selectedError = useSelector((state) => state.orders.selectedError);
  const { user } = useSelector((state) => state.auth);

  const [showRefundPanel, setShowRefundPanel] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [etaInput, setEtaInput] = useState('');

  const timelineRef = useRef(null);
  const orderLoaded = order && String(order._id) === String(id);

  useEffect(() => {
    dispatch(fetchOrder(id));
    const timer = setInterval(() => {
      dispatch(fetchOrder(id));
    }, 10000);
    return () => clearInterval(timer);
  }, [dispatch, id]);

  useEffect(() => {
    if (searchParams.get('tab') === 'timeline' && timelineRef.current) {
      timelineRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [searchParams, orderLoaded]);

  const currentStatus = useMemo(
    () => normalizeOrderStatus(order?.orderStatus, order?.paymentMethod),
    [order?.orderStatus, order?.paymentMethod]
  );
  const steps = useMemo(() => getOrderFlow(order?.paymentMethod), [order?.paymentMethod]);
  const currentIndex = steps.indexOf(currentStatus);
  const nextStatus = useMemo(() => getNextOrderStatus(order), [order]);
  const canAdvanceOrder = canRoleUpdateToStatus(user?.role, nextStatus);
  const requiresEtaForNextStatus = nextStatus === 'Out for Delivery' && user?.role === 'delivery';

  const orderProducts = useMemo(() => (Array.isArray(order?.products) ? order.products : []), [order?.products]);
  const calculatedSubTotal = useMemo(
    () => orderProducts.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [orderProducts]
  );

  const financials = {
    subTotal: Number(order?.subTotal ?? calculatedSubTotal ?? 0),
    discountTotal: Number(order?.discountTotal || 0),
    taxAmount: Number(order?.taxAmount || 0),
    deliveryCharge: Number(order?.deliveryCharge || 0),
    totalAmount: Number(order?.totalAmount || 0)
  };

  const paymentDetails = useMemo(() => {
    if (!order) return [];
    if (order.paymentProvider === 'CARD') {
      return [
        { label: 'Provider', value: 'Credit / Debit Card' },
        { label: 'Card Holder', value: order.paymentMeta?.cardHolder || 'N/A' },
        { label: 'Card Number', value: order.paymentMeta?.cardLast4 ? `**** **** **** ${order.paymentMeta.cardLast4}` : 'N/A' },
        { label: 'Expiry', value: order.paymentMeta?.cardExpiry || 'N/A' }
      ];
    }
    if (order.paymentProvider === 'PAYPAL') {
      return [
        { label: 'Provider', value: 'PayPal' },
        { label: 'PayPal Email', value: order.paymentMeta?.paypalEmail || 'N/A' }
      ];
    }
    if (order.paymentProvider === 'UPI') {
      return [
        { label: 'Provider', value: 'UPI' },
        { label: 'UPI ID', value: order.paymentMeta?.upiId || 'N/A' }
      ];
    }
    if (order.paymentProvider === 'NETBANKING' || order.paymentProvider === 'WALLET') {
      return [
        { label: 'Provider', value: order.paymentProvider },
        { label: 'Wallet / Bank', value: order.paymentMeta?.provider || 'N/A' }
      ];
    }
    return [{ label: 'Provider', value: order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'ONLINE' }];
  }, [order]);

  const isCustomer = user?.role === 'customer';
  const isAdmin = user?.role === 'admin';
  const withinWindow = order ? (Date.now() - new Date(order.createdAt).getTime()) / 60000 <= 30 : false;
  const beforeTransit = currentStatus === 'Placed' || currentStatus === 'Confirmed';
  const delayedDelivery = Boolean(order?.isDeliveryDelayed);
  const orderCustomerId = (order?.customerId?._id || order?.customerId || '').toString();
  const canCancelByCustomer = isCustomer && orderCustomerId === (user?._id || '').toString() && (withinWindow || beforeTransit || delayedDelivery);
  const canCancelByAdmin = isAdmin && !['Delivered', 'Cancelled', 'Refunded'].includes(order?.orderStatus);
  const canCancel = order && !['Cancelled', 'Delivered', 'Refunded'].includes(order.orderStatus) && (canCancelByCustomer || canCancelByAdmin);
  const canProcessRefund = isAdmin && order?.paymentMethod === 'ONLINE' && order?.orderStatus === 'Cancelled' && order?.paymentStatus === 'Paid';

  const timelineEvents = useMemo(() => {
    if (!order) return [];
    const list = [
      { label: 'Order Placed', time: order.createdAt },
      { label: 'In Transit', time: order.inTransitAt },
      { label: 'Out for Delivery', time: order.outForDeliveryAt },
      { label: 'Delivered', time: order.orderStatus === 'Delivered' ? order.updatedAt : null },
      { label: 'Cancelled', time: order.orderStatus === 'Cancelled' ? order.updatedAt : null },
      { label: 'Refunded', time: order.orderStatus === 'Refunded' ? order.updatedAt : null }
    ];
    return list.filter((entry) => entry.time);
  }, [order]);

  const onCancelOrder = async () => {
    const result = await dispatch(cancelOrder(order._id));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Order cancelled successfully');
      dispatch(fetchOrder(order._id));
      return;
    }
    toast.error(result.payload || 'Cancel order failed');
  };

  const onAdvanceStatus = async () => {
    if (!nextStatus || !canAdvanceOrder) return;
    if (requiresEtaForNextStatus && !etaInput) {
      toast.error('Estimated delivery date and time is required');
      return;
    }
    setUpdatingStatus(true);
    try {
      const payload = { status: nextStatus };
      if (requiresEtaForNextStatus) {
        payload.estimatedArrivalAt = new Date(etaInput).toISOString();
      }
      await api.put(`/orders/${order._id}/status`, payload);
      toast.success(`Order moved to ${nextStatus}`);
      dispatch(fetchOrder(order._id));
      if (requiresEtaForNextStatus) {
        setEtaInput('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const onProcessRefund = async () => {
    setProcessingRefund(true);
    try {
      await api.post(`/orders/${order._id}/refund`);
      toast.success('Refund processed and confirmed');
      setShowRefundPanel(false);
      dispatch(fetchOrder(order._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund process failed');
    } finally {
      setProcessingRefund(false);
    }
  };

  if (!orderLoaded && !selectedError) return <OrderDetailsSkeleton />;

  if (!orderLoaded && selectedError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-[#f4c7c2] bg-[#fff0ef] p-5 text-sm text-[#b42318]">
          {selectedError}
        </div>
      </div>
    );
  }

  return (
    <div className="relative isolate overflow-hidden bg-[#f4f7f2]">
      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-[#d9ebde] blur-3xl" />
      <div className="pointer-events-none absolute top-72 -right-20 h-64 w-64 rounded-full bg-[#f7ebd5] blur-3xl" />

      <main className="relative max-w-7xl mx-auto px-4 py-8 space-y-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-[#d8e7dd] bg-gradient-to-r from-[#f8fcf8] via-white to-[#f3f8f4] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1f7a4d]">Order details</p>
              <h1 className="mt-1 font-display text-3xl font-semibold text-[#153a2b]">Order #{shortId(order._id)}</h1>
              <p className="mt-1 text-sm text-[#4f6d5c]">
                Placed on {formatDateTime(order.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusPillClass(currentStatus)}`}>
                {currentStatus}
              </span>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusPillClass(order.paymentStatus)}`}>
                Payment: {order.paymentStatus}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {canCancel && (
              <button
                type="button"
                onClick={onCancelOrder}
                className="rounded-full border border-[#f0c7c1] bg-[#fff1f0] px-4 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#ffe7e5]"
              >
                Cancel Order
              </button>
            )}
            {!canCancel && isCustomer && !['Cancelled', 'Delivered', 'Refunded'].includes(order.orderStatus) && (
              <span className="rounded-full border border-[#f4d4a6] bg-[#fff6ea] px-4 py-2 text-xs font-semibold text-[#b54708]">
                Cancellation: within 30 mins / before transit / delayed delivery
              </span>
            )}
            {nextStatus && canAdvanceOrder && (
              <>
                {requiresEtaForNextStatus && (
                  <input
                    type="datetime-local"
                    className="rounded-full border border-[#c8ddcf] bg-white px-4 py-2 text-sm text-[#315744]"
                    value={etaInput}
                    onChange={(event) => setEtaInput(event.target.value)}
                  />
                )}
                <button
                  type="button"
                  onClick={onAdvanceStatus}
                  disabled={updatingStatus}
                  className="rounded-full border border-[#c8ddcf] bg-white px-4 py-2 text-sm font-semibold text-[#315744] transition hover:-translate-y-0.5 hover:border-[#9fc5ad] disabled:opacity-60"
                >
                  {updatingStatus ? 'Updating...' : `Move to ${nextStatus}`}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => timelineRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="rounded-full border border-[#c8ddcf] bg-white px-4 py-2 text-sm font-semibold text-[#315744] transition hover:-translate-y-0.5 hover:border-[#9fc5ad]"
            >
              Track Timeline
            </button>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[1.15fr,0.85fr]">
          <section className="space-y-5">
            <article className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-[#153a2b]">Product Summary</h2>
              <div className="mt-4 space-y-3">
                {orderProducts.map((item, index) => {
                  const product = item.productId || {};
                  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=500&q=80';
                  const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
                  return (
                    <div key={(item._id || product._id || `line-${index}`).toString()} className="flex gap-3 rounded-2xl border border-[#e4eee7] bg-[#fbfdfb] p-3">
                      <img src={image} alt={product.productName || 'Product'} className="h-16 w-16 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-semibold text-[#153a2b]">{product.productName || 'Deleted Product'}</p>
                        <p className="text-xs text-[#5f7f6d]">Qty: {Number(item.quantity || 0)}</p>
                        <p className="text-xs text-[#5f7f6d]">Unit Price: {formatCurrency(item.price || 0)}</p>
                      </div>
                      <p className="text-sm font-semibold text-[#153a2b]">{formatCurrency(lineTotal)}</p>
                    </div>
                  );
                })}
              </div>
            </article>

            <article ref={timelineRef} className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-[#153a2b]">Order Timeline</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {steps.map((step, index) => (
                  <span
                    key={step}
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                      currentStatus === step
                        ? 'border-[#1f7a4d] bg-[#1f7a4d] text-white'
                        : currentIndex > index
                          ? 'border-[#93c7a9] bg-[#eaf6ef] text-[#1f7a4d]'
                          : 'border-[#dfeae2] bg-white text-[#6f8679]'
                    }`}
                  >
                    {step}
                  </span>
                ))}
                {order.orderStatus === 'Cancelled' && (
                  <span className="inline-flex rounded-full border border-[#f4c7c2] bg-[#fff0ef] px-3 py-1 text-xs font-semibold text-[#b42318]">
                    Cancelled
                  </span>
                )}
                {order.orderStatus === 'Refunded' && (
                  <span className="inline-flex rounded-full border border-[#d6ccff] bg-[#f3f0ff] px-3 py-1 text-xs font-semibold text-[#5b3cc4]">
                    Refunded
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {timelineEvents.map((event) => (
                  <div key={`${event.label}-${event.time}`} className="flex items-center justify-between rounded-xl border border-[#e4eee7] bg-[#fbfdfb] px-3 py-2">
                    <p className="text-sm font-medium text-[#153a2b]">{event.label}</p>
                    <p className="text-xs text-[#5f7f6d]">{formatDateTime(event.time)}</p>
                  </div>
                ))}
                {!timelineEvents.length && (
                  <p className="text-sm text-[#5f7f6d]">Timeline events will appear as status updates progress.</p>
                )}
              </div>
            </article>
          </section>

          <aside className="space-y-5">
            <article className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#153a2b]">Charges Breakdown</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#4f6d5c]">Subtotal</span>
                  <span>{formatCurrency(financials.subTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-[#b45309]">
                  <span>Discount</span>
                  <span>- {formatCurrency(financials.discountTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4f6d5c]">Tax</span>
                  <span>{formatCurrency(financials.taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4f6d5c]">Shipping</span>
                  <span>{formatCurrency(financials.deliveryCharge)}</span>
                </div>
                <div className="border-t border-[#e2ece5] pt-2 flex items-center justify-between text-base font-semibold text-[#153a2b]">
                  <span>Total Amount</span>
                  <span>{formatCurrency(financials.totalAmount)}</span>
                </div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm space-y-3">
              <h2 className="text-lg font-semibold text-[#153a2b]">Delivery & Billing</h2>
              <div className="rounded-2xl border border-[#e4eee7] bg-[#fbfdfb] p-3 text-sm">
                <p className="font-semibold text-[#153a2b]">Delivery Address</p>
                <p className="mt-1 text-[#4f6d5c]">{order.shippingAddress || order.customerId?.address || 'N/A'}</p>
              </div>
              <div className="rounded-2xl border border-[#e4eee7] bg-[#fbfdfb] p-3 text-sm">
                <p className="font-semibold text-[#153a2b]">Customer</p>
                <p className="mt-1 text-[#4f6d5c]">{order.customerId?.name || 'N/A'}</p>
                <p className="text-[#4f6d5c]">{order.customerId?.email || ''}</p>
                <p className="text-[#4f6d5c]">{order.customerId?.phone || ''}</p>
              </div>
              {order.deliveryPartnerId && (
                <div className="rounded-2xl border border-[#e4eee7] bg-[#fbfdfb] p-3 text-sm">
                  <p className="font-semibold text-[#153a2b]">Delivery Partner</p>
                  <p className="mt-1 text-[#4f6d5c]">{order.deliveryPartnerId?.name || 'N/A'}</p>
                  <p className="text-[#4f6d5c]">{order.deliveryPartnerId?.phone || ''}</p>
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#153a2b]">Payment Details</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-xl border border-[#e4eee7] bg-[#fbfdfb] px-3 py-2 text-sm">
                  <p className="text-xs text-[#5f7f6d]">Method</p>
                  <p className="font-medium text-[#153a2b]">{order.paymentMethod}</p>
                </div>
                <div className="rounded-xl border border-[#e4eee7] bg-[#fbfdfb] px-3 py-2 text-sm">
                  <p className="text-xs text-[#5f7f6d]">Status</p>
                  <p className="font-medium text-[#153a2b]">{order.paymentStatus}</p>
                </div>
                {paymentDetails.map((item) => (
                  <div key={item.label} className="rounded-xl border border-[#e4eee7] bg-[#fbfdfb] px-3 py-2 text-sm">
                    <p className="text-xs text-[#5f7f6d]">{item.label}</p>
                    <p className="font-medium text-[#153a2b] break-all">{item.value}</p>
                  </div>
                ))}
                {order.paymentReference && (
                  <div className="rounded-xl border border-[#e4eee7] bg-[#fbfdfb] px-3 py-2 text-sm">
                    <p className="text-xs text-[#5f7f6d]">Reference</p>
                    <p className="font-medium text-[#153a2b] break-all">{order.paymentReference}</p>
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[#153a2b]">Delivery Tracking</h2>
              <div className="mt-3 space-y-2 text-sm text-[#4f6d5c]">
                <p>Current: <span className="font-semibold text-[#153a2b]">{order.deliveryTrackingStatus || 'Not started'}</span></p>
                <p>Estimated Arrival: <span className="font-semibold text-[#153a2b]">{formatDateTime(order.estimatedArrivalAt)}</span></p>
                {order.isDeliveryDelayed && (
                  <p className="rounded-xl border border-[#f4c7c2] bg-[#fff0ef] px-3 py-2 text-xs font-semibold text-[#b42318]">
                    Delivery delay detected. Cancellation may be available as per policy.
                  </p>
                )}
              </div>
            </article>
          </aside>
        </div>

        {canProcessRefund && (
          <section className="rounded-3xl border border-[#f2d3a8] bg-[#fff8ef] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[#7a5317]">Refund Management</h2>
            {!showRefundPanel ? (
              <button
                type="button"
                onClick={() => setShowRefundPanel(true)}
                className="mt-3 rounded-full bg-[#b7791f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9a6216]"
              >
                Process Refund
              </button>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-[#7a5f22]">
                  Verify transfer manually using the payment details above, then confirm refund.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onProcessRefund}
                    disabled={processingRefund}
                    className="rounded-full bg-[#b7791f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9a6216] disabled:opacity-60"
                  >
                    {processingRefund ? 'Processing...' : 'Confirm Refund'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRefundPanel(false)}
                    disabled={processingRefund}
                    className="rounded-full border border-[#e2c89f] bg-white px-4 py-2 text-sm font-semibold text-[#7a5317] hover:bg-[#fff4e2]"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {order.orderStatus === 'Refunded' && (
          <section className="rounded-3xl border border-[#d6ccff] bg-[#f7f4ff] p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#5b3cc4]">
              Refund completed for this order. Payment status is marked as Refunded.
            </p>
          </section>
        )}
      </main>
    </div>
  );
};

export default OrderDetails;
