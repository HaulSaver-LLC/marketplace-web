import React, { useState } from 'react';
import { ensureCurrentUser } from '../../util/data';
import { useSelector } from 'react-redux';
import { propTypes } from '../../util/types';

const RegisterActivatePage = () => {
  const currentUser = useSelector(state => ensureCurrentUser(state.user.currentUser));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  if (!currentUser || !currentUser.id) {
    return <div>Please sign in first.</div>;
  }

  const handlePay = async () => {
    setLoading(true);
    setMsg('');
    try {
      const email = currentUser.attributes.email;
      const userId = currentUser.id.uuid || currentUser.id; // FTW uses id.uuid
      const r = await fetch('/api/registration/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email }),
      });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else setMsg('Unable to start checkout.');
    } catch (e) {
      setMsg('Payment start failed.');
    } finally {
      setLoading(false);
    }
  };

  const paid = currentUser.attributes.profile.publicData?.registrationPaid === true;

  return (
    <div style={{ maxWidth: 520, margin: '40px auto' }}>
      <h1>Activate your account</h1>
      {paid ? (
        <p>✅ Your registration fee is paid. You’re all set!</p>
      ) : (
        <>
          <p>To finish signup, please pay the registration fee.</p>
          <button onClick={handlePay} disabled={loading}>
            {loading ? 'Starting checkout…' : 'Pay registration fee'}
          </button>
          {msg && <p style={{ color: 'crimson' }}>{msg}</p>}
        </>
      )}
    </div>
  );
};

RegisterActivatePage.propTypes = {
  currentUser: propTypes.currentUser,
};

export default RegisterActivatePage;
