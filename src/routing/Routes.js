// ===============================
// FILE: src/containers/Routes.js
// DESCRIPTION: Application routes with auth and registrationPaid enforcement.
// ===============================
import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';

import { useRouteConfiguration } from '../context/routeConfigurationContext';
import { propTypes } from '../util/types';
import * as log from '../util/log';
import { canonicalRoutePath } from '../util/routes';
import { useConfiguration } from '../context/configurationContext';

import { locationChanged } from '../ducks/routing.duck';

import { NamedRedirect } from '../components';
import NotFoundPage from '../containers/NotFoundPage/NotFoundPage';
import LoadableComponentErrorBoundary from './LoadableComponentErrorBoundary/LoadableComponentErrorBoundary';

// --- helpers ---
const isBanned = currentUser => {
  const isBrowser = typeof window !== 'undefined';
  return isBrowser && currentUser?.attributes?.banned === true;
};

// Check registrationPaid (support publicData, protectedData, metadata just in case)
const isRegistrationPaid = currentUser => {
  const profile = currentUser?.attributes?.profile || {};
  const pub = profile.publicData || {};
  const prot = profile.protectedData || {};
  const meta = profile.metadata || {};
  return (
    pub.registrationPaid === true ||
    prot.registrationPaid === true ||
    meta.registrationPaid === true
  );
};

// Decide if a route’s component can render based on route flags and user state
const canShowComponent = props => {
  const { isAuthenticated, currentUser, route } = props;
  const { auth, requiresPaid } = route;

  // 1) Auth gate
  if (auth) {
    if (!isAuthenticated) return false;
    if (isBanned(currentUser)) return false;
  }

  // 2) Registration fee gate
  if (requiresPaid) {
    if (!currentUser?.id) return false;
    if (!isRegistrationPaid(currentUser)) return false;
  }

  return true;
};

const callLoadData = props => {
  const { match, location, route, dispatch, logoutInProgress, config } = props;
  const { loadData, name } = route;
  const shouldLoadData =
    typeof loadData === 'function' && canShowComponent(props) && !logoutInProgress;

  if (shouldLoadData) {
    dispatch(loadData(match.params, location.search, config))
      .then(() => {
        if (props.logLoadDataCalls) {
          console.log(`loadData success for ${name} route`);
        }
      })
      .catch(e => {
        log.error(e, 'load-data-failed', { routeName: name });
      });
  }
};

const setPageScrollPosition = (location, delayed) => {
  if (!location.hash) {
    window.scroll({ top: 0, left: 0 });
  } else {
    const el = document.querySelector(location.hash);
    if (el) {
      el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else {
      delayed = window.setTimeout(() => {
        const reTry = document.querySelector(location.hash);
        reTry?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }, 300);
    }
  }
};

const handleLocationChanged = (dispatch, location, routeConfiguration, delayed) => {
  setPageScrollPosition(location, delayed);
  const path = canonicalRoutePath(routeConfiguration, location);
  dispatch(locationChanged(location, path));
};

class RouteComponentRenderer extends Component {
  componentDidMount() {
    const { dispatch, location, routeConfiguration } = this.props;
    this.delayed = null;
    callLoadData(this.props);
    handleLocationChanged(dispatch, location, routeConfiguration, this.delayed);
  }

  componentDidUpdate(prevProps) {
    const { dispatch, location, routeConfiguration } = this.props;
    if (prevProps.location !== this.props.location) {
      callLoadData(this.props);
      handleLocationChanged(dispatch, location, routeConfiguration, this.delayed);
    }
  }

  componentWillUnmount() {
    if (this.delayed) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    const { route, match, location, staticContext = {}, currentUser } = this.props;
    const {
      component: RouteComponent,
      authPage = 'SignupPage', // where to send unauthenticated users
      paidPage = 'PricingPage', // where to send unpaid users (change to your activation page if needed)
      extraProps,
      requiresPaid,
    } = route;

    const canShow = canShowComponent(this.props);
    if (!canShow) staticContext.unauthorized = true;

    const hasCurrentUser = !!currentUser?.id;
    const restrictedWithUser = !canShow && hasCurrentUser;
    const banned = restrictedWithUser && isBanned(currentUser);

    return canShow ? (
      <LoadableComponentErrorBoundary>
        <RouteComponent
          params={match.params}
          location={location}
          staticContext={staticContext}
          {...extraProps}
        />
      </LoadableComponentErrorBoundary>
    ) : banned ? (
      <NamedRedirect name="LandingPage" />
    ) : requiresPaid && hasCurrentUser && !isRegistrationPaid(currentUser) ? (
      <NamedRedirect
        name={paidPage}
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    ) : (
      <NamedRedirect
        name={authPage}
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }
}

const mapStateToProps = state => {
  const { isAuthenticated, logoutInProgress } = state.auth;
  const { currentUser } = state.user;
  return { isAuthenticated, logoutInProgress, currentUser };
};
const RouteComponentContainer = compose(connect(mapStateToProps))(RouteComponentRenderer);

const Routes = props => {
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();
  const { isAuthenticated, logoutInProgress, logLoadDataCalls } = props;

  const toRouteComponent = route => {
    const renderProps = {
      isAuthenticated,
      logoutInProgress,
      route,
      routeConfiguration,
      config,
      logLoadDataCalls,
    };
    const isExact = route.exact != null ? route.exact : true;
    return (
      <Route
        key={route.name}
        path={route.path}
        exact={isExact}
        render={matchProps => (
          <RouteComponentContainer
            {...renderProps}
            match={matchProps.match}
            location={matchProps.location}
            staticContext={matchProps.staticContext}
          />
        )}
      />
    );
  };

  return (
    <Switch>
      {routeConfiguration.map(toRouteComponent)}
      <Route component={NotFoundPage} />
    </Switch>
  );
};

export default withRouter(Routes);
