import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function StockScreener() {
  const [form, setForm] = useState({ riskTolerance: 'Moderate', investmentAmount: '', timeHorizon: '3-5 years', sectors: '', goals: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.investmentAmount) return toast.error('Enter investment amount');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/screener', form);
      setResult(data.analysis);
      toast.success('Analysis complete');
    } catch (e) { toast.error(e.response?.data?.error || 'Analysis failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-goldman">Goldman Sachs Style</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Risk Tolerance</label>
            <select className="form-select" value={form.riskTolerance} onChange={e => set('riskTolerance', e.target.value)}>
              <option>Conservative</option><option>Moderate</option><option>Aggressive</option><option>Very Aggressive</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Investment Amount ($)</label>
            <input className="form-input" placeholder="e.g. 50000" value={form.investmentAmount} onChange={e => set('investmentAmount', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Time Horizon</label>
            <select className="form-select" value={form.timeHorizon} onChange={e => set('timeHorizon', e.target.value)}>
              <option>Less than 1 year</option><option>1-2 years</option><option>3-5 years</option><option>5-10 years</option><option>10+ years</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Preferred Sectors</label>
            <input className="form-input" placeholder="e.g. Tech, Healthcare, Energy" value={form.sectors} onChange={e => set('sectors', e.target.value)} />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Investment Goals</label>
            <textarea className="form-textarea" placeholder="e.g. Long-term wealth building, dividend income, capital appreciation" value={form.goals} onChange={e => set('goals', e.target.value)} />
          </div>
        </div>
        <button className="btn btn-success btn-lg btn-full" onClick={run} disabled={loading}>
          {loading ? '⟳ Analyzing...' : '🔍 Generate Goldman Sachs Stock Screen'}
        </button>
      </div>
      <AnalysisResult result={result} module="Goldman Sachs Stock Screener" loading={loading} />
    </div>
  );
}
