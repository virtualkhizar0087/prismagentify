import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function StockBreakdown() {
  const [form, setForm] = useState({ ticker: '', focusAreas: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.ticker) return toast.error('Enter a ticker symbol');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/stock-breakdown', form);
      setResult(data.analysis); toast.success('Breakdown complete');
    } catch (e) { toast.error(e.response?.data?.error || 'Analysis failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-morgan">Institutional Research Note</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Ticker Symbol</label>
            <input className="form-input" placeholder="e.g. NVDA" value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} />
          </div>
          <div className="form-group">
            <label className="form-label">Focus Areas (optional)</label>
            <input className="form-input" placeholder="e.g. AI growth, competitive moat, margin expansion" value={form.focusAreas} onChange={e => set('focusAreas', e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={run} disabled={loading}>
          {loading ? '⟳ Analyzing...' : '🔬 Generate Institutional Stock Breakdown'}
        </button>
      </div>
      <AnalysisResult result={result} module="Institutional Stock Breakdown" loading={loading} />
    </div>
  );
}
