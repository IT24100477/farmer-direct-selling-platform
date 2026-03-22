import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import api from '../services/api.js';
import StarRating from '../components/StarRating.jsx';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ReviewManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === 'admin';
  const isFarmer = user?.role === 'farmer';

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [savingReplyId, setSavingReplyId] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reviews/manage', {
        params: {
          search: search.trim() || undefined,
          rating: ratingFilter || undefined
        }
      });
      const rows = Array.isArray(data) ? data : [];
      setReviews(rows);
      setReplyDrafts((prev) => {
        const next = { ...prev };
        rows.forEach((review) => {
          if (next[review._id] === undefined) next[review._id] = review.farmerReply || '';
        });
        return next;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load reviews');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => reviews, [reviews]);

  const saveReply = async (reviewId) => {
    const reply = String(replyDrafts[reviewId] || '').trim();
    if (!reply) {
      toast.error('Reply cannot be empty');
      return;
    }
    setSavingReplyId(reviewId);
    try {
      await api.put(`/reviews/${reviewId}/reply`, { reply });
      toast.success('Reply saved');
      await loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save reply');
    } finally {
      setSavingReplyId('');
    }
  };

  const deleteReview = async (reviewId) => {
    if (!isAdmin) return;
    setDeletingId(reviewId);
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success('Review removed');
      await loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete review');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-[#d8e7dd] bg-gradient-to-r from-[#f8fcf8] via-white to-[#f3f8f4] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#1f7a4d]">
          {isAdmin ? 'Review moderation' : 'Review management'}
        </p>
        <h2 className="mt-1 font-display text-3xl font-semibold text-[#153a2b]">
          {isAdmin ? 'All Product Reviews' : 'Customer Reviews on Your Products'}
        </h2>
        <p className="mt-1 text-sm text-[#4f6d5c]">
          {isAdmin
            ? 'Moderate customer feedback across all products. Reply or remove inappropriate reviews.'
            : 'Monitor feedback, engage with customers, and improve product trust by replying to reviews.'}
        </p>
      </section>

      <section className="rounded-3xl border border-[#d8e7dd] bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="auth-input"
            placeholder="Search by product, customer, or review text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="auth-input"
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value)}
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>{rating} Stars</option>
            ))}
          </select>
          <button
            type="button"
            onClick={loadReviews}
            className="rounded-xl border border-[#c8ddcf] bg-white px-4 py-2.5 text-sm font-semibold text-[#315744] hover:border-[#9fc5ad]"
          >
            Apply Filters
          </button>
        </div>
      </section>

      {loading && <p className="text-sm text-[#5f7f6d]">Loading reviews...</p>}

      <section className="space-y-4">
        {filteredReviews.map((review) => (
          <article key={review._id} className="rounded-3xl border border-[#d8e7dd] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1f7a4d]">
                  {review.productId?.productName || 'Product'}
                </p>
                <p className="text-sm text-[#315744]">
                  Customer: <span className="font-semibold text-[#153a2b]">{review.customerId?.name || 'Customer'}</span>
                </p>
                <p className="text-xs text-[#5f7f6d]">Submitted: {formatDate(review.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StarRating value={review.rating} count={0} showMeta={false} size="md" />
                <span className="text-sm font-semibold text-[#153a2b]">{Number(review.rating || 0).toFixed(1)}</span>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-[#e4eee7] bg-[#fbfdfb] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#5f7f6d]">Customer Review</p>
              <p className="mt-1 text-sm text-[#315744]">{review.comment || 'No comment provided'}</p>
            </div>

            <div className="mt-3 rounded-2xl border border-[#dce9e0] bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#1f7a4d]">Farmer Reply</p>
              <textarea
                className="auth-input mt-2 min-h-[95px]"
                placeholder="Write your response to the customer..."
                value={replyDrafts[review._id] || ''}
                onChange={(event) =>
                  setReplyDrafts((prev) => ({ ...prev, [review._id]: event.target.value }))
                }
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => saveReply(review._id)}
                  disabled={savingReplyId === review._id}
                  className="rounded-full bg-[#1f7a4d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#18643f] disabled:opacity-60"
                >
                  {savingReplyId === review._id ? 'Saving...' : review.farmerReply ? 'Update Reply' : 'Post Reply'}
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => deleteReview(review._id)}
                    disabled={deletingId === review._id}
                    className="rounded-full border border-[#f0c7c1] bg-[#fff1f0] px-4 py-2 text-sm font-semibold text-[#b42318] hover:bg-[#ffe7e5] disabled:opacity-60"
                  >
                    {deletingId === review._id ? 'Deleting...' : 'Delete Review'}
                  </button>
                )}
              </div>
              {review.farmerReply && (
                <p className="mt-2 text-xs text-[#5f7f6d]">
                  Last reply: {formatDate(review.farmerReplyAt)} by {review.farmerReplyBy?.name || 'Farmer'}
                </p>
              )}
            </div>
          </article>
        ))}

        {!loading && !filteredReviews.length && (
          <div className="rounded-3xl border border-dashed border-[#c8ddcf] bg-white/80 p-6 text-center text-sm text-[#5f7f6d]">
            No reviews found for the selected filters.
          </div>
        )}
      </section>
    </div>
  );
};

export default ReviewManagement;
