// server/dev api file (same one where you created /api/registration-payment-intent)

// ... existing requires:
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const crypto = require('crypto');
const Stripe = require('stripe');

// ✅ add this:
const IntegrationSdk = require('sharetribe-flex-integration-sdk');

// ... your existing env loader & Stripe init ...

// ✅ Integration API instance (server-only secrets)
const integrationSdk = IntegrationSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
  clientSecret: process.env.SHARETRIBE_SDK_CLIENT_SECRET,
  // baseUrl: 'https://flex-api.sharetribe.com', // default OK
});

// ... your existing middleware, /api/health, and /api/registration-payment-intent ...

// ✅ NEW: mark user as paid (server-side profile update)
app.post('/api/mark-registration-paid', async (req, res) => {
  try {
    const { userId, payment } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const r = await integrationSdk.users.updateProfile({
      id: userId,
      publicData: {
        registrationPaid: true,
        // optional audit trail (allowed only if your schema permits extra props or you use protectedData instead)
        registrationPayment: payment || null,
      },
    });

    return res.json({ ok: true, user: r?.data?.data || null });
  } catch (err) {
    console.error('mark-registration-paid error', {
      status: err?.status || err?.statusCode,
      data: err?.data,
      message: err?.message,
    });
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
});
