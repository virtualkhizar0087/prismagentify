import React from 'react';

export default function SkeletonCard({ height = 280 }) {
  return (
    <div style={{
      background: '#112219',
      border: '1px solid rgba(0,194,124,0.1)',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      height,
      animation: 'skeleton-pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: '55%', background: 'rgba(0,194,124,0.05)' }} />
      <div style={{ padding: '0.75rem' }}>
        <div style={{ height: 12, background: 'rgba(0,194,124,0.08)', borderRadius: 4, marginBottom: 8, width: '80%' }} />
        <div style={{ height: 12, background: 'rgba(0,194,124,0.06)', borderRadius: 4, marginBottom: 12, width: '50%' }} />
        <div style={{ height: 32, background: 'rgba(0,194,124,0.08)', borderRadius: 6 }} />
      </div>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
