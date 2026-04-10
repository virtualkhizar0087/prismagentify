import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'analystai_watchlist';

const MODULE_OPTIONS = [
  { label: 'Stock Breakdown', path: '/app/stock-breakdown' },
  { label: 'DCF Valuation', path: '/app/dcf' },
  { label: 'Trade Setup', path: '/app/trade-setup' },
  { label: 'Risk Analysis', path: '/app/risk' },
  { label: 'Earnings Breakdown', path: '/app/earnings-breakdown' },
  { label: 'News Sentiment', path: '/app/news-sentiment' },
  { label: 'Options Strategy', path: '/app/options-strategy' },
];

function loadList() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveList(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function Watchlist() {
  const [items, setItems] = useState(loadList);
  const [ticker, setTicker] = useState('');
  const [note, setNote] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNote, setEditNote] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    saveList(items);
  }, [items]);

  const add = () => {
    if (!ticker.trim()) return toast.error('Enter a ticker');
    const sym = ticker.trim().toUpperCase();
    if (items.find(i => i.ticker === sym)) return toast.error(`${sym} is already in your watchlist`);
    const newItem = { id: Date.now(), ticker: sym, note: note.trim(), added: new Date().toISOString() };
    setItems(prev => [newItem, ...prev]);
    setTicker('');
    setNote('');
    toast.success(`${sym} added to watchlist`);
  };

  const remove = (id, sym) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success(`${sym} removed`);
  };

  const saveEdit = (id) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, note: editNote } : i));
    setEditId(null);
    toast.success('Note saved');
  };

  const runAnalysis = (tickerSym, modulePath) => {
    navigate(modulePath);
    setTimeout(() => {
      // Pre-fill ticker in destination page via sessionStorage hint
      sessionStorage.setItem('prefill_ticker', tickerSym);
    }, 50);
  };

  const fmt = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>

      {/* Add ticker */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 14 }}>Add to Watchlist</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ width: 120, flexShrink: 0 }}
            placeholder="Ticker (e.g. AAPL)"
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && add()}
          />
          <input
            className="form-input"
            style={{ flex: 1, minWidth: 180 }}
            placeholder="Note (optional) — e.g. Watch for earnings beat, strong moat"
            value={note}
            onChange={e => setNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
          />
          <button className="btn btn-primary" onClick={add} style={{ flexShrink: 0 }}>
            + Add
          </button>
        </div>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>★</div>
          <div style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 8 }}>Your watchlist is empty</div>
          <div style={{ fontSize: 14 }}>Add tickers above to track them and quickly run analysis.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 2 }}>{items.length} ticker{items.length !== 1 ? 's' : ''} tracked</div>
          {items.map(item => (
            <div key={item.id} className="card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {/* Ticker badge */}
                <div style={{
                  background: 'linear-gradient(135deg,rgba(79,142,247,0.15),rgba(0,211,149,0.1))',
                  border: '1px solid rgba(79,142,247,0.3)',
                  borderRadius: 8,
                  padding: '8px 14px',
                  minWidth: 70,
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#4f8ef7', letterSpacing: '1px' }}>{item.ticker}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Added {fmt(item.added)}</div>
                </div>

                {/* Note */}
                <div style={{ flex: 1 }}>
                  {editId === item.id ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        className="form-input"
                        style={{ flex: 1, fontSize: 13 }}
                        value={editNote}
                        onChange={e => setEditNote(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(item.id)}
                        autoFocus
                      />
                      <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => saveEdit(item.id)}>Save</button>
                      <button className="btn" style={{ padding: '6px 12px', fontSize: 12, background: 'var(--bg-secondary)' }} onClick={() => setEditId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div
                      style={{ fontSize: 13, color: item.note ? 'var(--text-secondary)' : 'var(--text-muted)', cursor: 'pointer', minHeight: 20, lineHeight: 1.5 }}
                      onClick={() => { setEditId(item.id); setEditNote(item.note); }}
                      title="Click to edit note"
                    >
                      {item.note || <span style={{ fontStyle: 'italic' }}>No note — click to add one</span>}
                    </div>
                  )}

                  {/* Quick-run analysis buttons */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {MODULE_OPTIONS.slice(0, 4).map(mod => (
                      <button
                        key={mod.path}
                        onClick={() => runAnalysis(item.ticker, mod.path)}
                        style={{
                          background: 'rgba(79,142,247,0.08)',
                          border: '1px solid rgba(79,142,247,0.2)',
                          borderRadius: 6,
                          padding: '4px 10px',
                          color: '#4f8ef7',
                          fontSize: 11,
                          cursor: 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        {mod.label} →
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => remove(item.id, item.ticker)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '2px 6px', flexShrink: 0 }}
                  title="Remove from watchlist"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
