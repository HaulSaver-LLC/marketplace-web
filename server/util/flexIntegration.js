const { createInstance } = require('sharetribe-flex-integration-sdk'); // ensure this dependency exists

let _sdk;
function flexIntegrationSdk() {
  if (_sdk) return _sdk;
  _sdk = createInstance({
    clientId: process.env.INTEGRATION_CLIENT_ID,
    clientSecret: process.env.INTEGRATION_CLIENT_SECRET,
  });
  return _sdk;
}

module.exports = { flexIntegrationSdk };
