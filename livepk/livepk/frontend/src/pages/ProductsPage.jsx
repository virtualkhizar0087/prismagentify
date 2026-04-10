import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useCartStore } from '../store';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';
import SkeletonCard from '../components/shared/SkeletonCard';

const CATEGORIES = ['All', 'fashion', 'beauty', 'electronics', 'home', 'food', 'kids', 'sports'];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const handleWishlist = async (productId) => {
    if (!isAuthenticated) { toast.error('Login to save to wishlist'); return; }
    try {
      await api.post('/wishlist', { productId });
      toast.success('❤️ Added to wishlist!');
    } catch (err) {
      if (err.response?.status === 409) toast('Already in wishlist', { icon: '❤️' });
      else toast.error('Failed to add to wishlist');
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    setHasMore(true);
    const params = {};
    if (category !== 'All') params.category = category;
    if (search) params.search = search;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sortBy) params.sort = sortBy;
    params.page = 1;
    params.limit = 12;
    api.get('/products', { params })
      .then(r => {
        const data = r.data.data;
        setProducts(data.products || []);
        setHasMore(data.hasMore || data.total > 12);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category, search, minPrice, maxPrice, sortBy]);

  const loadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const params = {};
    if (category !== 'All') params.category = category;
    if (search) params.search = search;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sortBy) params.sort = sortBy;
    params.page = nextPage;
    params.limit = 12;
    try {
      const r = await api.get('/products', { params });
      const newProducts = r.data.data.products || [];
      setProducts(prev => [...prev, ...newProducts]);
      setPage(nextPage);
      setHasMore(newProducts.length === 12);
    } catch {}
    setLoadingMore(false);
  };

  return (
    <div className="main-content">
      <div className="container" style={{ paddingBottom: '4rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="section-label">Browse</div>
          <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
            All Products
          </h1>

          {/* Search */}
          <input
            type="text"
            className="form-input"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 400, marginBottom: '1rem' }}
          />

          {/* Category Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  background: category === cat ? 'rgba(0,194,124,0.15)' : '#0D1F19',
                  border: `1px solid ${category === cat ? '#00C27C' : 'rgba(0,194,124,0.2)'}`,
                  color: category === cat ? '#00C27C' : '#7BA897',
                  padding: '0.35rem 0.9rem',
                  borderRadius: '2rem',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: category === cat ? 600 : 400,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort + Price Row */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.75rem' }}>
            {/* Sort By */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ background: '#0D1F19', border: '1px solid rgba(0,194,124,0.2)', color: '#E8F5F0', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}
            >
              <option value="newest">🕐 Newest</option>
              <option value="price_asc">💰 Price: Low to High</option>
              <option value="price_desc">💰 Price: High to Low</option>
              <option value="rating">⭐ Top Rated</option>
              <option value="popular">🔥 Most Popular</option>
            </select>

            {/* Price Range */}
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input
                type="number"
                value={minPrice}
                onChange={e => setMinPrice(e.target.value)}
                placeholder="Min PKR"
                style={{ width: 90, background: '#0D1F19', border: '1px solid rgba(0,194,124,0.2)', color: '#E8F5F0', padding: '0.4rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.82rem', fontFamily: 'DM Sans,sans-serif' }}
              />
              <span style={{ color: '#4A7A6A', fontSize: '0.8rem' }}>–</span>
              <input
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
                placeholder="Max PKR"
                style={{ width: 90, background: '#0D1F19', border: '1px solid rgba(0,194,124,0.2)', color: '#E8F5F0', padding: '0.4rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.82rem', fontFamily: 'DM Sans,sans-serif' }}
              />
              {(minPrice || maxPrice) && (
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem' }}>✕ Clear</button>
              )}
            </div>

            {/* Active filter count */}
            {(minPrice || maxPrice || sortBy !== 'newest' || category !== 'All') && (
              <button onClick={() => { setMinPrice(''); setMaxPrice(''); setSortBy('newest'); setCategory('All'); setSearch(''); }} style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff6b6b', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {[1,2,3,4,5,6,7,8].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#7BA897' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛍️</div>
            <h3>No products found</h3>
            <p style={{ fontSize: '0.88rem', marginTop: '0.5rem' }}>Try a different category or search term</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {products.map(product => {
              const price = product.salePrice || product.price;
              const discount = product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
              return (
                <div key={product._id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
                  <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ position: 'relative', aspectRatio: '1', background: '#0D1F19', overflow: 'hidden' }}>
                      {product.thumbnail
                        ? <img src={product.thumbnail} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem' }}>🛍️</div>
                      }
                      {discount > 0 && (
                        <div style={{ position: 'absolute', top: 8, left: 8, background: '#ff4444', color: '#fff', fontWeight: 700, fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '0.3rem' }}>
                          -{discount}%
                        </div>
                      )}
                      {product.codAvailable && (
                        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(245,166,35,0.9)', color: '#000', fontWeight: 700, fontSize: '0.65rem', padding: '0.2rem 0.4rem', borderRadius: '0.3rem' }}>
                          COD
                        </div>
                      )}
                    </div>
                  </Link>

                  <div style={{ padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#7BA897', textTransform: 'capitalize', marginBottom: '0.25rem' }}>
                      {product.category}
                    </div>
                    <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.4, marginBottom: '0.4rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.name}
                      </div>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 800, color: '#00C27C', fontSize: '1rem' }}>PKR {price?.toLocaleString()}</span>
                      {product.salePrice && <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: '#4A7A6A' }}>PKR {product.price?.toLocaleString()}</span>}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: '#7BA897', marginBottom: '0.5rem' }}>
                      ⭐ {product.rating?.toFixed(1) || '0'} · {product.totalSold || 0} sold
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => { addItem(product, 1); toast.success(`${product.name} added to cart!`); }}
                      >
                        🛒 Cart
                      </button>
                      <button
                        onClick={() => handleWishlist(product._id)}
                        style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.3)', color: '#ff6b6b', padding: '0.4rem 0.6rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.85rem' }}
                        title="Save to Wishlist"
                      >
                        ❤️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {hasMore && products.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button onClick={loadMore} disabled={loadingMore} style={{ background: 'rgba(0,194,124,0.1)', border: '1px solid rgba(0,194,124,0.3)', color: '#00C27C', padding: '0.75rem 2.5rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'DM Sans,sans-serif' }}>
              {loadingMore ? '⏳ Loading...' : '⬇️ Load More Products'}
            </button>
          </div>
        )}
        {!hasMore && products.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2rem', color: '#4A7A6A', fontSize: '0.85rem' }}>
            ✅ All products loaded
          </div>
        )}
      </div>
    </div>
  );
}
