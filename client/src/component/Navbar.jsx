import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice.js';
import NotificationBell from './NotificationBell.jsx';

const ROLE_META = {
  admin: { label: 'Admin', panelLabel: 'Admin Panel', panelPath: '/admin' },
  farmer: { label: 'Farmer', panelLabel: 'Farmer Panel', panelPath: '/farmer' },
  delivery: { label: 'Delivery', panelLabel: 'Delivery Panel', panelPath: '/delivery' },
  customer: { label: 'Customer', panelLabel: 'Dashboard', panelPath: '/customer' }
};

const navLinkClass =
  'rounded-full px-3 py-2 text-sm font-semibold text-[#2e5342] transition hover:-translate-y-0.5 hover:bg-white hover:text-[#1f7a4d]';

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const roleMeta = ROLE_META[user?.role] || ROLE_META.customer;
  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const initials = useMemo(
    () =>
      (user?.name || 'User')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join(''),
    [user?.name]
  );

  useEffect(() => {
    const onClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };
    const onEsc = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const closeMobileMenu = () => setMobileOpen(false);

  const handleLogout = () => {
    dispatch(logout());
    setAccountOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-[linear-gradient(120deg,rgba(244,251,247,0.82),rgba(252,248,238,0.82))] shadow-[0_12px_26px_-20px_rgba(16,58,40,0.6)] backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            onClick={closeMobileMenu}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1f7a4d] text-sm font-bold text-white shadow-sm">
              FF
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-[#153a2b]">FarmFresh</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1 rounded-full border border-[#d2e4d8] bg-white/60 p-1">
            <Link to="/products" className={navLinkClass}>
              Products
            </Link>
            <Link to="/promotions" className={navLinkClass}>
              Promotions
            </Link>
            {user && (
              <Link to="/orders" className={navLinkClass}>
                Orders
              </Link>
            )}
            {user && (
              <Link to={roleMeta.panelPath} className={navLinkClass}>
                {roleMeta.panelLabel}
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/cart"
              className="group relative inline-flex items-center gap-2 rounded-full border border-[#cfe2d5] bg-white px-3 py-2 text-sm font-semibold text-[#315744] transition hover:-translate-y-0.5 hover:border-[#9fc5ad] hover:text-[#1f7a4d]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="20" r="1.3" />
                <circle cx="17" cy="20" r="1.3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L21 7H7" />
              </svg>
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full border border-white bg-[#dc2626] px-1.5 text-center text-[10px] font-bold leading-[18px] text-white shadow-sm">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {user && <NotificationBell showLabel={false} className="px-2.5" />}

            {!user ? (
              <Link
                to="/login"
                className="rounded-full bg-[#1f7a4d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#18643f]"
              >
                Login
              </Link>
            ) : (
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setAccountOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#cfe2d5] bg-white px-2 py-1.5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#9fc5ad]"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f3ec] text-xs font-bold text-[#1f7a4d]">
                    {initials || 'U'}
                  </span>
                  <span className="flex flex-col items-start leading-tight">
                    <span className="max-w-[120px] truncate text-sm font-semibold text-[#153a2b]">{user.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-[#6f8679]">{roleMeta.label}</span>
                  </span>
                  <svg viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 text-[#5f7f6d] transition ${accountOpen ? 'rotate-180' : ''}`}>
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.512a.75.75 0 0 1-1.08 0l-4.25-4.512a.75.75 0 0 1 .02-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                <div
                  className={`absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-[#d6e6db] bg-white p-2 shadow-xl transition ${
                    accountOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
                  }`}
                >
                  <Link
                    to="/profile"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-[#315744] transition hover:bg-[#f1f7f3] hover:text-[#1f7a4d]"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to={roleMeta.panelPath}
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-[#315744] transition hover:bg-[#f1f7f3] hover:text-[#1f7a4d]"
                  >
                    {roleMeta.panelLabel}
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-[#315744] transition hover:bg-[#f1f7f3] hover:text-[#1f7a4d]"
                  >
                    Orders
                  </Link>
                  <div className="my-1 border-t border-[#e6eee9]" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex w-full items-center gap-2 rounded-xl border border-[#f3c7c2] bg-[#fff2f1] px-3 py-2 text-left text-sm font-semibold text-[#b42318] transition hover:bg-[#ffe7e5]"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5m0 0-5-5m5 5H9m4 5v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/cart"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#cfe2d5] bg-white text-[#315744]"
              onClick={closeMobileMenu}
              aria-label="Cart"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="20" r="1.3" />
                <circle cx="17" cy="20" r="1.3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.6L21 7H7" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[17px] rounded-full bg-[#dc2626] px-1 text-center text-[10px] font-bold leading-[17px] text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#cfe2d5] bg-white text-[#315744] transition hover:border-[#9fc5ad] hover:text-[#1f7a4d]"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M3 5h14v2H3V5Zm0 4h14v2H3V9Zm0 4h14v2H3v-2Z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-[max-height,opacity,margin] duration-300 md:hidden ${
            mobileOpen ? 'mt-3 max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="rounded-2xl border border-[#d7e7db] bg-white/90 p-3 shadow-sm">
            {user && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#e4eee7] bg-[#f8fbf9] p-2.5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f3ec] text-sm font-bold text-[#1f7a4d]">
                  {initials || 'U'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#153a2b]">{user.name}</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#6f8679]">{roleMeta.label}</p>
                </div>
              </div>
            )}

            <div className="grid gap-1.5">
              <Link to="/products" onClick={closeMobileMenu} className={navLinkClass}>
                Products
              </Link>
              <Link to="/promotions" onClick={closeMobileMenu} className={navLinkClass}>
                Promotions
              </Link>
              {user && (
                <>
                  <Link to="/orders" onClick={closeMobileMenu} className={navLinkClass}>
                    Orders
                  </Link>
                  <Link to={roleMeta.panelPath} onClick={closeMobileMenu} className={navLinkClass}>
                    {roleMeta.panelLabel}
                  </Link>
                  <Link to="/profile" onClick={closeMobileMenu} className={navLinkClass}>
                    Profile
                  </Link>
                  <NotificationBell showLabel className="justify-center" />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 inline-flex items-center justify-center gap-2 rounded-full border border-[#f3c7c2] bg-[#fff2f1] px-4 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#ffe7e5]"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5m0 0-5-5m5 5H9m4 5v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" />
                    </svg>
                    Logout
                  </button>
                </>
              )}
              {!user && (
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="mt-1 rounded-full bg-[#1f7a4d] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#18643f]"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
