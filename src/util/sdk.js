// src/util/sdk.js
import sharetribeSdk from 'sharetribe-flex-sdk';

const clientId = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
if (!clientId) {
  throw new Error('Missing REACT_APP_SHARETRIBE_SDK_CLIENT_ID (.env.development)');
}

const sdk = sharetribeSdk.createInstance({
  clientId,
  baseUrl: process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL || 'https://flex-api.sharetribe.com',
  // keep your template’s tokenStore/transit if you have them
});

export default sdk;
