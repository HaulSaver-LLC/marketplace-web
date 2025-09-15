// src/pages/OneTimePaymentPage.jsx
import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!stripe || !elements) return;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/register/payment-complete',
      },
    });
    if (error) setMessage(error.message);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>
        Pay $4.99
      </button>
      {message && <div>{message}</div>}
    </form>
  );
}

export default function OneTimePaymentPage() {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Fetch clientSecret from backend (assume user's token/session included)
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST', // fill out body details as appropriate
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: '...' /* get from context */ }),
    })
      .then(r => r.json())
      .then(d => setClientSecret(d.clientSecret));
  }, []);

  const options = { clientSecret };
  return (
    <div>
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
}
