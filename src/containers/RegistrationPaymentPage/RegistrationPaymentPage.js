// ===============================
// FILE: src/containers/RegistrationPaymentPage/RegistrationPaymentPage.js
// DESCRIPTION:
// - $10 registration fee via Stripe Payment Element (Payment Intent)
// - Marks user as paid (publicData.registrationPaid = true) on success
// - Refreshes currentUser in Redux and redirects to /verify-email
// REQUIREMENTS:
// - Backend endpoint POST /api/registration/intent -> { clientSecret }
// - STRIPE_PUBLISHABLE_KEY in env
// ===============================
import React, { useEffect, useMemo, useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { injectIntl } from '../../util/reactIntl';
import { ensureCurrentUser } from '../../util/data';
import { propTypes } from '../../util/types';
import { fetchCurrentUser } from '../../ducks/user.duck';
import sdk from '../../util/sdk';

import { createInstance } from '../../util/sdkLoader';
const sdk = createInstance();

import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

import { PrimaryButton, Page, H1, H3 } from '../../components';
import css from './RegistrationPaymentPage.module.css';

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY
);

// ----- Inner form (assumes Elements + clientSecret already mounted) -----
const PayInner = ({ currentUser, onSuccess, dispatch }) => {
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
      confirmParams: {
        // return_url can be added for redirect-based flows if needed
      },
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
        // 1) Mark paid in publicData so route guard (requiresPaid) can read it
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
          // (Optional) duplicate minimal info in protectedData if you want it private too
          protectedData: {
            registrationPaidAt: new Date().toISOString(),
          },
        });

        // 2) Refresh the Redux store's currentUser so gating works immediately
        await dispatch(fetchCurrentUser());
      } catch (e) {
        // PI already succeeded, proceed but log the issue
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
export const RegistrationPaymentPageComponent = props => {
  const { currentUser, history, dispatch } = props;

  const [clientSecret, setClientSecret] = useState(null);
  const [status, setStatus] = useState('idle'); // idle|loading|error
  const [error, setError] = useState(null);

  // Require logged-in user
  useEffect(() => {
    const u = ensureCurrentUser(currentUser);
    if (!u?.id?.uuid) {
      // Not logged in → send to login/signup
      history.replace('/login');
      return;
    }
    // If already paid, skip this page
    const alreadyPaid = !!u?.attributes?.profile?.publicData?.registrationPaid;
    if (alreadyPaid) {
      history.replace('/verify-email');
      return;
    }

    const email = u?.attributes?.email;
    setStatus('loading');
    fetch('/api/registration/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u.id.uuid, email, amount: 1000, currency: 'usd' }),
    })
      .then(r => r.json())
      .then(d => {
        if (d?.clientSecret) {
          setClientSecret(d.clientSecret);
          setStatus('idle');
        } else {
          setError(d?.error || 'Failed to initialize payment');
          setStatus('error');
        }
      })
      .catch(() => {
        setError('Failed to initialize payment');
        setStatus('error');
      });
  }, [currentUser, history]);

  const appearance = useMemo(() => ({ theme: 'stripe' }), []);

  const goToVerification = () => {
    history.push('/verify-email');
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
          <PayInner currentUser={currentUser} onSuccess={goToVerification} dispatch={dispatch} />
        </Elements>
      ) : null}
    </Page>
  );
};

RegistrationPaymentPageComponent.defaultProps = {
  currentUser: null,
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
