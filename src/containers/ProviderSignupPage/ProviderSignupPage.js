// ===============================
// FILE: src/containers/ProviderSignupPage/ProviderSignupPage.js
// DESCRIPTION: U.S.-ONLY Provider/Carrier signup with FMCSA-focused compliance checks.
// NOTE: After successful signup, this redirects to /register/payment
//       for the $4.99 registration fee (Stripe Payment Intent flow).
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

import css from './ProviderSignupPage.module.css';

// ---------- Constants ----------
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
  { key: 'interstate', label: 'Interstate (crosses state lines, MC authority required)' },
  { key: 'intrastate', label: 'Intrastate only (single state)' },
];

// U.S. service area choices
const US_SERVICE_AREA = [
  { key: 'nationwide', label: 'Nationwide (all U.S. states)' },
  { key: 'contiguous', label: 'Contiguous U.S. (lower 48)' },
  { key: 'specific_states', label: 'Specific states (enter 2-letter codes)' },
];

// Acceptable 2-letter state/territory codes (all caps)
const US_STATE_CODES = new Set([
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  // territories (optional – keep if you service)
  'DC',
  'PR',
  'GU',
  'VI',
  'AS',
  'MP',
]);

// ---------- Local validator helpers ----------
const required = msg => validators.required(msg);
const requiredIf = (msg, predicate) => (value, allValues) =>
  predicate(allValues) ? validators.required(msg)(value) : undefined;

const emailRequired = validators.required('Email is required');
const emailValid = validators.emailFormatValid('Enter a valid email');
const passwordMinLen = validators.minLength(8, 'Password must be at least 8 characters');
const passwordMaxLen = validators.maxLength(64, 'Password is too long');

// Cross-field predicates
const isInterstate = v => v?.authorityScope === 'interstate';
const saysHasUSDOT = v => !!v?.hasUSDOT;
const saysHasMC = v => !!v?.hasMC;
const needsMC = v => isInterstate(v) && (!!v?.hasMC || true); // interstate implies MC required

// DOT must be 6–8 digits (FMCSA range varies; accept 6–8)
const dotPattern = /^\d{6,8}$/;
// MC numbers are typically 6–7 digits; accept with or without "MC-" prefix
const mcPattern = /^(MC-)?\d{6,7}$/;

// Numeric minimums
const MIN_AUTO_LIAB = 750000;
const MIN_CARGO_LIAB = 100000;

// Helpers
const onlyDigits = s => (s || '').replace(/\D+/g, '');
const parseStatesCSV = s =>
  (s || '')
    .toUpperCase()
    .split(/[\s,;/]+/)
    .filter(Boolean);

// ---------- Form-level validation for U.S. compliance ----------
const validateForm = values => {
  const errors = {};

  // Interstate requires MC authority + number
  if (isInterstate(values)) {
    if (!values.hasMC) {
      errors.hasMC = 'Interstate carriers must have MC authority.';
    }
    const mcRaw = (values.mc_number || '').toUpperCase();
    const mcNorm = mcRaw.startsWith('MC-') ? mcRaw : `MC-${onlyDigits(mcRaw)}`;
    if (!mcPattern.test(mcNorm)) {
      errors.mc_number = 'Enter a valid MC (e.g., MC-123456).';
    }
  }

  // DOT number format if user says they have one
  if (saysHasUSDOT(values)) {
    const d = onlyDigits(values.dot_number);
    if (!dotPattern.test(d)) {
      errors.dot_number = 'Enter a valid USDOT (6–8 digits).';
    }
  }

  // Insurance minimums
  const auto = Number(values.autoLiabilityLimit || 0);
  const cargo = Number(values.cargoLiabilityLimit || 0);
  if (auto && auto < MIN_AUTO_LIAB) {
    errors.autoLiabilityLimit = `Auto liability must be at least $${MIN_AUTO_LIAB.toLocaleString()}.`;
  }
  if (cargo && cargo < MIN_CARGO_LIAB) {
    errors.cargoLiabilityLimit = `Cargo coverage must be at least $${MIN_CARGO_LIAB.toLocaleString()}.`;
  }

  // Policy expiration cannot be in the past
  if (values.insurancePolicyExpires) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(values.insurancePolicyExpires);
    if (exp < today) {
      errors.insurancePolicyExpires = 'Policy expiration date cannot be in the past.';
    }
  }

  // If specific states selected, require valid 2-letter codes
  if (values.serviceArea === 'specific_states') {
    const codes = parseStatesCSV(values.serviceStates);
    if (!codes.length) {
      errors.serviceStates = 'Enter at least one 2-letter state code (e.g., AZ, NM, TX).';
    } else {
      const invalid = codes.filter(c => !US_STATE_CODES.has(c));
      if (invalid.length) {
        errors.serviceStates = `Invalid state codes: ${invalid.join(
          ', '
        )}. Use 2-letter codes like CA, NV.`;
      }
    }
  }

  return errors;
};

