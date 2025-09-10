import express from 'express';
import stripe from '../stripe.js';

const router = express.Router();

/**
 * POST /api/stripe/setup-intent
 * body: { customerId?: string }
 * returns: { clientSecret }
 */
router.post('/setup-intent', async (req, res) => {
  try {
    const { customerId } = req.body || {};
    const si = await stripe.setupIntents.create(
      customerId ? { customer: customerId, usage: 'off_session' } : { usage: 'off_session' }
    );
    res.json({ clientSecret: si.client_secret });
  } catch (err) {
    console.error('Create SetupIntent failed:', err);
    res.status(500).json({ error: 'setup_intent_failed' });
  }
});

export default router;
