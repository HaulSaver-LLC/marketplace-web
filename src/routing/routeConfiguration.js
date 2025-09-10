import React from 'react';
import loadable from '@loadable/component';

import getPageDataLoadingAPI from '../containers/pageDataLoadingAPI';
import NotFoundPage from '../containers/NotFoundPage/NotFoundPage';
import PreviewResolverPage from '../containers/PreviewResolverPage/PreviewResolverPage';
import ProviderSignupPage from '../containers/ProviderSignupPage/ProviderSignupPage';
import ShipperSignupPage from '../containers/ShipperSignupPage/ShipperSignupPage';
import RegisterActivatePage from '../containers/RegisterActivatePage/RegisterActivatePage';

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
  import(
    /* webpackChunkName: "ListingPageCoverPhoto" */ /* webpackPrefetch: true */ '../containers/ListingPage/ListingPageCoverPhoto'
  )
);
const ListingPageCarousel = loadable(() =>
  import(
    /* webpackChunkName: "ListingPageCarousel" */ /* webpackPrefetch: true */ '../containers/ListingPage/ListingPageCarousel'
  )
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
  import(
    /* webpackChunkName: "SearchPageWithMap" */ /* webpackPrefetch: true */ '../containers/SearchPage/SearchPageWithMap'
  )
);
const SearchPageWithGrid = loadable(() =>
  import(
    /* webpackChunkName: "SearchPageWithGrid" */ /* webpackPrefetch: true */ '../containers/SearchPage/SearchPageWithGrid'
  )
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

// Styleguide helps you review current components and develop new ones
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
    layoutConfig.listingPage?.variantType === 'carousel' ? ListingPageCarousel : ListingPageCoverPhoto;

  const isPrivateMarketplace = accessControlConfig?.marketplace?.private === true;
  const authForPrivateMarketplace = isPrivateMarketplace ? { auth: true } : {};

  // Flag for pages that require registration fee
  const requirePaid = { requirePaid: true };

  return [
    // Landing & CMS
    { path: '/', name: 'LandingPage', component: LandingPage, loadData: pageDataLoadingAPI.LandingPage.loadData },
    { path: '/p/:pageId', name: 'CMSPage', component: CMSPage, loadData: pageDataLoadingAPI.CMSPage.loadData },

    // Search
    { path: '/s', name: 'SearchPage', ...authForPrivateMarketplace, component: SearchPage, loadData: pageDataLoadingAPI.SearchPage.loadData },
    { path: '/s/:listingType', name: 'SearchPageWithListingType', ...authForPrivateMarketplace, component: SearchPage, loadData: pageDataLoadingAPI.SearchPage.loadData },

    // Listings
    { path: '/l', name: 'ListingBasePage', component: RedirectToLandingPage },
    { path: '/l/:slug/:id', name: 'ListingPage', ...authForPrivateMarketplace, component: ListingPage, loadData: pageDataLoadingAPI.ListingPage.loadData },
    { path: '/l/:slug/:id/checkout', name: 'CheckoutPage', auth: true, ...requirePaid, component: CheckoutPage, setInitialValues: pageDataLoadingAPI.CheckoutPage.setInitialValues },
    { path: '/l/:slug/:id/:variant', name: 'ListingPageVariant', auth: true, authPage: 'LoginPage', ...requirePaid, component: ListingPage, loadData: pageDataLoadingAPI.ListingPage.loadData },
    {
      path: '/l/new',
      name: 'NewListingPage',
      auth: true,
      ...requirePaid,
      component: () => (
        <NamedRedirect name="EditListingPage" params={{ slug: draftSlug, id: draftId, type: 'new', tab: 'details' }} />
      ),
    },
    { path: '/l/:slug/:id/:type/:tab', name: 'EditListingPage', auth: true, ...requirePaid, component: EditListingPage, loadData: pageDataLoadingAPI.EditListingPage.loadData },
    { path: '/l/:slug/:id/:type/:tab/:returnURLType', name: 'EditListingStripeOnboardingPage', auth: true, ...requirePaid, component: EditListingPage, loadData: pageDataLoadingAPI.EditListingPage.loadData },
    { path: '/l/:id', name: 'ListingPageCanonical', ...authForPrivateMarketplace, component: ListingPage, loadData: pageDataLoadingAPI.ListingPage.loadData },

    // Profiles
    { path: '/u', name: 'ProfileBasePage', component: RedirectToLandingPage },
    { path: '/u/:id', name: 'ProfilePage', ...authForPrivateMarketplace, component: ProfilePage, loadData: pageDataLoadingAPI.ProfilePage.loadData },
    { path: '/u/:id/:variant', name: 'ProfilePageVariant', auth: true, authPage: 'LoginPage', ...requirePaid, component: ProfilePage, loadData: pageDataLoadingAPI.ProfilePage.loadData },

    // Settings
    { path: '/profile-settings', name: 'ProfileSettingsPage', auth: true, authPage: 'LoginPage', ...requirePaid, component: ProfileSettingsPage },

    // Auth
    { path: '/login', name: 'LoginPage', component: AuthenticationPage, extraProps: { tab: 'login' } },
    { path: '/signup', name: 'SignupPage', component: AuthenticationPage, extraProps: { tab: 'signup' }, loadData: pageDataLoadingAPI.AuthenticationPage.loadData },
    { path: '/signup/:userType', name: 'SignupForUserTypePage', component: AuthenticationPage, extraProps: { tab: 'signup' }, loadData: pageDataLoadingAPI.AuthenticationPage.loadData },
    { path: '/confirm', name: 'ConfirmPage', component: AuthenticationPage, extraProps: { tab: 'confirm' }, loadData: pageDataLoadingAPI.AuthenticationPage.loadData },

    // Inbox & transactions
    { path: '/inbox', name: 'InboxBasePage', auth: true, authPage: 'LoginPage', ...requirePaid, component: () => <NamedRedirect name="InboxPage" params={{ tab: 'sales' }} /> },
    { path: '/inbox/:tab', name: 'InboxPage', auth: true, authPage: 'LoginPage', ...requirePaid, component: InboxPage, loadData: pageDataLoadingAPI.InboxPage.loadData },
    {
      path: '/order/:id',
      name: 'OrderDetailsPage',
      auth: true,
      authPage: 'LoginPage',
      ...requirePaid,
      component: TransactionPage,
      extraProps: { transactionRole: 'customer' },
      loadData: (params, ...rest) =>
        pageDataLoadingAPI.TransactionPage.loadData({ ...params, transactionRole: 'customer' }, ...rest),
      setInitialValues: pageDataLoadingAPI.TransactionPage.setInitialValues,
    },
    {
      path: '/order/:id/details',
      name: 'OrderDetailsPageRedirect',
      auth: true,
      authPage: 'LoginPage',
      ...requirePaid,
      component: props => <NamedRedirect name="OrderDetailsPage" params={{ id: props.params?.id }} />,
    },
    { path: '/sale/:id', name: 'SaleDetailsPage', auth: true, authPage: 'LoginPage', ...requirePaid, component: TransactionPage, loadData: pageDataLoadingAPI.TransactionPage.loadData },
    {
      path: '/sale/:id/details',
      name: 'SaleDetailsPageRedirect',
      auth: true,
      authPage: 'LoginPage',
      ...requirePaid,
      component: props => <NamedRedirect name="SaleDetailsPage" params={{ id: props.params?.id }} />,
    },

    // Listings mgmt
    {
      path: '/listings',
      name: 'ManageListingsPage',
      auth: true,
      authPage: 'LoginPage',
      ...requirePaid,
      component: ManageListingsPage,
      loadData: pageDataLoadingAPI.ManageListingsPage.loadData,
    },

    // Account (settings navigation)
    { path: '/account', name: 'AccountSettingsPage', auth: true, authPage: 'LoginPage', ...requirePaid, component: () => <NamedRedirect name="ContactDetailsPage" /> },
    { path: '/account/contact-details', name: 'ContactDetailsPage', auth: true, authPage: 'LoginPage', ...requirePaid, component: ContactDetailsPage, loadData: pageDataLoadingAPI.ContactDetailsPage.loadData },
    { path: '/account/change-password', name: 'PasswordChangePage', auth: true, authPage: 'LoginPage', ...requirePaid, component: PasswordChangePage },
    { path: '/account/payments', name: 'StripePayoutPage', auth: true, authPage: 'LoginPage', ...requirePaid, component: StripePayoutPage, loadData: pageDataLoadingAPI.StripePayoutPage.loadData },
    { path: '/account/payments/:returnURLType', name: 'StripePayoutOnboardingPage', auth: true, authPage: 'LoginPage', ...requirePaid, component: StripePayoutPage, loadData: pageDataLoadingAPI.StripePayoutPage.loadData },
    { path: '/account/payment-methods', name: 'PaymentMethodsPage', auth: true, authPage: 'LoginPage', ...requirePaid, component: PaymentMethodsPage, loadData: pageDataLoadingAPI.PaymentMethodsPage.loadData },

    // Legal & misc
    { path: '/terms-of-service', name: 'TermsOfServicePage', component: TermsOfServicePage, loadData: pageDataLoadingAPI.TermsOfServicePage.loadData },
    { path: '/privacy-policy', name: 'PrivacyPolicyPage', component: PrivacyPolicyPage, loadData: pageDataLoadingAPI.PrivacyPolicyPage.loadData },

    // Styleguide
    { path: '/styleguide', name: 'Styleguide', ...authForPrivateMarketplace, component: StyleguidePage },
    { path: '/styleguide/g/:group', name: 'StyleguideGroup', ...authForPrivateMarketplace, component: StyleguidePage },
    { path: '/styleguide/c/:component', name: 'StyleguideComponent', ...authForPrivateMarketplace, component: StyleguidePage },
    { path: '/styleguide/c/:component/:example', name: 'StyleguideComponentExample', ...authForPrivateMarketplace, component: StyleguidePage },
    { path: '/styleguide/c/:component/:example/raw', name: 'StyleguideComponentExampleRaw', ...authForPrivateMarketplace, component: StyleguidePage, extraProps: { raw: true } },

    // Access / error
    { path: '/no-:missingAccessRight', name: 'NoAccessPage', component: NoAccessPage },
    { path: '/notfound', name: 'NotFoundPage', component: props => <NotFoundPage {...props} /> },

    // Custom signup pages
    { path: '/signup/provider', name: 'ProviderSignupPage', component: ProviderSignupPage },
    { path: '/signup/shipper', name: 'ShipperSignupPage', component: ShipperSignupPage },

    // Stripe Activation (no auth; used to finish payment)
    { path: '/register/activate', name: 'RegisterActivatePage', component: RegisterActivatePage, exact: true },

    // Required API paths
    { path: '/reset-password', name: 'PasswordResetPage', component: PasswordResetPage },
    { path: '/recover-password', name: 'PasswordRecoveryPage', component: PasswordRecoveryPage },
    {
      path: '/verify-email',
      name: 'EmailVerificationPage',
      auth: true,
      authPage: 'LoginPage',
      component: EmailVerificationPage,
      loadData: pageDataLoadingAPI.EmailVerificationPage.loadData,
    },
    { path: '/preview', name: 'PreviewResolverPage', component: PreviewResolverPage },
  ];
};

export default routeConfiguration;
