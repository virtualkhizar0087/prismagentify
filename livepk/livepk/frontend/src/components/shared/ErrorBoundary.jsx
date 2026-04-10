import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('LivePK Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#050D0A' }}>
          <div style={{ textAlign: 'center', maxWidth: 440 }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Something went wrong</h2>
            <p style={{ color: '#7BA897', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              An unexpected error occurred. Please refresh the page or go back home.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => window.location.reload()} style={{ background: '#163028', border: '1px solid rgba(0,194,124,0.2)', color: '#7BA897', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                🔄 Refresh Page
              </button>
              <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }} style={{ background: '#00C27C', border: 'none', color: '#000', padding: '0.6rem 1.25rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 700 }}>
                🏠 Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
