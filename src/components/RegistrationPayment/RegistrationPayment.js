import React, { useEffect, useState, useMemo } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PrimaryButton, H3 } from '../index'; // adjust import to your component barrel

export default function RegistrationPayment({ email, userType, onPaid, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState(null);
  const [amount, setAmount] = useState(null);
  const [currency, setCurrency] = useState('usd');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetch('/api/registration/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userType }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.error || 'Failed to init payment');
        if (!mounted) return;
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setCurrency(data.currency);
      } catch (e) {
        setErr(e);
        onError?.(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [email, userType, onError]);

  const amountLabel = useMemo(() => {
    if (amount == null) return '...';
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount / 100);
    } catch {
      return `$${(amount / 100).toFixed(2)} ${currency}`;
    }
  }, [amount, currency]);

  const pay = async e => {
    e?.preventDefault?.();
    if (!stripe || !elements || !clientSecret) return;
    setBusy(true);
    setErr(null);
    try {
      const card = elements.getElement(CardElement);
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card, billing_details: { email: email || undefined } },
      });
      if (error) throw new Error(error.message);
      if (paymentIntent?.status === 'succeeded') onPaid?.(paymentIntent);
      else throw new Error('Payment did not succeed');
    } catch (e) {
      setErr(e);
      onError?.(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <H3>Registration payment</H3>
      <p>
        Fee: <strong>{amountLabel}</strong>
      </p>
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      {err && <div style={{ color: 'crimson', marginBottom: 12 }}>{err.message}</div>}
      <PrimaryButton onClick={pay} disabled={!clientSecret || busy}>
        {busy ? 'Processing…' : 'Pay & Continue'}
      </PrimaryButton>
    </div>
  );
}
