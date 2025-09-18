const { transactionLineItems } = require('../api-util/lineItems');
const {
  getSdk,
  getTrustedSdk,
  handleError,
  serialize,
  fetchCommission,
} = require('../api-util/sdk');

module.exports = (req, res) => {
  const { isSpeculative, orderData, bodyParams, queryParams } = req.body;

  const sdk = getSdk(req, res);
  let lineItems = null;

  const listingPromise = () => sdk.listings.show({ id: bodyParams?.params?.listingId });

  Promise.all([listingPromise(), fetchCommission(sdk), sdk.currentUser.show()])
    .then(([showListingResponse, fetchAssetsResponse, currentUserResponse]) => {
      const listing = showListingResponse.data.data;
      const commissionAsset = fetchAssetsResponse.data.data[0];
      const currentUser = currentUserResponse?.data?.data;

      const { providerCommission, customerCommission } =
        commissionAsset?.type === 'jsonAsset' ? commissionAsset.attributes.data : {};

      // ------------------ CARRIER AUTHORITY GUARD ------------------
      // Determine which transition is being requested
      const transitionName =
        bodyParams?.transition ||
        bodyParams?.params?.transition ||
        (Array.isArray(bodyParams) ? bodyParams.find(p => p && p.transition)?.transition : null);

      // Read flags from current user privateData
      const pd = currentUser?.attributes?.profile?.privateData || {};
      const isCarrier = pd.accountType === 'ProCarrier';
      const isPaid = pd.registrationFeePaid === true;
      const isAuthorityVerified = pd.authorityVerified === true; // set this true when USDOT/authority verified

      // Which transitions to block until verified (adjust to your process if needed)
      const BLOCKED_UNTIL_VERIFIED = ['transition/accept', 'transition/operator-accept'];

      if (
        isCarrier &&
        isPaid &&
        !isAuthorityVerified &&
        BLOCKED_UNTIL_VERIFIED.includes(transitionName)
      ) {
        return res.status(403).json({
          error: 'CARRIER_AUTHORITY_NOT_VERIFIED',
          message: 'You must verify USDOT/authority before accepting hauls.',
        });
      }
      // -------------------------------------------------------------

      lineItems = transactionLineItems(
        listing,
        { ...orderData, ...bodyParams.params },
        providerCommission,
        customerCommission
      );

      return getTrustedSdk(req);
    })
    .then(trustedSdk => {
      // Omit listingId from params (transition/request-payment-after-inquiry does not need it)
      const { listingId, ...restParams } = bodyParams?.params || {};

      // Add lineItems to the body params
      const body = {
        ...bodyParams,
        params: {
          ...restParams,
          lineItems,
        },
      };

      if (isSpeculative) {
        return trustedSdk.transactions.transitionSpeculative(body, queryParams);
      }
      return trustedSdk.transactions.transition(body, queryParams);
    })
    .then(apiResponse => {
      const { status, statusText, data } = apiResponse;
      res
        .status(status)
        .set('Content-Type', 'application/transit+json')
        .send(
          serialize({
            status,
            statusText,
            data,
          })
        )
        .end();
    })
    .catch(e => {
      handleError(res, e);
    });
};
