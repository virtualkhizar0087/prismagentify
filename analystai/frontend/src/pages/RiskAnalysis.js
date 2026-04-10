import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function RiskAnalysis() {
  const [form, setForm] = useState({ holdings: '', portfolioValue: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.holdings || !form.portfolioValue) return toast.error('Enter holdings and portfolio value');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/risk', form);
      setResult(data.analysis); toast.success('Risk analysis complete');
    } catch (e) { toast.error(e.response?.data?.error || 'Analysis failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-bridgewater">Bridgewater Style — Ray Dalio Principles</div>
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label">Portfolio Holdings</label>
            <textarea className="form-textarea" style={{ minHeight: '120px' }}
              placeholder="e.g. AAPL 25%, MSFT 20%, NVDA 15%, BND 20%, GLD 10%, Cash 10%"
              value={form.holdings} onChange={e => set('holdings', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Total Portfolio Value ($)</label>
            <input className="form-input" placeholder="e.g. 100000" value={form.portfolioValue} onChange={e => set('portfolioValue', e.target.value)} />
          </div>
        </div>
        <button className="btn btn-lg btn-full" style={{ background: 'linear-gradient(135deg,#a78bfa,#7c5cdb)', color: 'white' }} onClick={run} disabled={loading}>
          {loading ? '⟳ Running Risk Analysis...' : '🛡 Generate Bridgewater Risk Report'}
        </button>
      </div>
      <AnalysisResult result={result} module="Bridgewater Risk Analysis" loading={loading} />
    </div>
  );
}
