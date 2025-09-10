import express from 'express';
import { stripe } from '../stripe.js';
import { sdkPriv } from '../ftwSdk.js';

const router = express.Router();

// MUST be raw body before any JSON parser in server/index.js
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = secret ? stripe.webhooks.constructEvent(req.body, sig, secret) : JSON.parse(req.body); // dev-only fallback
  } catch (err) {
    console.error('Webhook verify failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId) {
        // Mark user as paid in Sharetribe (extended data)
        await sdkPriv.users.updateProfile(
          {
            id: userId,
            publicData: { registrationPaid: true }, // or protectedData/privateData
          },
          { expand: true }
        );
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).send('webhook_handler_failed');
  }
});

export default router;
