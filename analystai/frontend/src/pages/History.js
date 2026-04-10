import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const ALL_MODULES = [
  'Goldman Sachs Stock Screener',
  'Morgan Stanley DCF Valuation',
  'Bridgewater Risk Analysis',
  'JPMorgan Earnings Breakdown',
  'BlackRock Portfolio Builder',
  'Stock Breakdown',
  'Smart Trade Setup Builder',
  'Earnings Reaction Analyzer',
  'Portfolio Risk Scanner',
  'Sector Finder',
  'Long-Term Compounder Finder',
  'News Sentiment Analyzer',
  'Options Strategy Builder',
];

export default function History() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('All');

  useEffect(() => {
    axios.get('/api/user/history')
      .then(({ data }) => {
        if (data.success) setAnalyses(data.analyses);
      })
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = analyses;
    if (filterModule !== 'All') {
      list = list.filter(a => a.module === filterModule);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.module?.toLowerCase().includes(q) ||
        a.result?.toLowerCase().includes(q) ||
        JSON.stringify(a.input || {}).toLowerCase().includes(q)
      );
    }
    return list;
  }, [analyses, search, filterModule]);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const fmt = (iso) => new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  if (loading) {
    return (
      <div className="loading-box" style={{ marginTop: 60 }}>
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading history...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {filtered.length} of {analyses.length} analyses
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ width: 220, fontSize: 13 }}
            placeholder="Search analyses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-select"
            style={{ fontSize: 13, width: 200 }}
            value={filterModule}
            onChange={e => setFilterModule(e.target.value)}
          >
            <option value="All">All Modules</option>
            {ALL_MODULES.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📂</div>
          <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {analyses.length === 0 ? 'No analyses yet' : 'No results match your filter'}
          </div>
          <div style={{ fontSize: 14 }}>
            {analyses.length === 0
              ? 'Run your first analysis from any module to see it here.'
              : 'Try a different search term or select a different module.'}
          </div>
          {(search || filterModule !== 'All') && (
            <button
              onClick={() => { setSearch(''); setFilterModule('All'); }}
              className="btn btn-primary"
              style={{ marginTop: 16 }}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((a) => (
            <div key={a.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                    {a.module}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(a.created_at)}</div>
                </div>
                <button
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', fontSize: 13 }}
                  onClick={e => { e.stopPropagation(); copy(a.result); }}
                >
                  ⎘ Copy
                </button>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {expanded === a.id ? '▲' : '▼'}
                </div>
              </div>

              {expanded === a.id && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '20px', background: 'var(--bg-primary)' }}>
                  <div className="result-body">
                    <ReactMarkdown>{a.result}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
