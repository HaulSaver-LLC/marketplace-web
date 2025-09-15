import React, { useEffect, useState, useMemo } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { PrimaryButton } from '../../components';
import css from './OneTimePaymentPage.module.css';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ clientSecret, email }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handlePay = async e => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/register/one-time-payment`,
        receipt_email: email || undefined,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setSubmitting(false);
      return;
    }

    // If no redirect is needed and payment is confirmed, reload to refresh currentUser
    window.location.reload();
  };

  return (
    <form onSubmit={handlePay} className={css.form}>
      <PaymentElement />
      {error ? <div className={css.error}>{error}</div> : null}
      <PrimaryButton type="submit" disabled={submitting || !stripe || !elements}>
        {submitting ? 'Processing…' : 'Pay $4.99 to Unlock'}
      </PrimaryButton>
    </form>
  );
}

export default function OneTimePaymentPage() {
  const currentUser = useSelector(state => state.user.currentUser);
  const [clientSecret, setClientSecret] = useState(null);

  // If already paid, bounce them onward (e.g., to dashboard or profile)
  const isUnlocked =
    currentUser?.attributes?.profile?.metadata?.profileUnlockPaid ||
    currentUser?.attributes?.metadata?.profileUnlockPaid;

  useEffect(() => {
    if (isUnlocked) {
      window.location.replace('/'); // or /account, /listings, etc.
      return;
    }

    const init = async () => {
      const res = await fetch('/api/stripe/create-profile-unlock-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id?.uuid,
          email: currentUser?.attributes?.email,
        }),
      });
      const data = await res.json();
      setClientSecret(data.clientSecret);
    };
    if (currentUser?.id?.uuid) init();
  }, [currentUser, isUnlocked]);

  const options = useMemo(() => ({ clientSecret }), [clientSecret]);

  if (isUnlocked) return null;
  if (!clientSecret) return <div className={css.loading}>Preparing checkout…</div>;

  return (
    <div className={css.root}>
      <h1>One-Time Profile Setup Unlock</h1>
      <p>
        Pay <strong>$4.99</strong> once to activate your account features.
      </p>
      <Elements stripe={stripePromise} options={options}>
        <PaymentForm clientSecret={clientSecret} email={currentUser?.attributes?.email} />
      </Elements>
    </div>
  );
}
