import React from 'react';

const ComingSoonPage = () => {
  const launchEmail = 'support@haulsaver.com'; // change if needed
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #10151b 0%, #1e2936 100%)',
        color: '#e7eef7',
        padding: 24,
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          padding: '28px 28px 20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                width: 34,
                height: 34,
                borderRadius: 10,
                background: '#62783c',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
              }}
            >
              HS
            </span>
            HaulSaver
          </div>
          <span
            style={{
              fontSize: 12,
              letterSpacing: 1,
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid rgba(231,238,247,0.35)',
              textTransform: 'uppercase',
              opacity: 0.9,
            }}
          >
            Coming Soon
          </span>
        </header>

        <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: '16px 0 8px', fontWeight: 800 }}>
          We’re gearing up your freight marketplace.
        </h1>
        <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 18 }}>
          The new HaulSaver experience is in final prep. Listings, carrier onboarding, and secure
          Stripe payouts are being tuned. Thanks for your patience!
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
          <a
            href={`mailto:${launchEmail}?subject=HaulSaver%20Early%20Access`}
            style={{
              appearance: 'none',
              border: '1px solid rgba(231,238,247,0.25)',
              background: 'transparent',
              color: '#e7eef7',
              padding: '12px 16px',
              borderRadius: 12,
              fontWeight: 700,
            }}
          >
            Contact us
          </a>
        </div>

        <div
          style={{ marginTop: 22, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 18 }}
        >
          <ul
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
          >
            <li>
              <strong>OSM Maps</strong>
              <div style={{ opacity: 0.7, fontSize: 13 }}>Pickup & drop-off routing</div>
            </li>
            <li>
              <strong>Stripe Connect</strong>
              <div style={{ opacity: 0.7, fontSize: 13 }}>Secure shipper→carrier payouts</div>
            </li>
            <li>
              <strong>Carrier Vetting</strong>
              <div style={{ opacity: 0.7, fontSize: 13 }}>Docs & safety verification</div>
            </li>
            <li>
              <strong>Reverse Bidding</strong>
              <div style={{ opacity: 0.7, fontSize: 13 }}>Competitive carrier quotes</div>
            </li>
          </ul>
        </div>

        <p style={{ marginTop: 22, fontSize: 12, opacity: 0.6, textAlign: 'center' }}>
          © {new Date().getFullYear()} HaulSaver LLC · All rights reserved
        </p>
      </section>
    </main>
  );
};

export default ComingSoonPage;
