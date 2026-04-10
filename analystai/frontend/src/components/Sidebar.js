import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/app', icon: '⬡', label: 'Dashboard' },
  { path: '/app/history', icon: '🕐', label: 'History' },
  { path: '/app/watchlist', icon: '★', label: 'Watchlist' },
];

const INSTITUTIONAL = [
  { path: '/app/screener', icon: '🔍', label: 'Stock Screener' },
  { path: '/app/dcf', icon: '📐', label: 'DCF Valuation' },
  { path: '/app/risk', icon: '🛡', label: 'Risk Analysis' },
  { path: '/app/earnings-breakdown', icon: '📊', label: 'Earnings Breakdown' },
  { path: '/app/portfolio-builder', icon: '🏗', label: 'Portfolio Builder' },
];

const TRADING = [
  { path: '/app/stock-breakdown', icon: '🔬', label: 'Stock Breakdown' },
  { path: '/app/trade-setup', icon: '🎯', label: 'Trade Setup' },
  { path: '/app/earnings-reaction', icon: '⚡', label: 'Earnings Reaction' },
  { path: '/app/portfolio-risk', icon: '🔥', label: 'Portfolio Risk Scanner' },
];

const MACRO = [
  { path: '/app/sector-finder', icon: '🌐', label: 'Sector Finder' },
  { path: '/app/compounder', icon: '📈', label: 'Compounder Finder' },
];

const ADVANCED = [
  { path: '/app/news-sentiment', icon: '📰', label: 'News Sentiment' },
  { path: '/app/options-strategy', icon: '📊', label: 'Options Strategy' },
];

const PLAN_COLORS = { free: '#6e7681', starter: '#4f8ef7', pro: '#00d395', enterprise: '#f0b429' };
const PLAN_LABELS = { free: 'FREE', starter: 'STARTER', pro: 'PRO', enterprise: 'ENTERPRISE' };

export default function Sidebar() {
  const { user, plan, usageDisplay, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const email = user?.email || '';
  const shortEmail = email.length > 22 ? email.slice(0, 20) + '…' : email;
  const initials = email ? email[0].toUpperCase() : '?';
  const planColor = PLAN_COLORS[plan] || '#6e7681';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">AnalystAI</div>
        <div className="logo-sub">Institutional Analysis Platform</div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(item => (
          <NavLink key={item.path} to={item.path} end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-section-title">Wall Street Modules</div>
        {INSTITUTIONAL.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-section-title">Trading Tools</div>
        {TRADING.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-section-title">Macro & Growth</div>
        {MACRO.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-section-title">Advanced Tools</div>
        {ADVANCED.map(item => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <div className="sidebar-section-title">Account</div>
        <NavLink to="/app/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">⚙</span>
          Settings
        </NavLink>
      </nav>

      {/* User section */}
      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
        {/* Plan badge + usage */}
        <div style={{ background: 'rgba(79,142,247,0.06)', border: '1px solid rgba(79,142,247,0.15)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: planColor, letterSpacing: '1px' }}>
              {PLAN_LABELS[plan] || 'FREE'}
            </span>
            {(plan === 'free' || plan === 'starter') && (
              <span
                style={{ fontSize: 10, color: '#4f8ef7', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => navigate('/checkout?plan=pro')}
              >
                Upgrade
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{usageDisplay}</div>
        </div>

        {/* Avatar + email + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#4f8ef7,#00d395)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shortEmail}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '2px 6px', flexShrink: 0 }}
          >
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
}
