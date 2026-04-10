import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center'}}>
      <div style={{fontSize:'5rem',marginBottom:'1rem'}}>📡</div>
      <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'3rem',fontWeight:900,marginBottom:'0.5rem'}}>404</h1>
      <p style={{color:'#7BA897',marginBottom:'2rem',fontSize:'1rem'}}>This page doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary btn-lg">Go Back Home →</Link>
    </div>
  );
}
