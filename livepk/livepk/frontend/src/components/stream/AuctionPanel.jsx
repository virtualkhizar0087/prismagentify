import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store';
import toast from 'react-hot-toast';

export default function AuctionPanel({ streamId, socket }) {
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Fetch active auction for this stream
    api.get(`/auctions?streamId=${streamId}&status=active`)
      .then(r => {
        const auctions = r.data.data?.auctions || [];
        if (auctions.length > 0) setAuction(auctions[0]);
      })
      .catch(() => {});

    // Socket listeners
    if (socket) {
      socket.on('auction_update', (data) => {
        if (data.auctionId === auction?._id || data.streamId === streamId) {
          setAuction(prev => prev ? { ...prev, ...data } : data);
        }
      });
      socket.on('new_bid', (data) => {
        if (data.auctionId === auction?._id) {
          setAuction(prev => prev ? { ...prev, currentPrice: data.amount, bidCount: (prev.bidCount || 0) + 1, highestBidder: data.bidderName } : prev);
          toast(`🔨 ${data.bidderName} bid PKR ${data.amount.toLocaleString()}!`, { duration: 2000 });
        }
      });
    }

    return () => {
      socket?.off('auction_update');
      socket?.off('new_bid');
    };
  }, [streamId, socket]);

  const handleBid = async () => {
    if (!isAuthenticated) { toast.error('Login to bid'); return; }
    if (!bidAmount || isNaN(bidAmount)) { toast.error('Enter valid bid amount'); return; }
    const amount = Number(bidAmount);
    if (amount <= (auction?.currentPrice || auction?.startingPrice || 0)) {
      toast.error(`Bid must be higher than PKR ${(auction?.currentPrice || auction?.startingPrice).toLocaleString()}`);
      return;
    }
    setLoading(true);
    try {
      await api.post(`/auctions/${auction._id}/bid`, { amount });
      setAuction(prev => ({ ...prev, currentPrice: amount, highestBidder: user?.name }));
      setBidAmount('');
      toast.success('🔨 Bid placed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bid failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { toast.error('Login to buy'); return; }
    if (!auction?.buyNowPrice) return;
    setLoading(true);
    try {
      await api.post(`/auctions/${auction._id}/buy-now`);
      toast.success('🎉 Item purchased!');
      setAuction(prev => ({ ...prev, status: 'ended' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  if (!auction) return null;

  const timeLeft = auction.endsAt ? Math.max(0, Math.floor((new Date(auction.endsAt) - Date.now()) / 1000)) : 0;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <span style={{ color: '#F5A623', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'monospace' }}>🔨 LIVE AUCTION</span>
        {auction.status === 'active' && (
          <span style={{ color: '#ff6b6b', fontSize: '0.78rem', fontFamily: 'monospace' }}>
            ⏱️ {mins}:{String(secs).padStart(2, '0')}
          </span>
        )}
      </div>

      <div style={{ padding: '0.75rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{auction.title}</div>

        <div style={s.priceRow}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#7BA897' }}>Current Bid</div>
            <div style={{ color: '#00C27C', fontWeight: 700, fontSize: '1.2rem' }}>
              PKR {(auction.currentPrice || auction.startingPrice || 0).toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: '#7BA897' }}>Bids</div>
            <div style={{ fontWeight: 700 }}>{auction.bidCount || 0}</div>
          </div>
        </div>

        {auction.highestBidder && (
          <div style={{ fontSize: '0.75rem', color: '#7BA897', marginBottom: '0.5rem' }}>
            👑 Leading: {auction.highestBidder}
          </div>
        )}

        {auction.status === 'active' && (
          <>
            <div style={s.bidRow}>
              <input
                type="number"
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                placeholder={`Min PKR ${((auction.currentPrice || auction.startingPrice || 0) + (auction.minIncrement || 50)).toLocaleString()}`}
                style={s.bidInput}
              />
              <button onClick={handleBid} disabled={loading} style={s.bidBtn}>
                {loading ? '...' : 'Bid'}
              </button>
            </div>

            {auction.buyNowPrice && (
              <button onClick={handleBuyNow} disabled={loading} style={s.buyNowBtn}>
                ⚡ Buy Now — PKR {auction.buyNowPrice.toLocaleString()}
              </button>
            )}
          </>
        )}

        {auction.status === 'ended' && (
          <div style={{ textAlign: 'center', padding: '0.5rem', color: '#F5A623', fontSize: '0.85rem', fontWeight: 600 }}>
            🏁 Auction Ended
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  panel: { background: '#112219', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1rem' },
  header: { background: 'rgba(245,166,35,0.1)', padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(245,166,35,0.2)' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' },
  bidRow: { display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' },
  bidInput: { flex: 1, background: '#0D1F19', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '0.4rem', padding: '0.5rem', color: '#E8F5F0', fontSize: '0.85rem' },
  bidBtn: { background: '#F5A623', border: 'none', color: '#000', padding: '0.5rem 0.9rem', borderRadius: '0.4rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' },
  buyNowBtn: { width: '100%', background: 'rgba(0,194,124,0.15)', border: '1px solid rgba(0,194,124,0.3)', color: '#00C27C', padding: '0.5rem', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' },
};
