import React, { useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';

const GIFTS = [
  { id: 'rose', emoji: '🌹', name: 'Rose', price: 50, coins: 5 },
  { id: 'heart', emoji: '❤️', name: 'Heart', price: 100, coins: 10 },
  { id: 'fire', emoji: '🔥', name: 'Fire', price: 200, coins: 20 },
  { id: 'diamond', emoji: '💎', name: 'Diamond', price: 500, coins: 50 },
  { id: 'crown', emoji: '👑', name: 'Crown', price: 1000, coins: 100 },
  { id: 'rocket', emoji: '🚀', name: 'Rocket', price: 2000, coins: 200 },
];

export default function GiftPanel({ streamId, sellerId, socket }) {
  const [sending, setSending] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  const sendGift = async (gift) => {
    if (!isAuthenticated) { toast.error('Login to send gifts'); return; }
    setSending(gift.id);
    try {
      await api.post(`/streams/${streamId}/gift`, {
        giftType: gift.id,
        amount: gift.price,
        receiverId: sellerId,
      });

      // Emit to socket for live animation
      socket?.emit('send_gift', {
        streamId,
        giftType: gift.id,
        giftEmoji: gift.emoji,
        giftName: gift.name,
        amount: gift.price,
        senderName: user?.name,
      });

      toast.success(`${gift.emoji} ${gift.name} sent! PKR ${gift.price}`, { duration: 2000 });
      setShowPanel(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gift failed. Check wallet balance.');
    } finally {
      setSending(null);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={s.giftBtn}
        title="Send a gift"
      >
        🎁 Gift
      </button>

      {showPanel && (
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>🎁 Send a Gift</span>
            <button onClick={() => setShowPanel(false)} style={s.closeBtn}>✕</button>
          </div>
          <div style={s.grid}>
            {GIFTS.map(gift => (
              <button
                key={gift.id}
                onClick={() => sendGift(gift)}
                disabled={sending === gift.id}
                style={s.giftCard}
              >
                <div style={{ fontSize: '1.8rem' }}>{gift.emoji}</div>
                <div style={{ fontSize: '0.72rem', color: '#7BA897', marginTop: '0.2rem' }}>{gift.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#F5A623', fontWeight: 700 }}>PKR {gift.price}</div>
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.7rem', color: '#4A7A6A', padding: '0.5rem 0.75rem', textAlign: 'center' }}>
            Gifts are deducted from your wallet
          </p>
        </div>
      )}
    </div>
  );
}

const s = {
  giftBtn: { background: 'rgba(245,166,35,0.15)', border: '1px solid rgba(245,166,35,0.3)', color: '#F5A623', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 },
  panel: { position: 'absolute', bottom: '100%', right: 0, width: 280, background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '0.5rem', zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', borderBottom: '1px solid rgba(0,194,124,0.15)', background: '#0D1F19' },
  closeBtn: { background: 'none', border: 'none', color: '#7BA897', cursor: 'pointer', fontSize: '0.85rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', padding: '0.75rem' },
  giftCard: { background: '#0D1F19', border: '1px solid rgba(0,194,124,0.15)', borderRadius: '0.5rem', padding: '0.6rem 0.3rem', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s' },
};
