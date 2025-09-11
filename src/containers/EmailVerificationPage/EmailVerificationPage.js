import React, { useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { parse } from '../../util/urlHelpers';
import { ensureCurrentUser } from '../../util/data';
import { verify } from '../../ducks/emailVerification.duck';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { Page, ResponsiveBackgroundImageContainer, LayoutSingleColumn } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import EmailVerificationForm from './EmailVerificationForm/EmailVerificationForm';

import css from './EmailVerificationPage.module.css';

/**
  Parse verification token from URL
  Returns stringified token, if provided, else null.
  We stringify to avoid parse() turning it into a number.
*/
const parseVerificationToken = search => {
  const urlParams = parse(search);
  const verificationToken = urlParams.t;
  return verificationToken ? `${verificationToken}` : null;
};

export const EmailVerificationPageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();
  const {
    currentUser,
    scrollingDisabled,
    submitVerification, // thunk wrapper
    isVerified,
    emailVerificationInProgress,
    verificationError,
    location,
    history, // from withRouter
  } = props;

  const user = ensureCurrentUser(currentUser);
  const tokenFromUrl = parseVerificationToken(location ? location.search : null);

  // Redirect to /register/payment immediately after successful verification
  useEffect(() => {
    if (isVerified && user?.attributes?.emailVerified && user?.attributes?.pendingEmail == null) {
      history.replace('/register/payment');
    }
  }, [isVerified, user, history]);

  // Guard submit: ensure we only call verify when a token exists
  const handleSubmit = ({ verificationToken }) => {
    const token = verificationToken || tokenFromUrl;
    if (!token) {
      // Return a rejected promise so Final Form can show a form-level error
      return Promise.reject({
        _error: intl.formatMessage(
          { id: 'EmailVerificationPage.missingToken' },
          {},
          'Missing verification token'
        ),
      });
    }
    return submitVerification({ verificationToken: token });
  };

  return (
    <Page
      title={intl.formatMessage({ id: 'EmailVerificationPage.title' })}
      scrollingDisabled={scrollingDisabled}
      referrer="origin"
    >
      <LayoutSingleColumn
        mainColumnClassName={css.layoutWrapperMain}
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <ResponsiveBackgroundImageContainer
          className={css.root}
          childrenWrapperClassName={css.contentContainer}
          as="section"
          image={config.branding.brandImage}
          sizes="100%"
          useOverlay
        >
          <div className={css.content}>
            {user.id ? (
              <EmailVerificationForm
                initialValues={{ verificationToken: tokenFromUrl }}
                onSubmit={handleSubmit}
                currentUser={user}
                inProgress={emailVerificationInProgress}
                verificationError={verificationError}
              />
            ) : (
              <FormattedMessage id="EmailVerificationPage.loadingUserInformation" />
            )}
          </div>
        </ResponsiveBackgroundImageContainer>
      </LayoutSingleColumn>
    </Page>
  );
};

EmailVerificationPageComponent.propTypes = {
  currentUser: propTypes.currentUser,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const { isVerified, verificationError, verificationInProgress } = state.emailVerification;
  return {
    isVerified,
    verificationError,
    emailVerificationInProgress: verificationInProgress,
    currentUser,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = dispatch => ({
  submitVerification: ({ verificationToken }) => dispatch(verify(verificationToken)),
});

// withRouter must wrap connect
export default compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EmailVerificationPageComponent);
