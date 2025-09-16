// server/api/registrationFee.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

// --- config & utils ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-06-20' });
const AMOUNT = Number(process.env.REGISTRATION_FEE_AMOUNT || 1000); // cents
const CURRENCY = String(process.env.REGISTRATION_FEE_CURRENCY || 'usd').toLowerCase();

const mask = v => (v ? `${String(v).slice(0, 6)}…${String(v).slice(-4)}` : '(missing)');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('[Stripe] Missing STRIPE_SECRET_KEY env');
}

// JSON body parser for this router only
router.use(express.json());

// --- helpers ---
async function createRegistrationPI({ userId, email }) {
  // Optional: sanity-check account (useful if keys misconfigured)
  try {
    const acct = await stripe.accounts.retrieve();
    console.log('[Stripe] Using account:', acct?.id || '(unknown)');
  } catch (e) {
    console.warn('[Stripe] accounts.retrieve failed:', e?.type, e?.code, e?.message);
  }

  console.log('[Stripe] Creating PI', {
    key: mask(process.env.STRIPE_SECRET_KEY),
    amount: AMOUNT,
    currency: CURRENCY,
    userId,
    email,
  });

  // Stable idempotency key prevents duplicate PIs when the client/effect re-runs
  const idempotencyKey = ['regfee', process.env.NODE_ENV || 'prod', userId, AMOUNT, CURRENCY].join(
    ':'
  );

  const intent = await stripe.paymentIntents.create(
    {
      amount: AMOUNT,
      currency: CURRENCY,
      description: 'HaulSaver registration fee',
      receipt_email: email || undefined,
      metadata: {
        purpose: 'registration_fee',
        registrationType: 'signup_fee',
        userId: userId || '',
        env: process.env.NODE_ENV || 'development',
      },
      automatic_payment_methods: { enabled: true },
    },
    { idempotencyKey }
  );

  console.log('[Stripe] PI created:', { id: intent.id, status: intent.status });
  return intent;
}

function ok(res, intent) {
  return res.json({
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  });
}

function handleError(res, err) {
  console.error('[Stripe] create PI error:', {
    type: err?.type,
    code: err?.code,
    statusCode: err?.statusCode,
    message: err?.message,
  });
  const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  return res.status(status).json({ error: err?.message || 'Failed to create PaymentIntent' });
}

// --- single handler wired to multiple paths ---
async function registrationPIHandler(req, res) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }
    const { userId, email } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const intent = await createRegistrationPI({ userId, email });
    return ok(res, intent);
  } catch (err) {
    return handleError(res, err);
  }
}

// POST aliases (all do the same thing)
router.post('/registration/intent', registrationPIHandler);
router.post('/registration-payment-intent', registrationPIHandler);
router.post('/intent', registrationPIHandler);

// Optional lookups for debugging
router.get('/registration/intent/:id', async (req, res) => {
  try {
    const pi = await stripe.paymentIntents.retrieve(req.params.id);
    return res.json({
      id: pi.id,
      status: pi.status,
      last_payment_error: pi.last_payment_error || null,
      charges: pi.charges?.data ?? [],
    });
  } catch (err) {
    console.error('[Stripe] PI retrieve error:', err?.message);
    return res.status(404).json({ error: 'Not found' });
  }
});

router.get('/intent/:id', async (req, res) => {
  try {
    const pi = await stripe.paymentIntents.retrieve(req.params.id);
    return res.json({
      id: pi.id,
      status: pi.status,
      last_payment_error: pi.last_payment_error || null,
      charges: pi.charges?.data ?? [],
    });
  } catch (err) {
    console.error('[Stripe] PI retrieve error:', err?.message);
    return res.status(404).json({ error: 'Not found' });
  }
});

console.log('Routes mounted for registration fee endpoints.');
module.exports = router;
