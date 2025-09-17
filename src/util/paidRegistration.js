// src/util/paidRegistration.js
export const hasPaidRegistration = currentUser => {
  if (!currentUser) return false;
  const prof = currentUser?.attributes?.profile || {};
  const publicData = prof.publicData || {};
  const protectedData = prof.protectedData || {};
  const privateData = currentUser?.attributes?.privateData || {};

  // prefer protectedData, fall back to public/private as needed
  return !!(
    protectedData.registrationPaid ||
    publicData.registrationPaid ||
    privateData.registrationPaid
  );
};
