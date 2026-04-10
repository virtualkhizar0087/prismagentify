// BuyerOrders.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

function ReturnModal({ order, onClose }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Please provide a reason'); return; }
    setLoading(true);
    try {
      await api.post(`/orders/${order._id}/return`, { reason });
      toast.success('Return request submitted! Seller will review within 48 hours.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Return request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: 440 }}>
        <h3 style={{ marginBottom: '1rem', fontFamily: 'Playfair Display,serif' }}>📦 Request Return</h3>
        <p style={{ color: '#7BA897', fontSize: '0.85rem', marginBottom: '1rem' }}>Order #{order.orderNumber || order._id?.slice(-8).toUpperCase()}</p>
        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '0.82rem', color: '#7BA897', display: 'block', marginBottom: '0.4rem' }}>Reason for return *</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: '100%', background: '#0D1F19', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '0.4rem', padding: '0.6rem', color: '#E8F5F0', marginBottom: '1rem', fontSize: '0.88rem' }}
          >
            <option value="">Select a reason</option>
            <option value="defective">Defective / Damaged product</option>
            <option value="wrong_item">Wrong item received</option>
            <option value="not_as_described">Not as described</option>
            <option value="size_issue">Size / Fit issue</option>
            <option value="changed_mind">Changed my mind</option>
            <option value="other">Other</option>
          </select>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: '#163028', border: '1px solid rgba(0,194,124,0.2)', color: '#7BA897', padding: '0.6rem', borderRadius: '0.5rem', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading || !reason} className="btn btn-primary" style={{ flex: 1 }}>
              {loading ? 'Submitting...' : 'Submit Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BuyerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnOrder, setReturnOrder] = useState(null);
  useEffect(() => { api.get('/orders/my-orders').then(r => { setOrders(r.data.data?.orders || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const statusColor = { placed: '#F5A623', confirmed: '#00C27C', dispatched: '#00C27C', delivered: '#00C27C', cancelled: '#ff6b6b' };

  return (
    <div className="main-content container" style={{ paddingBottom: '3rem' }}>
      {returnOrder && <ReturnModal order={returnOrder} onClose={() => setReturnOrder(null)} />}
      <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.8rem', fontWeight: 700, marginBottom: '1.5rem' }}>My Orders</h2>
      {loading ? <div className="spinner" style={{ margin: '3rem auto' }} /> :
       orders.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📦</div><p>No orders yet. Watch a live stream and buy something!</p></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(o => (
            <div key={o._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#7BA897' }}>{o.orderNumber}</div>
                  <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{o.seller?.sellerProfile?.storeName || o.seller?.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#7BA897', marginTop: '0.25rem' }}>
                    {o.items?.length} item(s) · PKR {o.totalAmount?.toLocaleString()} · {o.paymentMethod?.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#4A7A6A', marginTop: '0.25rem' }}>
                    {new Date(o.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                  <span style={{ background: `${statusColor[o.status]}22`, color: statusColor[o.status] || '#7BA897', padding: '0.2rem 0.6rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'monospace', textTransform: 'capitalize', border: `1px solid ${statusColor[o.status] || '#7BA897'}44` }}>
                    {o.status}
                  </span>
                  {o.trackingNumber && <div style={{ fontSize: '0.75rem', color: '#7BA897' }}>📦 {o.trackingNumber}</div>}
                  {o.status === 'delivered' && (
                    <button onClick={() => setReturnOrder(o)} style={{ background: 'rgba(255,166,0,0.1)', border: '1px solid rgba(255,166,0,0.3)', color: '#F5A623', padding: '0.35rem 0.7rem', borderRadius: '0.4rem', cursor: 'pointer', fontSize: '0.78rem' }}>↩️ Return</button>
                  )}
                </div>
              </div>
              <OrderTimeline status={o.status} statusHistory={o.statusHistory} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderTimeline({ status, statusHistory }) {
  const steps = [
    { key: 'placed', label: 'Order Placed', icon: '📦' },
    { key: 'confirmed', label: 'Confirmed', icon: '✅' },
    { key: 'processing', label: 'Processing', icon: '⚙️' },
    { key: 'shipped', label: 'Shipped', icon: '🚚' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' },
  ];

  const ORDER_FLOW = ['placed','confirmed','processing','shipped','out_for_delivery','delivered'];
  const currentIndex = ORDER_FLOW.indexOf(status);
  const isReturned = status === 'return_requested' || status === 'returned';
  const isCancelled = status === 'cancelled';

  return (
    <div style={{ padding: '0.75rem 0' }}>
      {(isCancelled || isReturned) ? (
        <div style={{ textAlign: 'center', padding: '0.5rem', color: isCancelled ? '#ff6b6b' : '#F5A623', fontSize: '0.85rem', fontWeight: 600 }}>
          {isCancelled ? '❌ Order Cancelled' : '↩️ Return Requested'}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {steps.map((step, i) => {
            const isDone = i <= currentIndex;
            const isCurrent = i === currentIndex;
            return (
              <React.Fragment key={step.key}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52, flexShrink: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: isDone ? '#00C27C' : '#163028', border: `2px solid ${isDone ? '#00C27C' : 'rgba(0,194,124,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isCurrent ? '1rem' : '0.75rem', transition: 'all 0.3s', boxShadow: isCurrent ? '0 0 0 4px rgba(0,194,124,0.2)' : 'none' }}>
                    {isDone ? (i === currentIndex ? step.icon : '✓') : <span style={{ opacity: 0.4, fontSize: '0.7rem' }}>{i + 1}</span>}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: isDone ? '#00C27C' : '#4A7A6A', marginTop: '0.25rem', textAlign: 'center', lineHeight: 1.2, fontWeight: isCurrent ? 700 : 400, whiteSpace: 'nowrap' }}>
                    {step.label}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: i < currentIndex ? '#00C27C' : 'rgba(0,194,124,0.15)', minWidth: 12, transition: 'background 0.3s' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BuyerOrders;
