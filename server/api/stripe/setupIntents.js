// server/api/stripe/setupIntents.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Optional helper: find/create a Customer for your app user
async function getOrCreateCustomer({ email, name, userId }) {
  // If you already persist stripeCustomerId for users somewhere, use that instead.
  const queryEmail = email ? `email:'${email.replace(/'/g, "\\'")}'` : '';
  const queryUser = userId
    ? `metadata['app_user_id']:'${String(userId).replace(/'/g, "\\'")}'`
    : '';
  const query = [queryEmail, queryUser].filter(Boolean).join(' AND ') || "email:'none'";

  const search = await stripe.customers.search({ query });

  if (search.data.length > 0) return search.data[0];

  return await stripe.customers.create({
    email: email || undefined,
    name: name || undefined,
    metadata: { app_user_id: userId || '' },
  });
}

/**
 * POST /api/stripe/setup-intents
 * Body: { email, name, userId }
 * Returns: { clientSecret, customerId }
 */
router.post('/setup-intents', async (req, res) => {
  try {
    const { email, name, userId } = req.body || {};
    if (!email && !userId) {
      return res.status(400).json({ error: 'Provide at least email or userId' });
    }

    const customer = await getOrCreateCustomer({ email, name, userId });

    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      usage: 'off_session',
      payment_method_types: ['card'],
      metadata: { app_user_id: userId || '' },
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customer.id,
    });
  } catch (err) {
    console.error('SetupIntent error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
