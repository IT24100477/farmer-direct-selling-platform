import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const navByRole = {
  admin: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Users', to: '/admin/users' },
    { label: 'Products', to: '/admin/products' },
    { label: 'Orders', to: '/admin/orders' },
    { label: 'Reviews', to: '/admin/reviews' },
    { label: 'Promotions', to: '/admin/promotions' },
    { label: 'Profile', to: '/profile' },
    { label: 'Notifications', to: '/notifications' }
  ],
  farmer: [
    { label: 'Dashboard', to: '/farmer' },
    { label: 'My Products', to: '/farmer/products' },
    { label: 'Orders', to: '/farmer/orders' },
    { label: 'Reviews', to: '/farmer/reviews' },
    { label: 'Promotions', to: '/farmer/promotions' },
    { label: 'Profile', to: '/profile' },
    { label: 'Notifications', to: '/notifications' }
  ],
  delivery: [
    { label: 'Delivery Dashboard', to: '/delivery' },
    { label: 'Orders to Deliver', to: '/delivery/orders-to-deliver' },
    { label: 'Profile', to: '/profile' },
    { label: 'Notifications', to: '/notifications' }
  ],
  customer: [
    { label: 'Dashboard', to: '/customer' },
    { label: 'Products', to: '/products' },
    { label: 'Cart', to: '/cart' },
    { label: 'Orders', to: '/orders' },
    { label: 'Profile', to: '/profile' }
  ]
};

const roleTitle = {
  admin: 'Admin Panel',
  farmer: 'Farmer Panel',
  delivery: 'Delivery Panel',
  customer: 'Customer Menu'
};

const linkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-[#1f7a4d] text-white'
      : 'text-[#315744] hover:bg-[#edf4ee] hover:text-[#1f7a4d]'
  }`;

const RoleSidebarLayout = ({ role }) => {
  const { user } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const activeRole = role || user?.role;
  const navItems = useMemo(() => navByRole[activeRole] || [], [activeRole]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="md:hidden mb-4">
        <button
          type="button"
          className="w-full rounded-lg border border-[#c7dccd] bg-white px-3 py-2 text-left text-sm font-semibold text-[#1f7a4d]"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {roleTitle[activeRole] || 'Menu'}
        </button>
        {mobileOpen && (
          <div className="mt-2 rounded-xl border border-[#d6e6db] bg-white p-2 shadow-sm">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === `/${activeRole}`} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-[240px,1fr] gap-6">
        <aside className="hidden md:block">
          <div className="sticky top-24 rounded-2xl border border-[#d6e6db] bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f7a4d]">
              {roleTitle[activeRole] || 'Menu'}
            </p>
            <nav className="mt-3 space-y-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === `/${activeRole}`} className={linkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
};

export default RoleSidebarLayout;
