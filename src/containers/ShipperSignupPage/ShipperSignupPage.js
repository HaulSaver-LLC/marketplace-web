// ===============================
// FILE: src/containers/ShipperSignupPage/ShipperSignupPage.js
// DESCRIPTION: U.S.-ONLY signup page for Customers/Shippers using Sharetribe Flex components.
// NOTE: After successful signup, this redirects to /register/payment
//       for the $10 registration fee (Stripe Payment Intent flow).
// ===============================
import React, { useMemo } from 'react';
import { withRouter } from 'react-router-dom';
import { Form as FinalForm } from 'react-final-form';
import { FORM_ERROR } from 'final-form';
import arrayMutators from 'final-form-arrays';

import * as validators from '../../util/validators';

import {
  Page,
  Form,
  PrimaryButton,
  FieldTextInput,
  FieldSelect,
  FieldCheckbox,
  FieldPhoneNumberInput,
  InlineTextButton,
  H1,
  H3,
  IconCheckmark,
  IconReviewStar,
} from '../../components';

import css from './ShipperSignupPage.module.css';

const required = msg => validators.required(msg);

const emailRequired = validators.required('Email is required');
const emailValid = validators.emailFormatValid('Enter a valid email');
const passwordMinLen = validators.minLength(8, 'Password must be at least 8 characters');
const passwordMaxLen = validators.maxLength(64, 'Password is too long');

const USER_TYPE_OPTIONS = [
  { key: 'individual', label: 'Individual' },
  { key: 'business', label: 'Business' },
];

// US-only
const ORIGIN_REGION_OPTIONS = [{ key: 'us', label: 'United States (US-only accounts)' }];

const CONTACT_PREFS = [{ key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }];

