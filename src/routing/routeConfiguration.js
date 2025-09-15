import React from 'react';
import loadable from '@loadable/component';

import getPageDataLoadingAPI from '../containers/pageDataLoadingAPI';
import NotFoundPage from '../containers/NotFoundPage/NotFoundPage';
import PreviewResolverPage from '../containers/PreviewResolverPage/PreviewResolverPage';
import ProviderSignupPage from '../containers/ProviderSignupPage/ProviderSignupPage';
import ShipperSignupPage from '../containers/ShipperSignupPage/ShipperSignupPage';

// routeConfiguration needs to initialize containers first
// Otherwise, components will import form container eventually and
// at that point css bundling / imports will happen in wrong order.
import { NamedRedirect } from '../components';

const pageDataLoadingAPI = getPageDataLoadingAPI();

const AuthenticationPage = loadable(() =>
  import(/* webpackChunkName: "AuthenticationPage" */ '../containers/AuthenticationPage/AuthenticationPage')
);
const CheckoutPage = loadable(() =>
  import(/* webpackChunkName: "CheckoutPage" */ '../containers/CheckoutPage/CheckoutPage')
);
const CMSPage = loadable(() =>
  import(/* webpackChunkName: "CMSPage" */ '../containers/CMSPage/CMSPage')
);
const ContactDetailsPage = loadable(() =>
  import(/* webpackChunkName: "ContactDetailsPage" */ '../containers/ContactDetailsPage/ContactDetailsPage')
);
const EditListingPage = loadable(() =>
  import(/* webpackChunkName: "EditListingPage" */ '../containers/EditListingPage/EditListingPage')
);
const EmailVerificationPage = loadable(() =>
  import(/* webpackChunkName: "EmailVerificationPage" */ '../containers/EmailVerificationPage/EmailVerificationPage')
);
const InboxPage = loadable(() =>
  import(/* webpackChunkName: "InboxPage" */ '../containers/InboxPage/InboxPage')
);
const LandingPage = loadable(() =>
  import(/* webpackChunkName: "LandingPage" */ '../containers/LandingPage/LandingPage')
);
const ListingPageCoverPhoto = loadable(() =>
  import(/* webpackChunkName: "ListingPageCoverPhoto" */ /* webpackPrefetch: true */ '../containers/ListingPage/ListingPageCoverPhoto')
);
const ListingPageCarousel = loadable(() =>
  import(/* webpackChunkName: "ListingPageCarousel" */ /* webpackPrefetch: true */ '../containers/ListingPage/ListingPageCarousel')
);
const ManageListingsPage = loadable(() =>
  import(/* webpackChunkName: "ManageListingsPage" */ '../containers/ManageListingsPage/ManageListingsPage')
);
const PasswordChangePage = loadable(() =>
  import(/* webpackChunkName: "PasswordChangePage" */ '../containers/PasswordChangePage/PasswordChangePage')
);
const PasswordRecoveryPage = loadable(() =>
  import(/* webpackChunkName: "PasswordRecoveryPage" */ '../containers/PasswordRecoveryPage/PasswordRecoveryPage')
);
const PasswordResetPage = loadable(() =>
  import(/* webpackChunkName: "PasswordResetPage" */ '../containers/PasswordResetPage/PasswordResetPage')
);
const PaymentMethodsPage = loadable(() =>
  import(/* webpackChunkName: "PaymentMethodsPage" */ '../containers/PaymentMethodsPage/PaymentMethodsPage')
);
const PrivacyPolicyPage = loadable(() =>
  import(/* webpackChunkName: "PrivacyPolicyPage" */ '../containers/PrivacyPolicyPage/PrivacyPolicyPage')
);
const ProfilePage = loadable(() =>
  import(/* webpackChunkName: "ProfilePage" */ '../containers/ProfilePage/ProfilePage')
);
const ProfileSettingsPage = loadable(() =>
  import(/* webpackChunkName: "ProfileSettingsPage" */ '../containers/ProfileSettingsPage/ProfileSettingsPage')
);
const SearchPageWithMap = loadable(() =>
  import(/* webpackChunkName: "SearchPageWithMap" */ /* webpackPrefetch: true */ '../containers/SearchPage/SearchPageWithMap')
);
const SearchPageWithGrid = loadable(() =>
  import(/* webpackChunkName: "SearchPageWithGrid" */ /* webpackPrefetch: true */ '../containers/SearchPage/SearchPageWithGrid')
);
const StripePayoutPage = loadable(() =>
  import(/* webpackChunkName: "StripePayoutPage" */ '../containers/StripePayoutPage/StripePayoutPage')
);
const TermsOfServicePage = loadable(() =>
  import(/* webpackChunkName: "TermsOfServicePage" */ '../containers/TermsOfServicePage/TermsOfServicePage')
);
const TransactionPage = loadable(() =>
  import(/* webpackChunkName: "TransactionPage" */ '../containers/TransactionPage/TransactionPage')
);
const NoAccessPage = loadable(() =>
  import(/* webpackChunkName: "NoAccessPage" */ '../containers/NoAccessPage/NoAccessPage')
);

