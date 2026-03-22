import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { Toaster } from 'react-hot-toast';
import { fetchNotifications } from './redux/slices/notificationSlice.js';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ProductList from './pages/ProductList.jsx';
import ProductDetails from './pages/ProductDetails.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import Orders from './pages/Orders.jsx';
import OrderDetails from './pages/OrderDetails.jsx';
import Promotions from './pages/Promotions.jsx';
import Profile from './pages/Profile.jsx';
import FarmerDashboard from './pages/FarmerDashboard.jsx';
import FarmerProducts from './pages/FarmerProducts.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminProducts from './pages/AdminProducts.jsx';
import AdminOrders from './pages/AdminOrders.jsx';
import DeliveryDashboard from './pages/DeliveryDashboard.jsx';
import DeliveryOrdersToDeliver from './pages/DeliveryOrdersToDeliver.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import Notifications from './pages/Notifications.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleSidebarLayout from './components/RoleSidebarLayout.jsx';
import FarmerOrders from './pages/FarmerOrders.jsx';
import ReviewManagement from './pages/ReviewManagement.jsx';
import ProductInsights from './pages/ProductInsights.jsx';

const App = () => {
  const { user, token } = useSelector((s) => s.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user || !token) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    socket.emit('register', user._id);
    socket.on('notification', () => {
      dispatch(fetchNotifications()).unwrap().catch(() => {});
    });
    dispatch(fetchNotifications()).unwrap().catch(() => {});
    return () => socket.disconnect();
  }, [user, token, dispatch]);

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<ProductList />} />
        <Route path="/products/insights" element={<ProductInsights />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/promotions" element={<Promotions />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route element={<ProtectedRoute roles={['customer', 'farmer', 'admin', 'delivery']} />}> 
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route element={<ProtectedRoute roles={['farmer']} />}>
          <Route element={<RoleSidebarLayout role="farmer" />}>
            <Route path="/farmer" element={<FarmerDashboard />} />
            <Route path="/farmer/products" element={<FarmerProducts />} />
            <Route path="/farmer/orders" element={<FarmerOrders />} />
            <Route path="/farmer/reviews" element={<ReviewManagement />} />
            <Route path="/farmer/promotions" element={<Promotions />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<RoleSidebarLayout role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/reviews" element={<ReviewManagement />} />
            <Route path="/admin/promotions" element={<Promotions />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={['delivery']} />}>
          <Route element={<RoleSidebarLayout role="delivery" />}>
            <Route path="/delivery" element={<DeliveryDashboard />} />
            <Route path="/delivery/orders-to-deliver" element={<DeliveryOrdersToDeliver />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={['customer']} />}>
          <Route element={<RoleSidebarLayout role="customer" />}>
            <Route path="/customer" element={<CustomerDashboard />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
};

export default App;
