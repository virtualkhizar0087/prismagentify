// LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div style={authStyles.page}>
      <div style={authStyles.card}>
        <Link to="/" style={authStyles.logo}>Dikhaao 🔴</Link>
        <h1 style={authStyles.title}>Welcome Back</h1>
        <p style={authStyles.sub}>Login to your Dikhaao account</p>

        <form onSubmit={handleSubmit} style={authStyles.form}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email" required
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password" required
              className="form-input"
              placeholder="Your password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login →'}
          </button>
        </form>

        <p style={authStyles.switch}>
          Don't have an account? <Link to="/register">Register free</Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'buyer', city: 'Lahore' });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(form);
    if (result.success) {
      toast.success('Account created! Welcome to Dikhaao 🎉');
      if (form.role === 'seller') navigate('/seller');
      else if (form.role === 'influencer') navigate('/influencer');
      else navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  const roles = [
    { value: 'buyer', label: '🛍️ I want to shop', desc: 'Browse and buy from live streams' },
    { value: 'seller', label: '🏪 I want to sell', desc: 'List products and go live' },
    { value: 'influencer', label: '🎥 I am an influencer', desc: 'Promote products and earn commission' },
  ];

  return (
    <div style={authStyles.page}>
      <div style={{ ...authStyles.card, maxWidth: 480 }}>
        <Link to="/" style={authStyles.logo}>Dikhaao 🔴</Link>
        <h1 style={authStyles.title}>Join Dikhaao</h1>
        <p style={authStyles.sub}>Pakistan's #1 Live Commerce Platform</p>

        <form onSubmit={handleSubmit} style={authStyles.form}>
          {/* Role Selection */}
          <div>
            <label className="form-label">I am a...</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.4rem' }}>
              {roles.map(r => (
                <label key={r.value} style={{
                  ...authStyles.roleOption,
                  ...(form.role === r.value ? authStyles.roleOptionActive : {})
                }}>
                  <input
                    type="radio"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontWeight: 600 }}>{r.label}</span>
                  <span style={{ fontSize: '0.78rem', color: '#7BA897' }}>{r.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" required className="form-input" placeholder="Muhammad Ali" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" required className="form-input" placeholder="you@gmail.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone (Pakistani)</label>
            <input type="tel" className="form-input" placeholder="03001234567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <select className="form-input form-select" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                {['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" required className="form-input" placeholder="6+ characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} minLength={6} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>

        <p style={authStyles.switch}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

const authStyles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1.5rem 2rem', background: 'linear-gradient(180deg, rgba(0,194,124,0.05) 0%, transparent 40%)' },
  card: { width: '100%', maxWidth: 420, background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '1rem', padding: '2.5rem' },
  logo: { display: 'block', textAlign: 'center', fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: '1.1rem', color: '#00C27C', textDecoration: 'none', marginBottom: '1.5rem' },
  title: { fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.4rem' },
  sub: { color: '#7BA897', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  switch: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.88rem', color: '#7BA897' },
  roleOption: { display: 'flex', flexDirection: 'column', gap: '0.1rem', background: '#0D1F19', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '0.5rem', padding: '0.75rem 1rem', cursor: 'pointer', transition: 'all 0.15s' },
  roleOptionActive: { background: 'rgba(0,194,124,0.12)', borderColor: '#00C27C' },
};

export default LoginPage;
