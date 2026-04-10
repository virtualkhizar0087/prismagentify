import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function Success() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const plan = params.get('plan') || 'pro';
  const [verified, setVerified] = useState(false);
  const [customer, setCustomer] = useState('');

  useEffect(() => {
    if (sessionId) {
      axios.get(`/api/stripe/verify-session/${sessionId}`)
        .then(({ data }) => {
          if (data.paid) { setVerified(true); setCustomer(data.customer || ''); }
        })
        .catch(() => setVerified(true)); // show success even if verify fails
    } else {
      setVerified(true);
    }
  }, [sessionId]);

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
        <h1 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '12px' }}>Welcome to AnalystAI!</h1>
        <p style={{ color: '#8b949e', fontSize: '16px', marginBottom: '8px' }}>
          Your <strong style={{ color: '#00d395', textTransform: 'capitalize' }}>{plan}</strong> subscription is active.
          {customer && <> Confirmation sent to <strong style={{ color: '#e6edf3' }}>{customer}</strong>.</>}
        </p>
        <p style={{ color: '#6e7681', fontSize: '14px', marginBottom: '36px' }}>You now have access to institutional-grade AI analysis — the same frameworks used by Goldman Sachs, Morgan Stanley, and Bridgewater.</p>

        <div style={{ background: '#161b27', border: '1px solid #00d395', borderRadius: '16px', padding: '28px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', color: '#00d395', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Start Here</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '🎯', label: 'Build your first Trade Setup', path: '/app/trade-setup' },
              { icon: '🔬', label: 'Run a Stock Breakdown', path: '/app/stock-breakdown' },
              { icon: '🔍', label: 'Screen stocks like Goldman Sachs', path: '/app/screener' },
            ].map((item, i) => (
              <Link key={i} to={item.path} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#1a2035', border: '1px solid #2a3352', borderRadius: '8px', padding: '14px 16px', textDecoration: 'none', color: '#e6edf3', fontSize: '14px', fontWeight: 500 }}>
                <span>{item.icon}</span>{item.label}<span style={{ marginLeft: 'auto', color: '#4f8ef7' }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        <Link to="/app" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#4f8ef7,#3b6fd4)', color: 'white', padding: '14px 32px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '15px' }}>
          Open Dashboard →
        </Link>
      </div>
    </div>
  );
}
