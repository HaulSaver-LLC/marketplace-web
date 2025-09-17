// server/api/stripeWebhook.js
const IntegrationSdk = require('sharetribe-flex-integration-sdk');
const sdk = IntegrationSdk.createInstance({
  clientId: process.env.FLEX_INTEGRATION_CLIENT_ID,
  clientSecret: process.env.FLEX_INTEGRATION_CLIENT_SECRET,
});

// when PI succeeds and you have userId in PI.metadata.userId
await sdk.users.updateProfile({
  id: paymentIntent.metadata.userId,
  // NOTE: with Integration SDK this is usually 'protectedData' under 'profile'
  // some SDKs expect { profile: { protectedData: {...} } }
  profile: { protectedData: { registrationPaid: true } },
});
