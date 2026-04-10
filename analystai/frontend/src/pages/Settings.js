import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../lib/supabase';

const PLAN_COLORS = { free: '#6e7681', starter: '#4f8ef7', pro: '#00d395', enterprise: '#f0b429' };
const PLAN_LABELS = { free: 'Free', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };
const PLAN_LIMITS = {
  free: '3 lifetime analyses',
  starter: '5 analyses per day',
  pro: 'Unlimited analyses',
  enterprise: 'Unlimited analyses',
};

export default function Settings() {
  const { user, profile, plan, usageDisplay, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const planColor = PLAN_COLORS[plan] || '#6e7681';
  const planLabel = PLAN_LABELS[plan] || 'Free';
  const isPaid = plan !== 'free';

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    }
    setChangingPassword(false);
  };

  const handleBillingPortal = async () => {
    setLoadingPortal(true);
    try {
      const { data } = await axios.post('/api/stripe/billing-portal');
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not open billing portal');
    }
    setLoadingPortal(false);
  };

  const handleUpgrade = () => {
    navigate('/checkout?plan=pro');
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Account Info */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 16 }}>Account</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg,#4f8ef7,#00d395)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.email}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Current Plan</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: planColor }}>{planLabel}</div>
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Usage</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{usageDisplay}</div>
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Plan Limit</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{PLAN_LIMITS[plan] || '3 lifetime'}</div>
          </div>
          <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Analyses</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-blue)' }}>{profile?.total_analyses || 0}</div>
          </div>
        </div>
      </div>

      {/* Subscription Management */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 16 }}>Subscription</div>

        {isPaid ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d395', flexShrink: 0 }}></div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Active <strong style={{ color: planColor }}>{planLabel}</strong> subscription — {PLAN_LIMITS[plan]}
              </div>
            </div>
            <button
              onClick={handleBillingPortal}
              disabled={loadingPortal}
              className="btn btn-primary"
              style={{ marginRight: 10 }}
            >
              {loadingPortal ? '⟳ Opening...' : '🔗 Manage Billing & Invoices'}
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cancel, upgrade, or download invoices via Stripe</span>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              You're on the <strong>Free plan</strong> — 3 lifetime analyses. Upgrade to unlock unlimited access.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { plan: 'starter', label: 'Starter — $19/mo', desc: '5 analyses/day', color: '#4f8ef7' },
                { plan: 'pro', label: 'Pro — $49/mo', desc: 'Unlimited, all modules', color: '#00d395' },
                { plan: 'enterprise', label: 'Enterprise — $199/mo', desc: 'Team access + API', color: '#f0b429' },
              ].map(p => (
                <button
                  key={p.plan}
                  onClick={() => navigate(`/checkout?plan=${p.plan}`)}
                  style={{
                    background: `rgba(${p.color === '#4f8ef7' ? '79,142,247' : p.color === '#00d395' ? '0,211,149' : '240,180,41'},0.08)`,
                    border: `1px solid ${p.color}`,
                    borderRadius: 8,
                    padding: '10px 16px',
                    color: p.color,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  <div>{p.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 400 }}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 16 }}>Change Password</div>
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min. 6 characters"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={changingPassword}>
              {changingPassword ? '⟳ Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid rgba(255,77,109,0.3)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-red)', marginBottom: 10 }}>Danger Zone</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Need to delete your account? Contact us and we'll handle it within 24 hours.
        </div>
        <a
          href="mailto:support@analystai.com"
          style={{ fontSize: 13, color: 'var(--accent-red)', textDecoration: 'none', fontWeight: 500 }}
        >
          Contact support →
        </a>
      </div>

    </div>
  );
}
