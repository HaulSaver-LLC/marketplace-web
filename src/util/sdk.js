// src/util/sdk.js
import sharetribeSdk from 'sharetribe-flex-sdk';

const clientId = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;

if (!clientId) {
  // Fail fast with a clear message in development
  throw new Error(
    'Missing REACT_APP_SHARETRIBE_SDK_CLIENT_ID for the browser. ' +
      'Add it to .env.development and restart `yarn run dev`.'
  );
}

const sdk = sharetribeSdk.createInstance({
  clientId,
  baseUrl: process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL || 'https://flex-api.sharetribe.com',
  // keep tokenStore/transit options here if your template uses them
});

export default sdk;

console.log('SDK clientId', process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID);
