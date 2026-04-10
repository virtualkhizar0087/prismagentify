import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useCartStore } from '../../store';
import toast from 'react-hot-toast';
import { getSocket } from '../../services/socket';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items, toggleCart } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out!');
    navigate('/');
  };

  const getDashboardLink = () => {
    if (user?.role === 'seller') return '/seller';
    if (user?.role === 'influencer') return '/influencer';
    return '/orders';
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoText}>Dikh<span style={{color:'#00C27C'}}>aao</span></span>
          <span style={styles.logoDot}>🔴</span>
        </Link>

        {/* Center Nav */}
        <div style={styles.links}>
          <Link to="/?status=live" style={styles.link}>Live Now</Link>
          <Link to="/?status=scheduled" style={styles.link}>Upcoming</Link>
          <Link to="/products" style={styles.link}>Products</Link>
          {isAuthenticated && (
            <Link to={getDashboardLink()} style={styles.link}>
              {user?.role === 'seller' ? 'My Store' : user?.role === 'influencer' ? 'My Stats' : 'My Orders'}
            </Link>
          )}
        </div>

        {/* Right Actions */}
        <div style={styles.actions}>
          {isAuthenticated && <NotificationBell socket={getSocket()} user={user} />}
          {/* Cart */}
          <button onClick={toggleCart} style={styles.iconBtn} title="Cart">
            🛍️
            {totalItems > 0 && (
              <span style={styles.cartBadge}>{totalItems}</span>
            )}
          </button>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          {isAuthenticated ? (
            <div style={styles.userMenu}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={styles.avatarBtn}
              >
                <div style={styles.avatar}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span style={styles.userName}>{user?.name?.split(' ')[0]}</span>
                <span>▾</span>
              </button>

              {menuOpen && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <div style={styles.dropdownName}>{user?.name}</div>
                    <div style={styles.dropdownRole}>{user?.role} · {user?.city}</div>
                  </div>
                  <hr style={styles.dropDivider} />
                  <Link to={getDashboardLink()} style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    📊 Dashboard
                  </Link>
                  <Link to="/orders" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    📦 My Orders
                  </Link>
                  <hr style={styles.dropDivider} />
                  <button onClick={handleLogout} style={{ ...styles.dropItem, color: '#ff6b6b', width: '100%', textAlign: 'left' }}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
            </div>
          )}
        </div>
      </div>
      {mobileMenuOpen && (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, background: '#0D1F19', borderBottom: '1px solid rgba(0,194,124,0.2)', zIndex: 999, padding: '1rem' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {[
              { to: '/', label: '🏠 Home' },
              { to: '/products', label: '📦 Products' },
              { to: '/orders', label: '📋 My Orders' },
              { to: '/wishlist', label: '❤️ Wishlist' },
            ].map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMobileMenuOpen(false)} style={{ color: '#E8F5F0', textDecoration: 'none', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem', display: 'block', background: 'rgba(0,194,124,0.05)' }}>
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ color: '#E8F5F0', textDecoration: 'none', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.9rem', display: 'block' }}>🔑 Login</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ textAlign: 'center', marginTop: '0.5rem' }}>Register</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </nav>
  );
}

function NotificationBell({ socket, user }) {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    if (!socket || !user) return;
    socket.on('order_notification', (data) => {
      setNotifs(prev => [{ id: Date.now(), message: data.message, time: new Date(), read: false, type: 'order' }, ...prev].slice(0, 20));
    });
    socket.on('new_bid', (data) => {
      setNotifs(prev => [{ id: Date.now(), message: `New bid: PKR ${data.amount?.toLocaleString()}`, time: new Date(), read: false, type: 'auction' }, ...prev].slice(0, 20));
    });
    socket.on('gift_received', (data) => {
      setNotifs(prev => [{ id: Date.now(), message: `${data.senderName} sent ${data.giftEmoji} ${data.giftName}!`, time: new Date(), read: false, type: 'gift' }, ...prev].slice(0, 20));
    });
    return () => {
      socket.off('order_notification');
      socket.off('new_bid');
      socket.off('gift_received');
    };
  }, [socket, user]);

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(!open); if (open) markAllRead(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '0.4rem', color: '#7BA897', fontSize: '1.2rem' }}
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, background: '#ff6b6b', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', width: 300, background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '0.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 1000, marginTop: '0.5rem', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0,194,124,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0D1F19' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
            {notifs.length > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#00C27C', cursor: 'pointer', fontSize: '0.75rem' }}>Mark all read</button>}
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#4A7A6A', fontSize: '0.85rem' }}>No notifications yet</div>
            ) : (
              notifs.map(n => (
                <div key={n.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0,194,124,0.08)', background: n.read ? 'transparent' : 'rgba(0,194,124,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                    {n.type === 'order' ? '📦' : n.type === 'auction' ? '🔨' : '🎁'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.83rem', color: '#E8F5F0', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: '0.7rem', color: '#4A7A6A', marginTop: '0.2rem' }}>
                      {new Date(n.time).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.read && <div style={{ width: 6, height: 6, background: '#00C27C', borderRadius: '50%', flexShrink: 0, marginTop: 4 }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    height: 64,
    background: 'rgba(5,13,10,0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0,194,124,0.2)',
    zIndex: 1000,
  },
  inner: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '0 1.5rem',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1.5rem',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'Space Mono', monospace",
    fontWeight: 700,
    fontSize: '1.2rem',
    color: '#E8F5F0',
    letterSpacing: '-1px',
  },
  logoDot: {
    fontSize: '0.7rem',
    marginLeft: '4px',
    animation: 'pulse 1.5s infinite',
  },
  links: {
    display: 'flex',
    gap: '0.25rem',
    flex: 1,
    justifyContent: 'center',
  },
  link: {
    color: '#7BA897',
    textDecoration: 'none',
    fontSize: '0.88rem',
    fontWeight: 500,
    padding: '0.4rem 0.75rem',
    borderRadius: '0.4rem',
    transition: 'all 0.2s',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexShrink: 0,
  },
  iconBtn: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: '#E8F5F0',
    width: 38,
    height: 38,
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    cursor: 'pointer',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6, right: -6,
    background: '#00C27C',
    color: '#000',
    fontSize: '0.6rem',
    fontWeight: 700,
    width: 18, height: 18,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Space Mono', monospace",
  },
  userMenu: { position: 'relative' },
  avatarBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    padding: '0.4rem 0.75rem',
    color: '#E8F5F0',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  avatar: {
    width: 28, height: 28,
    borderRadius: '50%',
    background: '#00C27C',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.8rem',
  },
  userName: { fontWeight: 500 },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    background: '#112219',
    border: '1px solid rgba(0,194,124,0.2)',
    borderRadius: '0.75rem',
    minWidth: 200,
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    zIndex: 100,
  },
  dropdownHeader: { padding: '0.9rem 1rem' },
  dropdownName: { fontWeight: 600, fontSize: '0.92rem' },
  dropdownRole: { fontSize: '0.75rem', color: '#7BA897', marginTop: '0.15rem', textTransform: 'capitalize' },
  dropDivider: { border: 'none', borderTop: '1px solid rgba(0,194,124,0.1)' },
  dropItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1rem',
    color: '#7BA897',
    textDecoration: 'none',
    fontSize: '0.88rem',
    transition: 'all 0.15s',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
};
