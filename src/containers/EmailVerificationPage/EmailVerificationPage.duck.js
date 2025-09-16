import { parse } from '../../util/urlHelpers';
import { verify } from '../../ducks/emailVerification.duck';

export const loadData = (_params, search) => {
  const { t } = parse(search || '');
  if (!t) {
    // no token: do not verify here; show "Check email" + "Resend" in UI
    return Promise.resolve();
  }
  return verify(String(t));
};
