import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const MODULES = [
  { icon: '🔍', name: 'Stock Screener', firm: 'Goldman Sachs Style', desc: 'Top 10 picks with P/E, moat rating, entry zones & stop-loss' },
  { icon: '📐', name: 'DCF Valuation', firm: 'Morgan Stanley Style', desc: '5-year projections, WACC, terminal value, undervalued verdict' },
  { icon: '🛡', name: 'Risk Analysis', firm: 'Bridgewater Style', desc: 'Correlation matrix, stress tests, Ray Dalio hedging strategies' },
  { icon: '📊', name: 'Earnings Breakdown', firm: 'JPMorgan Style', desc: 'Beat/miss history, implied move, bull/bear trade play' },
  { icon: '🏗', name: 'Portfolio Builder', firm: 'BlackRock Style', desc: 'Asset allocation, ETF picks, tax efficiency & rebalancing' },
  { icon: '🎯', name: 'Trade Setup Builder', firm: 'Smart Trading', desc: 'Entry zone, stop-loss, TP1/TP2/TP3 with R:R grade' },
  { icon: '🌐', name: 'Sector Finder', firm: 'Macro Strategy', desc: 'Top 5 sectors to outperform based on macro conditions' },
  { icon: '📈', name: 'Compounder Finder', firm: 'Buffett Style', desc: 'Long-term compounders with 5-year potential analysis' },
  { icon: '📰', name: 'News Sentiment', firm: 'AI Intelligence', desc: 'Paste headlines → sentiment score, trade implication & impact', badge: 'NEW' },
  { icon: '📊', name: 'Options Strategy', firm: 'Derivatives Desk', desc: 'Event-driven options plays — strikes, expiry, max P&L', badge: 'NEW' },
];

const TESTIMONIALS = [
  { name: 'James R.', role: 'Retail Investor, Texas', avatar: 'J', text: 'I used the Goldman Sachs screener and it gave me a better stock breakdown than anything I\'ve paid $200/mo for. The entry zones were spot on.', rating: 5 },
  { name: 'Sarah M.', role: 'Forex Trader, London', avatar: 'S', text: 'The Trade Setup module changed how I trade. Clear entry, stop-loss, and three targets with R:R ratios. I finally stopped guessing.', rating: 5 },
  { name: 'Daniel K.', role: 'Portfolio Manager, Dubai', avatar: 'D', text: 'The Bridgewater risk analysis on my portfolio found concentration risks I had missed for months. This is institutional quality at 1% of the price.', rating: 5 },
];

