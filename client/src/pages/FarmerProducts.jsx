import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { PRODUCT_CATEGORIES, normalizeProductCategory } from '../constants/productCategories.js';
import { formatCurrency } from '../utils/currency.js';

const defaultForm = {
  productName: '',
  category: PRODUCT_CATEGORIES[0],
  price: 0,
  quantity: 0,
  description: ''
};

const FarmerProducts = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get('/products/farmer/my');
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const uploadImage = async () => {
    if (!imageFile) return '';
    const formData = new FormData();
    formData.append('file', imageFile);
    const { data } = await api.post('/products/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.url;
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    let url = '';
    if (imageFile) url = await uploadImage();
    const payload = { ...form, price: Number(form.price), quantity: Number(form.quantity) };
    if (url) payload.images = [url];

    if (editing) {
      await api.put(`/products/${editing}`, payload);
    } else {
      await api.post('/products', payload);
    }

    setForm({ ...defaultForm });
    setImageFile(null);
    setImageUrl('');
    setEditing(null);
    setSaving(false);
    load();
  };

  const toggle = async (id) => {
    await api.patch(`/products/${id}/toggle`);
    load();
  };

  const del = async (id) => {
    await api.delete(`/products/${id}`);
    load();
  };

  const startEdit = (p) => {
    setEditing(p._id);
    setForm({
      productName: p.productName,
      category: normalizeProductCategory(p.category) || PRODUCT_CATEGORIES[0],
      price: p.price,
      quantity: p.quantity,
      description: p.description || ''
    });
    setImageUrl(p.images?.[0] || '');
    setImageFile(null);
  };

  const updateStock = async (id, quantity) => {
    await api.put(`/products/${id}/stock`, { quantity: Number(quantity) });
    load();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h2 className="text-xl font-semibold">My Products</h2>

      <form className="card space-y-3" onSubmit={submit}>
        <div className="grid md:grid-cols-2 gap-3">
          <input
            className="border p-2 rounded w-full"
            placeholder="Product name"
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
            minLength={3}
            maxLength={50}
            required
          />
          <select className="border p-2 rounded w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input className="border p-2 rounded w-full" type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <input className="border p-2 rounded w-full" type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
        </div>
        <textarea
          className="border p-2 rounded"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          maxLength={500}
        />
        <p className="text-xs text-gray-500">{form.description.length}/500 characters</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input type="file" accept="image/*" onChange={(e) => { setImageFile(e.target.files[0]); setImageUrl(e.target.files[0] ? URL.createObjectURL(e.target.files[0]) : ''); }} />
          {imageUrl && <img src={imageUrl} alt="preview" className="w-16 h-16 object-cover rounded border" />}
        </div>
        <button className="btn w-full" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update product' : 'Add product'}</button>
        {editing && <button type="button" className="text-sm text-red-500 underline" onClick={() => { setEditing(null); setForm({ ...defaultForm }); setImageFile(null); setImageUrl(''); }}>Cancel edit</button>}
      </form>

      {loading && <p>Loading products...</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p) => (
          <div key={p._id} className="card space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{p.productName}</p>
              <span className="text-xs px-2 py-1 rounded bg-gray-100">{p.isAvailable ? 'Enabled' : 'Disabled'}</span>
            </div>
            <p className="text-xs text-gray-500">ID: {p._id}</p>
            <p className="text-sm text-gray-600">{normalizeProductCategory(p.category) || p.category}</p>
            <p className="text-sm">{formatCurrency(p.price)} • Stock {p.quantity}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button className="text-xs text-primary underline" onClick={() => toggle(p._id)}>
                {p.isAvailable ? 'Mark unavailable' : 'Re-enable'}
              </button>
              <input
                className="border p-1 rounded text-sm w-20"
                type="number"
                defaultValue={p.quantity}
                onBlur={(e) => updateStock(p._id, e.target.value)}
              />
              <span className="text-xs text-gray-500">Update stock</span>
            </div>
            {p.images?.[0] && <img src={p.images[0]} alt={p.productName} className="w-full h-32 object-cover rounded" />}
            <div className="flex gap-3 text-sm">
              <button className="text-primary underline" onClick={() => startEdit(p)}>Edit</button>
              <button className="text-red-500 underline" onClick={() => del(p._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FarmerProducts;
