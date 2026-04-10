import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';
import AgoraVideo from '../components/stream/AgoraVideo';

export default function SellerDashboard() {
  return (
    <div style={{ paddingTop: 64, minHeight: '100vh' }}>
      <div style={styles.layout}>
        <Sidebar />
        <div style={styles.content}>
          <Routes>
            <Route index element={<DashOverview />} />
            <Route path="streams" element={<MyStreams />} />
            <Route path="products" element={<MyProducts />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="go-live" element={<GoLive />} />
            <Route path="analytics" element={<SellerAnalytics />} />
            <Route path="coupons" element={<SellerCoupons />} />
            <Route path="wallet" element={<SellerWallet />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const { user } = useAuthStore();
  const links = [
    { to: '/seller', label: '📊 Overview', exact: true },
    { to: '/seller/go-live', label: '🔴 Go Live' },
    { to: '/seller/streams', label: '📹 My Streams' },
    { to: '/seller/products', label: '📦 Products' },
    { to: '/seller/orders', label: '🛒 Orders' },
    { to: '/seller/analytics', label: '📈 Analytics' },
    { to: '/seller/coupons', label: '🏷️ Coupons' },
    { to: '/seller/wallet', label: '👛 Wallet & Payout' },
  ];
  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>
        <div style={styles.sideAvatar}>{user?.name?.charAt(0)}</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.sellerProfile?.storeName || user?.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#7BA897' }}>Seller · {user?.city}</div>
        </div>
      </div>
      <nav style={{ padding: '0.5rem' }}>
        {links.map(l => (
          <Link key={l.to} to={l.to} style={styles.sideLink}>{l.label}</Link>
        ))}
      </nav>
    </div>
  );
}

function DashOverview() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/sellers/dashboard').then(r => setStats(r.data.data)).catch(() => {});
  }, []);

  const cards = stats ? [
    { label: 'Total Revenue', value: `PKR ${(stats.orders?.totalRevenue || 0).toLocaleString()}`, icon: '💰' },
    { label: 'Total Orders', value: stats.orders?.totalOrders || 0, icon: '📦' },
    { label: 'Pending Orders', value: stats.orders?.pendingOrders || 0, icon: '⏳' },
    { label: 'Total Streams', value: stats.streams?.totalStreams || 0, icon: '📹' },
    { label: 'Total Viewers', value: (stats.streams?.totalViewers || 0).toLocaleString(), icon: '👁️' },
    { label: 'Wallet Balance', value: `PKR ${(stats.walletBalance || 0).toLocaleString()}`, icon: '👛' },
  ] : [];

  return (
    <div>
      <h2 style={styles.pageTitle}>Dashboard Overview</h2>
      {!stats ? (
        <div className="spinner" style={{ margin: '3rem auto' }} />
      ) : (
        <div style={styles.statsGrid}>
          {cards.map(c => (
            <div key={c.label} className="card">
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{c.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#00C27C', fontFamily: 'Playfair Display,serif' }}>{c.value}</div>
              <div style={{ fontSize: '0.82rem', color: '#7BA897', marginTop: '0.2rem' }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: '2rem' }}>
        <Link to="/seller/go-live" className="btn btn-primary btn-lg">
          🔴 Start a New Live Stream
        </Link>
      </div>
    </div>
  );
}

function GoLive() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ title: '', description: '', category: 'fashion', type: 'regular' });
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    api.get('/products/seller/my-products').then(r => setProducts(r.data.data || [])).catch(() => {});
  }, []);

  const generateAI = async () => {
    if (!form.category) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/stream-content', {
        category: form.category,
        type: form.type,
        products: products.filter(p => selectedProducts.includes(p._id)).map(p => ({ name: p.name }))
      });
      const d = res.data.data;
      setForm(f => ({ ...f, title: d.titleEn || f.title, description: d.descriptionEn || f.description }));
      toast.success('AI generated your stream title!');
    } catch { toast.error('AI generation failed'); }
    setAiLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/streams', { ...form, productIds: selectedProducts });
      setStream(res.data.data);
      toast.success('Stream created! Click Go Live when ready.');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create stream'); }
    setLoading(false);
  };

  const handleGoLive = async () => {
    if (!stream) return;
    setLoading(true);
    try {
      await api.post(`/streams/${stream._id}/go-live`);
      toast.success('🔴 You are now LIVE!');
      window.open(`/stream/${stream._id}`, '_blank');
    } catch { toast.error('Failed to go live'); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={styles.pageTitle}>Go Live</h2>
      {stream ? (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontFamily: 'Playfair Display,serif', fontSize: '1.4rem' }}>{stream.title}</h3>
          <p style={{ color: '#7BA897', marginBottom: '1rem' }}>Stream is ready. Click Go Live when ready!</p>
          <button className="btn btn-primary btn-lg" onClick={handleGoLive} disabled={loading} style={{ marginBottom: '1rem' }}>
            {loading ? 'Starting...' : '🔴 Go Live Now'}
          </button>
          {stream && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ aspectRatio: '16/9', background: '#0D1F19', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem' }}>
                <AgoraVideo
                  streamId={stream._id}
                  channelName={stream.agoraChannel || `livepk_${stream._id}`}
                  isHost={true}
                  userId={user?._id}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a href={`/stream/${stream._id}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  👁️ View Stream Page
                </a>
                <button onClick={async () => {
                  await api.post(`/streams/${stream._id}/end`);
                  toast.success('Stream ended');
                  setStream(null);
                }} style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.4)', color: '#ff6b6b', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                  ⏹ End Stream
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {['fashion','beauty','electronics','home','food','kids','sports','other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Stream Type</label>
              <select className="form-input form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {[['regular','Regular Show'],['flash_sale','⚡ Flash Sale'],['product_review','📝 Product Review'],['q_and_a','❓ Q&A']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Stream Title</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={generateAI} disabled={aiLoading}>
                {aiLoading ? '...' : '🤖 AI Generate'}
              </button>
            </div>
            <input type="text" required className="form-input" placeholder="e.g., Summer Fashion Haul — Up to 40% Off!" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} maxLength={120} />
          </div>
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea className="form-input" rows={3} placeholder="Tell viewers what to expect..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          {products.length > 0 && (
            <div className="form-group">
              <label className="form-label">Select Products to Feature ({selectedProducts.length} selected)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto', padding: '0.5rem', background: '#0D1F19', borderRadius: '0.5rem', border: '1px solid rgba(0,194,124,0.2)' }}>
                {products.map(p => (
                  <label key={p._id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.3rem', background: selectedProducts.includes(p._id) ? 'rgba(0,194,124,0.1)' : 'transparent' }}>
                    <input type="checkbox" checked={selectedProducts.includes(p._id)} onChange={e => setSelectedProducts(e.target.checked ? [...selectedProducts, p._id] : selectedProducts.filter(id => id !== p._id))} />
                    <span style={{ fontSize: '0.88rem' }}>{p.name}</span>
                    <span style={{ marginLeft: 'auto', color: '#00C27C', fontSize: '0.82rem', fontWeight: 600 }}>PKR {p.price?.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? 'Creating...' : 'Create Stream →'}
          </button>
        </form>
      )}
    </div>
  );
}

function MyStreams() {
  const [streams, setStreams] = useState([]);
  useEffect(() => { api.get('/streams/my-streams').then(r => setStreams(r.data.data?.streams || [])).catch(() => {}); }, []);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={styles.pageTitle}>My Streams</h2>
        <Link to="/seller/go-live" className="btn btn-primary">+ New Stream</Link>
      </div>
      {streams.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📹</div><p>No streams yet. Go live!</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {streams.map(s => (
            <div key={s._id} className="card" style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <span className={`badge ${s.status === 'live' ? 'badge-live' : 'badge-green'}`}>{s.status}</span>
                  <span className="badge badge-gold">{s.category}</span>
                </div>
                <div style={{ fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#7BA897', marginTop: '0.2rem' }}>
                  👁️ {s.totalViews} views · 🛒 {s.totalOrders} orders · PKR {s.totalRevenue?.toLocaleString() || 0}
                </div>
              </div>
              <Link to={`/stream/${s._id}`} className="btn btn-ghost btn-sm">View →</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MyProducts() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', category: 'fashion', price: '', stock: '', thumbnail: '' });
  const [loading, setLoading] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const loadProducts = () => { api.get('/products/seller/my-products').then(r => setProducts(r.data.data || [])).catch(() => {}); };

  useEffect(() => { loadProducts(); }, []);

  const handleEdit = (p) => {
    setEditProduct(p);
    setEditForm({
      name: p.name || '',
      price: p.price || '',
      salePrice: p.salePrice || '',
      stock: p.stock || '',
      description: p.description || '',
      category: p.category || 'fashion',
      codAvailable: p.codAvailable !== false,
      freeShipping: p.freeShipping || false,
    });
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      await api.put(`/products/${editProduct._id}`, editForm);
      toast.success('Product updated!');
      setEditProduct(null);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/products', { ...form, price: Number(form.price), stock: Number(form.stock) });
      setProducts([res.data.data, ...products]);
      setShowForm(false);
      setForm({ name: '', description: '', category: 'fashion', price: '', stock: '', thumbnail: '' });
      toast.success('Product created! AI is enhancing your description...');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={styles.pageTitle}>My Products</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Product</button>
      </div>
      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>New Product</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">Product Name</label><input required className="form-input" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="e.g., Embroidered Kurti" /></div>
              <div className="form-group"><label className="form-label">Category</label><select className="form-input form-select" value={form.category} onChange={e => setForm({...form,category:e.target.value})}>{['fashion','beauty','electronics','home','food','kids','sports','other'].map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Price (PKR)</label><input required type="number" className="form-input" value={form.price} onChange={e => setForm({...form,price:e.target.value})} placeholder="1500" /></div>
              <div className="form-group"><label className="form-label">Stock Qty</label><input required type="number" className="form-input" value={form.stock} onChange={e => setForm({...form,stock:e.target.value})} placeholder="50" /></div>
            </div>
            <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Describe your product... AI will enhance it automatically" /></div>
            <div>
              <label className="form-label">Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('image', file);
                  try {
                    const res = await api.post('/products/upload-images', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    setForm(prev => ({ ...prev, thumbnail: res.data.data.url }));
                    toast.success('Image uploaded!');
                  } catch {
                    toast.error('Image upload failed');
                  }
                }}
                style={{ ...styles.input, padding: '0.4rem' }}
              />
              {form.thumbnail && (
                <img src={form.thumbnail} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: '0.4rem', marginTop: '0.5rem' }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : '✨ Save with AI'}</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {products.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📦</div><p>No products yet.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
          {products.map(p => (
            <div key={p._id} className="card card-sm">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', background: p.isApproved ? 'rgba(0,194,124,0.15)' : 'rgba(245,166,35,0.15)', color: p.isApproved ? '#00C27C' : '#F5A623', padding: '0.15rem 0.4rem', borderRadius: '0.25rem', fontWeight: 600 }}>
                  {p.isApproved ? '✓ Approved' : '⏳ Pending'}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{p.name}</div>
              <div style={{ color: '#00C27C', fontWeight: 700, fontSize: '0.9rem' }}>PKR {p.price?.toLocaleString()}</div>
              <div style={{ fontSize: '0.78rem', color: '#7BA897', marginTop: '0.25rem' }}>Stock: {p.stock} · Sold: {p.totalSold}</div>
              {p.aiQualityScore && <div style={{ fontSize: '0.72rem', color: '#F5A623', marginTop: '0.25rem' }}>🤖 Quality: {p.aiQualityScore}/100</div>}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button onClick={() => handleEdit(p)} style={{ flex: 1, background: 'rgba(0,194,124,0.1)', border: '1px solid rgba(0,194,124,0.25)', color: '#00C27C', padding: '0.3rem 0.5rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>✏️ Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', overflowY: 'auto' }}>
          <div style={{ background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: 540, margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.1rem' }}>✏️ Edit Product</h3>
              <button onClick={() => setEditProduct(null)} style={{ background: 'none', border: 'none', color: '#7BA897', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleEditSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Product Name</label>
                  <input className="form-input" value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} required />
                </div>
                <div>
                  <label className="form-label">Price (PKR)</label>
                  <input className="form-input" type="number" value={editForm.price} onChange={e => setEditForm(p => ({...p, price: e.target.value}))} required />
                </div>
                <div>
                  <label className="form-label">Sale Price (PKR)</label>
                  <input className="form-input" type="number" value={editForm.salePrice} onChange={e => setEditForm(p => ({...p, salePrice: e.target.value}))} placeholder="Optional" />
                </div>
                <div>
                  <label className="form-label">Stock</label>
                  <input className="form-input" type="number" value={editForm.stock} onChange={e => setEditForm(p => ({...p, stock: e.target.value}))} required />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <select className="form-input" value={editForm.category} onChange={e => setEditForm(p => ({...p, category: e.target.value}))}>
                    {['fashion','beauty','electronics','home','food','kids','sports','other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows={3} value={editForm.description} onChange={e => setEditForm(p => ({...p, description: e.target.value}))} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="editCod" checked={editForm.codAvailable} onChange={e => setEditForm(p => ({...p, codAvailable: e.target.checked}))} />
                  <label htmlFor="editCod" style={{ fontSize: '0.85rem', color: '#7BA897', cursor: 'pointer' }}>COD Available</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" id="editShip" checked={editForm.freeShipping} onChange={e => setEditForm(p => ({...p, freeShipping: e.target.checked}))} />
                  <label htmlFor="editShip" style={{ fontSize: '0.85rem', color: '#7BA897', cursor: 'pointer' }}>Free Shipping</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setEditProduct(null)} style={{ flex: 1, background: '#163028', border: '1px solid rgba(0,194,124,0.2)', color: '#7BA897', padding: '0.6rem', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={editSaving}>
                  {editSaving ? 'Saving...' : '✅ Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/orders/seller/orders').then(r => { setOrders(r.data.data?.orders || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status } : o));
      toast.success(`Order marked as ${status}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Orders</h2>
      {loading ? <div className="spinner" style={{ margin: '3rem auto' }} /> : orders.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">🛒</div><p>No orders yet.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(o => (
            <div key={o._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#7BA897', marginBottom: '0.25rem' }}>{o.orderNumber}</div>
                  <div style={{ fontWeight: 600 }}>{o.buyer?.name} — {o.shippingAddress?.city}</div>
                  <div style={{ fontSize: '0.82rem', color: '#7BA897', marginTop: '0.2rem' }}>
                    {o.items?.length} item(s) · PKR {o.totalAmount?.toLocaleString()} · {o.paymentMethod?.toUpperCase()}
                  </div>
                  {o.fraudScore > 60 && <div style={{ fontSize: '0.78rem', color: '#ff6b6b', marginTop: '0.3rem' }}>⚠️ Fraud risk: {o.fraudScore}/100</div>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <span className={`badge ${o.status === 'delivered' ? 'badge-green' : o.status === 'placed' ? 'badge-gold' : 'badge-green'}`}>{o.status}</span>
                  {o.status === 'placed' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus(o._id, 'confirmed')}>Confirm</button>}
                  {o.status === 'confirmed' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus(o._id, 'processing')}>Process</button>}
                  {o.status === 'processing' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus(o._id, 'dispatched')}>Dispatch</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SellerAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    setLoading(true);
    api.get('/analytics/seller', { params: { period } })
      .then(r => { setData(r.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />;
  if (!data) return <div style={{ color: '#7BA897', textAlign: 'center', padding: '3rem' }}>No analytics data yet</div>;

  // Build revenue chart data from daily breakdown or mock
  const revenueData = data.revenueByDay || data.revenue?.daily || [];
  const chartData = revenueData.length > 0 ? revenueData : [
    { day: 'Mon', revenue: 0 }, { day: 'Tue', revenue: 0 }, { day: 'Wed', revenue: 0 },
    { day: 'Thu', revenue: 0 }, { day: 'Fri', revenue: 0 }, { day: 'Sat', revenue: 0 }, { day: 'Sun', revenue: 0 }
  ];

  const summaryCards = [
    { label: 'Total Revenue', value: `PKR ${(data.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: '#00C27C' },
    { label: 'Total Orders', value: data.totalOrders || 0, icon: '📦', color: '#F5A623' },
    { label: 'Total Viewers', value: (data.totalViewers || 0).toLocaleString(), icon: '👁️', color: '#7BA897' },
    { label: 'Conversion Rate', value: `${(data.conversionRate || 0).toFixed(1)}%`, icon: '📊', color: '#00C27C' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={styles.pageTitle}>📈 Analytics</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['7d','30d','90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              background: period === p ? 'rgba(0,194,124,0.2)' : '#112219',
              border: `1px solid ${period === p ? '#00C27C' : 'rgba(0,194,124,0.2)'}`,
              color: period === p ? '#00C27C' : '#7BA897',
              padding: '0.3rem 0.75rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.82rem'
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.statsGrid}>
        {summaryCards.map(c => (
          <div key={c.label} className="card">
            <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{c.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '0.8rem', color: '#7BA897' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#E8F5F0' }}>💰 Revenue Trend</h3>
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: 220 }}>
            <BarChartSimple data={chartData} />
          </div>
        ) : (
          <p style={{ color: '#4A7A6A', textAlign: 'center', padding: '2rem' }}>No revenue data for this period</p>
        )}
      </div>

      {/* Top Products */}
      {data.topProducts?.length > 0 && (
        <div className="card" style={{ marginTop: '1rem', padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#E8F5F0' }}>🏆 Top Products</h3>
          {data.topProducts.map((p, i) => (
            <div key={p._id || i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid rgba(0,194,124,0.08)' }}>
              <span style={{ color: '#F5A623', fontWeight: 700, width: 20 }}>#{i+1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#7BA897' }}>{p.totalSold || 0} sold</div>
              </div>
              <div style={{ color: '#00C27C', fontWeight: 700, fontSize: '0.9rem' }}>PKR {(p.revenue || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Stream Performance */}
      {data.streams?.length > 0 && (
        <div className="card" style={{ marginTop: '1rem', padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#E8F5F0' }}>📹 Stream Performance</h3>
          {data.streams.map((s, i) => (
            <div key={s._id || i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: '1px solid rgba(0,194,124,0.08)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#7BA897' }}>
                  👁️ {s.peakViewers || 0} viewers · {s.duration ? `${Math.floor(s.duration/60)}min` : 'N/A'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#00C27C', fontWeight: 700, fontSize: '0.9rem' }}>PKR {(s.revenue || 0).toLocaleString()}</div>
                <div style={{ fontSize: '0.72rem', color: '#7BA897' }}>{s.orderCount || 0} orders</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple pure CSS bar chart (no recharts needed to avoid build issues)
function BarChartSimple({ data }) {
  const maxVal = Math.max(...data.map(d => d.revenue || d.amount || 0), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '180px', padding: '0 0.5rem' }}>
      {data.slice(0, 14).map((d, i) => {
        const val = d.revenue || d.amount || 0;
        const height = maxVal > 0 ? Math.max((val / maxVal) * 160, 2) : 2;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ fontSize: '0.62rem', color: '#7BA897' }}>{val > 0 ? `${(val/1000).toFixed(0)}k` : ''}</div>
            <div style={{
              width: '100%', height: `${height}px`,
              background: 'linear-gradient(180deg, #00C27C, rgba(0,194,124,0.3))',
              borderRadius: '3px 3px 0 0',
              transition: 'height 0.5s ease',
              minHeight: 2,
            }} />
            <div style={{ fontSize: '0.6rem', color: '#4A7A6A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {d.day || d.date || d.label || `D${i+1}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SellerCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minOrder: '', maxUses: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCoupons(); }, []);

  const loadCoupons = () => {
    setLoading(true);
    api.get('/coupons/my')
      .then(r => { setCoupons(r.data.data?.coupons || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/coupons', form);
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({ code: '', discountType: 'percentage', discountValue: '', minOrder: '', maxUses: '', expiresAt: '' });
      loadCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      setCoupons(prev => prev.filter(c => c._id !== id));
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const generateCode = () => {
    const code = 'LIVEPK' + Math.random().toString(36).substring(2, 7).toUpperCase();
    setForm(prev => ({ ...prev, code }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={styles.pageTitle}>🏷️ Coupons</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? '✕ Cancel' : '+ Create Coupon'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>New Coupon</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Coupon Code</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="form-input" value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value.toUpperCase()}))} placeholder="SAVE20" required />
                  <button type="button" onClick={generateCode} style={{ background: '#112219', border: '1px solid rgba(0,194,124,0.3)', color: '#7BA897', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Auto</button>
                </div>
              </div>
              <div>
                <label className="form-label">Discount Type</label>
                <select className="form-input" value={form.discountType} onChange={e => setForm(p => ({...p, discountType: e.target.value}))}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (PKR)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Discount Value</label>
                <input className="form-input" type="number" value={form.discountValue} onChange={e => setForm(p => ({...p, discountValue: e.target.value}))} placeholder={form.discountType === 'percentage' ? '20' : '200'} required />
              </div>
              <div>
                <label className="form-label">Min Order (PKR)</label>
                <input className="form-input" type="number" value={form.minOrder} onChange={e => setForm(p => ({...p, minOrder: e.target.value}))} placeholder="500" />
              </div>
              <div>
                <label className="form-label">Max Uses</label>
                <input className="form-input" type="number" value={form.maxUses} onChange={e => setForm(p => ({...p, maxUses: e.target.value}))} placeholder="100" />
              </div>
              <div>
                <label className="form-label">Expires At</label>
                <input className="form-input" type="datetime-local" value={form.expiresAt} onChange={e => setForm(p => ({...p, expiresAt: e.target.value}))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : '✅ Create Coupon'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="spinner" style={{ margin: '3rem auto' }} />
      ) : coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#7BA897' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</div>
          <p>No coupons yet. Create your first discount!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {coupons.map(c => (
            <div key={c._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
              <div style={{ background: 'rgba(0,194,124,0.1)', border: '1px dashed rgba(0,194,124,0.4)', borderRadius: '0.4rem', padding: '0.4rem 0.9rem', fontFamily: 'monospace', fontWeight: 700, color: '#00C27C', fontSize: '0.95rem' }}>
                {c.code}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {c.discountType === 'percentage' ? `${c.discountValue}% off` : `PKR ${c.discountValue} off`}
                  {c.minOrder > 0 && <span style={{ color: '#7BA897', fontSize: '0.78rem', marginLeft: '0.5rem' }}>· Min PKR {c.minOrder.toLocaleString()}</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7BA897', marginTop: '0.2rem' }}>
                  Used {c.usedCount || 0}/{c.maxUses || '∞'} · {c.isActive ? '✅ Active' : '❌ Inactive'}
                  {c.expiresAt && ` · Expires ${new Date(c.expiresAt).toLocaleDateString('en-PK')}`}
                </div>
              </div>
              <button
                onClick={() => handleDelete(c._id)}
                style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff6b6b', padding: '0.35rem 0.7rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                🗑️ Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SellerWallet() {
  const { user, refreshMe } = useAuthStore();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('jazzcash');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    refreshMe();
    api.get('/sellers/withdrawals').then(r => setHistory(r.data.data?.withdrawals || [])).catch(() => {});
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) < 500) { toast.error('Minimum withdrawal is PKR 500'); return; }
    if (!accountNumber.trim()) { toast.error('Enter your account/phone number'); return; }
    if (Number(amount) > (user?.walletBalance || 0)) { toast.error('Insufficient wallet balance'); return; }
    setLoading(true);
    try {
      await api.post('/sellers/withdraw', { amount: Number(amount), method, accountNumber });
      toast.success(`✅ Withdrawal request of PKR ${Number(amount).toLocaleString()} submitted! Processing in 1-2 business days.`);
      setAmount('');
      setAccountNumber('');
      refreshMe();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const balance = user?.walletBalance || 0;

  return (
    <div>
      <h2 style={styles.pageTitle}>👛 Wallet & Payout</h2>

      {/* Balance Card */}
      <div style={{ background: 'linear-gradient(135deg, #112219, #163028)', border: '1px solid rgba(0,194,124,0.3)', borderRadius: '1rem', padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: '#7BA897', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Available Balance</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#00C27C', fontFamily: 'Playfair Display,serif' }}>PKR {balance.toLocaleString()}</div>
        <div style={{ fontSize: '0.78rem', color: '#4A7A6A', marginTop: '0.5rem' }}>Min withdrawal: PKR 500 · Processing: 1-2 business days</div>
      </div>

      {/* Withdraw Form */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>💸 Request Withdrawal</h3>
        <form onSubmit={handleWithdraw}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Amount (PKR)</label>
              <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Min 500" min="500" max={balance} required />
            </div>
            <div>
              <label className="form-label">Payment Method</label>
              <select className="form-input" value={method} onChange={e => setMethod(e.target.value)}>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">{method === 'bank' ? 'IBAN / Account Number' : 'Mobile Number'}</label>
            <input className="form-input" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder={method === 'bank' ? 'PK36SCBL0000001123456702' : '03XX-XXXXXXX'} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || balance < 500}>
            {loading ? 'Processing...' : `💸 Withdraw PKR ${Number(amount || 0).toLocaleString()}`}
          </button>
        </form>
      </div>

      {/* Withdrawal History */}
      {history.length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>📋 Withdrawal History</h3>
          {history.map((w, i) => (
            <div key={w._id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid rgba(0,194,124,0.08)' }}>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>PKR {w.amount?.toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: '#7BA897' }}>{w.method} · {new Date(w.createdAt).toLocaleDateString('en-PK')}</div>
              </div>
              <span style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '2rem', background: w.status === 'completed' ? 'rgba(0,194,124,0.15)' : 'rgba(245,166,35,0.15)', color: w.status === 'completed' ? '#00C27C' : '#F5A623' }}>
                {w.status || 'pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  layout: { display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 64px)' },
  sidebar: { borderRight: '1px solid rgba(0,194,124,0.2)', background: '#091410', position: 'sticky', top: 64, height: 'calc(100vh - 64px)', overflowY: 'auto' },
  sidebarHeader: { padding: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', borderBottom: '1px solid rgba(0,194,124,0.15)' },
  sideAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#00C27C', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 },
  sideLink: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: '0.5rem', color: '#7BA897', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, transition: 'all 0.15s', marginBottom: '0.2rem' },
  content: { padding: '2rem' },
  pageTitle: { fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.5px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '1rem' },
};
