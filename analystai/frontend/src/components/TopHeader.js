import React from 'react';

export default function TopHeader({ title, subtitle }) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <header className="top-header">
      <div>
        <div className="header-title">{title}</div>
        <div className="header-subtitle">{subtitle}</div>
      </div>
      <div className="header-right">
        <div style={{ textAlign: 'right', marginRight: '8px' }}>
          <div style={{ fontSize: '13px', fontFamily: 'JetBrains Mono', color: 'var(--text-primary)', fontWeight: 500 }}>{time}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{date}</div>
        </div>
        <div className="status-badge">
          <span className="status-dot"></span>
          AI Online
        </div>
      </div>
    </header>
  );
}
