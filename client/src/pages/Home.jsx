import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchPromotions } from '../redux/slices/promotionSlice.js';
import { fetchProducts } from '../redux/slices/productSlice.js';
import PromotionShowcaseCard from '../components/PromotionShowcaseCard.jsx';
import StarRating from '../components/StarRating.jsx';
import { formatCurrency } from '../utils/currency.js';

const categoryCards = [
  {
    title: 'Fresh Vegetables',
    blurb: 'Harvested daily from nearby farms with quality checks in place.',
    image:
      'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8VmVnZXRhYmxlc3xlbnwwfHwwfHx8MA%3D%3D',
    query: 'Fresh Vegetables'
  },
  {
    title: 'Seasonal Fruits',
    blurb: 'Tree-ripened and packed for freshness with minimal handling.',
    image:
      'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80',
    query: 'Seasonal Fruits'
  },
  {
    title: 'Dairy and Eggs',
    blurb: 'Farm-direct dairy products from trusted local producers.',
    image:
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=1200&q=80',
    query: 'Dairy & Eggs'
  },
  {
    title: 'Organic Staples',
    blurb: 'Clean pantry essentials sourced from certified growers.',
    image:
      'https://media.istockphoto.com/id/671580278/photo/varieties-of-grains-seeds-and-raw-quino.webp?a=1&b=1&s=612x612&w=0&k=20&c=eINzVszLtWMAApRJW3QPTzL1GvnAXAX4kSfVTM4ueIA=',
    query: 'Organic Staples'
  },
  {
    title: 'Spices',
    blurb: 'Aromatic ground and whole spices for daily cooking.',
    image:
      'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=1200&q=80',
    query: 'Spices'
  },
  {
    title: 'Processed Foods',
    blurb: 'Value-added farm products and pantry-ready essentials.',
    image:
      'https://images.unsplash.com/photo-1760000899287-dddf6e7d9ec9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHByb2Nlc3NlZCUyMGZvb2RzfGVufDB8fDB8fHww',
    query: 'Processed Foods'
  }
];

const testimonials = [
  {
    name: 'Ava Reynolds',
    role: 'Home Chef',
    quote:
      'Produce quality is consistently top-tier, and delivery updates are always accurate.',
    image:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=480&q=80'
  },
  {
    name: 'Noah Patel',
    role: 'Restaurant Owner',
    quote:
      'Bulk ordering is straightforward, and the direct farmer network keeps our kitchen stocked.',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=480&q=80'
  },
  {
    name: 'Leah Brooks',
    role: 'Fitness Coach',
    quote:
      'I can filter by freshness and source, then reorder in minutes. It saves me serious time.',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=480&q=80'
  }
];

