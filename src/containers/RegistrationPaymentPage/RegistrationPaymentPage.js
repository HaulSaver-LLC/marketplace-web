// ===============================
// FILE: src/containers/RegistrationPaymentPage/RegistrationPaymentPage.js
// DESCRIPTION:
// - $10 registration fee via Stripe Payment Element (Payment Intent)
// - Marks user as paid (publicData.registrationPaid = true) on success
// - Refreshes currentUser in Redux and redirects to /verify-email
// REQUIREMENTS:
// - Backend endpoint POST /api/registration-payment-intent -> { clientSecret }
// - REACT_APP_STRIPE_PUBLISHABLE_KEY in env
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

// --- Stripe key guard (browser must have REACT_APP_*)
const PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = PUBLISHABLE_KEY ? loadStripe(PUBLISHABLE_KEY) : Promise.resolve(null);

// ----- Inner form (assumes Elements + clientSecret already mounted) -----
const PayInner = ({ onSuccess, dispatch }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [status, setStatus] = useState('idle'); // idle|confirming|succeeded|failed
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError(null);
    setStatus('confirming');

    const { error: confirmErr, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required',
    });

    if (confirmErr) {
      setError(confirmErr.message || 'Payment failed');
      setStatus('failed');
      return;
    }

    const piStatus = paymentIntent?.status;
    if (piStatus === 'succeeded' || piStatus === 'processing' || piStatus === 'requires_capture') {
      try {
        // Lazy-load the Sharetribe SDK AFTER payment (avoids module-load issues)
        const { default: sdk } = await import('../../util/sdk');

        // Mark paid in publicData (simple gate signal)
        await sdk.currentUser.updateProfile({
          publicData: {
            registrationPaid: true,
            registrationPayment: {
              intentId: paymentIntent.id,
              amount: 1000, // cents
              currency: 'usd',
              at: new Date().toISOString(),
              status: piStatus,
            },
          },
          protectedData: {
            registrationPaidAt: new Date().toISOString(),
          },
        });

        // Refresh Redux store so guards react immediately
        await dispatch(fetchCurrentUser());
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('currentUser.updateProfile failed', e);
      }

      setStatus('succeeded');
      onSuccess();
    } else {
      setError(`Payment not completed (status: ${piStatus || 'unknown'})`);
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

// ----- Page component: fetches clientSecret and mounts Elements -----
export const RegistrationPaymentPageComponent = ({ currentUser = null, history, dispatch }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|loading|error
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      // Guard: Stripe publishable key must exist
      if (!PUBLISHABLE_KEY) {
        if (alive) {
          setError('Missing REACT_APP_STRIPE_PUBLISHABLE_KEY in frontend env');
          setStatus('error');
        }
        return;
      }

      // Get user from Redux or fall back to SDK
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

      // --- Build absolute API URL to ensure we hit port 3500 in dev ---
      const getApiBase = () => {
        try {
          const base = process.env.REACT_APP_MARKETPLACE_ROOT_URL || window.location.origin;
          const url = new URL(base);
          url.port = String(process.env.REACT_APP_DEV_API_SERVER_PORT || '3500'); // dev API port
          return url.origin.replace(/\/$/, '');
        } catch {
          return 'http://localhost:3500';
        }
      };
      const API_BASE = getApiBase();

      setStatus('loading');
      try {
        const resp = await fetch(`${API_BASE}/api/registration-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email, amount: 1000, currency: 'usd' }),
          // credentials: 'include', // uncomment if you rely on cookies
        });

        // Safely parse JSON or show text/html error body
        const ct = resp.headers.get('content-type') || '';
        const payload = ct.includes('application/json')
          ? await resp.json()
          : { error: (await resp.text()).slice(0, 400) };

        if (!resp.ok || !payload?.clientSecret) {
          throw new Error(payload?.error || 'Failed to initialize payment');
        }

        if (!alive) return;
        setClientSecret(payload.clientSecret);
        setStatus('idle');
      } catch (e) {
        if (!alive) return;
        setError(e.message || 'Failed to initialize payment');
        setStatus('error');
      }
    })();

    return () => {
      alive = false;
    };
  }, [currentUser, history]);

  const appearance = useMemo(() => ({ theme: 'stripe' }), []);

  const goToPostPayment = () => {
    history.push('/'); /* or '/onboarding' */
  };

  return (
    <Page className={css.page}>
      <H1>Registration Fee</H1>
      <H3>Pay a one-time $10 fee to continue to verification</H3>

      {status === 'loading' && <div className={css.loading}>Preparing payment…</div>}
      {status === 'error' && <div className={css.error}>{error || 'Unable to start payment.'}</div>}

      {clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance,
          }}
        >
          <PayInner onSuccess={goToPostPayment} dispatch={dispatch} />
        </Elements>
      ) : null}
    </Page>
  );
};

RegistrationPaymentPageComponent.propTypes = {
  currentUser: propTypes.currentUser,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  return { currentUser };
};

export default compose(
  connect(mapStateToProps),
  injectIntl,
  withRouter
)(RegistrationPaymentPageComponent);
