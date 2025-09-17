const helmet = require('helmet');
const crypto = require('crypto');

const dev = process.env.REACT_APP_ENV === 'development';
const self = "'self'";
const unsafeInline = "'unsafe-inline'";
const unsafeEval = "'unsafe-eval'";
const data = 'data:';
const blob = 'blob:';
const devImagesMaybe = dev ? ['*.localhost:8000'] : [];
const baseUrl = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL || 'https://flex-api.sharetribe.com';
// If you proxy the Asset Delivery API, include that base here too
const assetCdnBaseUrl = process.env.REACT_APP_SHARETRIBE_SDK_ASSET_CDN_BASE_URL;

exports.generateCSPNonce = (req, res, next) => {
  // Generate a unique nonce for each request (base64 is typical)
  crypto.randomBytes(32, (err, randomBytes) => {
    if (err) return next(err);
    res.locals.cspNonce = randomBytes.toString('base64');
    next();
  });
};

// Default CSP whitelist (keep comprehensive here; override in exports.csp)
const defaultDirectives = {
  baseUri: [self],
  defaultSrc: [self],
  childSrc: [blob],
  connectSrc: [
    self,
    baseUrl,
    assetCdnBaseUrl,
    '*.st-api.com',
    'https://cdn.st-api.com',
    'maps.googleapis.com',
    'places.googleapis.com',
    '*.tiles.mapbox.com',
    'api.mapbox.com',
    'events.mapbox.com',

    // Google Analytics / GTM
    '*.google-analytics.com',
    '*.analytics.google.com',
    '*.googletagmanager.com',
    '*.g.doubleclick.net',
    '*.google.com',

    // Plausible
    'plausible.io',
    '*.plausible.io',

    'fonts.googleapis.com',

    // Sentry
    'sentry.io',
    '*.sentry.io',

    // Stripe
    '*.stripe.com',
  ],
  fontSrc: [self, data, 'assets-sharetribecom.sharetribe.com', 'fonts.gstatic.com'],
  formAction: [self],
  frameSrc: [
    self,
    '*.stripe.com',
    '*.youtube-nocookie.com',
    'https://bid.g.doubleclick.net',
    'https://td.doubleclick.net',
  ],
  imgSrc: [
    self,
    data,
    blob,
    ...devImagesMaybe,
    '*.imgix.net',
    'sharetribe.imgix.net', // Safari 9.1 didn’t recognize wildcard rule
    'https://sharetribe-assets.imgix.net',

    // Styleguide placeholder images
    'picsum.photos',
    '*.picsum.photos',

    // Maps
    'api.mapbox.com',
    'maps.googleapis.com',
    '*.gstatic.com',
    '*.googleapis.com',
    '*.ggpht.com',

    // Giphy
    '*.giphy.com',

    // Google Analytics / GTM
    '*.google-analytics.com',
    '*.analytics.google.com',
    '*.googletagmanager.com',
    '*.g.doubleclick.net',
    '*.google.com',
    'google.com',

    // YouTube thumbs
    '*.ytimg.com',

    // Stripe
    '*.stripe.com',
  ],
  scriptSrc: [
    self,
    // nonce will be injected at runtime in exports.csp
    unsafeEval,
    'maps.googleapis.com',
    'api.mapbox.com',
    '*.googletagmanager.com',
    '*.google-analytics.com',
    'www.googleadservices.com',
    '*.g.doubleclick.net',
    'js.stripe.com',
    // Plausible analytics
    'plausible.io',
  ],
  styleSrc: [self, unsafeInline, 'fonts.googleapis.com', 'api.mapbox.com'],

  // These are useful but can also be added in exports.csp if you prefer
  workerSrc: [self, blob],
  manifestSrc: [self],
};

/**
 * Middleware for creating a Content Security Policy
 *
 * @param {String} reportUri URL where the browser will POST violation reports (optional)
 * @param {Boolean} reportOnly If true, only reports are sent (no blocking)
 */
exports.csp = (reportUri, reportOnly) => {
  // ====== CUSTOM OVERRIDES GO HERE IF YOU NEED THEM ======
  // Example:
  // const customDirectives = {
  //   imgSrc: defaultDirectives.imgSrc.concat('my-extra.cdn.example'),
  // };
  const customDirectives = {};
  // =======================================================

  // Start from the comprehensive defaults and apply overrides
  const directives = Object.assign({}, defaultDirectives, customDirectives);

  // Inject the per-request nonce into script-src (keep everything else you already allow)
  directives.scriptSrc = [
    ...(directives.scriptSrc || [self]),
    (req, res) => `'nonce-${res.locals.cspNonce}'`,
  ];

  // Ensure critical hosts are present explicitly (idempotent)
  directives.connectSrc = Array.from(
    new Set(
      [
        ...(directives.connectSrc || [self]),
        baseUrl,
        assetCdnBaseUrl,
        'https://cdn.st-api.com',
      ].filter(Boolean)
    )
  );

  directives.imgSrc = Array.from(
    new Set([...(directives.imgSrc || [self, data]), 'https://sharetribe-assets.imgix.net'])
  );

  // Stripe iframe
  directives.frameSrc = Array.from(
    new Set([...(directives.frameSrc || [self]), 'https://js.stripe.com'])
  );

  // PWA + workers
  directives.workerSrc = Array.from(new Set([...(directives.workerSrc || []), blob, self]));
  directives.manifestSrc = Array.from(new Set([...(directives.manifestSrc || []), self]));

  // Report URI (Helmet requires iterable)
  if (reportUri) directives.reportUri = [reportUri];

  // In production block mode, upgrade insecure requests
  if (!reportOnly && !dev) {
    directives.upgradeInsecureRequests = [];
  }

  // Use *our* full policy; don’t mix with Helmet defaults
  return helmet.contentSecurityPolicy({
    useDefaults: false,
    directives,
    reportOnly,
  });
};
