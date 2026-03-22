import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { PRODUCT_CATEGORIES, normalizeProductCategory } from '../constants/productCategories.js';
import { formatCurrency } from '../utils/currency.js';

const createEmptyForm = (farmerId = '') => ({
  productName: '',
  category: PRODUCT_CATEGORIES[0],
  price: '',
  quantity: '',
  description: '',
  farmerId
});

const AdminProducts = () => {
  const [items, setItems] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [form, setForm] = useState(createEmptyForm());
  const [editingId, setEditingId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const farmerMap = useMemo(() => {
    return farmers.reduce((acc, farmer) => {
      acc[farmer._id] = farmer;
      return acc;
    }, {});
  }, [farmers]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products/admin/all', { params: { search, category, sort } });
      setItems(data.items || data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadFarmers = async () => {
    try {
      const { data } = await api.get('/users', { params: { role: 'farmer', limit: 200 } });
      const rows = data.items || [];
      setFarmers(rows);
      setForm((prev) => {
        if (prev.farmerId || !rows.length) return prev;
        return { ...prev, farmerId: rows[0]._id };
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load farmers');
    }
  };

  useEffect(() => {
    loadFarmers();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, category, sort]);

  const resetForm = () => {
    setEditingId('');
    setImageFile(null);
    setImagePreview('');
    setForm(createEmptyForm(farmers[0]?._id || ''));
  };

  const uploadImage = async () => {
    if (!imageFile) return '';
    const data = new FormData();
    data.append('file', imageFile);
    const res = await api.post('/products/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.url;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.farmerId) {
      toast.error('Please select a farmer');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        productName: form.productName,
        category: form.category,
        price: Number(form.price),
        quantity: Number(form.quantity),
        description: form.description,
        farmerId: form.farmerId
      };

      if (imageFile) {
        const url = await uploadImage();
        if (url) payload.images = [url];
      }

      if (editingId) {
        await api.put(`/products/admin/${editingId}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products/admin', payload);
        toast.success('Product created');
      }

      resetForm();
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product) => {
    const farmerId = typeof product.farmerId === 'object' ? product.farmerId._id : product.farmerId;
    setEditingId(product._id);
    setForm({
      productName: product.productName,
      category: normalizeProductCategory(product.category) || PRODUCT_CATEGORIES[0],
      price: product.price,
      quantity: product.quantity,
      description: product.description || '',
      farmerId: farmerId || farmers[0]?._id || ''
    });
    setImageFile(null);
    setImagePreview(product.images?.[0] || '');
  };

  const toggle = async (id) => {
    try {
      await api.patch(`/products/${id}/toggle`);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle product');
    }
  };

  const updateStock = async (id, quantity) => {
    try {
      await api.put(`/products/${id}/stock`, { quantity: Number(quantity) });
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const removeProduct = async (id) => {
    try {
      await api.delete(`/products/admin/${id}`);
      toast.success('Product deleted');
      loadProducts();
      if (editingId === id) resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="card space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Admin Product Management</h2>
          {editingId && (
            <button type="button" className="text-sm text-red-600 underline" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>

        <form className="space-y-3" onSubmit={submit}>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              className="border rounded p-2"
              placeholder="Product name"
              value={form.productName}
              onChange={(event) => setForm({ ...form, productName: event.target.value })}
              minLength={3}
              maxLength={50}
              required
            />
            <select
              className="border rounded p-2"
              value={form.farmerId}
              onChange={(event) => setForm({ ...form, farmerId: event.target.value })}
              required
            >
              <option value="">Assign farmer</option>
              {farmers.map((farmer) => (
                <option key={farmer._id} value={farmer._id}>
                  {farmer.name} ({farmer.email})
                </option>
              ))}
            </select>
            <select
              className="border rounded p-2"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              required
            >
              {PRODUCT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              className="border rounded p-2"
              type="number"
              min="0"
              step="0.01"
              placeholder="Price"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
              required
            />
            <input
              className="border rounded p-2"
              type="number"
              min="0"
              step="1"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
              required
            />
          </div>

          <textarea
            className="border rounded p-2 w-full"
            placeholder="Description"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            maxLength={500}
          />
          <p className="text-xs text-gray-500">{form.description.length}/500 characters</p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setImageFile(file);
                setImagePreview(file ? URL.createObjectURL(file) : '');
              }}
            />
            {imagePreview && <img src={imagePreview} alt="preview" className="w-16 h-16 rounded object-cover border" />}
          </div>

          <button className="btn w-full" disabled={saving || !farmers.length}>
            {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
          </button>
          {!farmers.length && <p className="text-sm text-red-600">No farmer accounts found. Create/approve a farmer first.</p>}
        </form>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold">All Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
          <input
            className="border rounded px-2 py-2 text-sm w-full"
            placeholder="Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="border rounded px-2 py-2 text-sm w-full"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-2 text-sm w-full lg:w-auto"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((product) => {
          const farmerId = typeof product.farmerId === 'object' ? product.farmerId._id : product.farmerId;
          const farmerName = typeof product.farmerId === 'object'
            ? product.farmerId.name
            : farmerMap[farmerId]?.name || farmerId;

          return (
            <div key={product._id} className="card space-y-2">
              {product.images?.[0] && <img src={product.images[0]} alt={product.productName} className="h-36 w-full object-cover rounded" />}
              <div className="flex items-center justify-between">
                <p className="font-semibold">{product.productName}</p>
                <span className="text-xs px-2 py-1 rounded bg-gray-100">{product.isAvailable ? 'Enabled' : 'Disabled'}</span>
              </div>
              <p className="text-xs text-gray-500">ID: {product._id}</p>
              <p className="text-sm text-gray-600">{normalizeProductCategory(product.category) || product.category}</p>
              <p className="text-sm">{formatCurrency(product.price)} • Stock {product.quantity}</p>
              <p className="text-xs text-gray-500">Farmer: {farmerName}</p>
              <div className="flex flex-wrap items-center gap-2">
                <button className="text-xs text-primary underline" onClick={() => toggle(product._id)}>
                  {product.isAvailable ? 'Mark unavailable' : 'Re-enable'}
                </button>
                <input
                  className="border p-1 rounded text-sm w-20"
                  type="number"
                  min="0"
                  defaultValue={product.quantity}
                  onBlur={(event) => updateStock(product._id, event.target.value)}
                />
                <span className="text-xs text-gray-500">Update stock</span>
              </div>
              <div className="flex gap-3 text-sm">
                <button className="text-primary underline" onClick={() => startEdit(product)}>Edit</button>
                <button className="text-red-500 underline" onClick={() => removeProduct(product._id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminProducts;
