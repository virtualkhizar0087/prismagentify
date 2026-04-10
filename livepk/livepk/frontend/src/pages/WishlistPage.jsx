import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistAPI } from '../services/api';

const WishlistPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await wishlistAPI.get();
      setItems(res.data.data || []);
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId) => {
    try {
      await wishlistAPI.remove(productId);
      setItems(items.filter(i => i.product?._id !== productId));
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  if (loading) return <div style={styles.loading}>Loading wishlist...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>❤️ My Wishlist ({items.length})</h1>

      {items.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💔</div>
          <h2>Your wishlist is empty</h2>
          <p>Save products you love to buy them later!</p>
          <Link to="/products" style={styles.btn}>Browse Products</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {items.map(item => {
            const product = item.product;
            if (!product) return null;
            const price = product.salePrice || product.price;
            const hasDiscount = product.salePrice && product.salePrice < product.price;

            return (
              <div key={item._id} style={styles.card}>
                <div style={styles.imgWrapper}>
                  {product.thumbnail ? (
                    <img src={product.thumbnail} alt={product.name} style={styles.img} />
                  ) : (
                    <div style={styles.noImg}>📦</div>
                  )}
                  {!product.isActive && <div style={styles.badge}>Unavailable</div>}
                  {product.stock === 0 && <div style={styles.badgeRed}>Out of Stock</div>}
                </div>

                <div style={styles.info}>
                  <h3 style={styles.name}>{product.name}</h3>
                  <div style={styles.priceRow}>
                    <span style={styles.price}>PKR {price?.toLocaleString()}</span>
                    {hasDiscount && (
                      <span style={styles.oldPrice}>PKR {product.price?.toLocaleString()}</span>
                    )}
                  </div>
                  <div style={styles.rating}>
                    {'⭐'.repeat(Math.round(product.rating || 0))} ({product.rating?.toFixed(1) || 0})
                  </div>
                  <div style={styles.actions}>
                    <Link to={`/products/${product._id}`} style={styles.viewBtn}>View Product</Link>
                    <button onClick={() => removeItem(product._id)} style={styles.removeBtn}>🗑️ Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '24px 16px' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#1a1a1a' },
  loading: { textAlign: 'center', padding: 60, color: '#888' },
  empty: { textAlign: 'center', padding: '60px 20px', color: '#666' },
  btn: { display: 'inline-block', marginTop: 16, padding: '12px 28px', background: '#E53E3E', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'transform 0.2s' },
  imgWrapper: { position: 'relative', height: 200, background: '#f8f8f8', overflow: 'hidden' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  noImg: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 },
  badge: { position: 'absolute', top: 8, left: 8, background: '#666', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11 },
  badgeRed: { position: 'absolute', top: 8, left: 8, background: '#E53E3E', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11 },
  info: { padding: 16 },
  name: { fontSize: 15, fontWeight: '600', marginBottom: 8, color: '#1a1a1a', lineHeight: 1.4 },
  priceRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#E53E3E' },
  oldPrice: { fontSize: 13, color: '#aaa', textDecoration: 'line-through' },
  rating: { fontSize: 12, color: '#888', marginBottom: 12 },
  actions: { display: 'flex', gap: 8 },
  viewBtn: { flex: 1, padding: '8px', background: '#E53E3E', color: '#fff', borderRadius: 6, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: '600' },
  removeBtn: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13, color: '#666' },
};

export default WishlistPage;
