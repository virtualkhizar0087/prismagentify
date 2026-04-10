// CartDrawer.jsx
import React from 'react';
import { useCartStore, useAuthStore } from '../../store';
import { Link } from 'react-router-dom';

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity } = useCartStore();
  const subtotal = items.reduce((s, i) => s + ((i.product.salePrice || i.product.price) * i.quantity), 0);

  if (!isOpen) return null;

  return (
    <>
      <div onClick={toggleCart} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, background: '#112219', borderLeft: '1px solid rgba(0,194,124,0.2)', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,194,124,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: '1.2rem' }}>🛍️ Cart ({items.length})</span>
          <button onClick={toggleCart} style={{ background: 'none', border: 'none', color: '#7BA897', fontSize: '1.3rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#7BA897' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
              <p>Your cart is empty</p>
              <p style={{ fontSize: '0.82rem', marginTop: '0.5rem', color: '#4A7A6A' }}>Watch a live stream and add products!</p>
            </div>
          ) : items.map(item => (
            <div key={item.key} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid rgba(0,194,124,0.08)' }}>
              <div style={{ width: 56, height: 56, background: '#0D1F19', borderRadius: '0.4rem', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                {item.product.thumbnail ? <img src={item.product.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.4rem' }} /> : '🛍️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.2rem' }}>{item.product.name}</div>
                <div style={{ color: '#00C27C', fontWeight: 700, fontSize: '0.85rem' }}>PKR {(item.product.salePrice || item.product.price)?.toLocaleString()}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <button onClick={() => updateQuantity(item.key, item.quantity - 1)} style={{ background: '#163028', border: '1px solid rgba(0,194,124,0.2)', color: '#E8F5F0', width: 24, height: 24, borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.9rem' }}>−</button>
                  <span style={{ fontSize: '0.85rem', minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.key, item.quantity + 1)} style={{ background: '#163028', border: '1px solid rgba(0,194,124,0.2)', color: '#E8F5F0', width: 24, height: 24, borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.9rem' }}>+</button>
                  <button onClick={() => removeItem(item.key)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(0,194,124,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem', color: '#7BA897' }}>
              <span>Subtotal</span><span>PKR {subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 700 }}>
              <span>Shipping</span><span style={{ color: '#00C27C' }}>{subtotal >= 2000 ? 'FREE' : 'PKR 200'}</span>
            </div>
            <Link to="/checkout" onClick={toggleCart} className="btn btn-primary btn-full btn-lg">
              Checkout → PKR {(subtotal + (subtotal >= 2000 ? 0 : 200)).toLocaleString()}
            </Link>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#4A7A6A', marginTop: '0.75rem' }}>✅ Cash on Delivery Available</p>
          </div>
        )}
      </div>
    </>
  );
}
