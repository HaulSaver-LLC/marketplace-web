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

const isBanned = currentUser => {
  const isBrowser = typeof window !== 'undefined';
  // Future todo: currentUser?.attributes?.state === 'banned'
  return isBrowser && currentUser?.attributes?.banned === true;
};

// ---- NEW: helper to read the profile unlock flag from user metadata
const isProfileUnlocked = currentUser => {
  const md = currentUser?.attributes?.metadata || currentUser?.attributes?.profile?.metadata;
  return md?.profileUnlockPaid === true;
};

const canShowComponent = props => {
  const { isAuthenticated, currentUser, route } = props;
  const { auth } = route;
  return !auth || (isAuthenticated && !isBanned(currentUser));
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
      authPage = 'SignupPage',
      extraProps,
      // ---- NEW: optional flag from routeConfiguration.js
      requiresProfileUnlock = false,
    } = route;

    const canShow = canShowComponent(this.props);
    if (!canShow) {
      staticContext.unauthorized = true;
    }

    const hasCurrentUser = !!currentUser?.id;
    const restrictedPageWithCurrentUser = !canShow && hasCurrentUser;
    const isBannedFromAuthPages = restrictedPageWithCurrentUser && isBanned(currentUser);

    // ---- NEW: enforce the $4.99 unlock for gated pages
    // Only gate when user is authenticated (so they can pay) and the route requests it.
    const needsUnlock = hasCurrentUser && requiresProfileUnlock && !isProfileUnlocked(currentUser);

    if (canShow && needsUnlock) {
      // Redirect to the *named* route you’ll define as:
      // { name: 'OneTimePaymentPage', path: '/register/one-time-payment', ... }
      return (
        <NamedRedirect
          name="OneTimePaymentPage"
          state={{ from: `${location.pathname}${location.search}${location.hash}` }}
        />
      );
    }

    return canShow ? (
      <LoadableComponentErrorBoundary>
        <RouteComponent
          params={match.params}
          location={location}
          staticContext={staticContext}
          {...extraProps}
        />
      </LoadableComponentErrorBoundary>
    ) : isBannedFromAuthPages ? (
      <NamedRedirect name="LandingPage" />
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

const Routes = (props, context) => {
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
