const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const FEE = parseInt(process.env.REGISTRATION_FEE_CENTS || '1000', 10); // $10
const CURRENCY = process.env.REGISTRATION_CURRENCY || 'usd';

// POST /api/registration/create-intent
// body: { email, userType }
router.post('/create-intent', async (req, res) => {
  try {
    if (!FEE || !CURRENCY) throw new Error('Registration fee not configured');
    const { email, userType } = req.body || {};
    const pi = await stripe.paymentIntents.create({
      amount: FEE,
      currency: CURRENCY,
      metadata: { purpose: 'registration_fee', email: email || '', userType: userType || '' },
    });
    res.json({ clientSecret: pi.client_secret, amount: pi.amount, currency: pi.currency });
  } catch (e) {
    console.error('create-intent error', e);
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