const FAQS = [
  { q: 'Is the analysis based on real-time market data?', a: 'AnalystAI uses Claude AI trained on vast financial knowledge to reason through your inputs. For live price data, enter current prices and the AI analyzes from there. We recommend cross-referencing with your broker for live quotes.' },
  { q: 'Who is this for?', a: 'Retail investors, forex traders, financial advisors, and anyone who wants Goldman Sachs-quality research without the Goldman Sachs price tag. If you make investment or trading decisions, AnalystAI gives you an edge.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel with one click, no questions asked. You keep access until the end of your billing period.' },
  { q: 'Is this financial advice?', a: 'AnalystAI provides AI-generated analysis for educational and research purposes. It is not registered financial advice. Always do your own research and consult a licensed advisor for major decisions.' },
  { q: 'How is this different from ChatGPT?', a: 'AnalystAI has 13 pre-built institutional analyst personas, structured forms for each analysis type, professional report formatting, and a Bloomberg-style interface — all optimized for traders and investors. ChatGPT requires you to write the prompts yourself.' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = 13;
    const step = Math.ceil(target / 30);
    const timer = setInterval(() => {
      setCount(c => { if (c >= target) { clearInterval(timer); return target; } return c + step; });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#0d1117', color: '#e6edf3', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{ padding: '0 40px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a3352', position: 'sticky', top: 0, background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ fontSize: '20px', fontWeight: 800, background: 'linear-gradient(135deg,#4f8ef7,#00d395)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AnalystAI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <a href="#features" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '14px' }}>Features</a>
          <a href="#pricing" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '14px' }}>Pricing</a>
          <a href="#faq" style={{ color: '#8b949e', textDecoration: 'none', fontSize: '14px' }}>FAQ</a>
          <Link to="/app" style={{ background: 'linear-gradient(135deg,#4f8ef7,#3b6fd4)', color: 'white', padding: '8px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            Open App →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '90px 40px 80px', background: 'radial-gradient(ellipse at 50% 0%, rgba(79,142,247,0.08) 0%, transparent 65%)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,211,149,0.08)', border: '1px solid rgba(0,211,149,0.2)', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: '#00d395', fontWeight: 600, marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00d395', display: 'inline-block' }}></span>
          AI-Powered Financial Analysis Platform
        </div>

        <h1 style={{ fontSize: '58px', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: '22px', maxWidth: '800px', margin: '0 auto 22px' }}>
          Your Personal{' '}
          <span style={{ background: 'linear-gradient(135deg,#4f8ef7,#00d395)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Goldman Sachs Analyst
          </span>
          <br />— For $19 a Month
        </h1>

        <p style={{ fontSize: '19px', color: '#8b949e', maxWidth: '560px', margin: '0 auto 36px', lineHeight: 1.6 }}>
          Get institutional-grade stock analysis, trade setups, and portfolio risk reports in 30 seconds. The same frameworks used by Wall Street — now in your hands.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#pricing" style={{ background: 'linear-gradient(135deg,#4f8ef7,#3b6fd4)', color: 'white', padding: '14px 32px', borderRadius: '10px', textDecoration: 'none', fontSize: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            Start Free Trial → <span style={{ fontSize: '12px', opacity: 0.8 }}>No card required</span>
          </a>
          <Link to="/app" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #2a3352', color: '#e6edf3', padding: '14px 28px', borderRadius: '10px', textDecoration: 'none', fontSize: '16px', fontWeight: 600 }}>
            See It In Action
          </Link>
        </div>

        {/* Firm logos */}
        <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#6e7681', marginRight: '4px' }}>Analysis styles inspired by:</span>
          {['Goldman Sachs', 'Morgan Stanley', 'Bridgewater', 'JPMorgan', 'BlackRock'].map(f => (
            <span key={f} style={{ background: '#161b27', border: '1px solid #2a3352', padding: '5px 14px', borderRadius: '20px', fontSize: '12px', color: '#8b949e', fontWeight: 500 }}>{f}</span>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '60px', flexWrap: 'wrap' }}>
          {[
            { val: `${count}`, unit: ' Modules', label: 'Analysis frameworks' },
            { val: '30', unit: 'sec', label: 'Average report time' },
            { val: '$0', unit: '', label: 'To get started' },
            { val: '5', unit: ' Firm styles', label: 'Wall Street personas' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                <span style={{ background: 'linear-gradient(135deg,#4f8ef7,#00d395)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.val}</span>
                <span style={{ fontSize: '16px', color: '#8b949e' }}>{s.unit}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#6e7681', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{ padding: '80px 40px', background: '#161b27', borderTop: '1px solid #2a3352', borderBottom: '1px solid #2a3352' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#ff4d6d', fontWeight: 600, marginBottom: '16px' }}>The Problem</div>
          <h2 style={{ fontSize: '38px', fontWeight: 800, marginBottom: '24px', letterSpacing: '-1px' }}>
            Wall Street charges $50,000+/year<br />for the same analysis you need today
          </h2>
          <p style={{ fontSize: '17px', color: '#8b949e', lineHeight: 1.7, marginBottom: '40px' }}>
            Goldman Sachs equity research. Morgan Stanley DCF models. Bridgewater risk reports. JPMorgan earnings briefs. These aren't publicly available — unless you're an institutional client paying six figures. Everyone else guesses.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { icon: '😤', title: 'No clear entry/exit', desc: 'You enter trades emotionally, guess the stop-loss, and exit too early or too late' },
              { icon: '📉', title: 'No risk awareness', desc: 'Your portfolio has hidden concentration risks and correlations you\'ve never measured' },
              { icon: '🤷', title: 'No institutional edge', desc: 'Reddit, CNBC, and YouTube give you noise — not structured, actionable analysis' },
            ].map((p, i) => (
              <div key={i} style={{ background: '#1a2035', border: '1px solid #2a3352', borderRadius: '12px', padding: '24px' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{p.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '15px' }}>{p.title}</div>
                <div style={{ color: '#8b949e', fontSize: '13px', lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#00d395', fontWeight: 600, marginBottom: '16px' }}>The Solution</div>
          <h2 style={{ fontSize: '38px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-1px' }}>
            13 institutional AI analysts,<br />one simple platform
          </h2>
          <p style={{ fontSize: '17px', color: '#8b949e', lineHeight: 1.7 }}>
            Describe your stock, trade, or portfolio — and get a structured report as if a senior analyst at Goldman Sachs, Morgan Stanley, or Bridgewater just wrote it for you. In 30 seconds. For $19 a month.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '20px 40px 80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {MODULES.map((m, i) => (
              <div key={i} style={{ background: '#161b27', border: '1px solid #2a3352', borderRadius: '12px', padding: '22px', transition: 'all 0.2s', cursor: 'default', position: 'relative' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f8ef7'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3352'; e.currentTarget.style.transform = 'none'; }}>
                {m.badge && (
                  <span style={{ position: 'absolute', top: 12, right: 12, background: 'linear-gradient(135deg,#00d395,#00a36d)', color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 10, letterSpacing: '1px' }}>{m.badge}</span>
                )}
                <div style={{ fontSize: '26px', marginBottom: '10px' }}>{m.icon}</div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4f8ef7', fontWeight: 700, marginBottom: '6px' }}>{m.firm}</div>
                <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>{m.name}</div>
                <div style={{ color: '#8b949e', fontSize: '13px', lineHeight: 1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section style={{ padding: '60px 40px', background: '#161b27', borderTop: '1px solid #2a3352', borderBottom: '1px solid #2a3352' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '34px', fontWeight: 800, textAlign: 'center', marginBottom: '40px', letterSpacing: '-1px' }}>Why traders choose AnalystAI</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: '✅', title: 'Stop guessing entries and exits', desc: 'Every trade setup gives you an exact entry zone, stop-loss level, and three price targets with R:R ratios — so you trade with a plan, not hope.' },
              { icon: '✅', title: 'Know if a stock is cheap or expensive in 30 seconds', desc: 'The Morgan Stanley DCF module builds a full valuation model and tells you: undervalued, fairly valued, or overvalued — with the math shown.' },
              { icon: '✅', title: 'Find hidden risks before they hurt you', desc: 'The Bridgewater risk module stress-tests your portfolio against 2008 and 2020 scenarios and flags every concentration, correlation, and liquidity risk.' },
              { icon: '✅', title: 'Trade earnings with an edge', desc: 'See 4-quarter beat/miss patterns, consensus estimates, bull/bear scenarios, and get a clear recommended play: buy before, sell before, or wait.' },
              { icon: '✅', title: 'Build your entire portfolio like a BlackRock strategist', desc: 'Input your age, income, goals and risk tolerance — get an exact ETF allocation, rebalancing schedule, and one-page investment policy statement.' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', background: '#1a2035', border: '1px solid #2a3352', borderRadius: '10px', padding: '20px' }}>
                <span style={{ fontSize: '20px', marginTop: '2px' }}>{b.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '15px' }}>{b.title}</div>
                  <div style={{ color: '#8b949e', fontSize: '13.5px', lineHeight: 1.6 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPETITOR COMPARISON */}
      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#4f8ef7', fontWeight: 600, marginBottom: '16px' }}>vs. The Competition</div>
          <h2 style={{ fontSize: '34px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1px' }}>AnalystAI vs. everything else</h2>
          <p style={{ color: '#8b949e', fontSize: '15px', marginBottom: '40px' }}>More analysis types, better AI, a fraction of the price.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
              <thead>
                <tr>
                  {['Feature', 'AnalystAI', 'Seeking Alpha', 'Koyfin', 'Simply Wall St', 'ChatGPT'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', background: i === 1 ? 'rgba(0,211,149,0.1)' : '#161b27', border: '1px solid #2a3352', color: i === 1 ? '#00d395' : '#8b949e', fontWeight: 700, fontSize: '13px' }}>
                      {i === 1 ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ background: '#00d395', color: '#0d1117', fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 8 }}>YOU</span>{h}</span> : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Price', '$19/mo', '$19-99/mo', '$25-75/mo', '$10-25/mo', '$20/mo'],
                  ['Institutional AI Analysis', '✅ 13 modules', '⚠️ Basic AI summaries', '❌ No AI analysis', '⚠️ Simple scores only', '⚠️ Manual prompts only'],
                  ['Goldman/MS/Bridgewater styles', '✅ Yes', '❌ No', '❌ No', '❌ No', '⚠️ DIY prompting'],
                  ['DCF Valuation Model', '✅ Full model', '⚠️ Estimates only', '⚠️ Manual', '⚠️ Basic', '⚠️ Manual'],
                  ['Trade Setup (Entry/Stop/TP)', '✅ Yes', '❌ No', '❌ No', '❌ No', '⚠️ Manual'],
                  ['Options Strategy Builder', '✅ Yes (NEW)', '❌ No', '❌ No', '❌ No', '⚠️ Manual'],
                  ['News Sentiment Analyzer', '✅ Yes (NEW)', '✅ Yes', '❌ No', '❌ No', '⚠️ Manual'],
                  ['Portfolio Risk Scanner', '✅ Yes', '⚠️ Basic', '✅ Yes', '✅ Yes', '⚠️ Manual'],
                  ['Watchlist', '✅ Yes', '✅ Yes', '✅ Yes', '✅ Yes', '❌ No'],
                  ['PDF Export', '✅ Yes', '✅ Yes', '✅ Yes', '✅ Yes', '❌ No'],
                  ['Analysis History', '✅ Saved', '✅ Yes', '✅ Yes', '❌ No', '❌ No'],
                  ['Setup complexity', '✅ Zero — instant', '⚠️ Medium', '⚠️ High learning curve', '✅ Easy', '⚠️ Requires expertise'],
                ].map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? '#0d1117' : '#101418' }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{
                        padding: '11px 16px',
                        border: '1px solid #2a3352',
                        color: ci === 0 ? '#c9d1d9' : ci === 1 ? '#e6edf3' : '#8b949e',
                        fontWeight: ci === 0 ? 600 : ci === 1 ? 700 : 400,
                        background: ci === 1 ? 'rgba(0,211,149,0.04)' : undefined,
                      }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#f0b429', fontWeight: 600, marginBottom: '16px' }}>What Users Say</div>
          <h2 style={{ fontSize: '34px', fontWeight: 800, marginBottom: '40px', letterSpacing: '-1px' }}>Traders who stopped guessing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: '#161b27', border: '1px solid #2a3352', borderRadius: '12px', padding: '24px', textAlign: 'left' }}>
                <div style={{ color: '#f0b429', fontSize: '16px', marginBottom: '14px' }}>{'★'.repeat(t.rating)}</div>
                <p style={{ color: '#c9d1d9', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px', fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#00d395)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: '#0d1117' }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{t.name}</div>
                    <div style={{ color: '#8b949e', fontSize: '12px' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '80px 40px', background: '#161b27', borderTop: '1px solid #2a3352', borderBottom: '1px solid #2a3352' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#4f8ef7', fontWeight: 600, marginBottom: '16px' }}>Simple Pricing</div>
          <h2 style={{ fontSize: '38px', fontWeight: 800, marginBottom: '12px', letterSpacing: '-1px' }}>One trade pays for the entire year</h2>
          <p style={{ color: '#8b949e', fontSize: '16px', marginBottom: '48px' }}>Cancel anytime. No contracts. No hidden fees.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
              { name: 'Starter', price: '$19', period: '/mo', color: '#4f8ef7', features: ['5 AI analyses per day', 'Trade Setup Builder', 'Stock Breakdown', 'Earnings Reaction', 'Sector Finder', 'Email support'], cta: 'Start Free Trial', popular: false },
              { name: 'Pro', price: '$49', period: '/mo', color: '#00d395', features: ['Unlimited AI analyses', 'All 13 modules', 'Goldman Sachs Screener', 'Morgan Stanley DCF', 'Bridgewater Risk', 'JPMorgan Earnings', 'News Sentiment + Options', 'Priority support'], cta: 'Get Pro Access', popular: true },
              { name: 'Enterprise', price: '$199', period: '/mo', color: '#f0b429', features: ['Everything in Pro', 'White-label reports', 'Team access (5 seats)', 'API access', 'Custom AI personas', 'Dedicated account manager'], cta: 'Contact Sales', popular: false },
            ].map((p, i) => (
              <div key={i} style={{ background: p.popular ? 'linear-gradient(145deg,#1a2a4a,#1a2035)' : '#1a2035', border: `1px solid ${p.popular ? p.color : '#2a3352'}`, borderRadius: '16px', padding: '32px 24px', position: 'relative', transform: p.popular ? 'scale(1.04)' : 'none', boxShadow: p.popular ? `0 0 40px rgba(0,211,149,0.1)` : 'none' }}>
                {p.popular && <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: p.color, color: '#0d1117', padding: '4px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>Most Popular</div>}
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#8b949e', marginBottom: '12px' }}>{p.name}</div>
                <div style={{ fontSize: '48px', fontWeight: 900, color: p.color, letterSpacing: '-2px', lineHeight: 1 }}>{p.price}<span style={{ fontSize: '16px', color: '#8b949e', fontWeight: 400 }}>{p.period}</span></div>
                <div style={{ height: '1px', background: '#2a3352', margin: '24px 0' }}></div>
                <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {p.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#c9d1d9' }}>
                      <span style={{ color: p.color, fontWeight: 700 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link to={`/checkout?plan=${p.name.toLowerCase()}`} style={{ display: 'block', background: p.popular ? `linear-gradient(135deg,${p.color},#00a872)` : `rgba(${p.color === '#4f8ef7' ? '79,142,247' : p.color === '#f0b429' ? '240,180,41' : '0,211,149'},0.1)`, border: `1px solid ${p.color}`, color: p.popular ? '#0d1117' : p.color, padding: '13px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '14px', transition: 'all 0.15s' }}>
                  {p.cta} →
                </Link>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '28px', fontSize: '13px', color: '#6e7681' }}>🔒 Secure payment via Stripe · Cancel anytime · 7-day money-back guarantee</p>
        </div>
      </section>

      {/* OBJECTION CRUSH */}
      <section style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '32px' }}>Still thinking about it?</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { q: '"What if the AI is wrong?"', a: 'Every analysis includes the reasoning — you see the logic, not just the answer. Use it as a framework, the way a real analyst would, not as a guarantee.' },
              { q: '"I already use ChatGPT for this."', a: 'ChatGPT requires you to write expert-level prompts from scratch every time. AnalystAI has 11 pre-built institutional personas — Goldman Sachs, Morgan Stanley, Bridgewater — structured and ready in one click.' },
              { q: '"$19 is too much for AI analysis."', a: 'One better entry call saves you more than $19. One avoided bad trade saves you 10x more. The question isn\'t whether it\'s worth $19 — it\'s whether you can afford not to have it.' },
            ].map((o, i) => (
              <div key={i} style={{ background: '#161b27', border: '1px solid #2a3352', borderRadius: '10px', padding: '20px 24px', textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: '#4f8ef7', marginBottom: '8px', fontSize: '15px' }}>{o.q}</div>
                <div style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.6 }}>{o.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '40px 40px 80px', background: '#161b27', borderTop: '1px solid #2a3352' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center', marginBottom: '36px' }}>Frequently Asked Questions</h2>
          {FAQS.map((f, i) => (
            <div key={i} style={{ borderBottom: '1px solid #2a3352', paddingBottom: '16px', marginBottom: '16px' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', background: 'none', border: 'none', color: '#e6edf3', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', fontWeight: 600, padding: '8px 0', fontFamily: 'Inter, sans-serif' }}>
                {f.q}
                <span style={{ color: '#4f8ef7', fontSize: '20px', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
              </button>
              {openFaq === i && <p style={{ color: '#8b949e', fontSize: '14px', lineHeight: 1.7, marginTop: '10px', paddingRight: '32px' }}>{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: '80px 40px', textAlign: 'center', background: 'radial-gradient(ellipse at 50% 100%, rgba(79,142,247,0.08) 0%, transparent 60%)' }}>
        <h2 style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '20px' }}>
          Stop guessing.<br />
          <span style={{ background: 'linear-gradient(135deg,#4f8ef7,#00d395)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Start analyzing like Wall Street.</span>
        </h2>
        <p style={{ color: '#8b949e', fontSize: '17px', marginBottom: '36px' }}>Join traders and investors who upgraded their analysis today.</p>
        <a href="#pricing" style={{ background: 'linear-gradient(135deg,#4f8ef7,#3b6fd4)', color: 'white', padding: '16px 40px', borderRadius: '12px', textDecoration: 'none', fontSize: '17px', fontWeight: 800, display: 'inline-block' }}>
          Get Instant Access → Start Free
        </a>
        <p style={{ marginTop: '16px', fontSize: '13px', color: '#6e7681' }}>🔒 No credit card required · Cancel anytime · 7-day money-back guarantee</p>
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#6e7681' }}>
          <strong style={{ color: '#ff4d6d' }}>PS:</strong> The next trade you take without a proper setup could cost you more than a year of AnalystAI. Don't let that happen.
        </p>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '24px 40px', borderTop: '1px solid #2a3352', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, background: 'linear-gradient(135deg,#4f8ef7,#00d395)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AnalystAI</div>
        <div style={{ fontSize: '12px', color: '#6e7681' }}>© 2026 AnalystAI. For educational purposes only. Not financial advice.</div>
      </footer>

    </div>
  );
}
