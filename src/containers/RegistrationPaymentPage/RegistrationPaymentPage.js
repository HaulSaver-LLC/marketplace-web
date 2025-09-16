// ===============================
// FILE: src/containers/RegistrationPaymentPage/RegistrationPaymentPage.js
// ===============================
import React, { useEffect, useMemo, useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { injectIntl } from '../../util/reactIntl';
import { ensureCurrentUser } from '../../util/data';
import { propTypes } from '../../util/types';
import { fetchCurrentUser } from '../../ducks/user.duck';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

import { PrimaryButton, Page, H1, H3 } from '../../components';
import css from './RegistrationPaymentPage.module.css';

const PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : Promise.resolve(null);

// API base (same-origin in prod; explicit base in dev)
const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3500' : '');

// ---------- endpoints & helpers ----------

// PaymentIntent endpoints to try (dev + prod)
const REG_INTENT_PATHS = (() => {
  const fromEnv = process.env.REACT_APP_REGISTRATION_INTENT_PATH
    ? [process.env.REACT_APP_REGISTRATION_INTENT_PATH]
    : [];
  return [
    ...fromEnv,
    '/api/registration-payment-intent', // legacy/dev
    '/api/registration/intent', // prod
    '/api/intent', // extra alias if mounted
  ];
})();

// Mark-paid endpoints to try (prod can vary)
const MARK_PAID_PATHS = (() => {
  const fromEnv = process.env.REACT_APP_MARK_PAID_PATH
    ? [process.env.REACT_APP_MARK_PAID_PATH]
    : [];
  return [
    ...fromEnv,
    '/api/mark-registration-paid', // canonical
    '/api/registration/mark-paid', // alias 1
    '/api/registration/paid', // alias 2
  ];
})();

async function createRegistrationPI(body) {
  let lastErr;
  for (const p of REG_INTENT_PATHS) {
    const url = `${API_BASE}${p}`;
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const ct = r.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await r.json() : { error: await r.text() };
      if (r.ok && data?.clientSecret) return data;
      if (r.status !== 404) throw new Error(data?.error || `PI init failed (${r.status})`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('No registration PaymentIntent endpoint reachable');
}

async function markPaidOnServer({ userId, payment }) {
  let lastErr;
  for (const p of MARK_PAID_PATHS) {
    const url = `${API_BASE}${p}`;
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, payment }),
      });
      if (r.ok) return true;
      // For 404s, keep trying the next alias; surface other errors
      if (r.status !== 404) {
        const text = await r.text().catch(() => '');
        throw new Error(`mark-paid ${p} failed ${r.status}: ${text.slice(0, 200)}`);
      }
    } catch (e) {
      lastErr = e;
    }
  }
  if (lastErr) throw lastErr;
  // If all paths are 404, we silently allow the flow to proceed (payment succeeded)
  return false;
}

// ---------- UI components ----------