const Home = () => {
  const dispatch = useDispatch();
  const { items: promos } = useSelector((state) => state.promotions);
  const { items: products } = useSelector((state) => state.products);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    dispatch(fetchPromotions());
    dispatch(fetchProducts({ page: 1, limit: 8, sort: 'newest' }));
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const featuredProducts = useMemo(() => products.slice(0, 8), [products]);
  const carouselProducts = useMemo(
    () => (featuredProducts.length ? [...featuredProducts, ...featuredProducts] : []),
    [featuredProducts]
  );
  const carouselDuration = useMemo(
    () => Math.max(24, featuredProducts.length * 5),
    [featuredProducts.length]
  );

  // The API already returns only approved, active, in-range promotions.
  // Just sort by soonest-ending so the most urgent deals appear first.
  const activePromotions = useMemo(
    () => [...promos].sort((a, b) => new Date(a.endDate || 0) - new Date(b.endDate || 0)),
    [promos]
  );

  return (
    <div className="relative isolate overflow-hidden bg-[#f4f7f2]">
      <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-[#d7eadc] blur-3xl" />
      <div className="pointer-events-none absolute top-80 -right-20 h-72 w-72 rounded-full bg-[#f2e6cf] blur-3xl" />

      <main className="relative mx-auto max-w-7xl space-y-14 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <section className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-6 animate-fade-up">
            <p className="inline-flex items-center rounded-full bg-[#e3eee7] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0d5f3a]">
              Farm-to-customer marketplace
            </p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-[#153a2b] sm:text-5xl lg:text-6xl">
              Fresh from trusted farms to your table.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-[#3a5a4a] sm:text-lg">
              Discover seasonal produce, transparent pricing, and real-time order tracking in one
              premium buying experience.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-lg bg-[#1f7a4d] px-6 py-3 font-semibold text-white shadow-md shadow-[#1f7a4d]/30 transition hover:-translate-y-0.5 hover:bg-[#18643f]"
              >
                Explore Products
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg border border-[#c8ddcf] bg-white/90 px-6 py-3 font-semibold text-[#1f7a4d] transition hover:-translate-y-0.5 hover:border-[#9fc5ad]"
              >
                Become a Seller
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 sm:gap-4">
              <div className="rounded-xl border border-[#dce9e0] bg-white/80 p-3 text-center">
                <p className="text-2xl font-bold text-[#153a2b]">250+</p>
                <p className="text-xs text-[#4f6d5c]">Verified farmers</p>
              </div>
              <div className="rounded-xl border border-[#dce9e0] bg-white/80 p-3 text-center">
                <p className="text-2xl font-bold text-[#153a2b]">24h</p>
                <p className="text-xs text-[#4f6d5c]">Fresh delivery window</p>
              </div>
              <div className="rounded-xl border border-[#dce9e0] bg-white/80 p-3 text-center">
                <p className="text-2xl font-bold text-[#153a2b]">98%</p>
                <p className="text-xs text-[#4f6d5c]">Repeat purchase rate</p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-3xl border border-[#d5e6da] bg-white p-3 shadow-xl shadow-[#183a2b]/10 animate-fade-up-delayed">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80"
              alt="Farmer arranging fresh vegetables"
              className="h-72 w-full rounded-2xl object-cover transition duration-700 group-hover:scale-105 sm:h-[420px]"
            />
            <div className="absolute inset-x-7 bottom-7 rounded-2xl bg-white/90 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1f7a4d]">Live today</p>
              <h3 className="mt-1 text-lg font-semibold text-[#153a2b]">Seasonal harvest picks are now available</h3>
              <Link to="/products" className="mt-2 inline-block text-sm font-semibold text-[#1f7a4d]">
                Shop the collection
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1f7a4d]">Categories</p>
              <h2 className="font-display text-3xl font-semibold text-[#153a2b]">Shop by what you need most</h2>
            </div>
            <Link to="/products" className="text-sm font-semibold text-[#1f7a4d] hover:text-[#153a2b]">
              View all categories
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categoryCards.map((category, index) => (
              <Link
                key={category.title}
                to={`/products?category=${encodeURIComponent(category.query)}`}
                className="group overflow-hidden rounded-2xl border border-[#dae7de] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="text-lg font-semibold text-[#153a2b]">{category.title}</h3>
                  <p className="text-sm leading-relaxed text-[#4f6d5c]">{category.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1f7a4d]">Featured products</p>
              <h2 className="font-display text-3xl font-semibold text-[#153a2b]">Fresh picks from verified farmers</h2>
            </div>
            <Link to="/products" className="text-sm font-semibold text-[#1f7a4d] hover:text-[#153a2b]">
              Browse full marketplace
            </Link>
          </div>
          {featuredProducts.length ? (
            <div className="home-product-carousel relative overflow-hidden rounded-3xl border border-[#d8e7dd] bg-white/70 p-4 shadow-sm sm:p-5">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#f4f7f2] to-transparent sm:w-16" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#f4f7f2] to-transparent sm:w-16" />

              <div
                className="home-product-track flex w-max flex-nowrap gap-4"
                style={{ animationDuration: `${carouselDuration}s` }}
              >
                {carouselProducts.map((product, index) => (
                  (() => {
                    const isUnavailable = !product.isAvailable || Number(product.quantity) <= 0;
                    const unavailableLabel = Number(product.quantity) <= 0 ? 'Out of Stock' : 'Unavailable';
                    const containerClasses = `group w-[190px] flex-shrink-0 rounded-3xl border border-[#dce9e0] bg-white p-2.5 shadow-[0_10px_22px_-14px_rgba(20,64,45,0.55)] transition duration-300 sm:w-[220px] sm:p-3 lg:w-[250px] ${
                      isUnavailable
                        ? 'cursor-not-allowed opacity-90'
                        : 'hover:-translate-y-1 hover:shadow-[0_20px_34px_-20px_rgba(20,64,45,0.65)]'
                    }`;
                    const cardContent = (
                      <>
                        <div className="relative h-32 overflow-hidden rounded-2xl bg-[#edf4ee] sm:h-40 lg:h-44">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.productName}
                              className={`h-full w-full object-cover ${isUnavailable ? 'grayscale' : 'transition duration-500 group-hover:scale-105'}`}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-[#5f7f6d]">
                              Image unavailable
                            </div>
                          )}
                          {isUnavailable && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#b42318]">
                                {unavailableLabel}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2.5 space-y-1.5">
                          <span className="inline-flex rounded-full bg-[#ecf6ef] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#1f7a4d]">
                            {product.category || 'Farm Fresh'}
                          </span>
                          <h3 className="truncate text-sm font-semibold text-[#153a2b] sm:text-base">{product.productName}</h3>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-base font-bold text-[#1f7a4d] sm:text-lg">{formatCurrency(product.price || 0)}</p>
                            <StarRating
                              value={product.averageRating}
                              count={product.ratingCount}
                              className="rounded-full bg-[#f2f7f3] px-2 py-1"
                            />
                          </div>
                        </div>
                      </>
                    );

                    if (isUnavailable) {
                      return (
                        <div key={`${product._id}-${index}`} className={containerClasses}>
                          {cardContent}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={`${product._id}-${index}`}
                        to={`/products/${product._id}`}
                        className={containerClasses}
                      >
                        {cardContent}
                      </Link>
                    );
                  })()
                ))}
              </div>
              <p className="mt-4 text-center text-xs font-medium tracking-wide text-[#4f6d5c]">
                Hover to pause carousel
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#c8ddcf] bg-white/70 p-6 text-center text-[#4f6d5c]">
              Products are loading or not yet available.
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1f7a4d]">Latest Offers</p>
              <h2 className="font-display text-3xl font-semibold text-[#153a2b]">Exclusive Deals</h2>
            </div>
            <Link to="/promotions" className="text-sm font-semibold text-[#1f7a4d] hover:text-[#153a2b]">
              View all promotions
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[#d7e7db] bg-[linear-gradient(120deg,rgba(255,255,255,0.86),rgba(243,249,245,0.8))] p-4 shadow-[0_14px_28px_-18px_rgba(20,72,50,0.6)] backdrop-blur-md sm:p-5">
            <div className="pointer-events-none absolute -right-24 -top-28 h-52 w-52 rounded-full bg-[#d8efe1]/60 blur-3xl" />
            <div className="pointer-events-none absolute -left-24 bottom-0 h-40 w-40 rounded-full bg-[#f7ecda]/60 blur-3xl" />

            {activePromotions.length ? (
              <>
                <div className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-1">
                  {activePromotions.map((promo) => (
                    <div
                      key={promo._id}
                      className="min-w-[292px] max-w-[320px] flex-1 snap-start sm:min-w-[340px] sm:max-w-[360px]"
                    >
                      <PromotionShowcaseCard promo={promo} nowMs={nowMs} />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-center text-[11px] font-medium tracking-wide text-[#4f6d5c]">
                  Swipe or scroll to browse all available offers
                </p>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#c8ddcf] bg-white/70 p-6 text-sm text-[#4f6d5c]">
                No active promotions right now. Check back soon for new exclusive deals.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1f7a4d]">Testimonials</p>
            <h2 className="font-display text-3xl font-semibold text-[#153a2b]">Trusted by households and businesses</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial.name}
                className="rounded-2xl border border-[#dae7de] bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center gap-3">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-semibold text-[#153a2b]">{testimonial.name}</h3>
                    <p className="text-sm text-[#4f6d5c]">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-[#3e5d4d]">"{testimonial.quote}"</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#d7e7db] bg-gradient-to-r from-[#f1f7f2] via-[#fcf8ef] to-[#f7fbf8] p-8 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1f7a4d]">Ready to start?</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-[#153a2b] sm:text-4xl">
            Join the direct farm marketplace today
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#4f6d5c] sm:text-base">
            Buy fresher products, support local growers, and track every order from checkout to
            doorstep delivery.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-lg bg-[#1f7a4d] px-6 py-3 font-semibold text-white shadow-md shadow-[#1f7a4d]/25 transition hover:-translate-y-0.5 hover:bg-[#18643f]"
            >
              Create Account
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-lg border border-[#bfd6c7] bg-white px-6 py-3 font-semibold text-[#1f7a4d] transition hover:-translate-y-0.5 hover:border-[#9fc5ad]"
            >
              Start Shopping
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
