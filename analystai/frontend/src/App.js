import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import StockScreener from './pages/StockScreener';
import DCFValuation from './pages/DCFValuation';
import RiskAnalysis from './pages/RiskAnalysis';
import EarningsBreakdown from './pages/EarningsBreakdown';
import PortfolioBuilder from './pages/PortfolioBuilder';
import StockBreakdown from './pages/StockBreakdown';
import TradeSetup from './pages/TradeSetup';
import EarningsReaction from './pages/EarningsReaction';
import PortfolioRisk from './pages/PortfolioRisk';
import SectorFinder from './pages/SectorFinder';
import CompounderFinder from './pages/CompounderFinder';
import NewsSentiment from './pages/NewsSentiment';
import OptionsStrategy from './pages/OptionsStrategy';
import Watchlist from './pages/Watchlist';
import Settings from './pages/Settings';
import { useAuth } from './context/AuthContext';

const PAGE_META = {
  '/app': { title: 'Dashboard', sub: 'All 13 institutional analysis modules' },
  '/app/history': { title: 'Analysis History', sub: 'Your saved AI analyses' },
  '/app/screener': { title: 'Stock Screener', sub: 'Goldman Sachs Style — Top 10 picks with full fundamentals' },
  '/app/dcf': { title: 'DCF Valuation', sub: 'Morgan Stanley Style — Full discounted cash flow model' },
  '/app/risk': { title: 'Risk Analysis', sub: 'Bridgewater Style — Portfolio risk assessment & hedging' },
  '/app/earnings-breakdown': { title: 'Earnings Breakdown', sub: 'JPMorgan Style — Pre-earnings intelligence brief' },
  '/app/portfolio-builder': { title: 'Portfolio Builder', sub: 'BlackRock Style — Custom multi-asset allocation' },
  '/app/stock-breakdown': { title: 'Stock Breakdown', sub: 'Institutional deep-dive: business model, moat, thesis' },
  '/app/trade-setup': { title: 'Trade Setup Builder', sub: 'Smart entry zone, stop loss & price targets' },
  '/app/earnings-reaction': { title: 'Earnings Reaction', sub: 'Historical earnings pattern & statistical edge' },
  '/app/portfolio-risk': { title: 'Portfolio Risk Scanner', sub: 'Sector concentration, correlation & drawdown analysis' },
  '/app/sector-finder': { title: 'Sector Finder', sub: 'Macro-driven sector rotation opportunities' },
  '/app/compounder': { title: 'Compounder Finder', sub: 'Long-term compounders — Buffett-style screen' },
  '/app/news-sentiment': { title: 'News Sentiment Analyzer', sub: 'Paste headlines → AI sentiment score + trade implication' },
  '/app/options-strategy': { title: 'Options Strategy Builder', sub: 'Event-driven options plays — straddles, spreads & more' },
  '/app/watchlist': { title: 'My Watchlist', sub: 'Track your tickers and notes' },
  '/app/settings': { title: 'Account Settings', sub: 'Manage your profile, plan & billing' },
};

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0d1117' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AppShell({ children, path }) {
  const meta = PAGE_META[path] || PAGE_META['/app'];
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopHeader title={meta.title} subtitle={meta.sub} />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/success" element={<Success />} />
      <Route path="/pricing" element={<Landing />} />

      {/* Protected app pages */}
      <Route path="/app" element={<ProtectedRoute><AppShell path="/app"><Dashboard /></AppShell></ProtectedRoute>} />
      <Route path="/app/history" element={<ProtectedRoute><AppShell path="/app/history"><History /></AppShell></ProtectedRoute>} />
      <Route path="/app/screener" element={<ProtectedRoute><AppShell path="/app/screener"><StockScreener /></AppShell></ProtectedRoute>} />
      <Route path="/app/dcf" element={<ProtectedRoute><AppShell path="/app/dcf"><DCFValuation /></AppShell></ProtectedRoute>} />
      <Route path="/app/risk" element={<ProtectedRoute><AppShell path="/app/risk"><RiskAnalysis /></AppShell></ProtectedRoute>} />
      <Route path="/app/earnings-breakdown" element={<ProtectedRoute><AppShell path="/app/earnings-breakdown"><EarningsBreakdown /></AppShell></ProtectedRoute>} />
      <Route path="/app/portfolio-builder" element={<ProtectedRoute><AppShell path="/app/portfolio-builder"><PortfolioBuilder /></AppShell></ProtectedRoute>} />
      <Route path="/app/stock-breakdown" element={<ProtectedRoute><AppShell path="/app/stock-breakdown"><StockBreakdown /></AppShell></ProtectedRoute>} />
      <Route path="/app/trade-setup" element={<ProtectedRoute><AppShell path="/app/trade-setup"><TradeSetup /></AppShell></ProtectedRoute>} />
      <Route path="/app/earnings-reaction" element={<ProtectedRoute><AppShell path="/app/earnings-reaction"><EarningsReaction /></AppShell></ProtectedRoute>} />
      <Route path="/app/portfolio-risk" element={<ProtectedRoute><AppShell path="/app/portfolio-risk"><PortfolioRisk /></AppShell></ProtectedRoute>} />
      <Route path="/app/sector-finder" element={<ProtectedRoute><AppShell path="/app/sector-finder"><SectorFinder /></AppShell></ProtectedRoute>} />
      <Route path="/app/compounder" element={<ProtectedRoute><AppShell path="/app/compounder"><CompounderFinder /></AppShell></ProtectedRoute>} />
      <Route path="/app/news-sentiment" element={<ProtectedRoute><AppShell path="/app/news-sentiment"><NewsSentiment /></AppShell></ProtectedRoute>} />
      <Route path="/app/options-strategy" element={<ProtectedRoute><AppShell path="/app/options-strategy"><OptionsStrategy /></AppShell></ProtectedRoute>} />
      <Route path="/app/watchlist" element={<ProtectedRoute><AppShell path="/app/watchlist"><Watchlist /></AppShell></ProtectedRoute>} />
      <Route path="/app/settings" element={<ProtectedRoute><AppShell path="/app/settings"><Settings /></AppShell></ProtectedRoute>} />
    </Routes>
  );
}
