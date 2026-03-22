import { useEffect, useState } from 'react';
import api from '../services/api.js';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('all');
  const [active, setActive] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users', {
        params: { role, active: active === 'all' ? undefined : active, search, page }
      });
      setUsers(data.items);
      setPages(data.pages);
      setError('');
    } catch (e) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [role, active, page]);

  const approve = async (id) => {
    await api.put(`/users/approve/${id}`);
    load();
  };

  const reject = async (id) => {
    await api.put(`/users/reject/${id}`);
    load();
  };

  const deactivate = async (id) => {
    await api.put(`/users/deactivate/${id}`);
    load();
  };

  const activate = async (id) => {
    await api.put(`/users/activate/${id}`);
    load();
  };

  const changeRole = async (id, role) => {
    await api.put(`/users/${id}`, { role });
    load();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">Users</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
          <input
            className="border rounded px-2 py-2 text-sm w-full"
            placeholder="Search name/email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="border rounded px-2 py-2 text-sm w-full lg:w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="farmer">Farmer</option>
            <option value="customer">Customer</option>
            <option value="delivery">Delivery</option>
          </select>
          <select className="border rounded px-2 py-2 text-sm w-full lg:w-auto" value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="all">Active/Inactive</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="btn text-sm bg-gray-100 text-primary border border-primary w-full lg:w-auto" onClick={load}>Refresh</button>
        </div>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="hidden md:block overflow-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="text-left bg-gray-50">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Approved</th>
              <th className="p-2">Active</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2 capitalize">
                  <select
                    className="border rounded px-2 py-1 text-xs"
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="farmer">Farmer</option>
                    <option value="customer">Customer</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </td>
                <td className="p-2">{u.role === 'farmer' ? (u.isApproved ? 'Yes' : 'No') : '-'}</td>
                <td className="p-2">{u.isActive ? 'Active' : 'Inactive'}</td>
                <td className="p-2 space-x-2 whitespace-nowrap">
                  {u.role === 'farmer' && !u.isApproved && (
                    <>
                      <button className="text-sm text-primary underline" onClick={() => approve(u._id)}>Approve</button>
                      <button className="text-sm text-red-500 underline" onClick={() => reject(u._id)}>Reject</button>
                    </>
                  )}
                  {!u.isActive && (
                    <button className="text-sm text-primary underline" onClick={() => activate(u._id)}>Activate</button>
                  )}
                  {u.isActive && (
                    <button className="text-sm text-red-500 underline" onClick={() => deactivate(u._id)}>Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-3">
        {users.map((u) => (
          <div key={u._id} className="card space-y-2">
            <p className="font-semibold">{u.name}</p>
            <p className="text-xs text-gray-500 break-all">{u.email}</p>
            <p className="text-sm">Role:
              <select
                className="border rounded px-2 py-1 text-xs ml-2"
                value={u.role}
                onChange={(e) => changeRole(u._id, e.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="farmer">Farmer</option>
                <option value="customer">Customer</option>
                <option value="delivery">Delivery</option>
              </select>
            </p>
            <p className="text-xs text-gray-600">Approved: {u.role === 'farmer' ? (u.isApproved ? 'Yes' : 'No') : '-'}</p>
            <p className="text-xs text-gray-600">Status: {u.isActive ? 'Active' : 'Inactive'}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {u.role === 'farmer' && !u.isApproved && (
                <>
                  <button className="text-primary underline" onClick={() => approve(u._id)}>Approve</button>
                  <button className="text-red-500 underline" onClick={() => reject(u._id)}>Reject</button>
                </>
              )}
              {!u.isActive && (
                <button className="text-primary underline" onClick={() => activate(u._id)}>Activate</button>
              )}
              {u.isActive && (
                <button className="text-red-500 underline" onClick={() => deactivate(u._id)}>Deactivate</button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button className="btn text-sm bg-white text-primary border border-primary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span className="text-sm">Page {page} / {pages}</span>
        <button className="btn text-sm bg-white text-primary border border-primary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default AdminUsers;
