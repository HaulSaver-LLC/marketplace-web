// server/api/registrationFee.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

const amount = Number(process.env.REGISTRATION_FEE_AMOUNT || 1000);
const currency = process.env.REGISTRATION_FEE_CURRENCY || 'usd';

// POST /api/registration/intent
// body: { userId: string, email?: string }
router.post('/intent', async (req, res) => {
  try {
    const { userId, email } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      description: 'HaulSaver registration fee',
      receipt_email: email,
      metadata: {
        registrationType: 'signup_fee',
        userId,
      },
      automatic_payment_methods: { enabled: true },
    });

    return res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err) {
    // Do not leak secrets
    console.error('PI create error', err);
    return res.status(500).json({ error: 'Failed to create PaymentIntent' });
  }
});

// Optional: GET /api/registration/intent/:id (lookup)
router.get('/intent/:id', async (req, res) => {
  try {
    const pi = await stripe.paymentIntents.retrieve(req.params.id);
    return res.json({ status: pi.status, charges: pi.charges?.data ?? [] });
  } catch (err) {
    console.error('PI retrieve error', err);
    return res.status(404).json({ error: 'Not found' });
  }
});

module.exports = router;
