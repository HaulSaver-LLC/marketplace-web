export const isRegistrationPaid = currentUser => {
  const p = currentUser?.attributes?.profile || {};
  const pub = p.publicData || {};
  const prot = p.protectedData || {};
  const meta = p.metadata || {};
  return (
    pub.registrationPaid === true ||
    prot.registrationPaid === true ||
    meta.registrationPaid === true
  );
};
