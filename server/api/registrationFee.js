// server/api/registrationFee.js
const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

const mask = v => (v ? `${String(v).slice(0, 6)}…${String(v).slice(-4)}` : '(missing)');

if (!process.env.STRIPE_SECRET_KEY) {
  // Fail fast on boot, but keep also checking at runtime.
  // eslint-disable-next-line no-console
  console.error('[Stripe] Missing STRIPE_SECRET_KEY env');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// Defaults: $10 USD
const AMOUNT = Number(process.env.REGISTRATION_FEE_AMOUNT || 1000); // integer cents
const CURRENCY = String(process.env.REGISTRATION_FEE_CURRENCY || 'usd').toLowerCase();

// JSON body parser for this router only
router.use(express.json());

// ----- helpers -----
async function createRegistrationPI({ userId, email }) {
  // Verify account (useful for debugging mismatched keys)
  let acctId = '(unknown)';
  try {
    const acct = await stripe.accounts.retrieve();
    acctId = acct?.id || acctId;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Stripe] accounts.retrieve failed:', e?.type, e?.code, e?.message);
  }

  // eslint-disable-next-line no-console
  console.log('[Stripe] Creating PI', {
    acctId,
    key: mask(process.env.STRIPE_SECRET_KEY),
    amount: AMOUNT,
    currency: CURRENCY,
    userId,
    email,
  });

  const intent = await stripe.paymentIntents.create({
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
  });

  // eslint-disable-next-line no-console
  console.log('[Stripe] PI created:', { id: intent.id, status: intent.status });
  return intent;
}

function ok(res, intent) {
  return res.json({
    clientSecret: intent.client_secret,
    id: intent.id,
    paymentIntentId: intent.id,
  });
}

function handleError(res, err) {
  // eslint-disable-next-line no-console
  console.error('[Stripe] create PI error:', {
    type: err?.type,
    code: err?.code,
    statusCode: err?.statusCode,
    message: err?.message,
  });
  const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  return res.status(status).json({ error: err?.message || 'Failed to create PaymentIntent' });
}

// ----- routes -----
// Back-compat (current frontend call): POST /api/registration-payment-intent
router.post('/registration-payment-intent', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY)
      return res.status(500).json({ error: 'Stripe not configured' });
    const { userId, email } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const intent = await createRegistrationPI({ userId, email });
    return ok(res, intent);
  } catch (err) {
    return handleError(res, err);
  }
});

// Canonical alias: POST /api/registration/intent
router.post('/registration/intent', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY)
      return res.status(500).json({ error: 'Stripe not configured' });
    const { userId, email } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const intent = await createRegistrationPI({ userId, email });
    return ok(res, intent);
  } catch (err) {
    return handleError(res, err);
  }
});

// Minimal alias for earlier docs: POST /api/intent
router.post('/intent', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY)
      return res.status(500).json({ error: 'Stripe not configured' });
    const { userId, email } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const intent = await createRegistrationPI({ userId, email });
    return ok(res, intent);
  } catch (err) {
    return handleError(res, err);
  }
});

// Optional lookup aliases
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
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.error('[Stripe] PI retrieve error:', err?.message);
    return res.status(404).json({ error: 'Not found' });
  }
});

console.log('Routes mounted for registration fee endpoints.');
module.exports = router;
