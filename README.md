# Farmer to Customer Direct Selling Platform (MERN)

Full-stack demo implementing farmer-to-customer direct sales with role-based access, Stripe test payments, Cloudinary uploads, and real-time notifications via Socket.io.

## Tech
- MongoDB, Mongoose
- Express.js, Node.js
- JWT auth + refresh, RBAC middleware
- Stripe test integration
- Cloudinary uploads (multer-storage-cloudinary)
- Nodemailer for email (hook ready)
- Socket.io notifications
- React + Vite + Redux Toolkit + TailwindCSS

## Quick Start
1. **Clone deps**
   ```bash
   cd "Famer Customer Platform"
   npm install --prefix server
   npm install --prefix client
   ```
2. **Env files**
   - Copy `server/.env.example` -> `server/.env` and fill:
     - `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
     - `CLIENT_URL=http://localhost:5173`
     - `STRIPE_SECRET` (test key), Cloudinary + SMTP if used.
   - Copy `client/.env.example` -> `client/.env` and adjust `VITE_API_URL`.
3. **Seed sample data (optional)**
   ```bash
   npm run seed --prefix server
   ```
   Creates admin/farmer/customer/delivery users (password `password123`), sample products, promotions, order, review, notifications.

4. **Run dev** (two terminals)
   ```bash
   npm run dev --prefix server   # http://localhost:5000
   npm run dev --prefix client   # http://localhost:5173
   ```
5. **Default flow**
   - Register as Customer/Farmer/Delivery.
   - Admin marks farmers approved via `/api/users/approve/:id` (Admin token required).
   - Farmers add products, customers add to cart & checkout (COD or Stripe test).
   - Delivery partners get assigned automatically; status updates push notifications.

## API Overview (short)
- `POST /api/auth/register` {name,email,password,role}
- `POST /api/auth/login`
- `POST /api/auth/refresh` refresh token cookie -> new access token
- `GET /api/products` list with `page,limit,search,category,sort,minPrice,maxPrice`
- `POST /api/orders` customer checkout, returns Stripe clientSecret when ONLINE
- `GET /api/orders/me` customer orders; `/farmer`, `/delivery` role-specific
- `POST /api/reviews` only after delivered order
- `GET /api/promotions` auto-disables expired promos

## Frontend Pages
Home, Login/Register, Products list & details, Cart, Checkout, Orders, Promotions, Profile, Dashboards for Admin/Farmer/Delivery/Customer. Tailwind utility styles + simple components; Redux slices wired to backend.

## Deployment notes
- Backend ready for Render/Railway; set env vars.
- Frontend Vercel: set `VITE_API_URL` to deployed API base.
- MongoDB Atlas connection via `MONGO_URI`.

## Testing
- Hit `GET /` on server for health.
- Create user roles and verify RBAC by accessing protected routes.
- Stripe: use test card `4242 4242 4242 4242` when prompted.

## TODO / Extensions
- Add email triggers (order confirmation, farmer approval) via `utils/sendEmail`.
- Add file upload route using `upload` middleware and connect UI previews.
- Harden validation (express-validator) and input sanitization.
- Add charts (Recharts/Chart.js) to dashboards.
