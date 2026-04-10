import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function PortfolioBuilder() {
  const [form, setForm] = useState({ age: '', income: '', savings: '', goals: '', riskTolerance: 'Moderate', accountType: 'Taxable Brokerage', monthlyInvestment: '' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.age || !form.savings) return toast.error('Enter age and savings');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/portfolio-builder', form);
      setResult(data.analysis); toast.success('Portfolio built');
    } catch (e) { toast.error(e.response?.data?.error || 'Analysis failed'); }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-blackrock">BlackRock Style — $500M+ Portfolio Strategist</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Age</label>
            <input className="form-input" placeholder="e.g. 35" value={form.age} onChange={e => set('age', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Annual Income ($)</label>
            <input className="form-input" placeholder="e.g. 80000" value={form.income} onChange={e => set('income', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Current Savings ($)</label>
            <input className="form-input" placeholder="e.g. 50000" value={form.savings} onChange={e => set('savings', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Monthly Investment ($)</label>
            <input className="form-input" placeholder="e.g. 1000" value={form.monthlyInvestment} onChange={e => set('monthlyInvestment', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Risk Tolerance</label>
            <select className="form-select" value={form.riskTolerance} onChange={e => set('riskTolerance', e.target.value)}>
              <option>Conservative</option><option>Moderate</option><option>Aggressive</option><option>Very Aggressive</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select className="form-select" value={form.accountType} onChange={e => set('accountType', e.target.value)}>
              <option>Taxable Brokerage</option><option>401(k)</option><option>IRA (Traditional)</option><option>Roth IRA</option><option>Multiple Account Types</option>
            </select>
          </div>
          <div className="form-group form-full">
            <label className="form-label">Investment Goals</label>
            <textarea className="form-textarea" placeholder="e.g. Retire at 55, generate passive income, fund children's education" value={form.goals} onChange={e => set('goals', e.target.value)} />
          </div>
        </div>
        <button className="btn btn-lg btn-full" style={{ background: 'linear-gradient(135deg,#ff4d6d,#c9284d)', color: 'white' }} onClick={run} disabled={loading}>
          {loading ? '⟳ Building Portfolio...' : '🏗 Generate BlackRock Portfolio Plan'}
        </button>
      </div>
      <AnalysisResult result={result} module="BlackRock Portfolio Builder" loading={loading} />
    </div>
  );
}
