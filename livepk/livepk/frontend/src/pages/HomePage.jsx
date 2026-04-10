import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStreamStore } from '../store';
import api from '../services/api';

const CATEGORIES = ['All', 'fashion', 'beauty', 'electronics', 'home', 'food', 'kids', 'sports'];

export default function HomePage() {
  const { streams, fetchStreams, isLoading } = useStreamStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState('All');
  const status = searchParams.get('status') || 'live';

  useEffect(() => {
    const params = { status };
    if (category !== 'All') params.category = category;
    fetchStreams(params);
    const interval = setInterval(() => fetchStreams(params), 30000);
    return () => clearInterval(interval);
  }, [status, category]);

  return (
    <div className="main-content">
      {/* Hero Banner */}
      <div style={styles.hero}>
        <div className="container">
          <div style={styles.heroInner}>
            <div>
              <div className="section-label">Pakistan's Live Commerce Platform</div>
              <h1 style={styles.heroTitle}>
                Shop Live.<br/>
                <span style={{ color: '#00C27C' }}>Buy Direct.</span>
              </h1>
              <p style={styles.heroSub}>Watch influencers review products live. Buy instantly. COD available nationwide.</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                <Link to="/register?role=seller" className="btn btn-primary btn-lg">Start Selling Live</Link>
                <Link to="/register?role=influencer" className="btn btn-outline btn-lg">Become an Influencer</Link>
              </div>
            </div>
            <div style={styles.heroStats}>
              {[
                { num: '1.2M+', label: 'Orders via Live' },
                { num: '5,000+', label: 'Active Sellers' },
                { num: '98%', label: 'COD Available' },
              ].map(s => (
                <div key={s.label} style={styles.heroStat}>
                  <div style={styles.heroStatNum}>{s.num}</div>
                  <div style={styles.heroStatLabel}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: '4rem' }}>
        {/* Tabs */}
        <div style={styles.tabs}>
          {['live', 'scheduled', 'ended'].map(s => (
            <button
              key={s}
              onClick={() => setSearchParams({ status: s })}
              style={{ ...styles.tab, ...(status === s ? styles.tabActive : {}) }}
            >
              {s === 'live' && <span style={{ color: '#ff6b6b' }}>🔴 </span>}
              {s === 'live' ? 'LIVE NOW' : s === 'scheduled' ? '📅 Upcoming' : '📼 Replays'}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div style={styles.categories}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{ ...styles.catBtn, ...(category === c ? styles.catBtnActive : {}) }}
            >
              {c === 'All' ? '🌟 All' : c}
            </button>
          ))}
        </div>

        {/* Stream Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: '#7BA897' }}>Loading streams...</p>
          </div>
        ) : streams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{status === 'live' ? '📡' : '📅'}</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No {status} streams right now</h3>
            <p>Check back soon or browse upcoming streams</p>
          </div>
        ) : (
          <div style={styles.streamGrid}>
            {streams.map(stream => (
              <StreamCard key={stream._id} stream={stream} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StreamCard({ stream }) {
  const isLive = stream.status === 'live';
  return (
    <Link to={`/stream/${stream._id}`} style={styles.card}>
      {/* Thumbnail */}
      <div style={styles.cardThumb}>
        {stream.thumbnail ? (
          <img src={stream.thumbnail} alt={stream.title} style={styles.cardImg} />
        ) : (
          <div style={styles.cardImgPlaceholder}>
            {stream.category === 'fashion' ? '👗' : stream.category === 'beauty' ? '💄' : stream.category === 'electronics' ? '📱' : '🛍️'}
          </div>
        )}
        {isLive && (
          <div style={styles.liveBadge}>
            <span style={{ color: '#ff6b6b' }}>●</span> LIVE
          </div>
        )}
        {isLive && (
          <div style={styles.viewerBadge}>
            👁️ {stream.viewerCount?.toLocaleString() || 0}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={styles.cardInfo}>
        <div style={styles.cardSeller}>
          <div style={styles.sellerAvatar}>
            {stream.seller?.name?.charAt(0)}
          </div>
          <div>
            <div style={styles.storeName}>
              {stream.seller?.sellerProfile?.storeName || stream.seller?.name}
              {stream.seller?.sellerProfile?.isVerified && ' ✓'}
            </div>
            <div style={styles.cityLabel}>{stream.seller?.city}</div>
          </div>
        </div>
        <h3 style={styles.cardTitle}>{stream.title}</h3>
        <div style={styles.cardMeta}>
          <span style={styles.catTag}>{stream.category}</span>
          {stream.products?.length > 0 && (
            <span style={styles.productCount}>{stream.products.length} products</span>
          )}
        </div>
        {stream.status === 'scheduled' && stream.scheduledAt && (
          <div style={styles.scheduledTime}>
            📅 {new Date(stream.scheduledAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </Link>
  );
}

const styles = {
  hero: {
    borderBottom: '1px solid rgba(0,194,124,0.15)',
    padding: '3rem 0',
    marginBottom: '2rem',
    background: 'linear-gradient(180deg, rgba(0,194,124,0.05) 0%, transparent 100%)',
  },
  heroInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '3rem',
    flexWrap: 'wrap',
  },
  heroTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 900,
    letterSpacing: '-2px',
    lineHeight: 1.1,
    margin: '0.75rem 0',
  },
  heroSub: { color: '#7BA897', maxWidth: 420, fontSize: '1rem' },
  heroStats: { display: 'flex', gap: '2rem', flexWrap: 'wrap' },
  heroStat: { textAlign: 'center' },
  heroStatNum: { fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 900, color: '#00C27C' },
  heroStatLabel: { fontSize: '0.78rem', color: '#7BA897', marginTop: '0.2rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(0,194,124,0.15)', paddingBottom: '0.5rem' },
  tab: { background: 'none', border: 'none', color: '#7BA897', padding: '0.5rem 1rem', fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', cursor: 'pointer', borderRadius: '0.4rem', fontWeight: 600, letterSpacing: '0.05em' },
  tabActive: { background: 'rgba(0,194,124,0.15)', color: '#00C27C' },
  categories: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' },
  catBtn: { background: '#112219', border: '1px solid rgba(0,194,124,0.2)', color: '#7BA897', padding: '0.35rem 0.85rem', borderRadius: '2rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500, textTransform: 'capitalize', transition: 'all 0.2s' },
  catBtnActive: { background: 'rgba(0,194,124,0.2)', borderColor: '#00C27C', color: '#00C27C' },
  streamGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' },
  card: { background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '0.75rem', overflow: 'hidden', textDecoration: 'none', color: '#E8F5F0', transition: 'transform 0.2s, border-color 0.2s', display: 'block' },
  cardThumb: { position: 'relative', aspectRatio: '16/9', background: '#0D1F19', overflow: 'hidden' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' },
  liveBadge: { position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.8)', borderRadius: '0.3rem', padding: '0.2rem 0.5rem', fontSize: '0.72rem', fontFamily: "'Space Mono', monospace", fontWeight: 700, color: '#fff' },
  viewerBadge: { position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', borderRadius: '0.3rem', padding: '0.2rem 0.5rem', fontSize: '0.72rem', color: '#fff' },
  cardInfo: { padding: '1rem' },
  cardSeller: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' },
  sellerAvatar: { width: 28, height: 28, borderRadius: '50%', background: '#00C27C', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 },
  storeName: { fontSize: '0.82rem', fontWeight: 600 },
  cityLabel: { fontSize: '0.72rem', color: '#7BA897' },
  cardTitle: { fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.4, marginBottom: '0.6rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardMeta: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  catTag: { background: 'rgba(0,194,124,0.1)', color: '#00C27C', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.72rem', fontWeight: 500, textTransform: 'capitalize' },
  productCount: { fontSize: '0.72rem', color: '#7BA897' },
  scheduledTime: { fontSize: '0.78rem', color: '#F5A623', marginTop: '0.5rem' },
};
