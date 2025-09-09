// ===============================
// FILE: src/containers/ProviderSignupPage/ProviderSignupPage.js
// DESCRIPTION: Provider/Carrier signup with U.S. compliance attestations.
// ===============================
import React, { useMemo } from 'react';
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

import css from './ProviderSignupPage.module.css';

const VEHICLE_OPTIONS = [
  { key: 'pickup', label: 'Pickup (½–1 ton)' },
  { key: 'flatbed', label: 'Flatbed' },
  { key: 'box_truck', label: 'Box Truck (10–26ft)' },
  { key: 'step_deck', label: 'Step Deck' },
  { key: 'lowboy', label: 'Lowboy/Removable Gooseneck' },
  { key: 'car_hauler', label: 'Car Hauler' },
  { key: 'hotshot', label: 'Hotshot (Gooseneck/Dually)' },
  { key: 'van', label: 'Cargo Van' },
];

// U.S. operating scope (affects whether MC is required)
const AUTHORITY_SCOPE = [
  { key: 'interstate', label: 'Interstate (crosses state lines)' },
  { key: 'intrastate', label: 'Intrastate only (single state)' },
];

const REGION_OPTIONS = [
  { key: 'national', label: 'Nationwide' },
  { key: 'luzon', label: 'Luzon' },
  { key: 'visayas', label: 'Visayas' },
  { key: 'mindanao', label: 'Mindanao' },
  { key: 'custom', label: 'Custom (specify cities below)' },
];

// --- Conditional validators helpers
const required = msg => validators.required(msg);
const requiredIf = (msg, predicate) => (value, allValues) =>
  predicate(allValues) ? validators.required(msg)(value) : undefined;

const emailRequired = validators.required('Email is required');
const emailValid = validators.emailFormatValid('Enter a valid email');
const passwordMinLen = validators.minLength(8, 'Password must be at least 8 characters');
const passwordMaxLen = validators.maxLength(64, 'Password is too long');

// Predicates
const isInterstate = v => v?.authorityScope === 'interstate';
const saysHasUSDOT = v => !!v?.hasUSDOT;
const saysHasMC = v => !!v?.hasMC;
const needsMC = v => isInterstate(v) && saysHasMC(v);

