// server/apiServer.js
// Dev-only API server. In production, server/index.js serves API routes too.
require('./env').configureEnv();

const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const apiRouter = require('./apiRouter');
const wellKnownRouter = require('./wellKnownRouter');
const webmanifestResourceRoute = require('./resources/webmanifest');
const robotsTxtRoute = require('./resources/robotsTxt');
const sitemapResourceRoute = require('./resources/sitemap');

// ---- init app FIRST (fixes "Cannot access 'app' before initialization") ----
const app = express();

// ---- config ----
const PORT = process.env.REACT_APP_DEV_API_SERVER_PORT || 3500;
const HOST = process.env.BIND_HOST || '127.0.0.1';
const ORIGIN = (process.env.REACT_APP_MARKETPLACE_ROOT_URL || 'http://localhost:3000').trim();

// ---- middleware (order matters) ----
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- health ----
app.get('/api/health', (_req, res) => res.json({ ok: true, origin: ORIGIN }));

// ---- your API routes ----
// NOTE: apiRouter already contains handlers under '/api/...'
app.use('/api', apiRouter);

// ---- misc resources served by dev server ----
app.use('/.well-known', wellKnownRouter);
app.get('/site.webmanifest', webmanifestResourceRoute);
app.use(compression());
app.get('/robots.txt', robotsTxtRoute);
app.get('/sitemap-:resource', sitemapResourceRoute);

const Stripe = require('stripe');
const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

app.post('/api/registration-payment-intent', async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY' });

    const { userId, email } = req.body || {};
    if (!userId || !email) return res.status(400).json({ error: 'userId and email are required' });

    const amount = Number(process.env.REGISTRATION_FEE_AMOUNT || 1000); // cents
    const currency = String(process.env.REGISTRATION_FEE_CURRENCY || 'usd').toLowerCase();

    const pi = await stripe.paymentIntents.create({
      amount,
      currency,
      description: 'Registration fee',
      receipt_email: email,
      metadata: { userId, reason: 'registration_fee' },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: pi.client_secret, id: pi.id });
  } catch (err) {
    console.error('create PI failed', err);
    res.status(500).json({ error: 'Failed to create PaymentIntent' });
  }
});

// ---- single listen (no earlier listens anywhere) ----
app.listen(PORT, HOST, () => {
  console.log(`API server listening on http://${HOST}:${PORT}`);
});
