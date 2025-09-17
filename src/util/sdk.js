// src/util/sdk.js
// Works with both CJS and ESM builds of sharetribe-flex-sdk
import * as SDKMod from 'sharetribe-flex-sdk';

const SDK = SDKMod && (SDKMod.createInstance ? SDKMod : SDKMod.default || SDKMod);

const isBrowser = typeof window !== 'undefined';
const CLIENT_ID = process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID;
const BASE_URL = process.env.REACT_APP_SHARETRIBE_SDK_BASE_URL || undefined; // omit if not proxying

if (!CLIENT_ID) {
  // Fail fast with a clearer error than a later TypeError
  throw new Error('Missing REACT_APP_SHARETRIBE_SDK_CLIENT_ID');
}

// Try to build a token store if the module exposes one; otherwise fall back.
let tokenStore;
try {
  if (SDK && SDK.tokenStore) {
    tokenStore = isBrowser
      ? SDK.tokenStore.browserCookieStore({
          secure: process.env.NODE_ENV === 'production',
          domain: process.env.REACT_APP_TOP_LEVEL_DOMAIN || undefined,
          cookieName: `st-sdk-${CLIENT_ID}`,
        })
      : SDK.tokenStore.memoryStore();
  }
} catch {
  // noop → will fall back to SDK default (memory)
}

// Create instance (supports both `createInstance(opts)` and legacy default-fn style)
const create = SDK && SDK.createInstance ? SDK.createInstance : SDK;
const sdk = create({
  clientId: CLIENT_ID,
  ...(BASE_URL ? { baseUrl: BASE_URL } : {}),
  ...(tokenStore ? { tokenStore } : {}),
});

export default sdk;

console.log('SDK clientId', process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID);
