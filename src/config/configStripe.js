/* Stripe related configuration.

NOTE:
- REACT_APP_STRIPE_PUBLISHABLE_KEY is PUBLIC (browser). Put only pk_test/pk_live here.
- Your Stripe SECRET key stays in Sharetribe Console and/or your server env (never in the client).

If you customize anything below, keep in mind that Sharetribe still handles the actual
PaymentIntent lifecycle when you use Flex transaction transitions.
*/

// ========= Keys & basic flags =========

/** @type {string|undefined} */
export const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

export const isStripeEnabled = Boolean(publishableKey);

if (process.env.NODE_ENV !== 'production' && !publishableKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Stripe] REACT_APP_STRIPE_PUBLISHABLE_KEY is missing. ' +
      'Add it to .env.local for localhost or Render env for prod.'
  );
}

// ========= Booking window =========
//
// Stripe holds funds up to ~90 days globally (US can be longer).
// Default to 90, allow override via env when you know your country/flow.
//
const envBookingDays = Number(process.env.REACT_APP_BOOKING_DAY_COUNT || '');
export const dayCountAvailableForBooking =
  Number.isFinite(envBookingDays) && envBookingDays > 0 ? envBookingDays : 90;

// ========= MCC (Merchant Category Code) =========
//
// Default: 5734 Computer Software Stores.
// You can override via REACT_APP_STRIPE_DEFAULT_MCC (e.g., 4214 for local trucking, 4789 for transport services).
//
export const defaultMCC = (process.env.REACT_APP_STRIPE_DEFAULT_MCC || '5734').trim();

// ========= Supported payout countries (Stripe Connect) =========
//
// See: https://stripe.com/global
// This list is used for displaying the correct bank field requirements to providers.
//
export const supportedCountries = [
  { code: 'AU', currency: 'AUD', accountConfig: { bsb: true, accountNumber: true } }, // Australia
  { code: 'AT', currency: 'EUR', accountConfig: { iban: true } }, // Austria
  { code: 'BE', currency: 'EUR', accountConfig: { iban: true } }, // Belgium
  { code: 'BG', currency: 'BGN', accountConfig: { iban: true } }, // Bulgaria
  {
    code: 'CA',
    currency: 'CAD',
    accountConfig: { transitNumber: true, institutionNumber: true, accountNumber: true },
  },
  { code: 'CY', currency: 'EUR', accountConfig: { iban: true } }, // Cyprus
  { code: 'CZ', currency: 'CZK', accountConfig: { iban: true } }, // Czech Republic
  { code: 'DK', currency: 'DKK', accountConfig: { iban: true } }, // Denmark
  { code: 'EE', currency: 'EUR', accountConfig: { iban: true } }, // Estonia
  { code: 'FI', currency: 'EUR', accountConfig: { iban: true } }, // Finland
  { code: 'FR', currency: 'EUR', accountConfig: { iban: true } }, // France
  { code: 'DE', currency: 'EUR', accountConfig: { iban: true } }, // Germany
  { code: 'GR', currency: 'EUR', accountConfig: { iban: true } }, // Greece
  {
    code: 'HK',
    currency: 'HKD',
    accountConfig: { clearingCode: true, branchCode: true, accountNumber: true },
  },
  { code: 'IE', currency: 'EUR', accountConfig: { iban: true } }, // Ireland
  { code: 'IT', currency: 'EUR', accountConfig: { iban: true } }, // Italy
  {
    code: 'JP',
    currency: 'JPY',
    accountConfig: {
      bankName: true,
      branchName: true,
      bankCode: true,
      branchCode: true,
      accountNumber: true,
      accountOwnerName: true,
    },
  },
  { code: 'LV', currency: 'EUR', accountConfig: { iban: true } }, // Latvia
  { code: 'LT', currency: 'EUR', accountConfig: { iban: true } }, // Lithuania
  { code: 'LU', currency: 'EUR', accountConfig: { iban: true } }, // Luxembourg
  { code: 'MT', currency: 'EUR', accountConfig: { iban: true } }, // Malta
  { code: 'MX', currency: 'MXN', accountConfig: { clabe: true } }, // Mexico
  { code: 'NL', currency: 'EUR', accountConfig: { iban: true } }, // Netherlands
  { code: 'NZ', currency: 'NZD', accountConfig: { accountNumber: true } }, // New Zealand
  { code: 'NO', currency: 'NOK', accountConfig: { iban: true } }, // Norway
  { code: 'PL', currency: 'PLN', accountConfig: { iban: true } }, // Poland
  { code: 'PT', currency: 'EUR', accountConfig: { iban: true } }, // Portugal
  { code: 'RO', currency: 'RON', accountConfig: { iban: true } }, // Romania
  {
    code: 'SG',
    currency: 'SGD',
    accountConfig: { bankCode: true, branchCode: true, accountNumber: true },
  },
  { code: 'SK', currency: 'EUR', accountConfig: { iban: true } }, // Slovakia
  { code: 'SI', currency: 'EUR', accountConfig: { iban: true } }, // Slovenia
  { code: 'ES', currency: 'EUR', accountConfig: { iban: true } }, // Spain
  { code: 'SE', currency: 'SEK', accountConfig: { iban: true } }, // Sweden
  { code: 'CH', currency: 'CHF', accountConfig: { iban: true } }, // Switzerland
  { code: 'GB', currency: 'GBP', accountConfig: { sortCode: true, accountNumber: true } }, // United Kingdom
  { code: 'US', currency: 'USD', accountConfig: { routingNumber: true, accountNumber: true } }, // United States
];

// ========= Optional helpers =========

/** Quick map of country config by code. */
export const supportedCountryMap = supportedCountries.reduce((acc, c) => {
  acc[c.code] = c;
  return acc;
}, {});

/** Friendly labels for bank fields (can be used in forms). */
export const bankFieldLabels = {
  iban: 'IBAN',
  bsb: 'BSB',
  clabe: 'CLABE',
  sortCode: 'Sort code',
  routingNumber: 'Routing number',
  institutionNumber: 'Institution number',
  transitNumber: 'Transit number',
  accountNumber: 'Account number',
  bankCode: 'Bank code',
  branchCode: 'Branch code',
  bankName: 'Bank name',
  branchName: 'Branch name',
  accountOwnerName: 'Account holder name',
};
