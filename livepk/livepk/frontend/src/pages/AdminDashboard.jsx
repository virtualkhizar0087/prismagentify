import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Users', 'Products', 'Orders', 'Sellers'];

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState([]);
  const [userFilter, setUserFilter] = useState('');
  const [productFilter, setProductFilter] = useState('false'); // pending by default

  if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/" replace />;

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (tab === 'Users') fetchUsers(); }, [tab, userFilter]);
  useEffect(() => { if (tab === 'Products') fetchProducts(); }, [tab, productFilter]);
  useEffect(() => { if (tab === 'Orders') fetchOrders(); }, [tab]);
  useEffect(() => { if (tab === 'Sellers') fetchSellers(); }, [tab]);

  const fetchStats = async () => {
    try {
      const r = await api.get('/admin/stats');
      setStats(r.data.data);
    } catch { toast.error('Failed to load stats'); }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = userFilter ? { role: userFilter } : {};
      const r = await api.get('/admin/users', { params });
      setUsers(r.data.data.users);
    } catch { toast.error('Failed to load users'); }
    setLoading(false);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/products', { params: { approved: productFilter } });
      setProducts(r.data.data.products);
    } catch { toast.error('Failed to load products'); }
    setLoading(false);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/orders');
      setOrders(r.data.data.orders);
    } catch { toast.error('Failed to load orders'); }
    setLoading(false);
  };

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/users', { params: { role: 'seller' } });
      setSellers(r.data.data?.users || []);
    } catch { toast.error('Failed to load sellers'); }
    setLoading(false);
  };

  const toggleUser = async (userId, isActive) => {
    try {
      await api.patch(`/admin/users/${userId}`, { isActive });
      toast.success(isActive ? 'User activated' : 'User banned');
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const handleApproveSeller = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}`, { 'sellerProfile.isVerified': true });
      toast.success('Seller approved!');
      fetchSellers();
    } catch { toast.error('Failed to approve seller'); }
  };

  const handleRejectSeller = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}`, { isActive: false });
      toast.success('Seller rejected');
      fetchSellers();
    } catch { toast.error('Failed to reject'); }
  };

  const approveProduct = async (productId, isApproved) => {
    try {
      await api.patch(`/admin/products/${productId}`, { isApproved });
      toast.success(isApproved ? 'Product approved!' : 'Product rejected');
      fetchProducts();
    } catch { toast.error('Failed to update product'); }
  };

  const handleApproveProduct = async (productId) => {
    try {
      await api.patch(`/admin/products/${productId}`, { approved: true });
      toast.success('Product approved!');
      fetchProducts();
    } catch { toast.error('Failed to approve'); }
  };

  const handleRejectProduct = async (productId) => {
    if (!window.confirm('Reject and hide this product?')) return;
    try {
      await api.patch(`/admin/products/${productId}`, { approved: false });
      toast.success('Product rejected');
      fetchProducts();
    } catch { toast.error('Failed to reject'); }
  };

  const StatCard = ({ label, value, sub, color = '#00C27C' }) => (
    <div style={{ background: '#0D1F19', border: '1px solid rgba(0,194,124,0.15)', borderRadius: '0.75rem', padding: '1.25rem' }}>
      <div style={{ fontSize: '0.75rem', color: '#7BA897', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, color, fontFamily: 'Space Mono, monospace' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#4A7A6A', marginTop: '0.25rem' }}>{sub}</div>}
    </div>
  );

  return (
    <div className="main-content">
      <div className="container" style={{ paddingBottom: '4rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-label">Platform Management</div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '2rem', fontWeight: 700 }}>Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(0,194,124,0.15)', paddingBottom: '0' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.6rem 1.2rem', fontSize: '0.88rem', fontWeight: 600,
              color: tab === t ? '#00C27C' : '#7BA897',
              borderBottom: tab === t ? '2px solid #00C27C' : '2px solid transparent',
              marginBottom: '-1px', transition: 'all 0.2s',
            }}>{t}</button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'Overview' && (
          <div>
            {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div> : stats && (
              <>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#7BA897' }}>Users</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <StatCard label="Total Users" value={stats.users.total} sub={`+${stats.users.recentSignups} this week`} />
                  <StatCard label="Sellers" value={stats.users.sellers} color="#F5A623" />
                  <StatCard label="Buyers" value={stats.users.buyers} color="#00C27C" />
                  <StatCard label="Influencers" value={stats.users.influencers} color="#a78bfa" />
                </div>

                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#7BA897' }}>Products & Orders</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <StatCard label="Total Products" value={stats.products.total} />
                  <StatCard label="Pending Approval" value={stats.products.pending} color="#ff6b6b" sub="Need review" />
                  <StatCard label="Total Orders" value={stats.orders.total} sub={`+${stats.orders.recentOrders} this week`} />
                  <StatCard label="Revenue (PKR)" value={`${(stats.revenue.total / 1000).toFixed(0)}K`} color="#F5A623" />
                </div>

                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: '#7BA897' }}>Streams</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  <StatCard label="Total Streams" value={stats.streams.total} />
                  <StatCard label="Live Now" value={stats.streams.live} color="#ff4444" />
                </div>

                {stats.products.pending > 0 && (
                  <div style={{ marginTop: '2rem', background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#ff6b6b' }}>⚠️ {stats.products.pending} products pending approval</div>
                      <div style={{ fontSize: '0.8rem', color: '#7BA897', marginTop: '0.25rem' }}>Review and approve seller products</div>
                    </div>
                    <button className="btn btn-primary" style={{ fontSize: '0.82rem' }} onClick={() => { setTab('Products'); setProductFilter('false'); }}>
                      Review Now →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'Users' && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {['', 'buyer', 'seller', 'influencer', 'admin'].map(r => (
                <button key={r} onClick={() => setUserFilter(r)} style={{
                  background: userFilter === r ? 'rgba(0,194,124,0.15)' : '#0D1F19',
                  border: `1px solid ${userFilter === r ? '#00C27C' : 'rgba(0,194,124,0.2)'}`,
                  color: userFilter === r ? '#00C27C' : '#7BA897',
                  padding: '0.3rem 0.9rem', borderRadius: '2rem', fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize',
                }}>{r || 'All'}</button>
              ))}
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0,194,124,0.2)' }}>
                      {['Name', 'Email', 'Role', 'City', 'Joined', 'Status', 'Action'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#7BA897', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} style={{ borderBottom: '1px solid rgba(0,194,124,0.08)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#7BA897' }}>{u.email}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ background: u.role === 'admin' ? 'rgba(167,139,250,0.2)' : u.role === 'seller' ? 'rgba(245,166,35,0.15)' : 'rgba(0,194,124,0.1)', color: u.role === 'admin' ? '#a78bfa' : u.role === 'seller' ? '#F5A623' : '#00C27C', padding: '0.2rem 0.6rem', borderRadius: '0.3rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>{u.role}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#7BA897' }}>{u.city}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#7BA897' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ color: u.isActive ? '#00C27C' : '#ff6b6b', fontWeight: 600, fontSize: '0.75rem' }}>{u.isActive ? '● Active' : '● Banned'}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          {u.role !== 'admin' && (
                            <button onClick={() => toggleUser(u._id, !u.isActive)} style={{ background: u.isActive ? 'rgba(255,107,107,0.15)' : 'rgba(0,194,124,0.15)', border: `1px solid ${u.isActive ? 'rgba(255,107,107,0.3)' : 'rgba(0,194,124,0.3)'}`, color: u.isActive ? '#ff6b6b' : '#00C27C', padding: '0.25rem 0.6rem', borderRadius: '0.35rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                              {u.isActive ? 'Ban' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#7BA897' }}>No users found</div>}
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {tab === 'Products' && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[['false', '⏳ Pending'], ['true', '✅ Approved'], ['', 'All']].map(([val, label]) => (
                <button key={val} onClick={() => setProductFilter(val)} style={{
                  background: productFilter === val ? 'rgba(0,194,124,0.15)' : '#0D1F19',
                  border: `1px solid ${productFilter === val ? '#00C27C' : 'rgba(0,194,124,0.2)'}`,
                  color: productFilter === val ? '#00C27C' : '#7BA897',
                  padding: '0.3rem 0.9rem', borderRadius: '2rem', fontSize: '0.8rem', cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {products.map(p => (
                  <div key={p._id} className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '0.5rem', background: '#0D1F19', overflow: 'hidden', flexShrink: 0 }}>
                        {p.thumbnail ? <img src={p.thumbnail} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '1.5rem' }}>🛍️</div>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.3, marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#7BA897', marginBottom: '0.25rem' }}>
                          {p.seller?.sellerProfile?.storeName || p.seller?.name} · {p.category}
                        </div>
                        <div style={{ fontWeight: 700, color: '#00C27C', fontSize: '0.9rem' }}>PKR {p.price?.toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {!p.isApproved ? (
                        <button onClick={() => handleApproveProduct(p._id)} style={{ background: 'rgba(0,194,124,0.15)', border: '1px solid rgba(0,194,124,0.3)', color: '#00C27C', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>✅ Approve</button>
                      ) : (
                        <span style={{ color: '#00C27C', fontSize: '0.78rem' }}>✅ Approved</span>
                      )}
                      <button onClick={() => handleRejectProduct(p._id)} style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff6b6b', padding: '0.3rem 0.6rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.78rem' }}>❌ Reject</button>
                    </div>
                  </div>
                ))}
                {products.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#7BA897', gridColumn: '1/-1' }}>No products found</div>}
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'Orders' && (
          <div>
            {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0,194,124,0.2)' }}>
                      {['Order #', 'Buyer', 'City', 'Amount', 'Payment', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#7BA897', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o._id} style={{ borderBottom: '1px solid rgba(0,194,124,0.08)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#7BA897' }}>{o.orderNumber || o._id.toString().slice(-6).toUpperCase()}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{o.buyer?.name || '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#7BA897' }}>{o.buyer?.city || '—'}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#00C27C', fontWeight: 700 }}>PKR {o.totalAmount?.toLocaleString()}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#F5A623', textTransform: 'capitalize', fontSize: '0.8rem' }}>{o.paymentMethod || 'COD'}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ background: o.status === 'delivered' ? 'rgba(0,194,124,0.15)' : o.status === 'pending' ? 'rgba(245,166,35,0.15)' : 'rgba(0,194,124,0.08)', color: o.status === 'delivered' ? '#00C27C' : o.status === 'pending' ? '#F5A623' : '#7BA897', padding: '0.2rem 0.6rem', borderRadius: '0.3rem', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>{o.status}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#7BA897', fontSize: '0.78rem' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#7BA897' }}>No orders yet</div>}
              </div>
            )}
          </div>
        )}

        {/* ── SELLERS TAB ── */}
        {tab === 'Sellers' && (
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>🏪 Seller Management</h3>
            {loading ? <div className="spinner" style={{ margin: '2rem auto' }} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sellers.length === 0 && <p style={{ color: '#7BA897', textAlign: 'center', padding: '2rem' }}>No sellers found</p>}
                {sellers.map(s => (
                  <div key={s._id} style={{ background: '#112219', border: '1px solid rgba(0,194,124,0.15)', borderRadius: '0.75rem', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#00C27C', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                      {s.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{s.name} <span style={{ fontSize: '0.75rem', color: '#7BA897' }}>· {s.email}</span></div>
                      <div style={{ fontSize: '0.78rem', color: '#7BA897', marginTop: '0.2rem' }}>
                        📍 {s.city} · Store: {s.sellerProfile?.storeName || 'N/A'} · Joined {new Date(s.createdAt).toLocaleDateString('en-PK')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {s.sellerProfile?.isVerified ? (
                        <span style={{ background: 'rgba(0,194,124,0.15)', border: '1px solid rgba(0,194,124,0.3)', color: '#00C27C', padding: '0.25rem 0.6rem', borderRadius: '0.35rem', fontSize: '0.75rem', fontWeight: 700 }}>✅ Verified</span>
                      ) : (
                        <>
                          <button onClick={() => handleApproveSeller(s._id)} style={{ background: 'rgba(0,194,124,0.15)', border: '1px solid rgba(0,194,124,0.3)', color: '#00C27C', padding: '0.35rem 0.75rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>✅ Approve</button>
                          <button onClick={() => handleRejectSeller(s._id)} style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff6b6b', padding: '0.35rem 0.75rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.8rem' }}>❌ Reject</button>
                        </>
                      )}
                      <a href={`/store/${s._id}`} target="_blank" rel="noopener noreferrer" style={{ color: '#7BA897', fontSize: '0.8rem', textDecoration: 'none' }}>🔗 View Store</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
