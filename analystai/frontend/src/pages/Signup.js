import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Enter email and password');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await signUp(email, password);
      toast.success('Account created! Check your email to confirm.');
      navigate('/app');
    } catch (err) {
      toast.error(err.message || 'Signup failed');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err.message || 'Google signup failed');
    }
  };

  return (
    <div style={styles.page}>
      <nav style={styles.nav}>
        <Link to="/" style={styles.logo}>AnalystAI</Link>
      </nav>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>Create your account</div>
          <div style={styles.cardSub}>Get 3 free AI analyses — no card required</div>
        </div>

        <button style={styles.googleBtn} onClick={handleGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.48A4.8 4.8 0 014.5 7.5V5.43H1.83a8 8 0 000 7.14L4.5 10.48z"/>
            <path fill="#EA4335" d="M8.98 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 8.98 0A8 8 0 001.83 5.43L4.5 7.5c.68-2.03 2.6-3.92 4.48-3.92z"/>
          </svg>
          Continue with Google
        </button>

        <div style={styles.divider}><span>or</span></div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Free Account →'}
          </button>
        </form>

        <div style={styles.trialNote}>
          ✓ 3 free analyses included &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ Upgrade anytime
        </div>

        <div style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0d1117',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: 'Inter, sans-serif',
    color: '#e6edf3',
  },
  nav: {
    width: '100%',
    padding: '0 40px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #2a3352',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 800,
    background: 'linear-gradient(135deg,#4f8ef7,#00d395)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textDecoration: 'none',
  },
  card: {
    background: '#161b27',
    border: '1px solid #2a3352',
    borderRadius: '16px',
    padding: '36px 40px',
    width: '100%',
    maxWidth: '420px',
    marginTop: '64px',
  },
  cardHeader: { marginBottom: '28px', textAlign: 'center' },
  cardTitle: { fontSize: '22px', fontWeight: 700, marginBottom: '6px' },
  cardSub: { fontSize: '14px', color: '#00d395' },
  googleBtn: {
    width: '100%',
    padding: '11px',
    background: '#1a2035',
    border: '1px solid #2a3352',
    borderRadius: '8px',
    color: '#e6edf3',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    textAlign: 'center',
    margin: '20px 0',
    color: '#6e7681',
    fontSize: '12px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#8b949e', fontWeight: 500 },
  input: {
    padding: '10px 14px',
    background: '#0d1117',
    border: '1px solid #2a3352',
    borderRadius: '8px',
    color: '#e6edf3',
    fontSize: '14px',
    outline: 'none',
  },
  submitBtn: {
    padding: '12px',
    background: 'linear-gradient(135deg,#4f8ef7,#3b6fd4)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
  },
  trialNote: {
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '12px',
    color: '#6e7681',
  },
  footer: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#8b949e' },
  link: { color: '#4f8ef7', textDecoration: 'none', fontWeight: 500 },
};
