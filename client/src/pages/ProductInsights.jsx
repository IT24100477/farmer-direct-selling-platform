import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import api from '../services/api.js';
import StarRating from '../components/StarRating.jsx';

const PIE_COLORS = ['#1f7a4d', '#3bb87a', '#f59e0b', '#ef8c44', '#ef4444'];

const truncate = (str, n = 22) => (str?.length > n ? `${str.slice(0, n)}…` : str || '');

// ─── Custom Tooltips ────────────────────────────────────────────────────────

const BarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-[#deeadf] bg-white px-3 py-2 shadow-lg text-sm min-w-[160px]">
      <p className="font-semibold text-[#153a2b] mb-1">{d?.name}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-[#315744]">
          {entry.name}:{' '}
          <span className="font-bold text-[#1f7a4d]">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const ScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-[#deeadf] bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-[#153a2b]">{d?.name}</p>
      <p className="text-[#315744]">Reviews: <span className="font-bold text-[#1f7a4d]">{d?.x}</span></p>
      <p className="text-[#315744]">Avg Rating: <span className="font-bold text-[#f59e0b]">{d?.y}</span></p>
    </div>
  );
};

const CategoryTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-[#deeadf] bg-white px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-[#153a2b] mb-1">{d?.category}</p>
      <p className="text-[#315744]">Avg Rating: <span className="font-bold text-[#f59e0b]">{d?.avgRating}</span></p>
      <p className="text-[#315744]">Total Reviews: <span className="font-bold text-[#1f7a4d]">{d?.totalReviews}</span></p>
      <p className="text-[#315744]">Products: <span className="font-bold">{d?.products}</span></p>
    </div>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub }) => (
  <div className="rounded-2xl border border-[#deeadf] bg-white p-4 text-center shadow-sm">
    <p className="text-2xl font-bold text-[#1f7a4d]">{value}</p>
    <p className="text-xs font-semibold text-[#153a2b] mt-0.5">{label}</p>
    {sub && <p className="text-[10px] text-[#94a8a0] mt-0.5">{sub}</p>}
  </div>
);

// ─── Chart Wrapper ────────────────────────────────────────────────────────────