const PayInner = ({ onSuccess, dispatch, currentUser, clientSecret }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [status, setStatus] = useState('idle'); // idle|confirming|succeeded|failed
  const [error, setError] = useState(null);

  const uNow = ensureCurrentUser(currentUser);
  const billingName = uNow?.attributes?.profile?.displayName || uNow?.attributes?.email || '';
  const billingEmail = uNow?.attributes?.email || '';
  const userId = uNow?.id?.uuid;

  const markPaidAndContinue = async pi => {
    try {
      // Try to update server profile (fallback across aliases)
      const ok = await markPaidOnServer({
        userId,
        payment: {
          intentId: pi.id,
          amount: 1000,
          currency: 'usd',
          at: new Date().toISOString(),
          status: pi.status,
        },
      });

      if (!ok) {
        // Route missing everywhere — not fatal, payment already succeeded
        // eslint-disable-next-line no-console
        console.warn(
          'mark-registration-paid route not found; proceeding without server profile update'
        );
      }

      await dispatch(fetchCurrentUser());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Server profile update failed', e);
      setError('Paid, but failed to update profile. Please refresh; your payment is recorded.');
    }

    setStatus('succeeded');
    onSuccess();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripe || !elements || status === 'confirming') return;

    setError(null);
    setStatus('confirming');

    try {
      // 0) Avoid "unexpected_state": check current PI first
      const { paymentIntent: existingPI } = await stripe.retrievePaymentIntent(clientSecret);
      if (!existingPI) {
        setError('Unable to load payment session. Please reload the page.');
        setStatus('failed');
        return;
      }
      if (['succeeded', 'processing', 'requires_capture'].includes(existingPI.status)) {
        await markPaidAndContinue(existingPI);
        return;
      }
      if (existingPI.status === 'canceled') {
        setError('Payment session expired. Please reload the page to start a new payment.');
        setStatus('failed');
        return;
      }

      // 1) Validate fields
      const { error: submitError } = await elements.submit();
      if (submitError) {
        // eslint-disable-next-line no-console
        console.error('Payment Element validation error:', submitError);
        setError(submitError.message || 'Payment details are incomplete');
        setStatus('failed');
        return;
      }

      // 2) Confirm PI with billing details
      const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: billingName,
              email: billingEmail,
              address: { country: 'US', postal_code: '10001' }, // simple test ZIP
            },
          },
        },
        redirect: 'if_required',
      });

      if (confirmErr) {
        // eslint-disable-next-line no-console
        console.error('Stripe confirm error:', {
          type: confirmErr.type,
          code: confirmErr.code,
          message: confirmErr.message,
          decline_code: confirmErr.decline_code,
        });
        setError(
          confirmErr.message || 'Payment failed. Please check your card details and try again.'
        );
        setStatus('failed');
        return;
      }

      const piStatus = paymentIntent?.status;
      const lastErr = paymentIntent?.last_payment_error;
      if (lastErr) {
        // eslint-disable-next-line no-console
        console.error('Stripe last_payment_error:', lastErr);
        setError(lastErr.message || `Payment failed (status: ${piStatus || 'unknown'})`);
        setStatus('failed');
        return;
      }

      if (['succeeded', 'processing', 'requires_capture'].includes(piStatus)) {
        await markPaidAndContinue(paymentIntent);
      } else {
        setError(`Payment not completed (status: ${piStatus || 'unknown'})`);
        setStatus('failed');
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unexpected error during payment:', err);
      setError('Unexpected error during payment. Please try again.');
      setStatus('failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={css.form}>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error ? <div className={css.error}>{error}</div> : null}
      <PrimaryButton type="submit" disabled={!stripe || status === 'confirming'}>
        {status === 'confirming' ? 'Processing…' : 'Pay $10 Registration Fee'}
      </PrimaryButton>
    </form>
  );
};

export const RegistrationPaymentPageComponent = ({ currentUser = null, history, dispatch }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!PUBLISHABLE_KEY) {
        if (alive) {
          setError('Missing REACT_APP_STRIPE_PUBLISHABLE_KEY in frontend env');
          setStatus('error');
        }
        return;
      }

      let u = ensureCurrentUser(currentUser);
      let userId = u?.id?.uuid || null;
      let email = u?.attributes?.email || null;
      const alreadyPaid = !!u?.attributes?.profile?.publicData?.registrationPaid;

      try {
        if (!userId || !email) {
          const { default: sdk } = await import('../../util/sdk');
          const { data } = await sdk.currentUser.show();
          userId = data?.id?.uuid || userId;
          email = data?.attributes?.email || email;
        }
      } catch {
        history.replace('/login');
        return;
      }

      if (alreadyPaid) {
        history.replace('/verify-email');
        return;
      }

      setStatus('loading');
      try {
        const payload = await createRegistrationPI({ userId, email });
        if (!alive) return;
        setClientSecret(payload.clientSecret);
        setStatus('idle');
      } catch (e) {
        if (!alive) return;
        const msg =
          e?.message && /Failed to fetch|CSP|connect-src|blocked/i.test(e.message)
            ? 'Failed to reach payment API. Make sure /api is same-origin or proxied.'
            : e.message || 'Failed to initialize payment';
        setError(msg);
        setStatus('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [currentUser, history]);

  const appearance = useMemo(() => ({ theme: 'stripe' }), []);
  const goToPostPayment = () => {
    history.push('/verify-email');
  };

  return (
    <Page className={css.page}>
      <H1>Registration Fee</H1>
      <H3>Pay a one-time $10 fee to continue to verification</H3>

      {status === 'loading' && <div className={css.loading}>Preparing payment…</div>}
      {status === 'error' && <div className={css.error}>{error || 'Unable to start payment.'}</div>}

      {!PUBLISHABLE_KEY && (
        <div className={css.error}>
          Stripe publishable key missing. Set <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code>.
        </div>
      )}

      {clientSecret && PUBLISHABLE_KEY ? (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
          <PayInner
            onSuccess={goToPostPayment}
            dispatch={dispatch}
            currentUser={currentUser}
            clientSecret={clientSecret}
          />
        </Elements>
      ) : null}
    </Page>
  );
};

RegistrationPaymentPageComponent.propTypes = { currentUser: propTypes.currentUser };

const mapStateToProps = state => ({ currentUser: state.user.currentUser });

export default compose(
  connect(mapStateToProps),
  injectIntl,
  withRouter
)(RegistrationPaymentPageComponent);
