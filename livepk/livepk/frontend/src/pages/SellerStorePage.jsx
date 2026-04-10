import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCartStore, useAuthStore } from '../store';
import toast from 'react-hot-toast';

export default function SellerStorePage() {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [sellerRes, productsRes, streamsRes] = await Promise.all([
          api.get(`/users/${id}`),
          api.get('/products', { params: { seller: id, limit: 24 } }),
          api.get('/streams', { params: { seller: id, limit: 10 } }),
        ]);
        setSeller(sellerRes.data.data);
        setProducts(productsRes.data.data?.products || []);
        setStreams(streamsRes.data.data?.streams || []);
      } catch {
        toast.error('Failed to load store');
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [id]);

  const handleWishlist = async (productId) => {
    if (!isAuthenticated) { toast.error('Login to save'); return; }
    try {
      await api.post('/wishlist', { productId });
      toast.success('❤️ Saved to wishlist!');
    } catch {}
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!seller) return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem', marginTop: 64 }}>
      <h2>Store not found</h2>
      <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>Go Home</Link>
    </div>
  );

  const storeName = seller.sellerProfile?.storeName || seller.name;
  const rating = seller.sellerProfile?.rating || 4.5;
  const totalSales = seller.sellerProfile?.totalSales || 0;
  const isVerified = seller.sellerProfile?.isVerified;

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      {/* Store Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0D1F19, #163028)', borderBottom: '1px solid rgba(0,194,124,0.2)', padding: '2.5rem 1.5rem' }}>
        <div className="container" style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Store Avatar */}
          <div style={{ width: 80, height: 80, borderRadius: '1rem', background: '#00C27C', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, flexShrink: 0, border: '3px solid rgba(0,194,124,0.5)' }}>
            {storeName?.charAt(0)}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700 }}>{storeName}</h1>
              {isVerified && <span style={{ background: 'rgba(0,194,124,0.15)', border: '1px solid rgba(0,194,124,0.3)', color: '#00C27C', padding: '0.2rem 0.6rem', borderRadius: '0.35rem', fontSize: '0.75rem', fontWeight: 700 }}>✅ Verified</span>}
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#7BA897' }}>
              <span>📍 {seller.city}</span>
              <span>⭐ {rating.toFixed(1)} rating</span>
              <span>🛒 {totalSales.toLocaleString()} sales</span>
              <span>📦 {products.length} products</span>
            </div>
            {seller.sellerProfile?.description && (
              <p style={{ color: '#7BA897', fontSize: '0.88rem', marginTop: '0.6rem', maxWidth: 500 }}>{seller.sellerProfile.description}</p>
            )}
          </div>

          {/* Live stream indicator */}
          {streams.some(s => s.status === 'live') && (
            <Link to={`/stream/${streams.find(s => s.status === 'live')._id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.4)', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <span style={{ color: '#ff6b6b', fontSize: '0.8rem' }}>●</span>
                <span style={{ color: '#ff6b6b', fontWeight: 700, fontSize: '0.9rem' }}>LIVE NOW</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid rgba(0,194,124,0.15)', background: '#0D1F19' }}>
        <div className="container" style={{ display: 'flex', gap: '0' }}>
          {['products', 'streams'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', padding: '1rem 1.5rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: tab === t ? 700 : 400, color: tab === t ? '#00C27C' : '#7BA897', borderBottom: tab === t ? '2px solid #00C27C' : '2px solid transparent', textTransform: 'capitalize', fontFamily: 'DM Sans, sans-serif' }}>
              {t === 'products' ? `📦 Products (${products.length})` : `📹 Streams (${streams.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem', paddingBottom: '4rem' }}>
        {tab === 'products' && (
          products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#7BA897' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <p>No products listed yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {products.map(p => (
                <div key={p._id} style={{ background: '#112219', border: '1px solid rgba(0,194,124,0.15)', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <Link to={`/product/${p._id}`}>
                    <div style={{ aspectRatio: '1', background: '#0D1F19', overflow: 'hidden' }}>
                      {p.thumbnail ? <img src={p.thumbnail} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2.5rem' }}>🛍️</div>}
                    </div>
                  </Link>
                  <div style={{ padding: '0.75rem' }}>
                    <Link to={`/product/${p._id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.3rem', color: '#E8F5F0' }}>{p.name}</div>
                    </Link>
                    <div style={{ color: '#00C27C', fontWeight: 700, marginBottom: '0.5rem' }}>PKR {(p.salePrice || p.price)?.toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => { addItem(p); toast.success('Added to cart!'); }} className="btn btn-primary btn-sm" style={{ flex: 1 }}>🛒 Cart</button>
                      <button onClick={() => handleWishlist(p._id)} style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: '#ff6b6b', padding: '0.35rem 0.5rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}>❤️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'streams' && (
          streams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#7BA897' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
              <p>No streams yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {streams.map(s => (
                <Link key={s._id} to={`/stream/${s._id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: '#112219', border: '1px solid rgba(0,194,124,0.15)', borderRadius: '0.75rem', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ aspectRatio: '16/9', background: '#0D1F19', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <span style={{ fontSize: '2.5rem' }}>📹</span>
                      {s.status === 'live' && <div style={{ position: 'absolute', top: 8, left: 8, background: '#ff4444', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.72rem', fontWeight: 700 }}>● LIVE</div>}
                    </div>
                    <div style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem', color: '#E8F5F0' }}>{s.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#7BA897' }}>👁️ {s.totalViews || 0} views · {new Date(s.createdAt).toLocaleDateString('en-PK')}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
