import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function TradeSetup() {
  const [form, setForm] = useState({ ticker: '', currentPrice: '', tradeType: 'Long', timeframe: 'Swing (days to weeks)', riskAmount: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.ticker || !form.currentPrice) return toast.error('Enter ticker and current price');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/trade-setup', form);
      setResult(data.analysis); toast.success('Trade setup ready');
    } catch (e) { toast.error(e.response?.data?.error || 'Analysis failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-trade">Smart Trade Setup — Entry / Stop / Target</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Ticker / Pair</label>
            <input className="form-input" placeholder="e.g. AAPL or EUR/USD" value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} />
          </div>
          <div className="form-group">
            <label className="form-label">Current Price ($)</label>
            <input className="form-input" placeholder="e.g. 189.50" value={form.currentPrice} onChange={e => set('currentPrice', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Trade Direction</label>
            <select className="form-select" value={form.tradeType} onChange={e => set('tradeType', e.target.value)}>
              <option>Long</option><option>Short</option><option>Both Long and Short scenarios</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Timeframe</label>
            <select className="form-select" value={form.timeframe} onChange={e => set('timeframe', e.target.value)}>
              <option>Scalp (minutes to hours)</option><option>Day trade (intraday)</option><option>Swing (days to weeks)</option><option>Position (weeks to months)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Risk Amount ($) optional</label>
            <input className="form-input" placeholder="e.g. 500" value={form.riskAmount} onChange={e => set('riskAmount', e.target.value)} />
          </div>
        </div>
        <button className="btn btn-success btn-lg btn-full" onClick={run} disabled={loading}>
          {loading ? '⟳ Building Trade Plan...' : '🎯 Generate Smart Trade Setup'}
        </button>
      </div>
      <AnalysisResult result={result} module="Smart Trade Setup Builder" loading={loading} />
    </div>
  );
}