export const ShipperSignupPageComponent = props => {
  const onSubmit = async values => {
    const {
      email,
      password,
      givenName,
      familyName,
      phone,
      userType, // individual | business
      companyName, // optional for business
      originRegion,
      originCities, // free text list
      typicalItems, // free text
      contactPreference,
      marketingOptIn,
      acceptTos,
    } = values;

    if (!acceptTos) {
      return { [FORM_ERROR]: 'Please accept the Terms of Service.' };
    }

    // Enforce US-only selection just in case
    if (originRegion && originRegion !== 'us') {
      return { [FORM_ERROR]: 'This marketplace currently supports U.S. shippers only.' };
    }

    const profile = {
      firstName: givenName,
      lastName: familyName,
      displayName: `${givenName} ${familyName}`.trim(),
      abbreviatedName: `${givenName?.[0] || ''}${familyName?.[0] || ''}`.toUpperCase(),
      publicData: {
        userType: 'shipper',
        shipperProfile: {
          accountType: userType || 'individual',
          companyName: userType === 'business' ? companyName || null : null,
          originRegion: 'us',
          originCities,
          typicalItems,
          contactPreference: contactPreference || 'email',
          marketingOptIn: !!marketingOptIn,
        },
      },
      protectedData: {
        phone,
      },
    };

    const payload = { email, password, marketplace: 'flex', profile };

    try {
      // Create account + authenticate
      if (props.onSignup) {
        await props.onSignup(payload);
      }
      // Redirect to the $10 registration fee step before verification
      props.history.push('/register/payment');
      return undefined;
    } catch (e) {
      const message =
        e?.message ||
        e?.errors?.[0]?.message ||
        'Signup failed. Please review your details and try again.';
      return { [FORM_ERROR]: message };
    }
  };

  const companyPlaceholder = useMemo(() => 'Company (if business shipper)', []);

  return (
    <Page className={css.root} title="Sign up as a Shipper (U.S.)">
      <div className={css.hero}>
        <H1 as="h1" rootClassName={css.headline}>
          Ship smarter with HaulSaver (U.S.)
        </H1>
        <p className={css.subhead}>
          Create your account to post shipments, compare bids, and manage deliveries in one place.
          <br />
          <strong>Note:</strong> A one-time <strong>$10 registration fee</strong> is required right
          after signup to continue to verification.
        </p>
      </div>

      <div className={css.pageGrid}>
        {/* LEFT: Marketing panel */}
        <section className={css.leftPanel} aria-label="Why ship with us">
          <div className={css.benefitsCard}>
            <H3 rootClassName={css.cardTitle}>Why HaulSaver</H3>
            <ul className={css.benefitsList}>
              <li>
                <IconCheckmark className={css.bulletIcon} /> Post once, get multiple carrier bids
              </li>
              <li>
                <IconCheckmark className={css.bulletIcon} /> Transparent pricing & reviews
              </li>
              <li>
                <IconCheckmark className={css.bulletIcon} /> Secure, milestone-based payments
              </li>
              <li>
                <IconCheckmark className={css.bulletIcon} /> Real-time chat & updates
              </li>
            </ul>
          </div>

          <div className={css.stepsCard}>
            <H3 rootClassName={css.cardTitle}>How it works</H3>
            <ol className={css.stepsList}>
              <li>
                <span className={css.stepNum}>1</span> Create your account
              </li>
              <li>
                <span className={css.stepNum}>2</span> Pay the one-time $10 registration fee
              </li>
              <li>
                <span className={css.stepNum}>3</span> Post your shipment details
              </li>
              <li>
                <span className={css.stepNum}>4</span> Compare bids & choose a carrier
              </li>
              <li>
                <span className={css.stepNum}>5</span> Track delivery and confirm completion
              </li>
            </ol>
          </div>

          <div className={css.trustRow}>
            <div className={css.trustItem}>
              <IconReviewStar className={css.starIcon} /> Verified carriers
            </div>
            <div className={css.trustItem}>
              <IconReviewStar className={css.starIcon} /> Buyer protection
            </div>
            <div className={css.trustItem}>
              <IconReviewStar className={css.starIcon} /> 24/7 support
            </div>
          </div>
        </section>

        {/* RIGHT: Form panel */}
        <section className={css.formPanel} aria-label="Shipper signup form (U.S.)">
          <div className={css.formCard}>
            <FinalForm
              mutators={{ ...arrayMutators }}
              onSubmit={onSubmit}
              render={({ handleSubmit, invalid, submitting, submitError, values }) => (
                <Form onSubmit={handleSubmit} className={css.form}>
                  {submitError ? <div className={css.submitError}>{submitError}</div> : null}

                  {/* Identity */}
                  <div className={css.twoCol}>
                    <FieldTextInput
                      id="givenName"
                      name="givenName"
                      type="text"
                      label="First name"
                      placeholder="Jane"
                      validate={required('First name is required')}
                    />
                    <FieldTextInput
                      id="familyName"
                      name="familyName"
                      type="text"
                      label="Last name"
                      placeholder="Smith"
                      validate={required('Last name is required')}
                    />
                  </div>

                  {/* Account type */}
                  <div className={css.twoCol}>
                    <FieldSelect
                      id="userType"
                      name="userType"
                      label="I am signing up as"
                      validate={required('Please choose one')}
                    >
                      <option value="" disabled>
                        Select one
                      </option>
                      {USER_TYPE_OPTIONS.map(o => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </FieldSelect>

                    <FieldTextInput
                      id="companyName"
                      name="companyName"
                      type="text"
                      label="Company name (if business)"
                      placeholder={companyPlaceholder}
                    />
                  </div>

                  {/* Contact */}
                  <div className={css.twoCol}>
                    <FieldPhoneNumberInput
                      id="phone"
                      name="phone"
                      label="Phone number (U.S.)"
                      placeholder="(555) 555-5555"
                    />
                    <FieldSelect
                      id="contactPreference"
                      name="contactPreference"
                      label="Preferred contact"
                    >
                      <option value="" disabled>
                        Select preference
                      </option>
                      {CONTACT_PREFS.map(o => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </FieldSelect>
                  </div>

                  {/* Shipping profile (US-only) */}
                  <div className={css.twoCol}>
                    <FieldSelect
                      id="originRegion"
                      name="originRegion"
                      label="Where do you primarily ship from?"
                      validate={required('Please select United States')}
                    >
                      <option value="" disabled>
                        Select a region
                      </option>
                      {ORIGIN_REGION_OPTIONS.map(o => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </FieldSelect>
                    <FieldTextInput
                      id="originCities"
                      name="originCities"
                      type="text"
                      label="U.S. cities/areas (comma-separated)"
                      placeholder="e.g., Los Angeles, Phoenix, Las Vegas"
                    />
                  </div>

                  <FieldTextInput
                    id="typicalItems"
                    name="typicalItems"
                    type="text"
                    label="What do you typically ship?"
                    placeholder="e.g., furniture, motorcycles, equipment, boats"
                  />

                  {/* Credentials */}
                  <div className={css.twoCol}>
                    <FieldTextInput
                      id="email"
                      name="email"
                      type="email"
                      label="Email"
                      placeholder="you@example.com"
                      validate={validators.composeValidators(emailRequired, emailValid)}
                    />
                    <FieldTextInput
                      id="password"
                      name="password"
                      type="password"
                      label="Password"
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      validate={validators.composeValidators(passwordMinLen, passwordMaxLen)}
                    />
                  </div>

                  {/* Consents */}
                  <div className={css.legalBlock}>
                    <FieldCheckbox
                      id="marketingOptIn"
                      name="marketingOptIn"
                      label="Send me helpful tips and marketplace updates"
                    />
                    <FieldCheckbox
                      id="acceptTos"
                      name="acceptTos"
                      label={
                        <span>
                          I agree to the{' '}
                          <a href="/terms" target="_blank" rel="noreferrer">
                            Terms
                          </a>{' '}
                          and{' '}
                          <a href="/privacy" target="_blank" rel="noreferrer">
                            Privacy Policy
                          </a>
                          .
                        </span>
                      }
                    />
                  </div>

                  {/* Submit */}
                  <PrimaryButton
                    type="submit"
                    disabled={invalid || submitting}
                    className={css.submitBtn}
                  >
                    {submitting ? 'Creating account…' : 'Create shipper account'}
                  </PrimaryButton>

                  <p className={css.altAction}>
                    Already have an account?{' '}
                    <InlineTextButton onClick={() => props.history.push('/login')}>
                      Log in
                    </InlineTextButton>
                  </p>
                </Form>
              )}
            />
          </div>
        </section>
      </div>
    </Page>
  );
};

export default withRouter(ShipperSignupPageComponent);
