const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil', // matches your webhook dashboard API version
});

const PROFILE_UNLOCK_AMOUNT = 499; // $4.99 in cents
const CURRENCY = 'usd';

router.post('/create-profile-unlock-intent', async (req, res) => {
  try {
    const { userId, email } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const intent = await stripe.paymentIntents.create({
      amount: PROFILE_UNLOCK_AMOUNT,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        purpose: 'profile_unlock',
        userId,
        email: email || '',
        appEnv: process.env.APP_ENV || 'unknown',
      },
    });

    res.json({ clientSecret: intent.client_secret });
  } catch (err) {
    console.error('Error creating PaymentIntent', err);
    res.status(500).json({ error: 'Unable to create payment intent' });
  }
});

module.exports = router;
