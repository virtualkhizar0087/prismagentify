import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function EarningsReaction() {
  const [form, setForm] = useState({ company: '', ticker: '', numQuarters: '4' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.company || !form.ticker) return toast.error('Enter company and ticker');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/earnings-reaction', form);
      setResult(data.analysis); toast.success('Pattern analysis complete');
    } catch (e) { toast.error(e.response?.data?.error || 'Analysis failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-morgan">Quant Earnings Pattern Analysis</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input className="form-input" placeholder="e.g. Microsoft" value={form.company} onChange={e => set('company', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Ticker Symbol</label>
            <input className="form-input" placeholder="e.g. MSFT" value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} />
          </div>
          <div className="form-group">
            <label className="form-label">Number of Quarters to Analyze</label>
            <select className="form-select" value={form.numQuarters} onChange={e => set('numQuarters', e.target.value)}>
              <option value="4">Last 4 quarters</option><option value="6">Last 6 quarters</option><option value="8">Last 8 quarters</option>
            </select>
          </div>
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={run} disabled={loading}>
          {loading ? '⟳ Analyzing Patterns...' : '⚡ Generate Earnings Reaction Analysis'}
        </button>
      </div>
      <AnalysisResult result={result} module="Earnings Reaction Analyzer" loading={loading} />
    </div>
  );
}
