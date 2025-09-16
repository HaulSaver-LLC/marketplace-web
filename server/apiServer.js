// NOTE: dev-mode API server. In prod, server/index.js serves API routes too.

// Configure process.env with .env.* files
require('./env').configureEnv();

const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const crypto = require('crypto');
const Stripe = require('stripe');

const apiRouter = require('./apiRouter');
const wellKnownRouter = require('./wellKnownRouter');
const webmanifestResourceRoute = require('./resources/webmanifest');
const robotsTxtRoute = require('./resources/robotsTxt');
const sitemapResourceRoute = require('./resources/sitemap');

// ---------- Stripe & fee config ----------
const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

const rawAmount = String(process.env.REGISTRATION_FEE_AMOUNT || '1000').trim();
const cleanedAmount = rawAmount.replace(/[^\d]/g, '');
const FEE_AMOUNT = parseInt(cleanedAmount || '0', 10);

const FEE_CURRENCY = String(process.env.REGISTRATION_FEE_CURRENCY || 'usd')
  .trim()
  .toLowerCase();

// ---------- App & port ----------
const radix = 10;
const PORT = parseInt(process.env.REACT_APP_DEV_API_SERVER_PORT || '3500', radix);

// Preferred UI origin for local dev (used if ALLOWED_ORIGINS is not set)
const DEFAULT_UI_ORIGIN = (
  process.env.REACT_APP_MARKETPLACE_ROOT_URL || 'http://localhost:3000'
).trim();

// Build allowed origin list (comma-separated env or sensible defaults)
const envAllowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = [
  DEFAULT_UI_ORIGIN, // e.g., http://localhost:3000
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://localhost:3000',
  'https://127.0.0.1:3000',
  // keep your deployed dev domain so you can test cross-site too
  'https://dev.haulsaver.com',
  ...envAllowed,
];

// ---------- Express app ----------
const app = express();
app.set('trust proxy', 1);

// CORS (dev). Accept only from the allowed list; answer preflight quickly.
app.use(
  cors({
    origin(origin, cb) {
      // allow same-origin / curl / server-to-server (no Origin header)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // 24h preflight cache
  })
);

// Ensure OPTIONS never hangs (some proxies can be picky)
app.options('*', cors());

// Cookies & body parsing
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// .well-known routes
app.use('/.well-known', wellKnownRouter);

// ---------- Health check ----------
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    stripeConfigured: Boolean(stripeSecret),
    feeAmount: FEE_AMOUNT,
    feeCurrency: FEE_CURRENCY,
    allowedOrigins,
    port: PORT,
  });
});

// ---------- Registration fee: create PaymentIntent ----------
app.post('/api/registration-payment-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res
        .status(500)
        .json({ error: 'Stripe is not configured (missing STRIPE_SECRET_KEY).' });
    }
    if (!Number.isFinite(FEE_AMOUNT) || FEE_AMOUNT <= 0) {
      return res.status(500).json({
        error:
          'Invalid REGISTRATION_FEE_AMOUNT. Set a positive integer number of cents (e.g., 1000).',
      });
    }

    const { userId, email } = req.body || {};
    if (!userId || !email) {
      return res.status(400).json({ error: 'userId and email are required' });
    }

    const idempotencyKey = crypto
      .createHash('sha256')
      .update(`regfee:${userId}:${FEE_AMOUNT}:${FEE_CURRENCY}`)
      .digest('hex');

    const pi = await stripe.paymentIntents.create(
      {
        amount: FEE_AMOUNT,
        currency: FEE_CURRENCY,
        description: 'HaulSaver registration fee',
        receipt_email: email,
        metadata: { userId, reason: 'registration_fee' },
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey }
    );

    res.json({ clientSecret: pi.client_secret, id: pi.id });
  } catch (err) {
    console.error('Failed to create registration PaymentIntent:', err);
    res.status(500).json({ error: 'Failed to create PaymentIntent' });
  }
});

// Mount existing API under /api
app.use('/api', apiRouter);

// Manifest (served from API origin in dev)
app.get('/site.webmanifest', webmanifestResourceRoute);

// robots.txt and sitemap
app.use(compression());
app.get('/robots.txt', robotsTxtRoute);
app.get('/sitemap-:resource', sitemapResourceRoute);

// Root ping (handy to detect basic reachability quickly)
app.get('/', (_req, res) => res.send('Dev API is up'));

// Global error guard (avoid silent hangs)
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal error' });
});
