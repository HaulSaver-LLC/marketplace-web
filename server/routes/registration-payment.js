import express from 'express';
import { stripe } from '../stripe.js';
import { sdkPriv } from '../ftwSdk.js';

const router = express.Router();

/**
 * POST /api/registration/create-checkout
 * body: { userId: string, email: string }
 */
router.post('/create-checkout', async (req, res) => {
  try {
    const { userId, email } = req.body || {};
    if (!userId || !email) return res.status(400).json({ error: 'missing_user' });

    // Optionally create/reuse a Stripe Customer; store customer id to user metadata
    const customer = await stripe.customers.create({ email });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // or 'subscription'
      line_items: [{ price: process.env.REGISTRATION_PRICE_ID, quantity: 1 }],
      customer: customer.id,
      metadata: { userId }, // <- link back to Sharetribe user
      success_url: `${process.env.REACT_APP_MARKETPLACE_ROOT_URL}/register/activate?success=1`,
      cancel_url: `${process.env.REACT_APP_MARKETPLACE_ROOT_URL}/register/activate?canceled=1`,
    });

    // Save customer id to user (optional, but useful later)
    await sdkPriv.users.updateProfile(
      {
        id: userId,
        publicData: {},
        protectedData: {},
        privateData: { stripeCustomerId: customer.id },
      },
      { expand: true }
    );

    res.json({ url: session.url });
  } catch (err) {
    console.error('create-checkout failed:', err);
    res.status(500).json({ error: 'checkout_failed' });
  }
});

export default router;
