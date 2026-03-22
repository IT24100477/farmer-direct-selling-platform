import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications } from '../redux/slices/notificationSlice.js';
import { Link } from 'react-router-dom';

const NotificationBell = ({ showLabel = true, className = '' }) => {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.notifications);
  const unread = items.filter((n) => !n.isRead).length;

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  return (
    <Link
      to="/notifications"
      className={`group relative inline-flex items-center gap-2 rounded-full border border-[#cfe2d5] bg-white px-3 py-2 text-sm font-semibold text-[#315744] transition hover:-translate-y-0.5 hover:border-[#9fc5ad] hover:text-[#1f7a4d] ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0h6Z" />
      </svg>
      {showLabel && <span>Notifications</span>}
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full border border-white bg-[#dc2626] px-1.5 text-center text-[10px] font-bold leading-[18px] text-white shadow-sm">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
