import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ roles }) => {
  const { user, token } = useSelector((state) => state.auth);
  const storedToken = localStorage.getItem('token');
  if (!token || !storedToken) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
