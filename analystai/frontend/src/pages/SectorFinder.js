import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function SectorFinder() {
  const [form, setForm] = useState({ macroConditions: '', timeframe: '6-12 months' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const PRESETS = [
    'High interest rates, sticky inflation, strong USD',
    'AI boom, tech spending surge, cloud growth',
    'Rising energy prices, geopolitical tensions',
    'Fed cutting rates, recession fears easing',
    'Strong consumer, low unemployment, S&P near highs',
  ];

  const run = async () => {
    if (!form.macroConditions) return toast.error('Describe current macro conditions');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/sector-finder', form);
      setResult(data.analysis); toast.success('Sector analysis complete');
    } catch (e) { toast.error(e.response?.data?.error || 'Analysis failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-macro">Macro Sector Rotation Strategy</div>
        <div className="form-grid">
          <div className="form-group form-full">
            <label className="form-label">Current Macro Conditions</label>
            <textarea className="form-textarea"
              placeholder="e.g. High interest rates, AI boom, energy prices rising, Fed pausing cuts..."
              value={form.macroConditions} onChange={e => set('macroConditions', e.target.value)} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {PRESETS.map(p => (
                <button key={p} onClick={() => set('macroConditions', p)}
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {p.substring(0, 30)}...
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Timeframe</label>
            <select className="form-select" value={form.timeframe} onChange={e => set('timeframe', e.target.value)}>
              <option>3 months</option><option>6-12 months</option><option>12-24 months</option><option>2-3 years</option>
            </select>
          </div>
        </div>
        <button className="btn btn-success btn-lg btn-full" onClick={run} disabled={loading}>
          {loading ? '⟳ Finding Sectors...' : '🌐 Find Top 5 Sector Opportunities'}
        </button>
      </div>
      <AnalysisResult result={result} module="Sector Opportunity Finder" loading={loading} />
    </div>
  );
}