const ChartCard = ({ title, subtitle, children, empty }) => (
  <div className="rounded-2xl border border-[#deeadf] bg-white p-5 shadow-sm">
    <h2 className="text-base font-semibold text-[#153a2b]">{title}</h2>
    <p className="text-xs text-[#5e7a6a] mt-0.5 mb-4">{subtitle}</p>
    {empty ? (
      <div className="flex h-48 items-center justify-center text-sm text-[#94a8a0]">
        Not enough data to display this chart yet.
      </div>
    ) : (
      children
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ProductInsights = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/products', { params: { limit: 500 } });
        setProducts(Array.isArray(data?.items) ? data.items : []);
      } catch {
        setError('Failed to load product data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Derived data ─────────────────────────────────────────────────────────

  const ratedProducts = useMemo(() => products.filter((p) => p.ratingCount > 0), [products]);

  const totalReviews = useMemo(
    () => products.reduce((sum, p) => sum + (p.ratingCount || 0), 0),
    [products]
  );

  const overallAvg = useMemo(() => {
    if (!ratedProducts.length) return '—';
    return (ratedProducts.reduce((s, p) => s + p.averageRating, 0) / ratedProducts.length).toFixed(2);
  }, [ratedProducts]);

  const topReviewed = useMemo(
    () =>
      [...ratedProducts]
        .sort((a, b) => b.ratingCount - a.ratingCount)
        .slice(0, 10)
        .map((p) => ({ name: truncate(p.productName), reviews: p.ratingCount, id: p._id })),
    [ratedProducts]
  );

  const topRated = useMemo(
    () =>
      [...products]
        .filter((p) => p.ratingCount >= 2)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 10)
        .map((p) => ({
          name: truncate(p.productName),
          rating: parseFloat(p.averageRating.toFixed(2)),
          reviews: p.ratingCount,
          id: p._id
        })),
    [products]
  );

  const ratingDistribution = useMemo(() => {
    const buckets = [
      { label: '5 ★  (4.5 – 5)', range: [4.5, 5.1], count: 0 },
      { label: '4 ★  (3.5 – 4.5)', range: [3.5, 4.5], count: 0 },
      { label: '3 ★  (2.5 – 3.5)', range: [2.5, 3.5], count: 0 },
      { label: '2 ★  (1.5 – 2.5)', range: [1.5, 2.5], count: 0 },
      { label: '1 ★  (0 – 1.5)', range: [0, 1.5], count: 0 }
    ];
    ratedProducts.forEach((p) => {
      const b = buckets.find(({ range }) => p.averageRating >= range[0] && p.averageRating < range[1]);
      if (b) b.count++;
    });
    return buckets.filter((b) => b.count > 0);
  }, [ratedProducts]);

  const categoryPerformance = useMemo(() => {
    const map = {};
    ratedProducts.forEach((p) => {
      const cat = p.category || 'Other';
      if (!map[cat]) map[cat] = { ratingSum: 0, productCount: 0, totalReviews: 0 };
      map[cat].ratingSum += p.averageRating;
      map[cat].productCount++;
      map[cat].totalReviews += p.ratingCount;
    });
    return Object.entries(map)
      .map(([cat, val]) => ({
        category: truncate(cat, 14),
        avgRating: parseFloat((val.ratingSum / val.productCount).toFixed(2)),
        totalReviews: val.totalReviews,
        products: val.productCount
      }))
      .sort((a, b) => b.avgRating - a.avgRating);
  }, [ratedProducts]);

  const scatterData = useMemo(
    () =>
      ratedProducts.map((p) => ({
        x: p.ratingCount,
        y: parseFloat(p.averageRating.toFixed(2)),
        z: 1,
        name: p.productName
      })),
    [ratedProducts]
  );

  const tableData = useMemo(
    () => [...ratedProducts].sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 15),
    [ratedProducts]
  );

  // ── Loading / Error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-[#5e7a6a]">
        <svg className="h-8 w-8 animate-spin text-[#1f7a4d]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-sm">Loading product insights…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-red-500">{error}</p>
        <Link to="/products" className="inline-block text-sm font-semibold text-[#1f7a4d] hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f7a4d]">Analytics</p>
          <h1 className="font-display text-3xl font-semibold text-[#153a2b]">Product Reviews & Ratings</h1>
          <p className="mt-1 text-sm text-[#5e7a6a]">Visual insights into what customers are buying and rating.</p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[#c7dccd] bg-white px-4 py-2 text-sm font-semibold text-[#315744] transition hover:bg-[#f4faf6]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </Link>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Products" value={products.length} />
        <StatCard label="Reviewed Products" value={ratedProducts.length} sub={`${products.length ? Math.round((ratedProducts.length / products.length) * 100) : 0}% of catalogue`} />
        <StatCard label="Total Reviews" value={totalReviews.toLocaleString()} />
        <StatCard label="Overall Avg Rating" value={overallAvg !== '—' ? `${overallAvg} / 5` : '—'} />
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Chart 1 – Most Reviewed */}
        <ChartCard
          title="Most Reviewed Products"
          subtitle="Top 10 products by number of customer reviews"
          empty={topReviewed.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topReviewed} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef4ef" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#5e7a6a' }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#315744' }} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="reviews" name="Reviews" fill="#1f7a4d" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2 – Highest Rated */}
        <ChartCard
          title="Highest Rated Products"
          subtitle="Top 10 by average rating (minimum 2 reviews required)"
          empty={topRated.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topRated} layout="vertical" margin={{ left: 4, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef4ef" />
              <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#5e7a6a' }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#315744' }} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="rating" name="Avg Rating" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 3 – Rating Distribution */}
        <ChartCard
          title="Rating Distribution"
          subtitle="How reviewed products are spread across star brackets"
          empty={ratingDistribution.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ratingDistribution}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="46%"
                outerRadius={100}
                innerRadius={50}
                paddingAngle={2}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {ratingDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, _name, props) => [`${value} products`, props.payload.label]} />
              <Legend
                formatter={(value) => <span className="text-xs text-[#315744]">{value}</span>}
                wrapperStyle={{ paddingTop: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 4 – Category Performance */}
        <ChartCard
          title="Category Performance"
          subtitle="Average rating and total review volume per product category"
          empty={categoryPerformance.length === 0}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryPerformance} margin={{ bottom: 36, left: 4, right: 4, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef4ef" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 10, fill: '#315744' }}
                angle={-32}
                textAnchor="end"
                interval={0}
              />
              <YAxis yAxisId="rating" domain={[0, 5]} tick={{ fontSize: 10, fill: '#5e7a6a' }} />
              <YAxis yAxisId="reviews" orientation="right" tick={{ fontSize: 10, fill: '#5e7a6a' }} />
              <Tooltip content={<CategoryTooltip />} />
              <Legend
                verticalAlign="top"
                formatter={(value) => <span className="text-xs text-[#315744]">{value}</span>}
              />
              <Bar yAxisId="rating" dataKey="avgRating" name="Avg Rating" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="reviews" dataKey="totalReviews" name="Total Reviews" fill="#1f7a4d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Chart 5 – Scatter (full width) ── */}
      <ChartCard
        title="Review Volume vs. Average Rating"
        subtitle="Each dot is a product — the ideal products sit in the top-right (many reviews, high rating)"
        empty={scatterData.length === 0}
      >
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 24, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef4ef" />
            <XAxis
              type="number"
              dataKey="x"
              name="Reviews"
              tick={{ fontSize: 11, fill: '#5e7a6a' }}
              label={{ value: 'Number of Reviews', position: 'insideBottom', offset: -12, style: { fontSize: 11, fill: '#5e7a6a' } }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Rating"
              domain={[0, 5]}
              tick={{ fontSize: 11, fill: '#5e7a6a' }}
              label={{ value: 'Avg Rating', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: '#5e7a6a' } }}
            />
            <ZAxis range={[45, 45]} />
            <Tooltip content={<ScatterTooltip />} />
            <Scatter data={scatterData} fill="#1f7a4d" fillOpacity={0.65} />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── Top Products Table ── */}
      <div className="rounded-2xl border border-[#deeadf] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[#153a2b]">Top Reviewed Products — Full Table</h2>
        <p className="text-xs text-[#5e7a6a] mt-0.5 mb-4">Sorted by number of customer reviews</p>
        <div className="overflow-x-auto rounded-xl border border-[#deeadf]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f5faf6] text-[#315744]">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold">#</th>
                <th className="px-3 py-2.5 text-left font-semibold">Product</th>
                <th className="px-3 py-2.5 text-left font-semibold">Category</th>
                <th className="px-3 py-2.5 text-center font-semibold">Rating</th>
                <th className="px-3 py-2.5 text-right font-semibold">Reviews</th>
                <th className="px-3 py-2.5 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((p, i) => (
                <tr key={p._id} className="border-t border-[#eef4ef] transition hover:bg-[#f9fbf9]">
                  <td className="px-3 py-2 font-mono text-xs text-[#94a8a0]">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-[#153a2b]">{p.productName}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-[#ecf6ef] px-2 py-0.5 text-[10px] font-semibold text-[#1f7a4d]">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <StarRating value={p.averageRating} count={0} showMeta={false} size="xs" />
                    <span className="ml-1 text-xs font-semibold text-[#153a2b]">{p.averageRating.toFixed(1)}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-[#1f7a4d]">{p.ratingCount}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      to={`/products/${p._id}`}
                      className="text-xs font-semibold text-[#1f7a4d] hover:underline"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {!tableData.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-sm text-[#94a8a0]">
                    No reviewed products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductInsights;
