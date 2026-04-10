import React from 'react';
export default function PrivacyPage() {
  return (
    <div className="main-content container" style={{ paddingBottom: '4rem', maxWidth: 760 }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div className="section-label">Legal</div>
        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '2rem', fontWeight: 700 }}>Privacy Policy</h1>
        <p style={{ color: '#4A7A6A', fontSize: '0.82rem', marginTop: '0.5rem' }}>Last updated: March 2026</p>
      </div>
      {[
        { title: 'Information We Collect', content: 'We collect name, email, phone number, address, payment details, and browsing behavior on our platform to provide and improve our services.' },
        { title: 'How We Use Your Information', content: 'Your data is used to process orders, send notifications, prevent fraud, improve our services, and provide customer support. We do not sell your data.' },
        { title: 'Data Sharing', content: 'We share necessary information with sellers to fulfill orders, and with payment providers to process transactions. We do not share data with third-party advertisers.' },
        { title: 'SMS & WhatsApp Notifications', content: 'By registering, you consent to receive order updates and promotional messages via SMS and WhatsApp. You may opt out at any time by contacting support.' },
        { title: 'Data Security', content: 'We use industry-standard encryption (SSL/TLS) to protect your data. However, no online platform can guarantee 100% security.' },
        { title: 'Cookies', content: 'We use cookies to improve user experience, remember preferences, and analyze platform usage. You may disable cookies in your browser settings.' },
        { title: 'Your Rights', content: 'You have the right to access, correct, or delete your personal data. Contact privacy@livepk.pk to exercise your rights.' },
        { title: 'Contact', content: 'Privacy concerns: privacy@livepk.pk | LivePK Pvt. Ltd., Lahore, Pakistan' },
      ].map(section => (
        <div key={section.title} style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#00C27C', marginBottom: '0.5rem' }}>{section.title}</h2>
          <p style={{ color: '#7BA897', fontSize: '0.88rem', lineHeight: 1.8 }}>{section.content}</p>
        </div>
      ))}
    </div>
  );
}
