import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={s.footer}>
      <div className="container">
        <div style={s.grid}>
          {/* Brand */}
          <div>
            <div style={s.brand}>
              <span style={{ color: '#00C27C', fontWeight: 900, fontSize: '1.3rem', fontFamily: 'Playfair Display,serif' }}>Live</span>
              <span style={{ color: '#F5A623', fontWeight: 900, fontSize: '1.3rem', fontFamily: 'Playfair Display,serif' }}>PK</span>
            </div>
            <p style={s.tagline}>Pakistan's #1 Live Commerce Platform. Watch, shop, and connect with sellers in real-time.</p>
            <div style={s.socials}>
              {[
                { href: 'https://facebook.com', label: '📘 Facebook' },
                { href: 'https://instagram.com', label: '📸 Instagram' },
                { href: 'https://tiktok.com', label: '🎵 TikTok' },
                { href: 'https://youtube.com', label: '▶️ YouTube' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ color: '#4A7A6A', fontSize: '0.8rem', textDecoration: 'none', padding: '0.3rem 0.6rem', background: 'rgba(0,194,124,0.08)', borderRadius: '0.4rem', border: '1px solid rgba(0,194,124,0.15)' }}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <div style={s.colTitle}>Shop</div>
            {[
              { to: '/products', label: 'All Products' },
              { to: '/products?category=fashion', label: 'Fashion' },
              { to: '/products?category=beauty', label: 'Beauty' },
              { to: '/products?category=electronics', label: 'Electronics' },
              { to: '/products?category=home', label: 'Home & Living' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={s.link}>{l.label}</Link>
            ))}
          </div>

          {/* Sell */}
          <div>
            <div style={s.colTitle}>Sell on LivePK</div>
            {[
              { to: '/register', label: 'Become a Seller' },
              { to: '/register', label: 'Become an Influencer' },
              { to: '/seller', label: 'Seller Dashboard' },
              { to: '/influencer', label: 'Influencer Portal' },
            ].map(l => (
              <Link key={l.label} to={l.to} style={s.link}>{l.label}</Link>
            ))}
          </div>

          {/* Help */}
          <div>
            <div style={s.colTitle}>Help & Info</div>
            {[
              { to: '/contact', label: 'Contact Us' },
              { to: '/terms', label: 'Terms of Service' },
              { to: '/privacy', label: 'Privacy Policy' },
              { to: '/orders', label: 'Track Order' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={s.link}>{l.label}</Link>
            ))}
            <div style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#4A7A6A' }}>
              <div>📧 support@livepk.pk</div>
              <div style={{ marginTop: '0.3rem' }}>📞 0317-LIVEPK1</div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={s.bottom}>
          <div style={{ color: '#4A7A6A', fontSize: '0.78rem' }}>
            © {currentYear} LivePK. All rights reserved. Made with ❤️ in Pakistan 🇵🇰
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
            <span style={{ color: '#4A7A6A' }}>💵 COD Available</span>
            <span style={{ color: '#4A7A6A' }}>🔒 Secure Payments</span>
            <span style={{ color: '#4A7A6A' }}>🚚 Nationwide Delivery</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const s = {
  footer: { background: '#050D0A', borderTop: '1px solid rgba(0,194,124,0.15)', paddingTop: '3rem', paddingBottom: '1.5rem', marginTop: '4rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '2rem', marginBottom: '2.5rem' },
  brand: { display: 'flex', marginBottom: '0.75rem' },
  tagline: { color: '#4A7A6A', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '1rem' },
  socials: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  colTitle: { color: '#E8F5F0', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  link: { display: 'block', color: '#4A7A6A', textDecoration: 'none', fontSize: '0.83rem', padding: '0.2rem 0', transition: 'color 0.2s' },
  bottom: { borderTop: '1px solid rgba(0,194,124,0.1)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' },
};
