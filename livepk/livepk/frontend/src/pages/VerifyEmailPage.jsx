import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      });
  }, []);

  return (
    <div style={s.page}>
      <div style={s.card}>
        {status === 'verifying' && (
          <>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
            <h2 style={s.title}>Verifying your email...</h2>
            <p style={s.sub}>Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={s.icon}>✅</div>
            <h2 style={s.title}>Email Verified!</h2>
            <p style={s.sub}>{message}</p>
            <p style={{ color: '#4A7A6A', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Redirecting to login...
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
              Login Now
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={s.icon}>❌</div>
            <h2 style={s.title}>Verification Failed</h2>
            <p style={s.sub}>{message}</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Register Again</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#050D0A' },
  card: { background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '1rem', padding: '3rem 2.5rem', textAlign: 'center', maxWidth: 440, width: '100%' },
  icon: { fontSize: '3rem', marginBottom: '1rem' },
  title: { fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem', color: '#E8F5F0' },
  sub: { color: '#7BA897', fontSize: '0.95rem', lineHeight: 1.5 },
};
