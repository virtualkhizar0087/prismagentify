import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending (can wire to backend later)
    setTimeout(() => {
      setSent(true);
      setLoading(false);
      toast.success('Message sent! We\'ll reply within 24 hours.');
    }, 1000);
  };

  return (
    <div className="main-content container" style={{ paddingBottom: '4rem', maxWidth: 800 }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div className="section-label">Get in Touch</div>
        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Contact Us</h1>
        <p style={{ color: '#7BA897', fontSize: '0.95rem' }}>We're here to help. Reach out with any questions or concerns.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Contact Info */}
        <div>
          {[
            { icon: '📧', title: 'Email', value: 'support@livepk.pk', sub: 'Reply within 24 hours' },
            { icon: '📞', title: 'WhatsApp', value: '0317-LIVEPK1', sub: 'Mon–Sat, 9am–9pm' },
            { icon: '📍', title: 'Head Office', value: 'Lahore, Pakistan', sub: 'Punjab, PK' },
            { icon: '🕐', title: 'Support Hours', value: '9:00 AM – 9:00 PM', sub: 'Monday to Saturday' },
          ].map(item => (
            <div key={item.title} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: '#112219', border: '1px solid rgba(0,194,124,0.15)', borderRadius: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{item.title}</div>
                <div style={{ color: '#00C27C', fontSize: '0.88rem' }}>{item.value}</div>
                <div style={{ color: '#4A7A6A', fontSize: '0.75rem' }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        {sent ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '1rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Message Sent!</h3>
            <p style={{ color: '#7BA897', fontSize: '0.88rem' }}>We'll get back to you within 24 hours.</p>
            <button onClick={() => setSent(false)} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Send Another</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#112219', border: '1px solid rgba(0,194,124,0.2)', borderRadius: '1rem', padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Your Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Muhammad Ali" required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="you@example.com" required />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Subject</label>
              <select className="form-input" value={form.subject} onChange={e => setForm(p => ({...p, subject: e.target.value}))} required>
                <option value="">Select subject</option>
                <option value="order">Order Issue</option>
                <option value="payment">Payment Problem</option>
                <option value="seller">Seller Inquiry</option>
                <option value="technical">Technical Support</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Message</label>
              <textarea className="form-input" rows={4} value={form.message} onChange={e => setForm(p => ({...p, message: e.target.value}))} placeholder="Describe your issue or question..." required style={{ resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ Sending...' : '📤 Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
