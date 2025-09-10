// ===============================
// FILE: src/containers/ShipperSignupPage/ShipperSignupPage.js
// DESCRIPTION: Signup page for Customers/Shippers using Sharetribe Flex components
// with a $10 Stripe paid-activation step prior to account creation.
// Requirements:
//  - Backend route POST /api/registration/create-intent -> { clientSecret, amount, currency }
//  - <Elements stripe={...}> provider is mounted near app root
//  - @stripe/react-stripe-js and @stripe/stripe-js installed
// ===============================
import React, { useMemo, useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import { FORM_ERROR } from 'final-form';
import arrayMutators from 'final-form-arrays';

import * as validators from '../../util/validators';
import RegistrationPayment from '../../components/RegistrationPayment/RegistrationPayment';

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

const ORIGIN_REGION_OPTIONS = [
  { key: 'us', label: 'United States' },
  { key: 'canada', label: 'Canada' },
  { key: 'philippines', label: 'Philippines' },
  { key: 'eu', label: 'Europe (EU)' },
  { key: 'other', label: 'Other / Worldwide' },
];

const CONTACT_PREFS = [{ key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }];

export const ShipperSignupPageComponent = props => {
  // Two-phase flow: details -> pay -> create account
  const [phase, setPhase] = useState('form'); // 'form' | 'pay'
  const [snapshot, setSnapshot] = useState(null);
  const [submitErrorInline, setSubmitErrorInline] = useState(null);

  const onSubmitFormPhase = values => {
    const { acceptTos } = values;
    if (!acceptTos) {
      return { [FORM_ERROR]: 'Please accept the Terms of Service.' };
    }
    setSnapshot(values);
    setPhase('pay');
    return undefined;
  };

  const onPaid = async paymentIntent => {
    try {
      const v = snapshot || {};
      const profile = {
        firstName: v.givenName,
        lastName: v.familyName,
        displayName: `${v.givenName} ${v.familyName}`.trim(),
        abbreviatedName: `${v.givenName?.[0] || ''}${v.familyName?.[0] || ''}`.toUpperCase(),
        publicData: {
          userType: 'shipper',
          registrationPaid: true,
          shipperProfile: {
            accountType: v.userType || 'individual',
            companyName: v.userType === 'business' ? v.companyName || null : null,
            originRegion: v.originRegion,
            originCities: v.originCities,
            typicalItems: v.typicalItems,
            contactPreference: v.contactPreference || 'email',
            marketingOptIn: !!v.marketingOptIn,
          },
        },
        protectedData: { phone: v.phone },
      };

      const payload = {
        email: v.email,
        password: v.password,
        marketplace: 'flex',
        profile,
        metadata: {
          registrationPI: paymentIntent?.id,
          registrationAmount: paymentIntent?.amount,
          registrationCurrency: paymentIntent?.currency,
          registrationAt: new Date().toISOString(),
        },
      };

      await props.onSignup?.(payload);
    } catch (e) {
      setSubmitErrorInline(e);
      setPhase('pay');
    }
  };

  const companyPlaceholder = useMemo(() => 'Company (if business shipper)', []);

  return (
    <Page className={css.root} title="Sign up as a Shipper">
      <div className={css.hero}>
        <H1 as="h1" rootClassName={css.headline}>
          Ship smarter with HaulSaver
        </H1>
        <p className={css.subhead}>
          Create your account to post shipments, compare bids, and manage deliveries in one place.
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
                <span className={css.stepNum}>2</span> Add shipping preferences
              </li>
              <li>
                <span className={css.stepNum}>3</span> Pay one-time activation fee ($10)
              </li>
              <li>
                <span className={css.stepNum}>4</span> Post a shipment & compare bids
              </li>
            </ol>
          </div>
        </section>

        {/* RIGHT: Form panel (or payment step) */}
        <section className={css.formPanel} aria-label="Shipper signup form">
          <div className={css.formCard}>
            {phase === 'form' && (
              <FinalForm
                mutators={{ ...arrayMutators }}
                onSubmit={onSubmitFormPhase}
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
                        label="Phone number"
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

                    {/* Shipping profile */}
                    <div className={css.twoCol}>
                      <FieldSelect
                        id="originRegion"
                        name="originRegion"
                        label="Where do you primarily ship from?"
                        validate={required('Please select a region')}
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
                        label="Cities/areas (comma-separated)"
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

                    {/* Submit -> proceeds to payment */}
                    <PrimaryButton
                      type="submit"
                      disabled={invalid || submitting}
                      className={css.submitBtn}
                    >
                      Continue to payment
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
            )}

            {phase === 'pay' && (
              <div className={css.paymentCard}>
                {submitErrorInline ? (
                  <div className={css.submitError}>{submitErrorInline.message}</div>
                ) : null}
                <RegistrationPayment
                  email={snapshot?.email}
                  userType="shipper"
                  onPaid={onPaid}
                  onError={setSubmitErrorInline}
                />
                <p className={css.backLinkWrap}>
                  <InlineTextButton onClick={() => setPhase('form')}>
                    ← Back to details
                  </InlineTextButton>
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Page>
  );
};

export default ShipperSignupPageComponent;
