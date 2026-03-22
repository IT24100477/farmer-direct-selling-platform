import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications } from '../redux/slices/notificationSlice.js';
import api from '../services/api.js';

const Notifications = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.notifications);

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    dispatch(fetchNotifications());
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-3">
      <h2 className="text-xl font-semibold">Notifications</h2>
      {items.map((n) => (
        <div
          key={n._id}
          className={`card flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 ${n.isRead ? 'opacity-70' : ''} ${n.type === 'stock' ? 'border-[#f2c286] bg-[#fff8ef]' : ''}`}
        >
          <div>
            <p className="font-medium">{n.message}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {n.type === 'stock' ? 'Low Stock Alert' : n.type}
            </p>
          </div>
          {!n.isRead && <button className="text-sm text-primary underline" onClick={() => markRead(n._id)}>Mark read</button>}
        </div>
      ))}
      {!items.length && <p className="text-gray-500 text-sm">No notifications</p>}
    </div>
  );
};

export default Notifications;
