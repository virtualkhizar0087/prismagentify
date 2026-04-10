import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PLAN_DETAILS = {
  starter: { name: 'Starter', price: '$19/mo', color: '#4f8ef7', features: ['5 AI analyses per day', 'Trade Setup Builder', 'Stock Breakdown', 'Earnings Reaction', 'Sector Finder', 'Email support'] },
  pro: { name: 'Pro', price: '$49/mo', color: '#00d395', features: ['Unlimited AI analyses', 'All 11 modules', 'Goldman Sachs Screener', 'Morgan Stanley DCF', 'Bridgewater Risk', 'JPMorgan Earnings', 'BlackRock Portfolio Builder', 'Priority support'] },
  enterprise: { name: 'Enterprise', price: '$199/mo', color: '#f0b429', features: ['Everything in Pro', 'White-label reports', 'Team access (5 seats)', 'API access', 'Custom AI personas', 'Dedicated account manager'] },
};

export default function Checkout() {
  const [params] = useSearchParams();
  const plan = params.get('plan') || 'pro';
  const details = PLAN_DETAILS[plan] || PLAN_DETAILS.pro;
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please sign in first');
      navigate(`/login?redirect=/checkout?plan=${plan}`);
    }
  }, [user, authLoading, plan, navigate]);

  const handleCheckout = async () => {
    if (!user) {
      navigate(`/login?redirect=/checkout?plan=${plan}`);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/stripe/create-checkout', { plan });
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not create checkout session');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Checkout failed. Check your Stripe key.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <Link to="/" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
          ← Back
        </Link>

        <div style={{ background: '#161b27', border: `1px solid ${details.color}`, borderRadius: '16px', padding: '32px', marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: details.color, fontWeight: 700, marginBottom: '8px' }}>AnalystAI {details.name}</div>
          <div style={{ fontSize: '42px', fontWeight: 900, color: details.color, marginBottom: '20px' }}>{details.price}</div>

          <ul style={{ listStyle: 'none', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {details.features.map((f, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#c9d1d9' }}>
                <span style={{ color: details.color }}>✓</span>{f}
              </li>
            ))}
          </ul>

          {user && (
            <div style={{ marginBottom: '16px', background: '#0d1117', border: '1px solid #2a3352', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#8b949e' }}>
              Subscribing as: <strong style={{ color: '#e6edf3' }}>{user.email}</strong>
            </div>
          )}

          <button onClick={handleCheckout} disabled={loading || authLoading} style={{ width: '100%', background: `linear-gradient(135deg,${details.color},${details.color}cc)`, color: '#0d1117', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: 800, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Inter' }}>
            {loading ? 'Redirecting to Stripe...' : `Start ${details.name} — ${details.price} →`}
          </button>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#6e7681', marginTop: '14px' }}>
            🔒 Secure payment via Stripe · Cancel anytime · 7-day money-back guarantee
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/pricing" style={{ color: '#4f8ef7', fontSize: '13px', textDecoration: 'none' }}>View all plans →</Link>
        </div>
      </div>
    </div>
  );
}
