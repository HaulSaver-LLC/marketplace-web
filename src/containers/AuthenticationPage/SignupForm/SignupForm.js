import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';
import { getPropsForCustomUserFieldInputs } from '../../../util/userHelpers';

import {
  Form,
  PrimaryButton,
  FieldTextInput,
  CustomExtendedDataField,
  FieldSelect,
} from '../../../components';

import FieldSelectUserType from '../FieldSelectUserType';
import UserFieldDisplayName from '../UserFieldDisplayName';
import UserFieldPhoneNumber from '../UserFieldPhoneNumber';

import css from './SignupForm.module.css';

const getSoleUserTypeMaybe = userTypes =>
  Array.isArray(userTypes) && userTypes.length === 1 ? userTypes[0].userType : null;

const SignupFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    initialValues={{
      userType: props.preselectedUserType || getSoleUserTypeMaybe(props.userTypes),
      accountType: '', // ensure controlled select
    }}
    render={formRenderProps => {
      const {
        rootClassName,
        className,
        formId,
        handleSubmit,
        inProgress,
        invalid,
        intl,
        termsAndConditions,
        preselectedUserType,
        userTypes,
        userFields,
        values,
      } = formRenderProps;

      const { userType } = values || {};
      const accountType = values?.accountType;
      const isCompany = accountType === 'company';

      // email
      const emailRequired = validators.required(
        intl.formatMessage({ id: 'SignupForm.emailRequired' })
      );
      const emailValid = validators.emailFormatValid(
        intl.formatMessage({ id: 'SignupForm.emailInvalid' })
      );

      // password
      const passwordRequiredMessage = intl.formatMessage({ id: 'SignupForm.passwordRequired' });
      const passwordMinLengthMessage = intl.formatMessage(
        { id: 'SignupForm.passwordTooShort' },
        { minLength: validators.PASSWORD_MIN_LENGTH }
      );
      const passwordMaxLengthMessage = intl.formatMessage(
        { id: 'SignupForm.passwordTooLong' },
        { maxLength: validators.PASSWORD_MAX_LENGTH }
      );
      const passwordMinLength = validators.minLength(
        passwordMinLengthMessage,
        validators.PASSWORD_MIN_LENGTH
      );
      const passwordMaxLength = validators.maxLength(
        passwordMaxLengthMessage,
        validators.PASSWORD_MAX_LENGTH
      );
      const passwordRequired = validators.requiredStringNoTrim(passwordRequiredMessage);
      const passwordValidators = validators.composeValidators(
        passwordRequired,
        passwordMinLength,
        passwordMaxLength
      );

      // Custom user fields
      const userFieldProps = getPropsForCustomUserFieldInputs(userFields, intl, userType);
      const noUserTypes = !userType && !(userTypes?.length > 0);
      const userTypeConfig = userTypes.find(config => config.userType === userType);
      const showDefaultUserFields = userType || noUserTypes;
      const showCustomUserFields = (userType || noUserTypes) && userFieldProps?.length > 0;

      const classes = classNames(rootClassName || css.root, className);
      const submitInProgress = inProgress;
      const submitDisabled = invalid || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldSelectUserType
            name="userType"
            userTypes={userTypes}
            hasExistingUserType={!!preselectedUserType}
            intl={intl}
          />

          {/* Account Type */}
          <FieldSelect
            className={css.row}
            id={formId ? `${formId}.accountType` : 'accountType'}
            name="accountType"
            label={intl.formatMessage({ id: 'SignupForm.accountTypeLabel' })}
            placeholder={intl.formatMessage({ id: 'SignupForm.accountTypePlaceholder' })}
            validate={validators.required(
              intl.formatMessage({ id: 'SignupForm.accountTypeRequired' })
            )}
          >
            <option value="" disabled>
              {intl.formatMessage({ id: 'SignupForm.accountTypePlaceholder' })}
            </option>
            <option value="individual">
              {intl.formatMessage({ id: 'SignupForm.accountType.individual' })}
            </option>
            <option value="company">
              {intl.formatMessage({ id: 'SignupForm.accountType.company' })}
            </option>
          </FieldSelect>

          {showDefaultUserFields ? (
            <div className={css.defaultUserFields}>
              <FieldTextInput
                type="email"
                id={formId ? `${formId}.email` : 'email'}
                name="email"
                autoComplete="email"
                label={intl.formatMessage({ id: 'SignupForm.emailLabel' })}
                placeholder={intl.formatMessage({ id: 'SignupForm.emailPlaceholder' })}
                validate={validators.composeValidators(emailRequired, emailValid)}
              />
              <div className={css.name}>
                <FieldTextInput
                  className={css.firstNameRoot}
                  type="text"
                  id={formId ? `${formId}.fname` : 'fname'}
                  name="fname"
                  autoComplete="given-name"
                  label={intl.formatMessage({ id: 'SignupForm.firstNameLabel' })}
                  placeholder={intl.formatMessage({ id: 'SignupForm.firstNamePlaceholder' })}
                  validate={validators.required(
                    intl.formatMessage({ id: 'SignupForm.firstNameRequired' })
                  )}
                />
                <FieldTextInput
                  className={css.lastNameRoot}
                  type="text"
                  id={formId ? `${formId}.lname` : 'lname'}
                  name="lname"
                  autoComplete="family-name"
                  label={intl.formatMessage({ id: 'SignupForm.lastNameLabel' })}
                  placeholder={intl.formatMessage({ id: 'SignupForm.lastNamePlaceholder' })}
                  validate={validators.required(
                    intl.formatMessage({ id: 'SignupForm.lastNameRequired' })
                  )}
                />
              </div>

              <UserFieldDisplayName
                formName="SignupForm"
                className={css.row}
                userTypeConfig={userTypeConfig}
                intl={intl}
              />

              <FieldTextInput
                className={css.password}
                type="password"
                id={formId ? `${formId}.password` : 'password'}
                name="password"
                autoComplete="new-password"
                label={intl.formatMessage({ id: 'SignupForm.passwordLabel' })}
                placeholder={intl.formatMessage({ id: 'SignupForm.passwordPlaceholder' })}
                validate={passwordValidators}
              />

              <UserFieldPhoneNumber
                formName="SignupForm"
                className={css.row}
                userTypeConfig={userTypeConfig}
                intl={intl}
              />

              {/* Company-only fields */}
              {isCompany ? (
                <div className={css.companyFields}>
                  <FieldTextInput
                    className={css.row}
                    type="text"
                    id={formId ? `${formId}.companyName` : 'companyName'}
                    name="companyName"
                    autoComplete="organization"
                    label={intl.formatMessage({ id: 'SignupForm.companyNameLabel' })}
                    placeholder={intl.formatMessage({ id: 'SignupForm.companyNamePlaceholder' })}
                    validate={validators.required(
                      intl.formatMessage({ id: 'SignupForm.companyNameRequired' })
                    )}
                  />

                  <FieldSelect
                    className={css.row}
                    id={formId ? `${formId}.companyType` : 'companyType'}
                    name="companyType"
                    label={intl.formatMessage({ id: 'SignupForm.companyTypeLabel' })}
                    placeholder={intl.formatMessage({ id: 'SignupForm.companyTypePlaceholder' })}
                    validate={validators.required(
                      intl.formatMessage({ id: 'SignupForm.companyTypeRequired' })
                    )}
                  >
                    <option value="" disabled>
                      {intl.formatMessage({ id: 'SignupForm.companyTypePlaceholder' })}
                    </option>
                    <option value="dealer">
                      {intl.formatMessage({ id: 'SignupForm.companyType.dealer' })}
                    </option>
                    <option value="retailer">
                      {intl.formatMessage({ id: 'SignupForm.companyType.retailer' })}
                    </option>
                    <option value="warehouse">
                      {intl.formatMessage({ id: 'SignupForm.companyType.warehouse' })}
                    </option>
                    <option value="freightForwarder">
                      {intl.formatMessage({ id: 'SignupForm.companyType.freightForwarder' })}
                    </option>
                  </FieldSelect>

                  <FieldTextInput
                    className={css.row}
                    type="text"
                    id={formId ? `${formId}.taxId` : 'taxId'}
                    name="taxId"
                    autoComplete="off"
                    label={intl.formatMessage({ id: 'SignupForm.taxIdLabel' })}
                    placeholder={intl.formatMessage({ id: 'SignupForm.taxIdPlaceholder' })}
                    validate={validators.required(
                      intl.formatMessage({ id: 'SignupForm.taxIdRequired' })
                    )}
                  />

                  <FieldTextInput
                    className={css.row}
                    type="text"
                    id={
                      formId ? `${formId}.businessRegistrationNumber` : 'businessRegistrationNumber'
                    }
                    name="businessRegistrationNumber"
                    autoComplete="off"
                    label={intl.formatMessage({ id: 'SignupForm.businessRegNoLabel' })}
                    placeholder={intl.formatMessage({ id: 'SignupForm.businessRegNoPlaceholder' })}
                    validate={validators.required(
                      intl.formatMessage({ id: 'SignupForm.businessRegNoRequired' })
                    )}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {showCustomUserFields ? (
            <div className={css.customFields}>
              {userFieldProps.map(({ key, ...fieldProps }) => (
                <CustomExtendedDataField key={key} {...fieldProps} formId={formId} />
              ))}
            </div>
          ) : null}

          <div className={css.bottomWrapper}>
            {termsAndConditions}
            <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
              <FormattedMessage id="SignupForm.signUp" />
            </PrimaryButton>
          </div>
        </Form>
      );
    }}
  />
);

/**
 * A component that renders the signup form.
 */
const SignupForm = props => {
  const intl = useIntl();
  return <SignupFormComponent {...props} intl={intl} />;
};

export default SignupForm;
