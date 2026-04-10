import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function InfluencerDashboard() {
  const { user } = useAuthStore();
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    api.get('/influencers/earnings').then(r => setEarnings(r.data.data)).catch(()=>{});
  }, []);

  const stats = [
    { icon:'💰', label:'Total Earnings', value:`PKR ${(earnings?.earnings?.totalCommission||0).toLocaleString()}` },
    { icon:'🛒', label:'Orders Attributed', value:earnings?.earnings?.totalOrders||0 },
    { icon:'📊', label:'Commission Rate', value:`${earnings?.commissionRate||10}%` },
    { icon:'👛', label:'Wallet Balance', value:`PKR ${(earnings?.walletBalance||0).toLocaleString()}` },
  ];

  return (
    <div style={{paddingTop:64,minHeight:'100vh'}}>
      <div className="container" style={{paddingTop:'2rem',paddingBottom:'4rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'2rem',flexWrap:'wrap',gap:'1rem'}}>
          <div>
            <div style={{fontSize:'0.7rem',fontFamily:'monospace',letterSpacing:'0.12em',textTransform:'uppercase',color:'#00C27C',marginBottom:'0.3rem'}}>Influencer Portal</div>
            <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'2rem',fontWeight:700}}>Hello, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={{color:'#7BA897',marginTop:'0.25rem',fontSize:'0.88rem'}}>
              @{user?.influencerProfile?.handle||user?.email?.split('@')[0]} · <span style={{textTransform:'capitalize'}}>{user?.influencerProfile?.tier||'nano'}</span> influencer · {user?.city}
            </p>
          </div>
          <Link to="/" className="btn btn-primary">🔴 Browse Live Streams</Link>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:'1rem',marginBottom:'2.5rem'}}>
          {stats.map(s=>(
            <div key={s.label} className="card" style={{textAlign:'center'}}>
              <div style={{fontSize:'1.5rem',marginBottom:'0.5rem'}}>{s.icon}</div>
              <div style={{fontFamily:'Playfair Display,serif',fontSize:'1.4rem',fontWeight:700,color:'#00C27C'}}>{s.value}</div>
              <div style={{fontSize:'0.78rem',color:'#7BA897',marginTop:'0.2rem'}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',marginBottom:'1.5rem'}}>
          <div className="card">
            <h3 style={{fontWeight:700,marginBottom:'1rem'}}>🎯 How to Earn</h3>
            {[['1','Join a live stream as co-host or pick products to promote'],['2','Share your referral link on TikTok, Instagram & WhatsApp'],['3','Earn 10–15% commission on every sale you generate'],['4','Withdraw to JazzCash or Easypaisa (min PKR 500)']].map(([n,t])=>(
              <div key={n} style={{display:'flex',gap:'0.75rem',marginBottom:'0.75rem'}}>
                <div style={{width:24,height:24,borderRadius:'50%',background:'rgba(0,194,124,0.15)',border:'1px solid rgba(0,194,124,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontFamily:'monospace',fontWeight:700,color:'#00C27C',flexShrink:0}}>{n}</div>
                <span style={{fontSize:'0.88rem',color:'#7BA897',lineHeight:1.5}}>{t}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{fontWeight:700,marginBottom:'1rem'}}>📈 Commission Tiers</h3>
            {[['Nano','<10K followers','10%'],['Micro','10K–100K','12%'],['Macro','100K–1M','14%'],['Mega','1M+','15% + bonuses']].map(([tier,range,rate])=>(
              <div key={tier} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.5rem 0',borderBottom:'1px solid rgba(0,194,124,0.08)',fontSize:'0.85rem'}}>
                <div>
                  <span style={{fontWeight:600}}>{tier}</span>
                  <span style={{color:'#7BA897',fontSize:'0.78rem',marginLeft:'0.5rem'}}>{range}</span>
                </div>
                <span style={{color:'#00C27C',fontWeight:700,fontFamily:'monospace'}}>{rate}</span>
              </div>
            ))}
            <div style={{marginTop:'0.75rem',fontSize:'0.75rem',color:'#4A7A6A'}}>Your tier upgrades automatically based on your follower count</div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>🔗 Your Referral Link</h3>
          <p style={{ color: '#7BA897', fontSize: '0.85rem', marginBottom: '1rem' }}>Share this link to earn commission on every sale</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              readOnly
              value={`${window.location.origin}/?ref=${user?._id}`}
              style={{ flex: 1, background: '#0D1F19', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '0.5rem', padding: '0.6rem 0.85rem', color: '#00C27C', fontSize: '0.85rem', fontFamily: 'monospace' }}
            />
            <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/?ref=${user?._id}`); toast.success('Link copied!'); }} className="btn btn-primary">Copy</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <a href={`https://wa.me/?text=Shop on LivePK using my link and get great deals! ${window.location.origin}/?ref=${user?._id}`} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', padding: '0.4rem 0.85rem', borderRadius: '0.4rem', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>📱 Share on WhatsApp</a>
          </div>
        </div>

        {/* Withdrawal */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>💸 Withdraw Earnings</h3>
          <WithdrawForm balance={earnings?.walletBalance || 0} onSuccess={() => { api.get('/influencers/earnings').then(r => setEarnings(r.data.data)).catch(()=>{}); }} />
        </div>

        <div className="card">
          <h3 style={{fontWeight:700,marginBottom:'1rem'}}>🚀 Quick Actions</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.75rem'}}>
            {[
              {icon:'🛍️',label:'Browse Products',desc:'Find products to promote',to:'/'},
              {icon:'📹',label:'Watch Live Streams',desc:'Join as co-host',to:'/'},
              {icon:'📊',label:'View Analytics',desc:'Track your performance',to:'/influencer'},
              {icon:'💳',label:'Withdraw Earnings',desc:'Min PKR 500',to:'/influencer'},
            ].map(a=>(
              <Link key={a.label} to={a.to} style={{display:'block',background:'#0D1F19',border:'1px solid rgba(0,194,124,0.2)',borderRadius:'0.6rem',padding:'1rem',textDecoration:'none',transition:'border-color 0.2s'}}>
                <div style={{fontSize:'1.5rem',marginBottom:'0.4rem'}}>{a.icon}</div>
                <div style={{fontWeight:600,fontSize:'0.88rem'}}>{a.label}</div>
                <div style={{fontSize:'0.75rem',color:'#7BA897',marginTop:'0.2rem'}}>{a.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WithdrawForm({ balance, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('jazzcash');
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(amount) < 500) { toast.error('Minimum PKR 500'); return; }
    if (Number(amount) > balance) { toast.error('Insufficient balance'); return; }
    setLoading(true);
    try {
      await api.post('/influencers/withdraw', { amount: Number(amount), method, accountNumber: account });
      toast.success(`✅ Withdrawal of PKR ${Number(amount).toLocaleString()} requested!`);
      setAmount(''); setAccount('');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ background: 'rgba(0,194,124,0.08)', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#7BA897', fontSize: '0.85rem' }}>Available Balance</span>
        <span style={{ color: '#00C27C', fontWeight: 700 }}>PKR {(balance || 0).toLocaleString()}</span>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label className="form-label">Amount (PKR)</label>
            <input className="form-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Min 500" min="500" required />
          </div>
          <div>
            <label className="form-label">Method</label>
            <select className="form-input" value={method} onChange={e => setMethod(e.target.value)}>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label className="form-label">{method === 'bank' ? 'IBAN' : 'Mobile Number'}</label>
          <input className="form-input" value={account} onChange={e => setAccount(e.target.value)} placeholder={method === 'bank' ? 'PK36SCBL...' : '03XX-XXXXXXX'} required />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || balance < 500}>
          {loading ? 'Processing...' : `💸 Withdraw PKR ${Number(amount || 0).toLocaleString()}`}
        </button>
      </form>
    </div>
  );
}
