import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Link } from 'react-router-dom';
import { loginUser } from '../redux/slices/authSlice.js';

const Login = () => {
  const dispatch = useDispatch();
  const { token, status, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });

  const submit = (event) => {
    event.preventDefault();
    dispatch(loginUser(form));
  };

  if (token) return <Navigate to="/" replace />;

  return (
    <div className="relative isolate min-h-[calc(100vh-72px)] overflow-hidden bg-[#f4f7f2] px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#d8eadf_0,_transparent_45%),radial-gradient(circle_at_bottom_right,_#f2e6cf_0,_transparent_40%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="hidden overflow-hidden rounded-3xl border border-[#d6e6db] bg-white shadow-xl shadow-[#183a2b]/10 lg:block animate-fade-up">
          <div className="relative h-full min-h-[620px]">
            <img
              src="https://media.istockphoto.com/id/532270528/photo/organically-grown-produce-without-the-pesticides.webp?a=1&b=1&s=612x612&w=0&k=20&c=65d8zPM2fXzt5lqstp2DEjQqM2b3xdWUvMc96tnRFho="
              alt="Fresh farm produce"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f3325]/90 via-[#0f3325]/45 to-transparent" />
            <div className="absolute bottom-0 p-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d6f2e2]">Welcome back</p>
              <h1 className="font-display mt-3 text-4xl leading-tight">Manage your farm marketplace in one place</h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#deefe5]">
                Track inventory, monitor orders, and manage customer interactions with a clean,
                real-time dashboard experience.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#d6e6db] bg-white/95 p-6 shadow-xl shadow-[#183a2b]/10 backdrop-blur sm:p-8 animate-fade-up-delayed">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1f7a4d]">Sign in</p>
          <h2 className="font-display mt-2 text-3xl font-semibold text-[#153a2b]">Access your account</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#4f6d5c]">
            Enter your credentials to continue buying, selling, and managing deliveries.
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="email" className="auth-label">Email address</label>
              <p className="auth-helper">Use the email address you registered with.</p>
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
              <label htmlFor="password" className="auth-label">Password</label>
              <p className="auth-helper">Minimum 6 characters.</p>
              <input
                id="password"
                className="auth-input"
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                minLength={6}
                required
              />
            </div>

            <button
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-[#1f7a4d] px-4 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#18643f] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <p className="mt-6 text-sm text-[#4f6d5c]">
            New here?{' '}
            <Link to="/register" className="font-semibold text-[#1f7a4d] hover:text-[#153a2b]">
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
