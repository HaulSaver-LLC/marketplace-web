const Stripe = require('stripe');
const { flexIntegrationSdk } = require('./util/flexIntegration'); // helper we’ll add
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

module.exports = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      if (pi?.metadata?.purpose === 'profile_unlock' && pi?.metadata?.userId) {
        const userId = pi.metadata.userId;

        // Update Flex user metadata
        const sdk = flexIntegrationSdk();
        await sdk.users.updateProfile({
          id: userId,
          publicData: {}, // leave as-is
          privateData: {}, // leave as-is
          metadata: { profileUnlockPaid: true, profileUnlockAt: new Date().toISOString() },
        });
        // (Some SDKs use different shapes; adjust to your installed Flex SDK method signature.)
      }
    }

    // You can optionally handle payment_intent.payment_failed for logging/alerts
    res.json({ received: true });
  } catch (e) {
    console.error('Webhook processing error:', e);
    res.status(500).send('Webhook processing failed');
  }
};
