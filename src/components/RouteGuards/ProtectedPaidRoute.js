import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { isRegistrationPaid } from '../../util/registration';

const ProtectedPaidRoute = ({
  component: C,
  currentUser,
  fallback = '/signup/shipper',
  ...rest
}) => (
  <Route
    {...rest}
    render={props =>
      currentUser?.id ? (
        isRegistrationPaid(currentUser) ? (
          <C {...props} />
        ) : (
          <div style={{ padding: 24 }}>
            <h2>Finish account activation</h2>
            <p>A one-time $10 registration fee is required to access this feature.</p>
            <a className="btn" href={fallback}>
              Complete activation →
            </a>
          </div>
        )
      ) : (
        <Redirect to="/login" />
      )
    }
  />
);

export default ProtectedPaidRoute;
