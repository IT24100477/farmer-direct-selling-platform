import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { registerUser } from '../redux/slices/authSlice.js';

const Register = () => {
  const dispatch = useDispatch();
  const { token, status, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  });
  const [localError, setLocalError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setLocalError('');
    dispatch(
      registerUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role
      })
    );
  };

  if (token) return <Navigate to="/" replace />;

  return (
    <div className="relative isolate min-h-[calc(100vh-72px)] overflow-hidden bg-[#f4f7f2] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#d8eadf_0,_transparent_40%),radial-gradient(circle_at_bottom_left,_#f2e6cf_0,_transparent_42%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr,1.05fr]">
        <section className="rounded-3xl border border-[#d6e6db] bg-white/95 p-6 shadow-xl shadow-[#183a2b]/10 backdrop-blur sm:p-8 animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1f7a4d]">Get started</p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-[#153a2b]">Create your account</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4f6d5c]">
            Join as a customer, farmer, or delivery partner and start using the platform immediately.
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="name" className="auth-label">Full name</label>
              <p className="auth-helper">Use your real name for easier order and delivery coordination.</p>
              <input
                id="name"
                className="auth-input"
                placeholder="Your full name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="auth-label">Email address</label>
                <input
                  id="email"
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="auth-label">Phone number</label>
                <input
                  id="phone"
                  className="auth-input"
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="auth-label">I am joining as</label>
              <p className="auth-helper">Farmer accounts require admin approval before product selling is enabled.</p>
              <select
                id="role"
                className="auth-input"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
              >
                <option value="customer">Customer</option>
                <option value="farmer">Farmer</option>
                <option value="delivery">Delivery Partner</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="password" className="auth-label">Password</label>
                <input
                  id="password"
                  className="auth-input"
                  type="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="auth-label">Confirm password</label>
                <input
                  id="confirmPassword"
                  className="auth-input"
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-[#1f7a4d] px-4 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#18643f] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {(localError || error) && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{localError || error}</p>
          )}

          <p className="mt-6 text-sm text-[#4f6d5c]">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-[#1f7a4d] hover:text-[#153a2b]">
              Sign in
            </Link>
          </p>
        </section>

        <section className="hidden overflow-hidden rounded-3xl border border-[#d6e6db] bg-white shadow-xl shadow-[#183a2b]/10 lg:block animate-fade-up-delayed">
          <div className="relative h-full min-h-[680px]">
            <img
              src="https://media.istockphoto.com/id/539355554/photo/fresh-vegetables-being-sold-at-farmers-market.webp?a=1&b=1&s=612x612&w=0&k=20&c=ZPWgg96Dvnd3nI_S7Zvg7ZWSb3O0m4trqN77V0Vlsv4="
              alt="Fresh baskets of farm vegetables"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f3325]/90 via-[#0f3325]/40 to-transparent" />
            <div className="absolute bottom-0 p-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6f2e2]">Why join us</p>
              <h3 className="font-display mt-3 text-3xl leading-tight">Built for transparent and direct farm commerce</h3>
              <ul className="mt-4 space-y-2 text-sm text-[#deefe5]">
                <li>Track order and delivery status in real time.</li>
                <li>Access verified farmers and quality produce listings.</li>
                <li>Use secure checkout with promotion-aware pricing.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;
