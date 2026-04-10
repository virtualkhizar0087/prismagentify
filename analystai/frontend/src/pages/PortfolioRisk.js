import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function PortfolioRisk() {
  const [form, setForm] = useState({ stocks: '', portfolioSize: '', goal: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.stocks || !form.portfolioSize) return toast.error('Enter holdings and portfolio size');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/portfolio-risk', form);
      setResult(data.analysis); toast.success('Risk scan complete');
    } catch (e) { toast.error(e.response?.data?.error || 'Analysis failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-bridgewater">Hedge Fund Risk Dashboard</div>
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label">Portfolio Holdings (stocks with % or $ amounts)</label>
            <textarea className="form-textarea" style={{ minHeight: '100px' }}
              placeholder="e.g. AAPL $15000, TSLA $10000, AMZN $8000, SPY $12000, BND $5000"
              value={form.stocks} onChange={e => set('stocks', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Total Portfolio Size ($)</label>
            <input className="form-input" placeholder="e.g. 50000" value={form.portfolioSize} onChange={e => set('portfolioSize', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Investment Goal</label>
            <input className="form-input" placeholder="e.g. Long-term growth, retirement in 10 years" value={form.goal} onChange={e => set('goal', e.target.value)} />
          </div>
        </div>
        <button className="btn btn-lg btn-full" style={{ background: 'linear-gradient(135deg,#ff4d6d,#c9284d)', color: 'white' }} onClick={run} disabled={loading}>
          {loading ? '⟳ Scanning Risks...' : '🔥 Run Portfolio Risk Scan'}
        </button>
      </div>
      <AnalysisResult result={result} module="Portfolio Risk Scanner" loading={loading} />
    </div>
  );
}
