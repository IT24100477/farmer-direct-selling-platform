import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { addToCart } from '../redux/slices/cartSlice.js';
import { fetchProduct, fetchProducts } from '../redux/slices/productSlice.js';
import api from '../services/api.js';
import { normalizeProductCategory } from '../constants/productCategories.js';
import StarRating from '../components/StarRating.jsx';
import { formatCurrency } from '../utils/currency.js';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric'
});

const TABS = [
  { value: 'description', label: 'Description' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'delivery', label: 'Delivery & Returns' }
];
const REVIEW_COMMENT_MAX_LENGTH = 200;

const ProductDetailsSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
    <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
      <div className="space-y-3">
        <div className="h-[360px] rounded-3xl bg-[#e7efe9]" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-20 rounded-xl bg-[#e7efe9]" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-6 w-36 rounded bg-[#e7efe9]" />
        <div className="h-10 w-4/5 rounded bg-[#e7efe9]" />
        <div className="h-5 w-2/3 rounded bg-[#e7efe9]" />
        <div className="h-24 rounded-2xl bg-[#e7efe9]" />
        <div className="h-14 rounded-2xl bg-[#e7efe9]" />
      </div>
    </div>
    <div className="h-80 rounded-3xl bg-[#e7efe9]" />
  </div>
);

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selected, items: allProducts } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);

  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [error, setError] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState('');
  const [editForm, setEditForm] = useState({ rating: 5, comment: '' });
  const [reviewActionLoading, setReviewActionLoading] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const isLoadingProduct = !selected || selected._id !== id;

  useEffect(() => {
    dispatch(fetchProduct(id));
  }, [dispatch, id]);

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const { data } = await api.get(`/reviews/product/${id}`);
      setReviews(data);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [id]);

  useEffect(() => {
    if (!selected || selected._id !== id) return;
    setActiveImage(0);
    setQty(1);

    if (selected.category) {
      dispatch(
        fetchProducts({
          category: normalizeProductCategory(selected.category) || selected.category,
          limit: 12,
          sort: 'rating'
        })
      );
    }
  }, [dispatch, selected, id]);

  const images = useMemo(() => {
    if (isLoadingProduct) return [];
    if (selected?.images?.length) return selected.images;
    return ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'];
  }, [isLoadingProduct, selected]);

  const hasRealImage = Boolean(selected?.images?.length);
  const mainImage = images[activeImage] || images[0];
  const stock = Number(selected?.quantity || 0);
  const isOutOfStock = stock <= 0;
  const isUnavailable = !selected?.isAvailable || isOutOfStock;
  const isLowStock = !isUnavailable && stock < 5;

  const basePrice = Number(selected?.price || 0);
  const discountAmount = Number(selected?.discount || 0);
  const finalPrice = Math.max(basePrice - discountAmount, 0);
  const hasDiscount = discountAmount > 0;

  const averageFromReviews = useMemo(() => {
    if (!reviews.length) return Number(selected?.averageRating || 0);
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return total / reviews.length;
  }, [reviews, selected?.averageRating]);

  const ratingBreakdown = useMemo(() => {
    const byStar = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((review) => Number(review.rating) === stars).length
    }));
    return byStar;
  }, [reviews]);

  const relatedProducts = useMemo(
    () => allProducts.filter((product) => product._id !== id).slice(0, 8),
    [allProducts, id]
  );

  const stockBadge = isOutOfStock
    ? { label: 'Out of Stock', classes: 'bg-[#fff0ef] text-[#b42318] border-[#f6c9c3]' }
    : isLowStock
      ? { label: 'Low Stock', classes: 'bg-[#fff6ea] text-[#b54708] border-[#f4d2a7]' }
      : { label: 'In Stock', classes: 'bg-[#edf7f0] text-[#166a42] border-[#cfe7d7]' };

  const updateQty = (delta) => {
    setQty((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (!isUnavailable && next > stock) return stock;
      return next;
    });
  };

  const addSelectedToCart = () => {
    if (!selected || isUnavailable) return;
    dispatch(
      addToCart({
        productId: selected._id,
        name: selected.productName,
        price: hasDiscount ? finalPrice : basePrice,
        quantity: qty
      })
    );
    toast.success('Added to cart');
  };

  const buyNow = () => {
    addSelectedToCart();
    if (!isUnavailable) navigate('/checkout');
  };

  const submitReview = async () => {
    const normalizedComment = form.comment.trim();
    if (!normalizedComment) {
      setError('Please add a short review comment.');
      return;
    }
    if (normalizedComment.length > REVIEW_COMMENT_MAX_LENGTH) {
      setError(`Review comment cannot exceed ${REVIEW_COMMENT_MAX_LENGTH} characters.`);
      return;
    }
    setError('');
    setSubmittingReview(true);
    try {
      await api.post('/reviews', { productId: id, rating: form.rating, comment: normalizedComment });
      setForm({ rating: 5, comment: '' });
      await loadReviews();
      dispatch(fetchProduct(id));
      toast.success('Review submitted');
    } catch (err) {
      setError(err.response?.data?.message || 'Review failed');
    } finally {
      setSubmittingReview(false);
    }
  };

  const isOwnReview = (review) =>
    user?.role === 'customer' && String(review.customerId?._id || review.customerId) === String(user?._id);

  const startReviewEdit = (review) => {
    setEditingReviewId(review._id);
    setEditForm({ rating: Number(review.rating || 5), comment: review.comment || '' });
    setError('');
  };

  const saveReviewEdit = async () => {
    if (!editingReviewId) return;
    const normalizedComment = editForm.comment.trim();
    if (!normalizedComment) {
      setError('Please add a short review comment.');
      return;
    }
    if (normalizedComment.length > REVIEW_COMMENT_MAX_LENGTH) {
      setError(`Review comment cannot exceed ${REVIEW_COMMENT_MAX_LENGTH} characters.`);
      return;
    }
    setError('');
    setReviewActionLoading(`edit-${editingReviewId}`);
    try {
      await api.put(`/reviews/${editingReviewId}`, { rating: editForm.rating, comment: normalizedComment });
      setEditingReviewId('');
      await loadReviews();
      dispatch(fetchProduct(id));
      toast.success('Review updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update review');
    } finally {
      setReviewActionLoading('');
    }
  };

  const removeReview = async (reviewId) => {
    setError('');
    setReviewActionLoading(`delete-${reviewId}`);
    try {
      await api.delete(`/reviews/${reviewId}`);
      if (editingReviewId === reviewId) setEditingReviewId('');
      await loadReviews();
      dispatch(fetchProduct(id));
      toast.success('Review deleted');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete review');
    } finally {
      setReviewActionLoading('');
    }
  };

  if (isLoadingProduct) return <ProductDetailsSkeleton />;

  const reviewCount = reviews.length || Number(selected?.ratingCount || 0);
  const highlights = [
    `Category: ${normalizeProductCategory(selected.category) || selected.category}`,
    isOutOfStock ? 'Currently unavailable for purchase' : `${stock} units currently available`,
    selected.createdAt ? `Listed on ${dateFormatter.format(new Date(selected.createdAt))}` : 'Recently added',
    hasDiscount ? `Save ${formatCurrency(discountAmount)} with active promotion` : 'No active discount currently'
  ];

  return (
    <div className="relative isolate overflow-hidden bg-[#f4f7f2]">
      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-[#d9ebde] blur-3xl" />
      <div className="pointer-events-none absolute top-72 -right-20 h-64 w-64 rounded-full bg-[#f7ebd5] blur-3xl" />

      <main className="relative max-w-7xl mx-auto px-4 py-8 space-y-8 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="space-y-3">
            <div className="group relative overflow-hidden rounded-3xl border border-[#d8e7dd] bg-white p-2 shadow-[0_16px_30px_-18px_rgba(20,64,45,0.55)]">
              {!hasRealImage && (
                <span className="absolute left-4 top-4 z-10 rounded-full border border-[#c9ddcf] bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#315744]">
                  Preview image
                </span>
              )}
              {selected.discountBadge && (
                <span className="absolute right-4 top-4 z-10 rounded-full bg-[#fff5e8] px-3 py-1 text-xs font-bold text-[#b45309] shadow-sm">
                  {selected.discountBadge}
                </span>
              )}
              <div className="relative overflow-hidden rounded-2xl bg-[#edf4ee]">
                <img
                  src={mainImage}
                  alt={selected.productName}
                  className="h-[320px] w-full object-cover transition duration-700 group-hover:scale-110 sm:h-[420px]"
                />
                {isUnavailable && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#b42318]">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`overflow-hidden rounded-xl border bg-white p-1 transition ${
                      activeImage === index
                        ? 'border-[#1f7a4d] ring-2 ring-[#1f7a4d]/25'
                        : 'border-[#d8e7dd] hover:border-[#9fc5ad]'
                    }`}
                  >
                    <img src={image} alt={`${selected.productName} ${index + 1}`} className="h-16 w-full rounded-lg object-cover sm:h-20" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5 animate-fade-up">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full border border-[#cde0d2] bg-[#edf7f0] px-3 py-1 text-xs font-semibold text-[#1f7a4d]">
                {normalizeProductCategory(selected.category) || selected.category}
              </span>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${stockBadge.classes}`}>
                {stockBadge.label}
              </span>
              {selected.discountBadge && (
                <span className="inline-flex rounded-full border border-[#f4d2a7] bg-[#fff6ea] px-3 py-1 text-xs font-semibold text-[#b54708]">
                  {selected.discountBadge}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] font-semibold text-[#1f7a4d]">
                Farmer: {selected.farmerId?.name || 'Unknown Farmer'}
              </p>
              <h1 className="font-display text-3xl font-semibold leading-tight text-[#153a2b] sm:text-4xl">
                {selected.productName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#4f6d5c]">
                <StarRating value={averageFromReviews} count={reviewCount} size="md" />
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="underline decoration-[#9fc5ad] underline-offset-4 hover:text-[#1f7a4d]"
                >
                  Read all reviews
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d8e7dd] bg-white/85 p-4 shadow-sm">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <p className="text-3xl font-bold text-[#153a2b]">{formatCurrency(hasDiscount ? finalPrice : basePrice)}</p>
                {hasDiscount && (
                  <>
                    <p className="text-lg font-medium text-[#8aa396] line-through">{formatCurrency(basePrice)}</p>
                    <p className="rounded-full bg-[#e8f5ed] px-2.5 py-1 text-xs font-semibold text-[#166a42]">
                      You save {formatCurrency(discountAmount)}
                    </p>
                  </>
                )}
              </div>
              <p className="mt-2 text-sm text-[#567162]">
                {isUnavailable ? 'Currently not available for checkout.' : 'Price includes current promotional discounts where applicable.'}
              </p>
            </div>

            <div className="rounded-2xl border border-[#d8e7dd] bg-white/85 p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#153a2b]">Quantity</p>
                <p className="text-xs text-[#5f7f6d]">Max: {stock}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-xl border border-[#cde0d2] bg-[#f8fbf8]">
                  <button
                    type="button"
                    onClick={() => updateQty(-1)}
                    disabled={qty <= 1 || isUnavailable}
                    className="h-10 w-10 text-lg font-semibold text-[#315744] transition hover:bg-[#ecf4ef] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-[#153a2b]">{qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(1)}
                    disabled={isUnavailable || qty >= stock}
                    className="h-10 w-10 text-lg font-semibold text-[#315744] transition hover:bg-[#ecf4ef] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-[#5f7f6d]">Subtotal: {formatCurrency((hasDiscount ? finalPrice : basePrice) * qty)}</p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={addSelectedToCart}
                  disabled={isUnavailable}
                  className="inline-flex items-center justify-center rounded-xl border border-[#1f7a4d] bg-[#1f7a4d] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#18643f] active:translate-y-0 disabled:cursor-not-allowed disabled:border-[#b9c8be] disabled:bg-[#b9c8be]"
                >
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={buyNow}
                  disabled={isUnavailable}
                  className="inline-flex items-center justify-center rounded-xl border border-[#bfd6c7] bg-white px-4 py-3 text-sm font-semibold text-[#1f7a4d] transition hover:-translate-y-0.5 hover:border-[#9fc5ad] hover:bg-[#f6fbf8] active:translate-y-0 disabled:cursor-not-allowed disabled:border-[#d8e4dc] disabled:text-[#91a69a]"
                >
                  Buy Now
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d8e7dd] bg-white/80 p-4 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1f7a4d]">About this product</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-[#4f6d5c]">
                {highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#1f7a4d]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#d8e7dd] bg-white/75 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-[#e2ece5] pb-4">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.value
                    ? 'bg-[#1f7a4d] text-white shadow-sm'
                    : 'bg-[#f2f7f3] text-[#315744] hover:bg-[#e8f2eb]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="pt-5 space-y-3">
              <h2 className="font-display text-2xl font-semibold text-[#153a2b]">Description</h2>
              <p className="text-sm leading-7 text-[#456252]">
                {selected.description || 'Freshly sourced product from verified farmers, delivered with quality and safety checks.'}
              </p>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="pt-5 space-y-4">
              <h2 className="font-display text-2xl font-semibold text-[#153a2b]">Delivery & Returns</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[#dce9e0] bg-white p-4">
                  <h3 className="font-semibold text-[#153a2b]">Delivery</h3>
                  <p className="mt-1 text-sm text-[#4f6d5c]">
                    Orders are dispatched from nearby farms and usually delivered within 24 hours depending on your location.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#dce9e0] bg-white p-4">
                  <h3 className="font-semibold text-[#153a2b]">Returns</h3>
                  <p className="mt-1 text-sm text-[#4f6d5c]">
                    If product quality does not meet expectations, raise a support request within 24 hours for review and refund handling.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="pt-5 space-y-5">
              <h2 className="font-display text-2xl font-semibold text-[#153a2b]">Reviews</h2>

              <div className="grid gap-4 lg:grid-cols-[0.9fr,1.1fr]">
                <div className="rounded-2xl border border-[#dce9e0] bg-white p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1f7a4d]">Average rating</p>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="text-4xl font-bold text-[#153a2b]">{averageFromReviews.toFixed(1)}</p>
                    <p className="pb-1 text-sm text-[#5f7f6d]">/5</p>
                  </div>
                  <StarRating value={averageFromReviews} count={reviewCount} size="md" className="mt-2" />

                  <div className="mt-4 space-y-2">
                    {ratingBreakdown.map((row) => {
                      const width = reviewCount ? (row.count / reviewCount) * 100 : 0;
                      return (
                        <div key={row.stars} className="flex items-center gap-2 text-xs text-[#4f6d5c]">
                          <span className="w-8">{row.stars} star</span>
                          <div className="h-2 flex-1 rounded-full bg-[#edf4ee]">
                            <div className="h-full rounded-full bg-[#1f7a4d]" style={{ width: `${width}%` }} />
                          </div>
                          <span className="w-6 text-right">{row.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#dce9e0] bg-white p-4">
                  <h3 className="font-semibold text-[#153a2b]">Write a Review</h3>
                  {user?.role === 'customer' ? (
                    <div className="mt-3 space-y-3">
                      <div>
                        <p className="text-sm text-[#4f6d5c] mb-2">Your rating</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, rating: star }))}
                              className={`text-2xl transition ${form.rating >= star ? 'text-[#f4b740]' : 'text-[#d4dfd8]'}`}
                              aria-label={`Rate ${star} star`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        className="auth-input min-h-[110px]"
                        rows={4}
                        placeholder="Share your experience with this product."
                        value={form.comment}
                        onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
                        maxLength={REVIEW_COMMENT_MAX_LENGTH}
                      />
                      <p className="text-xs text-[#5f7f6d]">{form.comment.length}/{REVIEW_COMMENT_MAX_LENGTH} characters</p>
                      <button
                        type="button"
                        onClick={submitReview}
                        disabled={submittingReview}
                        className="btn disabled:opacity-60"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                      <p className="text-xs text-[#5f7f6d]">
                        Reviews can be submitted only by customers with a delivered order.
                      </p>
                      {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[#4f6d5c]">
                      Please <Link className="text-[#1f7a4d] underline" to="/login">login as a customer</Link> to submit a review.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {reviewsLoading && (
                  <div className="space-y-3">
                    <div className="h-24 rounded-2xl bg-[#e7efe9] animate-pulse" />
                    <div className="h-24 rounded-2xl bg-[#e7efe9] animate-pulse" />
                  </div>
                )}

                {!reviewsLoading && !reviews.length && (
                  <div className="rounded-2xl border border-dashed border-[#c8ddcf] bg-white p-5 text-sm text-[#5f7f6d]">
                    No reviews yet. Be the first to share your feedback.
                  </div>
                )}

                {!reviewsLoading &&
                  reviews.map((review) => (
                    <article key={review._id} className="rounded-2xl border border-[#dce9e0] bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[#153a2b]">{review.customerId?.name || 'Customer'}</p>
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-[#5f7f6d]">
                            {review.createdAt ? dateFormatter.format(new Date(review.createdAt)) : ''}
                          </p>
                          {(isOwnReview(review) || user?.role === 'admin') && (
                            <button
                              type="button"
                              onClick={() => removeReview(review._id)}
                              disabled={reviewActionLoading === `delete-${review._id}`}
                              className="text-xs font-semibold text-[#b42318] hover:underline disabled:opacity-50"
                            >
                              {reviewActionLoading === `delete-${review._id}` ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                          {isOwnReview(review) && editingReviewId !== review._id && (
                            <button
                              type="button"
                              onClick={() => startReviewEdit(review)}
                              className="text-xs font-semibold text-[#1f7a4d] hover:underline"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                      {editingReviewId === review._id ? (
                        <div className="mt-3 space-y-3">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditForm((prev) => ({ ...prev, rating: star }))}
                                className={`text-xl transition ${editForm.rating >= star ? 'text-[#f4b740]' : 'text-[#d4dfd8]'}`}
                                aria-label={`Set ${star} star`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                          <textarea
                            className="auth-input min-h-[100px]"
                            value={editForm.comment}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, comment: event.target.value }))}
                            maxLength={REVIEW_COMMENT_MAX_LENGTH}
                          />
                          <p className="text-xs text-[#5f7f6d]">{editForm.comment.length}/{REVIEW_COMMENT_MAX_LENGTH} characters</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={saveReviewEdit}
                              disabled={reviewActionLoading === `edit-${review._id}`}
                              className="btn"
                            >
                              {reviewActionLoading === `edit-${review._id}` ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingReviewId('')}
                              className="rounded-md border border-[#c8ddcf] bg-white px-3 py-2 text-sm font-semibold text-[#315744] hover:bg-[#f4faf6]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <StarRating value={review.rating} count={0} showMeta={false} className="mt-2" />
                          <p className="mt-2 text-sm leading-6 text-[#456252]">{review.comment || 'No comment provided.'}</p>
                          {review.farmerReply && (
                            <div className="mt-3 rounded-xl border border-[#dce9e0] bg-[#f6fbf8] p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#1f7a4d]">
                                Reply from {review.farmerReplyBy?.name || 'Farmer'}
                              </p>
                              <p className="mt-1 text-sm text-[#315744]">{review.farmerReply}</p>
                              {review.farmerReplyAt && (
                                <p className="mt-1 text-xs text-[#5f7f6d]">
                                  {dateFormatter.format(new Date(review.farmerReplyAt))}
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </article>
                  ))}
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1f7a4d]">Recommended</p>
              <h2 className="font-display text-2xl font-semibold text-[#153a2b]">You may also like</h2>
            </div>
            <Link to="/products" className="text-sm font-semibold text-[#1f7a4d] hover:text-[#153a2b]">
              View all products
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {relatedProducts.map((product) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="group min-w-[220px] max-w-[220px] rounded-2xl border border-[#dce9e0] bg-white p-2.5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative overflow-hidden rounded-xl bg-[#edf4ee]">
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                    alt={product.productName}
                    className="h-36 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  {product.discountBadge && (
                    <span className="absolute left-2 top-2 rounded-full bg-[#fff5e8] px-2 py-0.5 text-[10px] font-bold text-[#b45309]">
                      {product.discountBadge}
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  <p className="truncate text-sm font-semibold text-[#153a2b]">{product.productName}</p>
                  <StarRating value={product.averageRating} count={product.ratingCount} />
                  <p className="text-base font-bold text-[#1f7a4d]">{formatCurrency(Number(product.price || 0))}</p>
                </div>
              </Link>
            ))}
            {!relatedProducts.length && (
              <div className="rounded-2xl border border-dashed border-[#c8ddcf] bg-white p-5 text-sm text-[#5f7f6d]">
                No related products found right now.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProductDetails;
