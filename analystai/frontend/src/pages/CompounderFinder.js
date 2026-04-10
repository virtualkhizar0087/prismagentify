import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function CompounderFinder() {
  const [form, setForm] = useState({ exampleCompany: '', criteria: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const EXAMPLES = ['Apple (AAPL)', 'Amazon (AMZN)', 'Visa (V)', 'Costco (COST)', 'Constellation Software'];

  const run = async () => {
    if (!form.exampleCompany) return toast.error('Enter a reference company');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/compounder-finder', form);
      setResult(data.analysis); toast.success('Compounders found');
    } catch (e) { toast.error(e.response?.data?.error || 'Analysis failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-goldman">Buffett-Style Long-Term Compounder Screen</div>
        <div style={{ marginBottom: '16px' }}>
          <div className="form-label" style={{ marginBottom: '8px' }}>Quick Pick</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {EXAMPLES.map(e => (
              <button key={e} onClick={() => set('exampleCompany', e)}
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Reference Company (find similar to this)</label>
            <input className="form-input" placeholder="e.g. Apple, Visa, Costco" value={form.exampleCompany} onChange={e => set('exampleCompany', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Additional Criteria (optional)</label>
            <input className="form-input" placeholder="e.g. Small-cap, international, dividend growth" value={form.criteria} onChange={e => set('criteria', e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={run} disabled={loading}>
          {loading ? '⟳ Screening Compounders...' : '📈 Find Long-Term Compounders'}
        </button>
      </div>
      <AnalysisResult result={result} module="Long-Term Compounder Finder" loading={loading} />
    </div>
  );
}
