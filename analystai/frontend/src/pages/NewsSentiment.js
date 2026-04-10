import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AnalysisResult from '../components/AnalysisResult';

export default function NewsSentiment() {
  const [form, setForm] = useState({
    ticker: '',
    companyName: '',
    headlines: '',
    timeframe: 'Near-term (1-4 weeks)',
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const run = async () => {
    if (!form.ticker) return toast.error('Enter a ticker symbol');
    if (!form.headlines.trim()) return toast.error('Paste at least one news headline');
    setLoading(true); setResult('');
    try {
      const { data } = await axios.post('/api/analysis/news-sentiment', form);
      setResult(data.analysis);
      toast.success('Sentiment analysis complete');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Analysis failed');
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="card">
        <div className="firm-badge badge-goldman">AI News Intelligence</div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Ticker Symbol</label>
            <input
              className="form-input"
              placeholder="e.g. AAPL"
              value={form.ticker}
              onChange={e => set('ticker', e.target.value.toUpperCase())}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Company Name (optional)</label>
            <input
              className="form-input"
              placeholder="e.g. Apple Inc."
              value={form.companyName}
              onChange={e => set('companyName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Analysis Timeframe</label>
            <select
              className="form-select"
              value={form.timeframe}
              onChange={e => set('timeframe', e.target.value)}
            >
              <option>Intraday (today)</option>
              <option>Short-term (1-3 days)</option>
              <option>Near-term (1-4 weeks)</option>
              <option>Medium-term (1-3 months)</option>
            </select>
          </div>
          <div className="form-group form-full">
            <label className="form-label">
              News Headlines — paste one per line
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                (copy from Bloomberg, Reuters, CNBC, Twitter, etc.)
              </span>
            </label>
            <textarea
              className="form-textarea"
              style={{ minHeight: 140 }}
              placeholder={`Apple beats Q1 earnings by 8%, revenue hits all-time high\nFed signals potential rate cut in June — tech stocks rally\nApple Vision Pro sales miss initial projections by 40%\nBerkshire Hathaway increases Apple stake to $180B\nChina iPhone sales drop 20% amid Huawei competition`}
              value={form.headlines}
              onChange={e => set('headlines', e.target.value)}
            />
          </div>
        </div>
        <button
          className="btn btn-success btn-lg btn-full"
          onClick={run}
          disabled={loading}
        >
          {loading ? '⟳ Analyzing News Sentiment...' : '📰 Analyze News Sentiment'}
        </button>
      </div>
      <AnalysisResult result={result} module="News Sentiment Analyzer" loading={loading} />
    </div>
  );
}
