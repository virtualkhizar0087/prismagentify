import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function EarningsBreakdown() {
  const [form, setForm] = useState({ company: '', ticker: '', earningsDate: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.company || !form.ticker) return toast.error('Enter company name and ticker');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/earnings-breakdown', form);
      setResult(data.analysis); toast.success('Earnings brief complete');
    } catch (e) { toast.error(e.response?.data?.error || 'Analysis failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-jpmorgan">JPMorgan Style</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input className="form-input" placeholder="e.g. Tesla" value={form.company} onChange={e => set('company', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Ticker Symbol</label>
            <input className="form-input" placeholder="e.g. TSLA" value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())} />
          </div>
          <div className="form-group">
            <label className="form-label">Earnings Date (optional)</label>
            <input className="form-input" type="date" value={form.earningsDate} onChange={e => set('earningsDate', e.target.value)} />
          </div>
        </div>
        <button className="btn btn-success btn-lg btn-full" onClick={run} disabled={loading}>
          {loading ? '⟳ Generating Brief...' : '📊 Generate JPMorgan Earnings Brief'}
        </button>
      </div>
      <AnalysisResult result={result} module="JPMorgan Earnings Breakdown" loading={loading} />
    </div>
  );
}
