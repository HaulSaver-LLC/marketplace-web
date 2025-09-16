// server/api/registration.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/registration-payment-intent', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description: 'Registration Fee',
      metadata: { kind: 'registration_fee' },
      receipt_email: req.body?.email || undefined,
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (e) {
    console.error('PI create error', e);
    res.status(500).json({ error: 'stripe_error' });
  }
});

module.exports = router;
