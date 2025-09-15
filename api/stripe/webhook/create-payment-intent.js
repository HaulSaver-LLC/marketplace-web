// server/api/stripe.js (snippet)
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { userId, accountType } = req.body; // Capture from app context/session
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 499, // cents
      currency: 'usd',
      metadata: {
        userId,
        accountType,
      },
      description: 'One-Time Profile Setup Unlock',
    });
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
