import sharetribeSdk from 'sharetribe-flex-sdk';

export const sdkPriv = sharetribeSdk.createInstance({
  clientId: process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID,
  // Use client secret for privileged actions
  clientSecret: process.env.SHARETRIBE_SDK_CLIENT_SECRET,
  // If you use integ API, set baseUrl here
  // baseUrl: 'https://flex-integ-api.sharetribe.com',
});
