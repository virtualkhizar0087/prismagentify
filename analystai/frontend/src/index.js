import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/global.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1f2e', color: '#e2e8f0', border: '1px solid #2d3748' },
          success: { iconTheme: { primary: '#00d395', secondary: '#1a1f2e' } },
          error: { iconTheme: { primary: '#ff4d6d', secondary: '#1a1f2e' } }
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);
