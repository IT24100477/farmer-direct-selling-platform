import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/currency.js';

const colors = ['#1f7a4d', '#f59e0b', '#0ea5e9', '#6366f1', '#ef4444'];

const StatCard = ({ title, value }) => (
  <div className="card">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-semibold mt-1">{value}</p>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  useEffect(() => {
    api.get('/users/stats').then((res) => setStats(res.data));
    api.get('/users/analytics').then((res) => setAnalytics(res.data));
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link to="/admin/users" className="btn text-sm text-center">Manage Users</Link>
          <Link to="/admin/promotions" className="btn text-sm bg-white text-primary border border-primary text-center">Promotions</Link>
        </div>
      </div>

      {!stats && <p>Loading stats...</p>}
      {stats && (
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard title="Total users" value={stats.totalUsers} />
          <StatCard title="Farmers" value={stats.totalFarmers} />
          <StatCard title="Orders" value={stats.totalOrders} />
          <StatCard title="Products" value={stats.totalProducts} />
          <StatCard title="Revenue" value={formatCurrency(stats.revenue)} />
        </div>
      )}

      {analytics && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <p className="font-semibold mb-2">Users by role</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={analytics.roles} dataKey="count" nameKey="_id" outerRadius={80}>
                  {analytics.roles.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <p className="font-semibold mb-2">Orders by status</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.ordersByStatus}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={colors[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <p className="font-semibold mb-2">Top products</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.topProducts}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill={colors[1]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <p className="font-semibold mb-2">Promo usage</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.promoUsage}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="usage" fill={colors[2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