export const ProviderSignupPageComponent = props => {
  const onSubmit = values => {
    const {
      email,
      password,
      givenName,
      familyName,
      phone,
      companyName,
      // existing
      dot_number,
      mc_number,
      vehicleType,
      serviceRegion,
      serviceCities,
      acceptTos,

      // NEW (US compliance)
      authorityScope,
      hasUSDOT,
      hasMC,
      autoLiabilityLimit,
      cargoLiabilityLimit,
      insuranceCarrierName,
      insurancePolicyExpires, // yyyy-mm-dd
      w9Attestation,
      consentBackgroundCheck,
      consentFMCSADataPull,
      agreeCarrierAgreement,
      hazmatEndorsement,
      eldCompliant,
    } = values;

    // Hard stops for required legal checkboxes
    if (!acceptTos) return { [FORM_ERROR]: 'Please accept the Terms of Service.' };
    if (!agreeCarrierAgreement) return { [FORM_ERROR]: 'Please accept the Carrier Agreement.' };
    if (!w9Attestation)
      return { [FORM_ERROR]: 'W-9 attestation is required for payouts/tax reporting.' };
    if (!consentBackgroundCheck) return { [FORM_ERROR]: 'FCRA consent is required to continue.' };
    if (!consentFMCSADataPull)
      return { [FORM_ERROR]: 'Consent to retrieve FMCSA safety/authority data is required.' };

    // Build profile payload
    const profile = {
      firstName: givenName,
      lastName: familyName,
      displayName: `${givenName} ${familyName}`.trim(),
      abbreviatedName: `${givenName?.[0] || ''}${familyName?.[0] || ''}`.toUpperCase(),
      publicData: {
        userType: 'provider',
        companyName,
        vehicleType,
        serviceRegion,
        serviceCities,

        // Keep legacy fields for backwards compatibility
        dot_number: dot_number || null,
        mc_number: mc_number || null,

        // Structured U.S. compliance block
        usCompliance: {
          authorityScope, // 'interstate' | 'intrastate'
          hasUSDOT: !!hasUSDOT,
          usdot_number: hasUSDOT ? dot_number || null : null,
          hasMC: !!hasMC,
          mc_number: hasMC ? mc_number || null : null,
          insurance: {
            autoLiabilityLimit: autoLiabilityLimit || null, // e.g. 1000000
            cargoLiabilityLimit: cargoLiabilityLimit || null, // e.g. 100000
            carrierName: insuranceCarrierName || null,
            policyExpires: insurancePolicyExpires || null, // ISO date
            attestMinAutoLiability750k: Number(autoLiabilityLimit || 0) >= 750000,
          },
          attestations: {
            w9Attestation: !!w9Attestation,
            consentBackgroundCheck: !!consentBackgroundCheck,
            consentFMCSADataPull: !!consentFMCSADataPull,
            eldCompliant: !!eldCompliant,
            hazmatEndorsement: !!hazmatEndorsement,
          },
        },
      },
      protectedData: {
        phone,
      },
    };

    const payload = { email, password, marketplace: 'flex', profile };
    return props.onSignup ? props.onSignup(payload) : Promise.resolve();
  };

  const companyPlaceholder = useMemo(() => 'Your company (optional if owner-operator)', []);

  return (
    <Page className={css.root} title="Become a Provider">
      <div className={css.hero}>
        <H1 as="h1" rootClassName={css.headline}>
          Become a Carrier on HaulSaver
        </H1>
        <p className={css.subhead}>
          Join and start bidding on shipments. U.S. compliance-ready signup with quick verification.
        </p>
      </div>

      <div className={css.pageGrid}>
        {/* LEFT: Marketing panel */}
        <section className={css.leftPanel} aria-label="Why join">
          <div className={css.benefitsCard}>
            <H3 rootClassName={css.cardTitle}>Why join</H3>
            <ul className={css.benefitsList}>
              <li>
                <IconCheckmark className={css.bulletIcon} /> No listing fees for carriers
              </li>
              <li>
                <IconCheckmark className={css.bulletIcon} /> Bid on loads that fit your route
              </li>
              <li>
                <IconCheckmark className={css.bulletIcon} /> Direct chat with shippers
              </li>
              <li>
                <IconCheckmark className={css.bulletIcon} /> Mobile-friendly job management
              </li>
            </ul>
          </div>

          <div className={css.stepsCard}>
            <H3 rootClassName={css.cardTitle}>How it works</H3>
            <ol className={css.stepsList}>
              <li>
                <span className={css.stepNum}>1</span> Create your free account
              </li>
              <li>
                <span className={css.stepNum}>2</span> Add truck & compliance details
              </li>
              <li>
                <span className={css.stepNum}>3</span> Verify documents (quick)
              </li>
              <li>
                <span className={css.stepNum}>4</span> Start bidding on shipments
              </li>
            </ol>
          </div>

          <div className={css.trustRow}>
            <div className={css.trustItem}>
              <IconReviewStar className={css.starIcon} /> Transparent reviews
            </div>
            <div className={css.trustItem}>
              <IconReviewStar className={css.starIcon} /> Secure payments
            </div>
            <div className={css.trustItem}>
              <IconReviewStar className={css.starIcon} /> 24/7 support
            </div>
          </div>
        </section>

        {/* RIGHT: Form panel */}
        <section className={css.formPanel} aria-label="Carrier signup form">
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
                      placeholder="John"
                      validate={required('First name is required')}
                    />
                    <FieldTextInput
                      id="familyName"
                      name="familyName"
                      type="text"
                      label="Last name"
                      placeholder="Doe"
                      validate={required('Last name is required')}
                    />
                  </div>

                  <FieldTextInput
                    id="companyName"
                    name="companyName"
                    type="text"
                    label="Company name"
                    placeholder={companyPlaceholder}
                  />

                  <div className={css.twoCol}>
                    <FieldPhoneNumberInput
                      id="phone"
                      name="phone"
                      label="Phone number"
                      placeholder="(555) 555-5555"
                    />
                    <FieldSelect
                      id="vehicleType"
                      name="vehicleType"
                      label="Primary vehicle type"
                      validate={required('Select your vehicle type')}
                    >
                      <option value="" disabled>
                        Select vehicle type
                      </option>
                      {VEHICLE_OPTIONS.map(o => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </FieldSelect>
                  </div>

                  {/* U.S. authority scope drives USDOT/MC requirements */}
                  <div className={css.twoCol}>
                    <FieldSelect
                      id="authorityScope"
                      name="authorityScope"
                      label="Operating authority scope (U.S.)"
                      validate={required('Select operating authority scope')}
                    >
                      <option value="" disabled>
                        Select scope
                      </option>
                      {AUTHORITY_SCOPE.map(o => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </FieldSelect>

                    <div className={css.checkboxStack}>
                      <FieldCheckbox id="hasUSDOT" name="hasUSDOT" label="I have a USDOT number" />
                      <FieldCheckbox
                        id="hasMC"
                        name="hasMC"
                        label="I have an MC number (for interstate)"
                      />
                    </div>
                  </div>

                  <div className={css.twoCol}>
                    <FieldTextInput
                      id="dot_number"
                      name="dot_number"
                      type="text"
                      label="USDOT Number"
                      placeholder="e.g., 1234567"
                      validate={requiredIf('USDOT number is required', v => saysHasUSDOT(v))}
                    />
                    <FieldTextInput
                      id="mc_number"
                      name="mc_number"
                      type="text"
                      label="MC Number"
                      placeholder="e.g., MC-123456"
                      validate={requiredIf('MC number is required for interstate carriers', v =>
                        needsMC(v)
                      )}
                    />
                  </div>

                  {/* Insurance attestations */}
                  <div className={css.twoCol}>
                    <FieldTextInput
                      id="autoLiabilityLimit"
                      name="autoLiabilityLimit"
                      type="number"
                      label="Auto liability coverage (USD)"
                      placeholder="e.g., 1000000"
                      validate={required('Auto liability coverage is required (min $750,000)')}
                    />
                    <FieldTextInput
                      id="cargoLiabilityLimit"
                      name="cargoLiabilityLimit"
                      type="number"
                      label="Cargo coverage (USD)"
                      placeholder="e.g., 100000"
                      validate={required('Cargo coverage amount is required')}
                    />
                  </div>

                  <div className={css.twoCol}>
                    <FieldTextInput
                      id="insuranceCarrierName"
                      name="insuranceCarrierName"
                      type="text"
                      label="Insurance carrier"
                      placeholder="e.g., Progressive, Great West, etc."
                      validate={required('Insurance carrier is required')}
                    />
                    <FieldTextInput
                      id="insurancePolicyExpires"
                      name="insurancePolicyExpires"
                      type="date"
                      label="Policy expiration date"
                      validate={required('Policy expiration date is required')}
                    />
                  </div>

                  {/* Safety/compliance toggles */}
                  <div className={css.twoCol}>
                    <FieldCheckbox
                      id="eldCompliant"
                      name="eldCompliant"
                      label="I am ELD/HOS compliant"
                    />
                    <FieldCheckbox
                      id="hazmatEndorsement"
                      name="hazmatEndorsement"
                      label="I have a HazMat endorsement"
                    />
                  </div>

                  {/* Operating geography (kept from original) */}
                  <div className={css.twoCol}>
                    <FieldSelect
                      id="serviceRegion"
                      name="serviceRegion"
                      label="Service region"
                      validate={required('Select a service region')}
                    >
                      <option value="" disabled>
                        Select region
                      </option>
                      {REGION_OPTIONS.map(o => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </FieldSelect>
                    <FieldTextInput
                      id="serviceCities"
                      name="serviceCities"
                      type="text"
                      label="Cities you serve (comma-separated)"
                      placeholder="e.g., Phoenix, Las Vegas, San Diego"
                    />
                  </div>

                  {/* Account credentials */}
                  <div className={css.twoCol}>
                    <FieldTextInput
                      id="email"
                      name="email"
                      type="email"
                      label="Email"
                      placeholder="you@company.com"
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

                  {/* Legal documents / consents */}
                  <div className={css.legalBlock}>
                    <FieldCheckbox
                      id="w9Attestation"
                      name="w9Attestation"
                      label={
                        <span>
                          I will submit a valid IRS{' '}
                          <a href="/docs/w9" target="_blank" rel="noreferrer">
                            Form W-9
                          </a>{' '}
                          (or W-8 if applicable) for tax reporting.
                        </span>
                      }
                    />
                    <FieldCheckbox
                      id="consentBackgroundCheck"
                      name="consentBackgroundCheck"
                      label={
                        <span>
                          I authorize a background/MVR screening in accordance with the{' '}
                          <a href="/legal/fcra-disclosure" target="_blank" rel="noreferrer">
                            FCRA disclosure
                          </a>{' '}
                          and{' '}
                          <a href="/legal/fcra-summary" target="_blank" rel="noreferrer">
                            Summary of Rights
                          </a>
                          .
                        </span>
                      }
                    />
                    <FieldCheckbox
                      id="consentFMCSADataPull"
                      name="consentFMCSADataPull"
                      label={
                        <span>
                          I consent to retrieve and use my FMCSA registration, safety, and authority
                          data.
                        </span>
                      }
                    />
                    <FieldCheckbox
                      id="agreeCarrierAgreement"
                      name="agreeCarrierAgreement"
                      label={
                        <span>
                          I agree to the{' '}
                          <a href="/legal/carrier-agreement" target="_blank" rel="noreferrer">
                            Carrier Agreement
                          </a>
                          .
                        </span>
                      }
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
                    Create provider account
                  </PrimaryButton>

                  <p className={css.altAction}>
                    Already have an account?{' '}
                    <InlineTextButton onClick={() => props.history.push('/login')}>
                      Log in
                    </InlineTextButton>
                  </p>

                  {/* Simple inline hint showing when MC becomes required */}
                  <p className={css.hint}>
                    {isInterstate(values)
                      ? 'Interstate carriers generally need MC authority and minimum $750,000 auto liability.'
                      : 'Intrastate-only carriers typically do not need MC authority (state rules may vary).'}
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

export default ProviderSignupPageComponent;
