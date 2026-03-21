import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { placeOrder } from '../redux/slices/orderSlice.js';
import { clearCart } from '../redux/slices/cartSlice.js';
import { formatCurrency } from '../utils/currency.js';

const ONLINE_OPTIONS = [
  { value: 'CARD', label: 'Credit / Debit Card' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'UPI', label: 'UPI' },
  { value: 'NETBANKING', label: 'Net Banking' },
  { value: 'WALLET', label: 'Digital Wallet' }
];

const formatMoney = (value) => formatCurrency(value);

const Checkout = () => {
  const { items } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [method, setMethod] = useState('COD');
  const [address, setAddress] = useState('');
  const [promo, setPromo] = useState('');
  const [error, setError] = useState('');
  const [onlineMode, setOnlineMode] = useState('CARD');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const [cardForm, setCardForm] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '' });
  const [paypalEmail, setPaypalEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [netBankProvider, setNetBankProvider] = useState('HDFC Bank');
  const [walletProvider, setWalletProvider] = useState('Apple Pay');

  const isOnline = method === 'ONLINE';

  const fallbackSummary = useMemo(() => {
    const subTotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    return {
      subTotal,
      discountTotal: 0,
      itemTotal: subTotal,
      taxAmount: 0,
      deliveryCharge: 0,
      totalAmount: subTotal,
      taxPercent: 0
    };
  }, [items]);

  const fallbackLineItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.price || 0),
        discountPerUnit: 0,
        finalUnitPrice: Number(item.price || 0),
        lineSubTotal: Number(item.price || 0) * Number(item.quantity || 0),
        lineDiscount: 0,
        lineTotal: Number(item.price || 0) * Number(item.quantity || 0)
      })),
    [items]
  );

  const lineItems = Array.isArray(summary?.lineItems) && summary.lineItems.length ? summary.lineItems : fallbackLineItems;
  const totals = summary?.summary || fallbackSummary;
  const appliedPromotions = Array.isArray(summary?.appliedPromotions) ? summary.appliedPromotions : [];

  const buildDemoPayment = () => {
    if (!isOnline) return undefined;

    if (onlineMode === 'CARD') {
      return {
        mode: onlineMode,
        cardName: cardForm.cardName,
        cardNumber: cardForm.cardNumber,
        expiry: cardForm.expiry,
        cvv: cardForm.cvv
      };
    }

    if (onlineMode === 'PAYPAL') {
      return { mode: onlineMode, paypalEmail };
    }

    if (onlineMode === 'UPI') {
      return { mode: onlineMode, upiId };
    }

    if (onlineMode === 'NETBANKING') {
      return { mode: onlineMode, provider: netBankProvider };
    }

    return { mode: onlineMode, provider: walletProvider };
  };

  const loadPreview = async () => {
    if (!items.length) return;
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const payload = {
        promoCode: promo.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity || 0)
        }))
      };
      const { data } = await api.post('/orders/preview', payload);
      setSummary(data);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to calculate order summary';
      setSummary(null);
      setSummaryError(message);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (!items.length) return;
    const timer = setTimeout(() => {
      loadPreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [items, promo]);

  const submit = async () => {
    setError('');

    if (!address.trim()) {
      setError('Please enter a delivery address.');
      return;
    }

    if (summaryLoading) {
      setError('Please wait while order totals are being calculated.');
      return;
    }

    if (summaryError) {
      setError(summaryError);
      return;
    }

    const payload = {
      paymentMethod: method,
      promoCode: promo.trim() || undefined,
      address,
      items: items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
    };

    if (isOnline) {
      payload.demoPayment = buildDemoPayment();
    }

    const result = await dispatch(placeOrder(payload));

    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(clearCart());
      toast.success(isOnline ? 'Payment successful. Order confirmed.' : 'Order placed successfully.');
      navigate('/orders');
      return;
    }

    setError(result.payload || 'Order failed');
    toast.error(result.payload || 'Order failed');
  };

  if (!items.length) return <p className="p-4">No items to checkout.</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="text-2xl font-semibold text-[#153a2b]">Checkout</h2>
        <button
          type="button"
          className="rounded-md border border-[#c7dccd] bg-white px-4 py-2 text-sm font-semibold text-[#315744] hover:bg-[#f4faf6]"
          onClick={loadPreview}
        >
          Recalculate
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr]">
        <section className="card space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[#153a2b]">Selected Products</h3>
            <p className="text-sm text-[#5e7a6a]">
              Review quantities, unit prices, discounts, and line totals before placing your order.
            </p>
          </div>

          {summaryLoading && <p className="text-sm text-[#5e7a6a]">Calculating latest totals...</p>}
          {summaryError && <p className="text-sm text-red-600">{summaryError}</p>}

          <div className="overflow-x-auto rounded-xl border border-[#deeadf]">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f5faf6] text-[#315744]">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Product</th>
                  <th className="px-3 py-2 text-right font-semibold">Unit Price</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                  <th className="px-3 py-2 text-right font-semibold">Discount</th>
                  <th className="px-3 py-2 text-right font-semibold">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((line, index) => (
                  <tr key={(line.productId || index).toString()} className="border-t border-[#eef4ef]">
                    <td className="px-3 py-2">{line.productName || line.productId}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(line.unitPrice)}</td>
                    <td className="px-3 py-2 text-right">{line.quantity}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(line.lineSubTotal)}</td>
                    <td className="px-3 py-2 text-right text-[#b45309]">- {formatMoney(line.lineDiscount)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#153a2b]">{formatMoney(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-[#deeadf] bg-[#f8fbf8] p-3 space-y-2">
            <label className="block text-sm font-medium text-[#1d4f38]">Promo code (optional)</label>
            <input
              className="auth-input"
              placeholder="Enter promo code"
              value={promo}
              onChange={(event) => setPromo(event.target.value)}
            />
            {!!appliedPromotions.length && (
              <div className="text-xs text-[#315744] space-y-1">
                <p className="font-semibold">Applied promotions</p>
                {appliedPromotions.map((promoItem) => (
                  <p key={promoItem._id}>
                    {promoItem.title}
                    {promoItem.promoCode ? ` (${promoItem.promoCode})` : ''}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card space-y-3">
            <h3 className="text-lg font-semibold text-[#153a2b]">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatMoney(totals.subTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-[#b45309]">
                <span>Discounts</span>
                <span>- {formatMoney(totals.discountTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Taxable Amount</span>
                <span>{formatMoney(totals.itemTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax {totals.taxPercent ? `(${totals.taxPercent}%)` : '(0%)'}</span>
                <span>{formatMoney(totals.taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery Charges</span>
                <span>{formatMoney(totals.deliveryCharge)}</span>
              </div>
              <div className="border-t border-[#deeadf] pt-2 flex items-center justify-between text-base font-semibold text-[#153a2b]">
                <span>Final Total</span>
                <span>{formatMoney(totals.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="card space-y-3">
            <div>
              <label className="block text-sm font-medium">Delivery address</label>
              <textarea
                className="auth-input"
                rows={3}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Payment method</label>
              <select value={method} onChange={(event) => setMethod(event.target.value)} className="auth-input">
                <option value="COD">Cash on Delivery</option>
                <option value="ONLINE">Online Payment (Demo)</option>
              </select>
            </div>

            {isOnline && (
              <div className="space-y-3 rounded-xl border border-[#d8e8dd] bg-[#f7fbf8] p-3">
                <p className="text-sm font-semibold text-[#1d4f38]">Demo Payment Gateway</p>
                <div className="flex flex-wrap gap-2">
                  {ONLINE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setOnlineMode(option.value)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        onlineMode === option.value
                          ? 'border-[#1f7a4d] bg-[#1f7a4d] text-white'
                          : 'border-[#bfd6c7] bg-white text-[#315744] hover:border-[#94bfa5]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {onlineMode === 'CARD' && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className="auth-input sm:col-span-2"
                      placeholder="Card holder name"
                      value={cardForm.cardName}
                      onChange={(event) => setCardForm({ ...cardForm, cardName: event.target.value })}
                    />
                    <input
                      className="auth-input sm:col-span-2"
                      placeholder="Card number"
                      value={cardForm.cardNumber}
                      onChange={(event) => setCardForm({ ...cardForm, cardNumber: event.target.value })}
                    />
                    <input
                      className="auth-input"
                      placeholder="MM/YY"
                      value={cardForm.expiry}
                      onChange={(event) => setCardForm({ ...cardForm, expiry: event.target.value })}
                    />
                    <input
                      className="auth-input"
                      placeholder="CVV"
                      value={cardForm.cvv}
                      onChange={(event) => setCardForm({ ...cardForm, cvv: event.target.value })}
                    />
                  </div>
                )}

                {onlineMode === 'PAYPAL' && (
                  <input
                    className="auth-input"
                    placeholder="PayPal email"
                    value={paypalEmail}
                    onChange={(event) => setPaypalEmail(event.target.value)}
                  />
                )}

                {onlineMode === 'UPI' && (
                  <input
                    className="auth-input"
                    placeholder="UPI ID (example@upi)"
                    value={upiId}
                    onChange={(event) => setUpiId(event.target.value)}
                  />
                )}

                {onlineMode === 'NETBANKING' && (
                  <select
                    className="auth-input"
                    value={netBankProvider}
                    onChange={(event) => setNetBankProvider(event.target.value)}
                  >
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>SBI</option>
                  </select>
                )}

                {onlineMode === 'WALLET' && (
                  <select
                    className="auth-input"
                    value={walletProvider}
                    onChange={(event) => setWalletProvider(event.target.value)}
                  >
                    <option>Apple Pay</option>
                    <option>Google Pay</option>
                    <option>PhonePe</option>
                    <option>Paytm</option>
                  </select>
                )}
              </div>
            )}

            <button className="btn w-full" onClick={submit} disabled={summaryLoading || Boolean(summaryError)}>
              {isOnline ? 'Pay & Place Order' : 'Place Order'}
            </button>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
