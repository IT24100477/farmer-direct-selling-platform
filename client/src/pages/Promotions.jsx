import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPromotions } from '../redux/slices/promotionSlice.js';
import api from '../services/api.js';
import toast from 'react-hot-toast';
import { PRODUCT_CATEGORIES, normalizeProductCategory } from '../constants/productCategories.js';
import PromotionShowcaseCard from '../components/PromotionShowcaseCard.jsx';
import { formatCurrency } from '../utils/currency.js';

const PROMO_CODE_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]+$/;

const emptyForm = {
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: 0,
  applicableTo: 'product',
  productId: '',
  category: '',
  farmerId: '',
  promoCode: '',
  startDate: '',
  endDate: ''
};

const Promotions = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.promotions);
  const { user } = useSelector((s) => s.auth);
  const [manage, setManage] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [products, setProducts] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [nowMs, setNowMs] = useState(Date.now());
  const isAdmin = user?.role === 'admin';
  const isFarmer = user?.role === 'farmer';

  const loadPublic = () => dispatch(fetchPromotions());
  const loadManage = async () => {
    if (!isAdmin && !isFarmer) return;
    const { data } = await api.get('/promotions/manage');
    setManage(Array.isArray(data) ? data : []);
  };

  const loadReferences = async () => {
    if (!isAdmin && !isFarmer) return;
    try {
      if (isAdmin) {
        const [productsRes, farmersRes] = await Promise.all([
          api.get('/products/admin/all', { params: { limit: 300 } }),
          api.get('/users', { params: { role: 'farmer', limit: 300, active: 'true' } })
        ]);
        setProducts(Array.isArray(productsRes.data?.items) ? productsRes.data.items : []);
        setFarmers(Array.isArray(farmersRes.data?.items) ? farmersRes.data.items : []);
        return;
      }

      const { data } = await api.get('/products/farmer/my');
      setProducts(Array.isArray(data) ? data : []);
      setFarmers(user?._id ? [{ _id: user._id, name: user.name, email: user.email }] : []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load products/farmers for promotions');
    }
  };

  useEffect(() => { loadPublic(); loadManage(); loadReferences(); }, [dispatch, user]);
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (isFarmer && (form.applicableTo === 'farmer' || form.applicableTo === 'category') && user?._id) {
      setForm((f) => ({ ...f, farmerId: user._id }));
    }
  }, [isFarmer, form.applicableTo, user?._id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      ['title', 'description', 'productId', 'category', 'farmerId', 'promoCode'].forEach((k) => {
        if (typeof payload[k] === 'string') payload[k] = payload[k].trim();
      });
      // strip empty fields so backend doesn't try to cast ""
      ['productId', 'category', 'farmerId', 'promoCode'].forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });

      if (payload.promoCode && !PROMO_CODE_PATTERN.test(payload.promoCode)) {
        toast.error('Promo code must include both letters and numbers');
        return;
      }

      if (payload.applicableTo === 'product' && !payload.productId) {
        toast.error('Select a target product');
        return;
      }
      if (payload.applicableTo === 'category' && !payload.category) {
        toast.error('Select a target category');
        return;
      }
      if (isAdmin && payload.applicableTo === 'farmer' && !payload.farmerId) {
        toast.error('Select a target farmer');
        return;
      }

      if (editing) {
        await api.put(`/promotions/${editing}`, payload);
        toast.success('Promotion updated (awaiting approval if farmer)');
      } else {
        await api.post('/promotions', payload);
        toast.success('Promotion created');
      }
      setForm(emptyForm);
      setEditing(null);
      loadManage();
      loadPublic();
      loadReferences();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Promo save failed');
    }
  };

  const startEdit = (p) => {
    setEditing(p._id);
    setForm({
      title: p.title,
      description: p.description || '',
      discountType: p.discountType,
      discountValue: p.discountValue,
      applicableTo: p.applicableTo,
      productId: (typeof p.productId === 'object' ? p.productId?._id : p.productId) || '',
      category: normalizeProductCategory(p.category) || p.category || '',
      farmerId: (typeof p.farmerId === 'object' ? p.farmerId?._id : p.farmerId) || '',
      promoCode: p.promoCode || '',
      startDate: p.startDate?.substring(0,10) || '',
      endDate: p.endDate?.substring(0,10) || ''
    });
  };

  const del = async (id) => {
    await api.delete(`/promotions/${id}`);
    toast.success('Promotion deleted');
    loadManage(); loadPublic();
  };

  const approve = async (id) => {
    await api.patch(`/promotions/${id}/approve`, { approved: true, activate: true });
    toast.success('Approved');
    loadManage();
    loadPublic();
  };
  const reject = async (id) => {
    await api.patch(`/promotions/${id}/approve`, { approved: false, activate: false });
    toast.success('Rejected');
    loadManage();
    loadPublic();
  };
  const toggle = async (id) => {
    await api.patch(`/promotions/${id}/toggle`);
    toast.success('Status updated');
    loadManage();
    loadPublic();
  };

  const productOptions = isAdmin
    ? products
    : products.filter((product) => (typeof product.farmerId === 'object' ? product.farmerId?._id : product.farmerId)?.toString() === user?._id?.toString());

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h2 className="text-xl font-semibold">Promotions</h2>

      {(isAdmin || isFarmer) && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-sm">{editing ? 'Edit promotion' : 'Create promotion'}</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={submit}>
            <input className="border p-2 rounded w-full" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input
              className="border p-2 rounded w-full"
              placeholder="Promo code (optional)"
              value={form.promoCode}
              onChange={(e) => setForm({ ...form, promoCode: e.target.value })}
              pattern="(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]+"
              title="Use letters and numbers only (for example: FARM10)"
            />
            <textarea className="border p-2 rounded md:col-span-2 w-full" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select className="border p-2 rounded w-full" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <input className="border p-2 rounded w-full" type="number" step="0.01" placeholder="Discount value" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} required />
            <select className="border p-2 rounded w-full" value={form.applicableTo} onChange={(e) => setForm({ ...form, applicableTo: e.target.value })}>
              <option value="product">Product</option>
              <option value="category">Category</option>
              <option value="farmer">Farmer</option>
            </select>
            {form.applicableTo === 'product' && (
              <select className="border p-2 rounded w-full" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                <option value="">Select product</option>
                {productOptions.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.productName} ({product._id})
                  </option>
                ))}
              </select>
            )}
            {form.applicableTo === 'category' && (
              <select className="border p-2 rounded w-full" value={normalizeProductCategory(form.category) || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            )}
            {form.applicableTo === 'farmer' && (
              isFarmer
                ? <p className="text-xs text-gray-600">Farmer ID auto-set to your account</p>
                : (
                  <select className="border p-2 rounded w-full" value={form.farmerId} onChange={(e) => setForm({ ...form, farmerId: e.target.value })}>
                    <option value="">Select farmer</option>
                    {farmers.map((farmer) => (
                      <option key={farmer._id} value={farmer._id}>
                        {farmer.name} ({farmer.email})
                      </option>
                    ))}
                  </select>
                )
            )}
            <input className="border p-2 rounded w-full" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            <input className="border p-2 rounded w-full" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">
              <button className="btn" type="submit">{editing ? 'Update' : 'Create'}</button>
              {editing && <button type="button" className="text-sm text-red-500 underline" onClick={() => { setEditing(null); setForm(emptyForm); }}>Cancel</button>}
            </div>
          </form>
        </div>
      )}

      {(isAdmin || isFarmer) && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">My Promotions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {manage.map((p) => (
              <div key={p._id} className="card space-y-1">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{p.title}</p>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100">{p.isApproved ? 'Approved' : 'Pending'}</span>
                </div>
                <p className="text-sm text-gray-600">{p.description}</p>
                <p className="text-sm">{p.discountType === 'percentage' ? `${p.discountValue}%` : formatCurrency(p.discountValue)} off</p>
                <p className="text-xs text-gray-500">
                  Scope: {p.applicableTo}
                  {p.productId?.productName ? ` • Product: ${p.productId.productName}` : ''}
                  {p.category ? ` • Category: ${p.category}` : ''}
                  {p.farmerId?.name ? ` • Farmer: ${p.farmerId.name}` : ''}
                </p>
                <p className="text-xs text-gray-500">
                  Starts: {p.startDate?.substring(0, 10)} • Ends: {p.endDate?.substring(0, 10)}
                </p>
                <p className="text-xs text-gray-500">
                  Active: {p.isActive ? 'Yes' : 'No'} • Live now: {p.isLiveNow ? 'Yes' : 'No'} • Usage: {p.usageCount}
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <button className="text-primary underline" onClick={() => startEdit(p)}>Edit</button>
                  <button className="text-red-500 underline" onClick={() => del(p._id)}>Delete</button>
                  {isAdmin && !p.isApproved && (
                    <>
                      <button className="text-primary underline" onClick={() => approve(p._id)}>Approve</button>
                      <button className="text-red-500 underline" onClick={() => reject(p._id)}>Reject</button>
                    </>
                  )}
                  {(isAdmin || (isFarmer && p.canFarmerToggle)) && (
                    <button className="text-primary underline" onClick={() => toggle(p._id)}>
                      {p.isActive ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!manage.length && <p className="text-sm text-gray-500">No promotions yet.</p>}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">Active promotions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((p) => (
            <PromotionShowcaseCard key={p._id} promo={p} nowMs={nowMs} />
          ))}
          {!items.length && (
            <div className="card text-sm text-gray-500">No active promotions at the moment.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Promotions;
