import React from 'react';
import SetupPaymentMethod from '../../components/payments/SetupPaymentMethod';

const BillingPage = props => {
  const { currentUser } = props; // comes from props injected by Routes/SDK
  return (
    <div>
      <h1>Billing</h1>
      <SetupPaymentMethod currentUser={currentUser} />
    </div>
  );
};

export default BillingPage;
