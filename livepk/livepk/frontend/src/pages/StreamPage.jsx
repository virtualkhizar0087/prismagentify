import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStreamStore, useAuthStore, useCartStore } from '../store';
import { getSocket, joinStream, leaveStream, sendChatMessage, likeStream } from '../services/socket';
import toast from 'react-hot-toast';
import AgoraVideo from '../components/stream/AgoraVideo';
import AuctionPanel from '../components/stream/AuctionPanel';
import GiftPanel from '../components/stream/GiftPanel';

export default function StreamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchStream, currentStream, isLoading, viewerCount, chatMessages,
          pinnedProduct, flashSale, setViewerCount, addChatMessage, setPinnedProduct,
          setFlashSale, clearStream } = useStreamStore();
  const { user, isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();

  const [chatInput, setChatInput] = useState('');
  const [liked, setLiked] = useState(false);
  const [flashTimer, setFlashTimer] = useState(null);
  const chatEndRef = useRef(null);
  const socket = getSocket();

  // ── Load stream & join socket room ──
  useEffect(() => {
    fetchStream(id);

    socket.emit('join_stream', { streamId: id, userId: user?._id, userName: user?.name || 'Viewer' });

    // Socket listeners
    socket.on('viewer_update', ({ count }) => setViewerCount(count));
    socket.on('chat_message', (msg) => addChatMessage(msg));
    socket.on('system_message', (msg) => addChatMessage({ ...msg, id: Date.now(), type: 'system' }));
    socket.on('product_pinned', ({ product }) => setPinnedProduct(product));
    socket.on('flash_sale_alert', (sale) => {
      setFlashSale(sale);
      toast(`🔥 ${sale.message}`, { duration: 5000 });
      const secs = Math.floor((new Date(sale.endsAt) - Date.now()) / 1000);
      setFlashTimer(secs);
    });
    socket.on('order_notification', ({ message }) => {
      toast.success(message, { duration: 3000 });
    });
    socket.on('stream_ended', () => {
      toast('Stream has ended', { icon: '📴' });
    });
    socket.on('gift_received', ({ senderName, giftEmoji, giftName, amount }) => {
      toast(`${giftEmoji} ${senderName} sent a ${giftName}! PKR ${amount}`, { duration: 3000, icon: '🎁' });
      addChatMessage({ id: Date.now(), type: 'system', message: `🎁 ${senderName} sent ${giftEmoji} ${giftName} (PKR ${amount})` });
    });

    return () => {
      leaveStream(id);
      socket.off('viewer_update');
      socket.off('chat_message');
      socket.off('system_message');
      socket.off('product_pinned');
      socket.off('flash_sale_alert');
      socket.off('order_notification');
      socket.off('stream_ended');
      socket.off('gift_received');
      clearStream();
    };
  }, [id]);

  // ── Flash sale countdown ──
  useEffect(() => {
    if (flashTimer === null) return;
    if (flashTimer <= 0) { setFlashSale(null); setFlashTimer(null); return; }
    const t = setTimeout(() => setFlashTimer(t => t - 1), 1000);
    return () => clearTimeout(t);
  }, [flashTimer]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (!isAuthenticated) { toast.error('Login to chat'); return; }
    sendChatMessage(id, chatInput, user?._id, user?.name);
    setChatInput('');
  };

  const handleLike = () => {
    likeStream(id);
    setLiked(true);
    setTimeout(() => setLiked(false), 1000);
  };

  const handleAddToCart = (product) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
    if (currentStream?.status === 'live') {
      socket.emit('order_placed', {
        streamId: id, buyerName: user?.name,
        productName: product.name, amount: product.price
      });
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#7BA897' }}>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!currentStream) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 2rem', marginTop: 64 }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
        <h2>Stream not found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          Back to Home
        </button>
      </div>
    );
  }

  const stream = currentStream;
  const isLive = stream.status === 'live';

  return (
    <div style={styles.page}>
      {/* ── LEFT: Video + Info ── */}
      <div style={styles.videoCol}>
        {/* Video Player */}
        <div style={styles.videoWrap}>
          {isLive ? (
            <div style={styles.livePlayer}>
              <AgoraVideo
                streamId={id}
                channelName={stream.agoraChannel || `livepk_${id}`}
                isHost={user?._id === stream.seller?._id}
                userId={user?._id || 0}
              />
            </div>
          ) : stream.recordingUrl ? (
            <video src={stream.recordingUrl} controls style={{ width: '100%', borderRadius: '0.75rem' }} />
          ) : (
            <div style={styles.livePlaceholder}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                {stream.status === 'scheduled' ? '📅' : '📼'}
              </div>
              <p style={{ color: '#7BA897' }}>
                {stream.status === 'scheduled' ? 'Stream not started yet' : 'No recording available'}
              </p>
              {stream.scheduledAt && (
                <p style={{ color: '#F5A623', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Starts: {new Date(stream.scheduledAt).toLocaleString('en-PK')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Flash Sale Banner */}
        {flashSale && (
          <div style={styles.flashBanner}>
            <span style={{ fontSize: '1.2rem' }}>🔥</span>
            <div>
              <div style={{ fontWeight: 700 }}>{flashSale.message}</div>
              {flashTimer !== null && (
                <div style={{ fontSize: '0.8rem', color: '#F5A623', marginTop: '0.2rem' }}>
                  ⏱️ Ends in {Math.floor(flashTimer / 60)}:{String(flashTimer % 60).padStart(2, '0')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auction Panel */}
        <AuctionPanel streamId={id} socket={socket} />

        {/* Stream Info */}
        <div style={styles.streamInfo}>
          <div style={styles.streamHeader}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                {isLive ? (
                  <span className="badge badge-live">LIVE</span>
                ) : (
                  <span className="badge badge-green">{stream.status}</span>
                )}
                <span className="badge badge-gold">{stream.category}</span>
              </div>
              <h1 style={styles.streamTitle}>{stream.title}</h1>
              {stream.description && <p style={styles.streamDesc}>{stream.description}</p>}
            </div>

            <div style={styles.streamActions}>
              <button
                onClick={handleLike}
                style={{ ...styles.actionBtn, ...(liked ? styles.actionBtnActive : {}) }}
              >
                ❤️ {stream.likes || 0}
              </button>
              <button style={styles.actionBtn} onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success('Link copied!');
              }}>
                🔗 Share
              </button>
              <a
                href={`https://wa.me/?text=Watch this live stream on LivePK! ${window.location.href}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 600 }}
              >
                📱 WhatsApp
              </a>
              {isAuthenticated && isLive && (
                <GiftPanel streamId={id} sellerId={stream.seller?._id} socket={socket} />
              )}
            </div>
          </div>

          {/* Seller Info */}
          <div style={styles.sellerRow}>
            <div style={styles.sellerAvatarLg}>{stream.seller?.name?.charAt(0)}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{stream.seller?.sellerProfile?.storeName || stream.seller?.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#7BA897', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <span>📍 {stream.seller?.city}</span>
                <span>·</span>
                <span>⭐ {stream.seller?.sellerProfile?.rating?.toFixed(1) || '4.5'}</span>
                <span>·</span>
                {stream.seller?.sellerProfile?.totalSales > 100 ? (
                  <span style={{ background: 'rgba(0,194,124,0.15)', border: '1px solid rgba(0,194,124,0.3)', color: '#00C27C', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 700 }}>✅ Verified Seller</span>
                ) : (
                  <span style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)', color: '#F5A623', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.7rem' }}>🆕 New Seller</span>
                )}
                {stream.seller?.sellerProfile?.totalSales > 0 && (
                  <span style={{ color: '#4A7A6A', fontSize: '0.7rem' }}>{stream.seller.sellerProfile.totalSales} sales</span>
                )}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#7BA897' }}>👁️ {viewerCount} watching</span>
            </div>
          </div>
        </div>

        {/* ── Products List ── */}
        {stream.products?.length > 0 && (
          <div style={styles.productsSection}>
            <div className="section-label">Featured Products</div>
            <div style={styles.productGrid}>
              {stream.products.map((item) => {
                const p = item.product;
                if (!p) return null;
                const isPinned = item.isPinned;
                return (
                  <div key={p._id} style={{ ...styles.productCard, ...(isPinned ? styles.productCardPinned : {}) }}>
                    {isPinned && <div style={styles.pinnedBadge}>📌 Now Showing</div>}
                    <div style={styles.productThumb}>
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2rem' }}>🛍️</div>
                      )}
                    </div>
                    <div style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.35rem' }}>{p.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                        {item.streamPrice && item.streamPrice < p.price ? (
                          <>
                            <span style={{ color: '#00C27C', fontWeight: 700 }}>PKR {item.streamPrice?.toLocaleString()}</span>
                            <span style={{ textDecoration: 'line-through', color: '#4A7A6A', fontSize: '0.8rem' }}>PKR {p.price?.toLocaleString()}</span>
                          </>
                        ) : (
                          <span style={{ color: '#00C27C', fontWeight: 700 }}>PKR {p.price?.toLocaleString()}</span>
                        )}
                      </div>
                      <button
                        className="btn btn-primary btn-sm btn-full"
                        onClick={() => handleAddToCart(p)}
                      >
                        🛒 Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Live Chat ── */}
      <div style={styles.chatCol}>
        <div style={styles.chatHeader}>
          <span style={{ fontWeight: 600 }}>💬 Live Chat</span>
          <span style={{ fontSize: '0.78rem', color: '#7BA897' }}>{viewerCount} watching</span>
        </div>

        <div style={styles.chatMessages}>
          {chatMessages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#4A7A6A', fontSize: '0.85rem' }}>
              No messages yet. Say hello! 👋
            </div>
          )}
          {chatMessages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} currentUserId={user?._id} />
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendChat} style={styles.chatForm}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={isAuthenticated ? 'Say something... (Urdu/English)' : 'Login to chat'}
            disabled={!isAuthenticated}
            maxLength={200}
            style={styles.chatInput}
          />
          <button type="submit" style={styles.chatSendBtn} disabled={!isAuthenticated || !chatInput.trim()}>
            ➤
          </button>
        </form>

        {!isAuthenticated && (
          <div style={styles.loginPrompt}>
            <a href="/login" style={{ color: '#00C27C' }}>Login</a> to chat and buy
          </div>
        )}

        {/* Pinned Product in Chat */}
        {pinnedProduct && (
          <div style={styles.pinnedInChat}>
            <div style={{ fontSize: '0.7rem', color: '#F5A623', marginBottom: '0.3rem', fontFamily: 'monospace' }}>📌 PINNED PRODUCT</div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{pinnedProduct.name}</div>
            <div style={{ color: '#00C27C', fontWeight: 700, fontSize: '0.9rem' }}>PKR {pinnedProduct.price?.toLocaleString()}</div>
            <button className="btn btn-primary btn-sm btn-full" style={{ marginTop: '0.5rem' }} onClick={() => handleAddToCart(pinnedProduct)}>
              Buy Now 🛒
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMessage({ msg, currentUserId }) {
  const isSystem = msg.type === 'system' || msg.type === 'join';
  const isOwn = msg.userId === currentUserId;

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#4A7A6A', padding: '0.3rem 0' }}>
        {msg.message}
      </div>
    );
  }

  return (
    <div style={{ padding: '0.3rem 0', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: isOwn ? '#00C27C' : '#163028',
        color: isOwn ? '#000' : '#7BA897',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, marginTop: 2
      }}>
        {msg.userName?.charAt(0) || '?'}
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isOwn ? '#00C27C' : '#7BA897' }}>
          {msg.userName || 'Viewer'}
        </span>
        {' '}
        <span style={{ fontSize: '0.85rem', color: '#E8F5F0', wordBreak: 'break-word' }}>{msg.message}</span>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 0, minHeight: '100vh', paddingTop: 64, background: '#050D0A' },
  videoCol: { padding: '1.5rem', overflowY: 'auto' },
  chatCol: { borderLeft: '1px solid rgba(0,194,124,0.2)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', position: 'sticky', top: 64 },
  videoWrap: { marginBottom: '1rem' },
  livePlayer: { width: '100%', aspectRatio: '16/9', background: '#0D1F19', borderRadius: '0.75rem', overflow: 'hidden', position: 'relative' },
  livePlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  liveIndicator: { position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.8)', borderRadius: '0.3rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#fff' },
  flashBanner: { background: 'linear-gradient(135deg, rgba(255,68,68,0.2), rgba(245,166,35,0.15))', border: '1px solid rgba(255,68,68,0.4)', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' },
  streamInfo: { background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' },
  streamHeader: { display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  streamTitle: { fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.3 },
  streamDesc: { color: '#7BA897', fontSize: '0.88rem', marginTop: '0.4rem' },
  streamActions: { display: 'flex', gap: '0.5rem', flexShrink: 0 },
  actionBtn: { background: '#163028', border: '1px solid rgba(0,194,124,0.2)', color: '#7BA897', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s' },
  actionBtnActive: { background: 'rgba(255,100,100,0.2)', color: '#ff6b6b', borderColor: 'rgba(255,100,100,0.4)' },
  sellerRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,194,124,0.1)' },
  sellerAvatarLg: { width: 40, height: 40, borderRadius: '50%', background: '#00C27C', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 },
  productsSection: { background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '0.75rem', padding: '1.25rem' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginTop: '0.75rem' },
  productCard: { background: '#0D1F19', border: '1px solid rgba(0,194,124,0.15)', borderRadius: '0.5rem', overflow: 'hidden', transition: 'border-color 0.2s' },
  productCardPinned: { border: '1px solid #F5A623', boxShadow: '0 0 12px rgba(245,166,35,0.2)' },
  pinnedBadge: { background: 'rgba(245,166,35,0.15)', color: '#F5A623', padding: '0.25rem 0.75rem', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'monospace' },
  productThumb: { aspectRatio: '1', background: '#163028', overflow: 'hidden' },
  chatHeader: { padding: '1rem 1.25rem', borderBottom: '1px solid rgba(0,194,124,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0D1F19' },
  chatMessages: { flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' },
  chatForm: { display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem', borderTop: '1px solid rgba(0,194,124,0.15)', background: '#0D1F19' },
  chatInput: { flex: 1, background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', color: '#E8F5F0', fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif" },
  chatSendBtn: { background: '#00C27C', border: 'none', color: '#000', width: 38, height: 38, borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', flexShrink: 0 },
  loginPrompt: { textAlign: 'center', padding: '0.5rem', fontSize: '0.8rem', color: '#4A7A6A', background: '#0D1F19' },
  pinnedInChat: { margin: '0 1rem 1rem', background: '#0D1F19', border: '1px solid rgba(245,166,35,0.3)', borderRadius: '0.6rem', padding: '0.85rem' },
};
