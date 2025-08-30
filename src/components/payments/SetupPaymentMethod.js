import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

// 1) load Stripe.js with your publishable key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
);

function SetupForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setStatus(null);

    if (!stripe || !elements) return;

    setSaving(true);
    // 2) Confirm the SetupIntent using the Payment Element
    const { error: confirmError } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        // Optionally use a return_url if you want a redirect flow
        // return_url: `${window.location.origin}/billing/success`,
      },
      redirect: 'if_required', // stay in SPA if 3DS not needed
    });

    if (confirmError) {
      setError(confirmError.message);
    } else {
      setStatus('Payment method saved!');
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe || saving} style={{ marginTop: 12 }}>
        {saving ? 'Saving…' : 'Save payment method'}
      </button>
      {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
      {status && <div style={{ color: 'green', marginTop: 8 }}>{status}</div>}
    </form>
  );
}

export default function SetupPaymentMethod({ currentUser }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    // Call your API to create a SetupIntent
    (async () => {
      try {
        const res = await fetch('/api/stripe/setup-intents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser?.email,
            name: currentUser?.profile?.displayName || currentUser?.email,
            userId: currentUser?.id?.uuid || currentUser?.id || 'anonymous',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create SetupIntent');

        setClientSecret(data.clientSecret);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [currentUser]);

  if (err) return <div style={{ color: 'crimson' }}>Error: {err}</div>;
  if (!clientSecret) return <div>Loading…</div>;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: 'stripe' },
      }}
    >
      <SetupForm clientSecret={clientSecret} />
    </Elements>
  );
}
