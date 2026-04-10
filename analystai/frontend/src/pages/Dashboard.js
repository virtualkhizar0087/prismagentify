import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MODULES = [
  { path: '/app/screener', icon: '🔍', title: 'Stock Screener', firm: 'Goldman Sachs', firmClass: 'firm-gs', desc: 'Top 10 picks, P/E, moat rating, entry zones & stop-loss' },
  { path: '/app/dcf', icon: '📐', title: 'DCF Valuation', firm: 'Morgan Stanley', firmClass: 'firm-ms', desc: '5-year projections, WACC, terminal value, undervalued verdict' },
  { path: '/app/risk', icon: '🛡', title: 'Risk Analysis', firm: 'Bridgewater', firmClass: 'firm-bw', desc: 'Correlation matrix, stress tests, hedging strategies' },
  { path: '/app/earnings-breakdown', icon: '📊', title: 'Earnings Breakdown', firm: 'JPMorgan', firmClass: 'firm-jp', desc: 'Beat/miss history, implied move, bull/bear trade play' },
  { path: '/app/portfolio-builder', icon: '🏗', title: 'Portfolio Builder', firm: 'BlackRock', firmClass: 'firm-br', desc: 'Asset allocation, ETF picks, rebalancing & tax strategy' },
  { path: '/app/stock-breakdown', icon: '🔬', title: 'Stock Breakdown', firm: 'Institutional', firmClass: 'firm-custom', desc: 'Business model, revenue drivers, moat, bull/bear thesis' },
  { path: '/app/trade-setup', icon: '🎯', title: 'Trade Setup Builder', firm: 'Smart Trading', firmClass: 'firm-jp', desc: 'Entry zone, stop-loss, TP1/TP2/TP3 & risk-reward grade' },
  { path: '/app/earnings-reaction', icon: '⚡', title: 'Earnings Reaction', firm: 'Quant Strategy', firmClass: 'firm-ms', desc: 'Historical patterns & statistical edge around earnings' },
  { path: '/app/portfolio-risk', icon: '🔥', title: 'Portfolio Risk Scanner', firm: 'Hedge Fund', firmClass: 'firm-bw', desc: 'Red/yellow/green risk dashboard with health score 1-10' },
  { path: '/app/sector-finder', icon: '🌐', title: 'Sector Finder', firm: 'Macro Strategy', firmClass: 'firm-gs', desc: '5 sectors to outperform based on current macro conditions' },
  { path: '/app/compounder', icon: '📈', title: 'Compounder Finder', firm: 'Value Investing', firmClass: 'firm-custom', desc: 'Buffett-style long-term compounders with 5-yr potential' },
  { path: '/app/news-sentiment', icon: '📰', title: 'News Sentiment', firm: 'AI Intelligence', firmClass: 'firm-gs', desc: 'Paste headlines → sentiment score, trade implication & impact', badge: 'NEW' },
  { path: '/app/options-strategy', icon: '📊', title: 'Options Strategy', firm: 'Derivatives Desk', firmClass: 'firm-ms', desc: 'Event-driven options plays — strikes, expiry, max P&L', badge: 'NEW' },
];

const PLAN_COLORS = { free: '#6e7681', starter: '#4f8ef7', pro: '#00d395', enterprise: '#f0b429' };
const PLAN_LABELS = { free: 'FREE', starter: 'STARTER', pro: 'PRO', enterprise: 'ENTERPRISE' };

export default function Dashboard() {
  const { profile, plan, usageDisplay } = useAuth();

  const planColor = PLAN_COLORS[plan] || '#6e7681';
  const planLabel = PLAN_LABELS[plan] || 'FREE';
  const totalAnalyses = profile?.total_analyses || 0;
  const todayAnalyses = profile?.analyses_today || 0;

  return (
    <div>
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Your Plan</div>
          <div className="stat-value" style={{ color: planColor }}>{planLabel}</div>
          <div className="stat-sub">{usageDisplay}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Analyses Run</div>
          <div className="stat-value stat-blue">{totalAnalyses}</div>
          <div className="stat-sub">Lifetime</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Analyses Today</div>
          <div className="stat-value stat-green">{todayAnalyses}</div>
          <div className="stat-sub">Resets at midnight</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">AI Engine</div>
          <div className="stat-value stat-purple">Claude</div>
          <div className="stat-sub">claude-sonnet-4-6</div>
        </div>
      </div>

      {plan === 'free' && totalAnalyses >= 3 && (
        <div style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#ff4d6d' }}>Free plan limit reached</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>You've used all 3 free analyses. Upgrade to continue running reports.</div>
          </div>
          <Link to="/checkout?plan=pro" style={{ background: 'linear-gradient(135deg,#4f8ef7,#3b6fd4)', color: 'white', padding: '9px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
            Upgrade Now →
          </Link>
        </div>
      )}

      <div className="page-header">
        <div className="page-title">All 13 Analysis Modules</div>
        <div className="page-desc">Click any module to run institutional-grade AI analysis</div>
      </div>

      <div className="modules-grid">
        {MODULES.map(m => (
          <Link key={m.path} to={m.path} className="module-card" style={{ position: 'relative' }}>
            {m.badge && (
              <span style={{
                position: 'absolute', top: 10, right: 10,
                background: 'linear-gradient(135deg,#00d395,#00a36d)',
                color: 'white', fontSize: 9, fontWeight: 800,
                padding: '2px 7px', borderRadius: 10, letterSpacing: '1px',
              }}>{m.badge}</span>
            )}
            <div className="module-icon">{m.icon}</div>
            <div className={`module-firm ${m.firmClass}`}>{m.firm}</div>
            <div className="module-title">{m.title}</div>
            <div className="module-desc">{m.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
