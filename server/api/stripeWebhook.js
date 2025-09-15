// server/api/stripeWebhook.js (snippet)
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency: prevent duplicate processing
  const eventId = event.id;
  if (wasAlreadyProcessed(eventId)) {
    // implement via your database/log
    return res.status(200).end();
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Unlock the user account identified by paymentIntent.metadata.userId
      unlockUserProfile(paymentIntent.metadata.userId);
      break;
    case 'payment_intent.payment_failed':
      // Handle failure scenario as needed
      break;
    default:
    // Unhandled event
  }

  res.status(200).json({ received: true });
});

module.exports = router;
