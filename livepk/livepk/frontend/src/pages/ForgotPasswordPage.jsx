import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>📧</div>
          <h2 style={styles.title}>Check Your Email</h2>
          <p style={styles.subtitle}>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p style={{ color: '#888', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
            Didn't receive it? Check your spam folder or{' '}
            <button style={styles.link} onClick={() => setSent(false)}>try again</button>
          </p>
          <Link to="/login" style={styles.btn}>Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Forgot Password?</h2>
        <p style={styles.subtitle}>Enter your email and we'll send you a reset link.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
          <Link to="/login" style={{ color: '#E53E3E' }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f4', padding: 16 },
  card: { background: '#fff', borderRadius: 12, padding: 40, width: '100%', maxWidth: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#1a1a1a' },
  subtitle: { textAlign: 'center', color: '#666', fontSize: 14, marginBottom: 24 },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: { padding: '12px 16px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' },
  btn: { display: 'block', width: '100%', padding: '12px', background: '#E53E3E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 'bold', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', marginTop: 4 },
  error: { background: '#FEE2E2', color: '#C53030', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 12 },
  link: { background: 'none', border: 'none', color: '#E53E3E', cursor: 'pointer', padding: 0, fontSize: 13 },
};

export default ForgotPasswordPage;
