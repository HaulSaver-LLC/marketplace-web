import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePublishableKey } from '../config';

const stripePromise = loadStripe(stripePublishableKey);

function InnerForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      // If you used a customer on the server, SI will attach to it
    });

    if (error) setMessage(error.message || 'Failed to save card');
    else setMessage('Card saved!');
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={!stripe} style={{ marginTop: 12 }}>
        Save card
      </button>
      {message && <div style={{ marginTop: 8 }}>{message}</div>}
    </form>
  );
}

export default function SaveCardForm() {
  const [clientSecret, setClientSecret] = useState(null);

  React.useEffect(() => {
    // Get a SetupIntent from our local server
    fetch('/api/stripe/setup-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(d => setClientSecret(d.clientSecret));
  }, []);

  if (!clientSecret) return <div>Preparing payment form…</div>;

  return (
    <Elements options={{ clientSecret }} stripe={stripePromise}>
      <InnerForm />
    </Elements>
  );
}