// NEW: One-time $4.99 payment page
const OneTimePaymentPage = loadable(() =>
  import(/* webpackChunkName: "OneTimePaymentPage" */ '../containers/OneTimePaymentPage/OneTimePaymentPage')
);

// Styleguide helps you to review current components and develop new ones
const StyleguidePage = loadable(() =>
  import(/* webpackChunkName: "StyleguidePage" */ '../containers/StyleguidePage/StyleguidePage')
);

export const ACCOUNT_SETTINGS_PAGES = [
  'ContactDetailsPage',
  'PasswordChangePage',
  'StripePayoutPage',
  'PaymentMethodsPage',
];

// https://en.wikipedia.org/wiki/Universally_unique_identifier#Nil_UUID
const draftId = '00000000-0000-0000-0000-000000000000';
const draftSlug = 'draft';

const RedirectToLandingPage = () => <NamedRedirect name="LandingPage" />;

// Our routes are exact by default.
// See behaviour from Routes.js where Route is created.
const routeConfiguration = (layoutConfig, accessControlConfig) => {
  const SearchPage =
    layoutConfig.searchPage?.variantType === 'map' ? SearchPageWithMap : SearchPageWithGrid;
  const ListingPage =
    layoutConfig.listingPage?.variantType === 'carousel'
      ? ListingPageCarousel
      : ListingPageCoverPhoto;

  const isPrivateMarketplace = accessControlConfig?.marketplace?.private === true;
  const authForPrivateMarketplace = isPrivateMarketplace ? { auth: true } : {};

  return [
    {
      path: '/',
      name: 'LandingPage',
      component: LandingPage,
      loadData: pageDataLoadingAPI.LandingPage.loadData,
    },
    {
      path: '/p/:pageId',
      name: 'CMSPage',
      component: CMSPage,
      loadData: pageDataLoadingAPI.CMSPage.loadData,
    },

    // --- CUSTOM SIGNUP FLOWS (placed BEFORE generic /signup routes) ---
    {
      path: '/signup/provider',
      name: 'ProviderSignupPage',
      component: ProviderSignupPage,
    },
    {
      path: '/signup/customer', // ← as requested
      name: 'ShipperSignupPage',
      component: ShipperSignupPage,
    },

    // --- ONE-TIME PAYMENT FLOW ---
    {
      path: '/register/one-time-payment',
      name: 'OneTimePaymentPage',
      auth: true,           // must be signed in to pay
      authPage: 'LoginPage',
      component: OneTimePaymentPage,
      // optionally: loadData: pageDataLoadingAPI.OneTimePaymentPage?.loadData,
    },

    // NOTE: when private marketplace is enabled, '/s' is disallowed by robots.txt
    {
      path: '/s',
      name: 'SearchPage',
      ...authForPrivateMarketplace,
      component: SearchPage,
      loadData: pageDataLoadingAPI.SearchPage.loadData,
    },
    {
      path: '/s/:listingType',
      name: 'SearchPageWithListingType',
      ...authForPrivateMarketplace,
      component: SearchPage,
      loadData: pageDataLoadingAPI.SearchPage.loadData,
    },
    {
      path: '/l',
      name: 'ListingBasePage',
      component: RedirectToLandingPage,
    },
    {
      path: '/l/:slug/:id',
      name: 'ListingPage',
      ...authForPrivateMarketplace,
      component: ListingPage,
      loadData: pageDataLoadingAPI.ListingPage.loadData,
    },
    {
      path: '/l/:slug/:id/checkout',
      name: 'CheckoutPage',
      auth: true,
      component: CheckoutPage,
      setInitialValues: pageDataLoadingAPI.CheckoutPage.setInitialValues,
    },
    {
      path: '/l/:slug/:id/:variant',
      name: 'ListingPageVariant',
      auth: true,
      authPage: 'LoginPage',
      component: ListingPage,
      loadData: pageDataLoadingAPI.ListingPage.loadData,
    },
    {
      path: '/l/new',
      name: 'NewListingPage',
      auth: true,
      // If you want to gate listing creation behind the $4.99 unlock, add:
      // requiresProfileUnlock: true,
      component: () => (
        <NamedRedirect
          name="EditListingPage"
          params={{ slug: draftSlug, id: draftId, type: 'new', tab: 'details' }}
        />
      ),
    },
    {
      path: '/l/:slug/:id/:type/:tab',
      name: 'EditListingPage',
      auth: true,
      component: EditListingPage,
      loadData: pageDataLoadingAPI.EditListingPage.loadData,
    },
    {
      path: '/l/:slug/:id/:type/:tab/:returnURLType',
      name: 'EditListingStripeOnboardingPage',
      auth: true,
      component: EditListingPage,
      loadData: pageDataLoadingAPI.EditListingPage.loadData,
    },

    // Canonical path should be after the `/l/new` path
    {
      path: '/l/:id',
      name: 'ListingPageCanonical',
      ...authForPrivateMarketplace,
      component: ListingPage,
      loadData: pageDataLoadingAPI.ListingPage.loadData,
    },
    {
      path: '/u',
      name: 'ProfileBasePage',
      component: RedirectToLandingPage,
    },
    {
      path: '/u/:id',
      name: 'ProfilePage',
      ...authForPrivateMarketplace,
      component: ProfilePage,
      loadData: pageDataLoadingAPI.ProfilePage.loadData,
    },
    {
      path: '/u/:id/:variant',
      name: 'ProfilePageVariant',
      auth: true,
      component: ProfilePage,
      loadData: pageDataLoadingAPI.ProfilePage.loadData,
    },
    {
      path: '/profile-settings',
      name: 'ProfileSettingsPage',
      auth: true,
      authPage: 'LoginPage',
      component: ProfileSettingsPage,
    },

    // Auth bundle (generic)
    {
      path: '/login',
      name: 'LoginPage',
      component: AuthenticationPage,
      extraProps: { tab: 'login' },
    },
    {
      path: '/signup',
      name: 'SignupPage',
      component: AuthenticationPage,
      extraProps: { tab: 'signup' },
      loadData: pageDataLoadingAPI.AuthenticationPage.loadData,
    },
    {
      path: '/signup/:userType',
      name: 'SignupForUserTypePage',
      component: AuthenticationPage,
      extraProps: { tab: 'signup' },
      loadData: pageDataLoadingAPI.AuthenticationPage.loadData,
    },
    {
      path: '/confirm',
      name: 'ConfirmPage',
      component: AuthenticationPage,
      extraProps: { tab: 'confirm' },
      loadData: pageDataLoadingAPI.AuthenticationPage.loadData,
    },

    {
      path: '/recover-password',
      name: 'PasswordRecoveryPage',
      component: PasswordRecoveryPage,
    },
    {
      path: '/inbox',
      name: 'InboxBasePage',
      auth: true,
      authPage: 'LoginPage',
      component: () => <NamedRedirect name="InboxPage" params={{ tab: 'sales' }} />,
    },
    {
      path: '/inbox/:tab',
      name: 'InboxPage',
      auth: true,
      authPage: 'LoginPage',
      component: InboxPage,
      loadData: pageDataLoadingAPI.InboxPage.loadData,
    },
    {
      path: '/order/:id',
      name: 'OrderDetailsPage',
      auth: true,
      authPage: 'LoginPage',
      component: TransactionPage,
      extraProps: { transactionRole: 'customer' },
      loadData: (params, ...rest) =>
        pageDataLoadingAPI.TransactionPage.loadData(
          { ...params, transactionRole: 'customer' },
          ...rest
        ),
      setInitialValues: pageDataLoadingAPI.TransactionPage.setInitialValues,
    },
    {
      path: '/order/:id/details',
      name: 'OrderDetailsPageRedirect',
      auth: true,
      authPage: 'LoginPage',
      component: props => <NamedRedirect name="OrderDetailsPage" params={{ id: props.params?.id }} />,
    },
    {
      path: '/sale/:id',
      name: 'SaleDetailsPage',
      auth: true,
      authPage: 'LoginPage',
      component: TransactionPage,
      extraProps: { transactionRole: 'provider' },
      loadData: pageDataLoadingAPI.TransactionPage.loadData,
    },
    {
      path: '/sale/:id/details',
      name: 'SaleDetailsPageRedirect',
      auth: true,
      authPage: 'LoginPage',
      component: props => <NamedRedirect name="SaleDetailsPage" params={{ id: props.params?.id }} />,
    },
    {
      path: '/listings',
      name: 'ManageListingsPage',
      auth: true,
      authPage: 'LoginPage',
      component: ManageListingsPage,
      loadData: pageDataLoadingAPI.ManageListingsPage.loadData,
    },
    {
      path: '/account',
      name: 'AccountSettingsPage',
      auth: true,
      authPage: 'LoginPage',
      component: () => <NamedRedirect name="ContactDetailsPage" />,
    },
    {
      path: '/account/contact-details',
      name: 'ContactDetailsPage',
      auth: true,
      authPage: 'LoginPage',
      component: ContactDetailsPage,
      loadData: pageDataLoadingAPI.ContactDetailsPage.loadData,
    },
    {
      path: '/account/change-password',
      name: 'PasswordChangePage',
      auth: true,
      authPage: 'LoginPage',
      component: PasswordChangePage,
    },
    {
      path: '/account/payments',
      name: 'StripePayoutPage',
      auth: true,
      authPage: 'LoginPage',
      component: StripePayoutPage,
      loadData: pageDataLoadingAPI.StripePayoutPage.loadData,
    },
    {
      path: '/account/payments/:returnURLType',
      name: 'StripePayoutOnboardingPage',
      auth: true,
      authPage: 'LoginPage',
      component: StripePayoutPage,
      loadData: pageDataLoadingAPI.StripePayoutPage.loadData,
    },
    {
      path: '/account/payment-methods',
      name: 'PaymentMethodsPage',
      auth: true,
      authPage: 'LoginPage',
      component: PaymentMethodsPage,
      loadData: pageDataLoadingAPI.PaymentMethodsPage.loadData,
    },
    {
      path: '/terms-of-service',
      name: 'TermsOfServicePage',
      component: TermsOfServicePage,
      loadData: pageDataLoadingAPI.TermsOfServicePage.loadData,
    },
    {
      path: '/privacy-policy',
      name: 'PrivacyPolicyPage',
      component: PrivacyPolicyPage,
      loadData: pageDataLoadingAPI.PrivacyPolicyPage.loadData,
    },
    {
      path: '/styleguide',
      name: 'Styleguide',
      ...authForPrivateMarketplace,
      component: StyleguidePage,
    },
    {
      path: '/styleguide/g/:group',
      name: 'StyleguideGroup',
      ...authForPrivateMarketplace,
      component: StyleguidePage,
    },
    {
      path: '/styleguide/c/:component',
      name: 'StyleguideComponent',
      ...authForPrivateMarketplace,
      component: StyleguidePage,
    },
    {
      path: '/styleguide/c/:component/:example',
      name: 'StyleguideComponentExample',
      ...authForPrivateMarketplace,
      component: StyleguidePage,
    },
    {
      path: '/styleguide/c/:component/:example/raw',
      name: 'StyleguideComponentExampleRaw',
      ...authForPrivateMarketplace,
      component: StyleguidePage,
      extraProps: { raw: true },
    },
    {
      path: '/no-:missingAccessRight',
      name: 'NoAccessPage',
      component: NoAccessPage,
    },
    {
      path: '/notfound',
      name: 'NotFoundPage',
      component: props => <NotFoundPage {...props} />,
    },

    // Do not change this path!
    {
      path: '/reset-password',
      name: 'PasswordResetPage',
      component: PasswordResetPage,
    },

    // Do not change this path!
    {
      path: '/verify-email',
      name: 'EmailVerificationPage',
      auth: true,
      authPage: 'LoginPage',
      component: EmailVerificationPage,
      loadData: pageDataLoadingAPI.EmailVerificationPage.loadData,
    },

    // Do not change this path!
    {
      path: '/preview',
      name: 'PreviewResolverPage',
      component: PreviewResolverPage,
    },
  ];
};

export default routeConfiguration;
