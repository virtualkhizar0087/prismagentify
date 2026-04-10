import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function OptionsStrategy() {
  const [form, setForm] = useState({
    ticker: '',
    currentPrice: '',
    catalyst: '',
    catalystDate: '',
    sentiment: 'Neutral',
    riskTolerance: 'Moderate',
    accountSize: '',
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.ticker) return toast.error('Enter a ticker symbol');
    if (!form.currentPrice) return toast.error('Enter the current stock price');
    if (!form.catalyst) return toast.error('Describe the catalyst or event');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/options-strategy', form);
      setResult(data.analysis);
      toast.success('Options strategy generated');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Analysis failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-ms">Derivatives Strategy</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Ticker Symbol</label>
            <input
              className="form-input"
              placeholder="e.g. TSLA"
              value={form.ticker}
              onChange={e => set('ticker', e.target.value.toUpperCase())}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Current Stock Price ($)</label>
            <input
              className="form-input"
              placeholder="e.g. 245.50"
              value={form.currentPrice}
              onChange={e => set('currentPrice', e.target.value)}
            />
          </div>
          <div className="form-group form-full">
            <label className="form-label">Catalyst / Event</label>
            <input
              className="form-input"
              placeholder="e.g. Q1 Earnings report, FDA approval, FOMC meeting, product launch"
              value={form.catalyst}
              onChange={e => set('catalyst', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Catalyst Date (optional)</label>
            <input
              className="form-input"
              type="date"
              value={form.catalystDate}
              onChange={e => set('catalystDate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Your Sentiment on the Stock</label>
            <select
              className="form-select"
              value={form.sentiment}
              onChange={e => set('sentiment', e.target.value)}
            >
              <option>Strongly Bearish</option>
              <option>Bearish</option>
              <option>Neutral</option>
              <option>Bullish</option>
              <option>Strongly Bullish</option>
              <option>Uncertain / Volatile</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Risk Tolerance</label>
            <select
              className="form-select"
              value={form.riskTolerance}
              onChange={e => set('riskTolerance', e.target.value)}
            >
              <option>Conservative</option>
              <option>Moderate</option>
              <option>Aggressive</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Account Size ($)</label>
            <input
              className="form-input"
              placeholder="e.g. 25000"
              value={form.accountSize}
              onChange={e => set('accountSize', e.target.value)}
            />
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, padding: '10px 14px', background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.2)', borderRadius: 8 }}>
          ⚠ Options trading involves significant risk. This AI analysis is for educational purposes only — not financial advice. Always consult a licensed advisor before trading options.
        </div>
        <button
          className="btn btn-success btn-lg btn-full"
          onClick={run}
          disabled={loading}
        >
          {loading ? '⟳ Building Options Strategy...' : '📊 Build Options Strategy'}
        </button>
      </div>
      <AnalysisResult result={result} module="Options Strategy Builder" loading={loading} />
    </div>
  );
}
