import { Link } from 'react-router-dom';
import { normalizeProductCategory } from '../constants/productCategories.js';
import { formatCurrency } from '../utils/currency.js';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCountdown = (targetMs, nowMs) => {
  const diff = targetMs - nowMs;
  if (diff <= 0) return '00h 00m 00s';
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
};

const getPromoTargetLabel = (promo) => {
  if (promo.applicableTo === 'product') {
    return promo.productId?.productName ? `Product: ${promo.productId.productName}` : 'Product offer';
  }
  if (promo.applicableTo === 'category') {
    const category = normalizeProductCategory(promo.category) || promo.category || 'Selected Category';
    return `Category: ${category}`;
  }
  if (promo.applicableTo === 'farmer') {
    return promo.farmerId?.name ? `Farmer: ${promo.farmerId.name}` : 'Farmer offer';
  }
  return 'Marketplace offer';
};

const getPromoConditions = (promo) => {
  const conditions = [];
  if (promo.promoCode) {
    conditions.push(`Use code ${promo.promoCode} at checkout`);
  } else {
    conditions.push('Auto-applied at checkout when eligible');
  }

  if (promo.applicableTo === 'product' && promo.productId?.productName) {
    conditions.push(`Valid only for ${promo.productId.productName}`);
  } else if (promo.applicableTo === 'category') {
    conditions.push(`Valid for ${(normalizeProductCategory(promo.category) || promo.category || 'selected')} category products`);
  } else if (promo.applicableTo === 'farmer') {
    conditions.push('Valid on products from selected farmer');
  }

  return conditions;
};

const getPromoCtaTarget = (promo) => {
  if (promo.applicableTo === 'product' && promo.productId?._id) {
    return `/products/${promo.productId._id}`;
  }
  if (promo.applicableTo === 'category' && promo.category) {
    return `/products?category=${encodeURIComponent(promo.category)}`;
  }
  return '/products';
};

const PromotionShowcaseCard = ({ promo, nowMs = Date.now() }) => {
  const discountText = promo.discountType === 'percentage'
    ? `${promo.discountValue}% OFF`
    : `${formatCurrency(promo.discountValue || 0)} OFF`;

  const startMs = promo.startDate ? new Date(promo.startDate).getTime() : null;
  const endMs = promo.endDate ? new Date(promo.endDate).getTime() : null;
  const startsInFuture = startMs && nowMs < startMs;
  const isExpired = endMs && nowMs > endMs;
  const countdownLabel = startsInFuture ? 'Starts In' : 'Ends In';
  const countdownValue = startsInFuture
    ? formatCountdown(startMs, nowMs)
    : endMs
      ? formatCountdown(endMs, nowMs)
      : 'No expiry';
  const targetLabel = getPromoTargetLabel(promo);
  const conditions = getPromoConditions(promo);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-[#d7e7dc] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbf7_48%,#f0f8f2_100%)] p-5 shadow-[0_12px_28px_-18px_rgba(20,72,50,0.65)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_36px_-18px_rgba(20,72,50,0.7)]">
      <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-[#d4efe0]/60 blur-2xl transition duration-300 group-hover:scale-110" />
      <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute -left-12 top-0 h-full w-24 -skew-x-12 bg-white/30 blur-xl" />
      </div>

      <div className="relative flex items-start justify-between gap-3">
        <span className="inline-flex rounded-full bg-[#1f7a4d] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-sm">
          {discountText}
        </span>
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isExpired ? 'bg-red-100 text-red-600' : 'bg-[#e8f5ee] text-[#1f7a4d]'}`}>
          {isExpired ? 'Expired' : countdownLabel}
          {!isExpired && endMs ? `: ${countdownValue}` : ''}
        </span>
      </div>

      <div className="relative mt-4 space-y-2">
        <h3 className="text-lg font-semibold text-[#153a2b]">{promo.title}</h3>
        <p className="text-sm leading-relaxed text-[#4f6d5c]">{promo.description || 'Seasonal promotional offer.'}</p>
        <p className="inline-flex rounded-lg bg-[#edf7f1] px-2.5 py-1 text-xs font-semibold text-[#1f7a4d]">
          {targetLabel}
        </p>
      </div>

      <div className="relative mt-4 rounded-2xl border border-[#dce9e0] bg-white/80 p-3">
        <div className="flex items-center justify-between text-xs text-[#4f6d5c]">
          <span>Valid From</span>
          <span className="font-semibold text-[#315744]">{formatDate(promo.startDate)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-[#4f6d5c]">
          <span>Valid Until</span>
          <span className="font-semibold text-[#315744]">{formatDate(promo.endDate)}</span>
        </div>
      </div>

      <div className="relative mt-4 space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#2a6345]">Conditions</p>
        {conditions.map((condition) => (
          <p key={condition} className="flex items-start gap-2 text-xs text-[#4f6d5c]">
            <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1f7a4d]" />
            <span>{condition}</span>
          </p>
        ))}
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#315744]">
          {promo.promoCode ? `Code: ${promo.promoCode}` : 'No code needed'}
        </p>
        <Link
          to={getPromoCtaTarget(promo)}
          className="inline-flex items-center rounded-full bg-[#1f7a4d] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#18643f]"
        >
          Shop Now
        </Link>
      </div>
    </article>
  );
};

export default PromotionShowcaseCard;