export const ProviderSignupPageComponent = props => {
  const onSubmit = async values => {
    const {
      email,
      password,
      givenName,
      familyName,
      phone,
      companyName,

      // Compliance & ops
      dot_number,
      mc_number,
      vehicleType,
      serviceArea, // 'nationwide' | 'contiguous' | 'specific_states'
      serviceStates, // CSV list if specific_states
      acceptTos,

      // U.S. compliance fields
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

    // Normalize MC for storage if provided
    const mcRaw = (mc_number || '').toUpperCase();
    const mcNorm = mcRaw ? (mcRaw.startsWith('MC-') ? mcRaw : `MC-${onlyDigits(mcRaw)}`) : null;

    // Derive service region text for display, keep structured fields
    let serviceRegionLabel = 'Nationwide (US)';
    let serviceCities = null;
    if (serviceArea === 'contiguous') {
      serviceRegionLabel = 'Contiguous U.S. (Lower 48)';
    } else if (serviceArea === 'specific_states') {
      const codes = parseStatesCSV(serviceStates).join(', ');
      serviceRegionLabel = 'Specific states';
      serviceCities = codes; // reuse same public field label (kept for backwards compatibility in template)
    }

    // Build profile payload
    const profile = {
      firstName: givenName,
      lastName: familyName,
      displayName: `${givenName} ${familyName}`.trim(),
      abbreviatedName: `${(givenName || '').slice(0, 1)}${(familyName || '').slice(
        0,
        1
      )}`.toUpperCase(),
      publicData: {
        userType: 'provider',
        companyName,
        vehicleType,

        // Back-compat fields that some components expect:
        serviceRegion: serviceRegionLabel,
        serviceCities, // comma-separated 2-letter codes if specific

        // Legacy DOT/MC mirrors (keep)
        dot_number: dot_number || null,
        mc_number: mcNorm,

        // Structured U.S. compliance block
        usCompliance: {
          authorityScope, // 'interstate' | 'intrastate'
          hasUSDOT: !!hasUSDOT,
          usdot_number: hasUSDOT ? dot_number || null : null,
          hasMC: !!hasMC || isInterstate(values), // interstate implies MC
          mc_number: hasMC || isInterstate(values) ? mcNorm : null,
          insurance: {
            autoLiabilityLimit: autoLiabilityLimit || null, // e.g. 1000000
            cargoLiabilityLimit: cargoLiabilityLimit || null, // e.g. 100000
            carrierName: insuranceCarrierName || null,
            policyExpires: insurancePolicyExpires || null, // ISO date
            attestMinAutoLiability750k: Number(autoLiabilityLimit || 0) >= MIN_AUTO_LIAB,
          },
          attestations: {
            w9Attestation: !!w9Attestation,
            consentBackgroundCheck: !!consentBackgroundCheck,
            consentFMCSADataPull: !!consentFMCSADataPull,
            eldCompliant: !!eldCompliant,
            hazmatEndorsement: !!hazmatEndorsement,
          },
          serviceArea: {
            type: serviceArea, // 'nationwide' | 'contiguous' | 'specific_states'
            states: serviceArea === 'specific_states' ? parseStatesCSV(serviceStates) : null,
          },
        },
      },
      protectedData: {
        phone,
      },
    };

    // Sharetribe signup payload
    const payload = { email, password, marketplace: 'flex', profile };

    try {
      // onSignup should create the user + authenticate the session
      if (props.onSignup) {
        await props.onSignup(payload);
      }
      // After successful signup -> go to payment step
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

  const companyPlaceholder = useMemo(() => 'Your company (optional if owner-operator)', []);

  return (
    <Page className={css.root} title="Become a Provider (U.S.)">
      <div className={css.hero}>
        <H1 as="h1" rootClassName={css.headline}>
          Become a Carrier on HaulSaver (U.S.)
        </H1>
        <p className={css.subhead}>
          U.S.-only signup with FMCSA-focused compliance checks and quick verification.
          <br />
          <strong>Note:</strong> A one-time <strong>$4.99 registration fee</strong> is required
          right after signup to continue to verification.
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
                <span className={css.stepNum}>2</span> Add truck &amp; U.S. compliance details
              </li>
              <li>
                <span className={css.stepNum}>3</span> Pay the one-time $4.99 fee &amp; verify docs
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
        <section className={css.formPanel} aria-label="U.S. carrier signup form">
          <div className={css.formCard}>
            <FinalForm
              mutators={{ ...arrayMutators }}
              validate={validateForm}
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
                      label="Phone number (U.S.)"
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
                        label="I have an MC number (required for interstate)"
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
                        isInterstate(v)
                      )}
                    />
                  </div>

                  {/* Insurance attestations (U.S. FMCSA minimums) */}
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

                  {/* U.S. Operating geography */}
                  <div className={css.twoCol}>
                    <FieldSelect
                      id="serviceArea"
                      name="serviceArea"
                      label="Service area (U.S.)"
                      validate={required('Select a service area')}
                    >
                      <option value="" disabled>
                        Select service area
                      </option>
                      {US_SERVICE_AREA.map(o => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </FieldSelect>

                    <FieldTextInput
                      id="serviceStates"
                      name="serviceStates"
                      type="text"
                      label="States (2-letter codes, comma-separated)"
                      placeholder="e.g., CA, NV, AZ"
                      validate={requiredIf(
                        'Enter at least one state code (e.g., CA, NV, AZ)',
                        v => v?.serviceArea === 'specific_states'
                      )}
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

                  {/* Legal documents / consents (U.S.) */}
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
                    {submitting ? 'Creating account…' : 'Create provider account'}
                  </PrimaryButton>

                  <p className={css.altAction}>
                    Already have an account?{' '}
                    <InlineTextButton onClick={() => props.history.push('/login')}>
                      Log in
                    </InlineTextButton>
                  </p>

                  {/* U.S.-specific hinting */}
                  <p className={css.hint}>
                    {isInterstate(values)
                      ? 'Interstate carriers must have MC authority and at least $750,000 auto liability.'
                      : 'Intrastate-only carriers may not require MC authority (state rules vary).'}
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

export default withRouter(ProviderSignupPageComponent);
