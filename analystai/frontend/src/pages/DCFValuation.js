import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function DCFValuation() {
  const [form, setForm] = useState({ ticker: '', companyName: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.ticker || !form.companyName) return toast.error('Enter ticker and company name');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/dcf', form);
      setResult(data.analysis); toast.success('DCF model complete');
    } catch (e) { toast.error(e.response?.data?.error || 'Analysis failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-morgan">Morgan Stanley Style</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Ticker Symbol</label>
            <input className="form-input" placeholder="e.g. AAPL" value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} />
          </div>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input className="form-input" placeholder="e.g. Apple Inc." value={form.companyName} onChange={e => set('companyName', e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={run} disabled={loading}>
          {loading ? '⟳ Building DCF Model...' : '📐 Generate Morgan Stanley DCF Valuation'}
        </button>
      </div>
      <AnalysisResult result={result} module="Morgan Stanley DCF Valuation" loading={loading} />
    </div>
  );
}
