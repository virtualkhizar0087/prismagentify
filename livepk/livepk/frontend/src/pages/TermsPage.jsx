import React from 'react';
export default function TermsPage() {
  return (
    <div className="main-content container" style={{ paddingBottom: '4rem', maxWidth: 760 }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div className="section-label">Legal</div>
        <h1 style={{ fontFamily: 'Playfair Display,serif', fontSize: '2rem', fontWeight: 700 }}>Terms of Service</h1>
        <p style={{ color: '#4A7A6A', fontSize: '0.82rem', marginTop: '0.5rem' }}>Last updated: March 2026</p>
      </div>
      {[
        { title: '1. Acceptance of Terms', content: 'By accessing LivePK, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.' },
        { title: '2. User Accounts', content: 'You must provide accurate information when creating an account. You are responsible for maintaining the security of your account and all activities under it.' },
        { title: '3. Seller Responsibilities', content: 'Sellers must list products accurately, fulfill orders promptly, and comply with Pakistani consumer protection laws. Fraudulent listings will result in immediate account suspension.' },
        { title: '4. Buyer Responsibilities', content: 'Buyers must provide accurate shipping information and pay for orders as agreed. COD refusals without valid reason may result in account restrictions.' },
        { title: '5. Payments & COD', content: 'LivePK supports JazzCash, Easypaisa, bank transfer, and Cash on Delivery. Platform fees apply per transaction. See our pricing page for details.' },
        { title: '6. Returns & Refunds', content: 'Buyers may request returns within 7 days of delivery for eligible items. Refunds are processed within 5–10 business days via original payment method.' },
        { title: '7. Prohibited Content', content: 'Users may not list counterfeit goods, illegal items, or content that violates Pakistani law. LivePK reserves the right to remove any listing at its discretion.' },
        { title: '8. Limitation of Liability', content: 'LivePK is a marketplace platform and is not liable for disputes between buyers and sellers beyond our dispute resolution process.' },
        { title: '9. Changes to Terms', content: 'We may update these terms at any time. Continued use of LivePK after changes constitutes acceptance of the new terms.' },
        { title: '10. Contact', content: 'For legal inquiries: legal@livepk.pk | LivePK Pvt. Ltd., Lahore, Pakistan' },
      ].map(section => (
        <div key={section.title} style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#00C27C', marginBottom: '0.5rem' }}>{section.title}</h2>
          <p style={{ color: '#7BA897', fontSize: '0.88rem', lineHeight: 1.8 }}>{section.content}</p>
        </div>
      ))}
    </div>
  );
}
