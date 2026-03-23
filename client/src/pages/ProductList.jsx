import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchProducts } from '../redux/slices/productSlice.js';
import { addToCart } from '../redux/slices/cartSlice.js';
import { PRODUCT_CATEGORIES, normalizeProductCategory } from '../constants/productCategories.js';
import StarRating from '../components/StarRating.jsx';
import { formatCurrency } from '../utils/currency.js';

const ProductList = () => {
  const dispatch = useDispatch();
  const { items, status } = useSelector((state) => state.products);
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(normalizeProductCategory(searchParams.get('category')));
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  useEffect(() => {
    const params = { sort };
    if (search.trim()) params.search = search.trim();
    if (category) params.category = category;
    dispatch(fetchProducts(params));
  }, [dispatch, search, category, sort]);

  useEffect(() => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (category) params.category = category;
    if (sort !== 'newest') params.sort = sort;
    setSearchParams(params, { replace: true });
  }, [search, category, sort, setSearchParams]);

  const categorySummary = useMemo(() => {
    return PRODUCT_CATEGORIES.map((name) => ({
      name,
      count: items.filter((item) => normalizeProductCategory(item.category) === name).length
    }));
  }, [items]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
      <div className="rounded-3xl border border-[#d6e6db] bg-gradient-to-r from-[#f8fcf8] via-white to-[#f3f8f4] p-4 md:p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f7a4d]">Marketplace</p>
            <h2 className="font-display text-3xl font-semibold text-[#153a2b]">Browse by category</h2>
            <p className="text-sm text-[#4f6d5c] mt-1">Filter quickly, compare price and rating, then add to cart.</p>
            <Link
              to="/products/insights"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#1f7a4d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Buy Reviews
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
            <input
              className="w-full rounded-xl border border-[#c9ddcf] bg-white/95 px-3 py-2.5 text-sm"
              placeholder="Search product, category, or keyword"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              className="w-full rounded-xl border border-[#c9ddcf] bg-white/95 px-3 py-2.5 text-sm lg:w-52"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {PRODUCT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-xl border border-[#c9ddcf] bg-white/95 px-3 py-2.5 text-sm lg:w-auto"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {categorySummary.map((entry) => (
            <button
              key={entry.name}
              type="button"
              onClick={() => setCategory(entry.name)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                category === entry.name
                  ? 'border-[#1f7a4d] bg-[#1f7a4d] text-white'
                  : 'border-[#c9ddcf] bg-[#f8fbf9] text-[#315744] hover:border-[#9fc5ad]'
              }`}
            >
              {entry.name} ({entry.count})
            </button>
          ))}
          {category && (
            <button
              type="button"
              onClick={() => setCategory('')}
              className="rounded-full border border-[#c9ddcf] bg-white px-3 py-1 text-xs font-semibold text-[#315744]"
            >
              Clear category
            </button>
          )}
        </div>
      </div>

      {status === 'loading' && <p className="text-sm text-[#4f6d5c]">Loading products...</p>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((product) => {
          const isUnavailable = !product.isAvailable || Number(product.quantity) <= 0;
          const unavailableLabel = Number(product.quantity) <= 0 ? 'Out of Stock' : 'Unavailable';
          return (
            <article
              key={product._id}
              className={`group rounded-3xl border border-[#dce9e0] bg-white p-2.5 shadow-[0_10px_24px_-14px_rgba(22,72,51,0.55)] transition duration-300 sm:p-3 ${
                isUnavailable ? 'opacity-90' : 'hover:-translate-y-1 hover:shadow-[0_20px_32px_-16px_rgba(22,72,51,0.65)]'
              }`}
            >
              {isUnavailable ? (
                <div className="block cursor-not-allowed">
                  <div className="relative overflow-hidden rounded-2xl bg-[#edf4ee]">
                    {product.discountBadge && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-[#fff5e8] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#b45309] shadow-sm">
                        {product.discountBadge}
                      </span>
                    )}
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.productName}
                        className="h-28 w-full object-cover grayscale sm:h-36 lg:h-40"
                      />
                    ) : (
                      <div className="flex h-28 items-center justify-center text-xs text-[#5f7f6d] sm:h-36 lg:h-40">
                        Image unavailable
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#b42318]">
                        {unavailableLabel}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    <span className="inline-flex rounded-full bg-[#ebf6ef] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1f7a4d]">
                      {normalizeProductCategory(product.category) || product.category}
                    </span>
                    <h3 className="truncate text-sm font-semibold text-[#153a2b] sm:text-base">{product.productName}</h3>
                    <StarRating value={product.averageRating} count={product.ratingCount} />
                  </div>
                </div>
              ) : (
                <Link to={`/products/${product._id}`} className="block">
                  <div className="relative overflow-hidden rounded-2xl bg-[#edf4ee]">
                    {product.discountBadge && (
                      <span className="absolute left-2 top-2 z-10 rounded-full bg-[#fff5e8] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#b45309] shadow-sm">
                        {product.discountBadge}
                      </span>
                    )}
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.productName}
                        className="h-28 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-36 lg:h-40"
                      />
                    ) : (
                      <div className="flex h-28 items-center justify-center text-xs text-[#5f7f6d] sm:h-36 lg:h-40">
                        Image unavailable
                      </div>
                    )}
                  </div>
                  <div className="mt-2.5 space-y-1.5">
                    <span className="inline-flex rounded-full bg-[#ebf6ef] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1f7a4d]">
                      {normalizeProductCategory(product.category) || product.category}
                    </span>
                    <h3 className="truncate text-sm font-semibold text-[#153a2b] sm:text-base">{product.productName}</h3>
                    <StarRating value={product.averageRating} count={product.ratingCount} />
                  </div>
                </Link>
              )}
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <p className="text-base font-bold text-[#1f7a4d] sm:text-lg">{formatCurrency(product.price || 0)}</p>
                {isUnavailable ? (
                  <span className="rounded-full border border-[#e6d2b5] bg-[#fff6ea] px-2.5 py-1 text-[11px] font-semibold text-[#b54708]">
                    Unavailable
                  </span>
                ) : (
                  <>
                    <Link
                      to={`/products/${product._id}`}
                      className="rounded-full border border-[#cfe2d5] px-2.5 py-1 text-[11px] font-semibold text-[#315744] transition hover:border-[#9dc3ab] hover:text-[#1f7a4d]"
                    >
                      Details
                    </Link>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1f7a4d] text-lg font-semibold text-white shadow-sm transition hover:scale-105 hover:bg-[#18643f]"
                      aria-label={`Add ${product.productName} to cart`}
                      onClick={() => {
                        dispatch(addToCart({ productId: product._id, name: product.productName, price: product.price, quantity: 1 }));
                        toast.success('Added to cart');
                      }}
                    >
                      +
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!items.length && status !== 'loading' && (
        <div className="card text-center text-sm text-[#4f6d5c]">No products match the selected search and category filters.</div>
      )}
    </div>
  );
};

export default ProductList;
