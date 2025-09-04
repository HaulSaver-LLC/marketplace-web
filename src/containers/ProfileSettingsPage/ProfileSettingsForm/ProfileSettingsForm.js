import React, { Component } from 'react';
import { compose } from 'redux';
import { Field, Form as FinalForm } from 'react-final-form';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import arrayMutators from 'final-form-arrays';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { ensureCurrentUser } from '../../../util/data';
import * as validators from '../../../util/validators';
import { isUploadImageOverLimitError } from '../../../util/errors';
import { getPropsForCustomUserFieldInputs } from '../../../util/userHelpers';

import {
  Form,
  Avatar,
  Button,
  ImageFromFile,
  IconSpinner,
  FieldTextInput,
  H4,
  CustomExtendedDataField,
} from '../../../components';

import css from './ProfileSettingsForm.module.css';

const ACCEPT_IMAGES = 'image/*';
const UPLOAD_CHANGE_DELAY = 2000;

// Map a stored companyType (either a code like "dealer" or a translation id like
// "ProfileSettingsForm.companyType.dealer") to a human label.
const formatCompanyType = (type, intl) => {
  if (!type) return '—';

  // If the value is already an i18n id, translate it (with fallback to last segment)
  if (typeof type === 'string' && type.startsWith('ProfileSettingsForm.companyType.')) {
    const fallback = type.split('.').pop();
    return intl.formatMessage({ id: type, defaultMessage: fallback });
  }

  // Otherwise assume it's one of our codes
  const idMap = {
    dealer: 'ProfileSettingsForm.companyType.dealer',
    retailer: 'ProfileSettingsForm.companyType.retailer',
    warehouse: 'ProfileSettingsForm.companyType.warehouse',
    freightForwarder: 'ProfileSettingsForm.companyType.freightForwarder',
  };
  const id = idMap[type];
  return id ? intl.formatMessage({ id, defaultMessage: type }) : type;
};

const DisplayNameMaybe = props => {
  const { userTypeConfig, intl } = props;

  const isDisabled = userTypeConfig?.defaultUserFields?.displayName === false;
  if (isDisabled) return null;

  const isRequired = userTypeConfig?.displayNameSettings?.required === true;

  const validateMaybe = isRequired
    ? {
        validate: validators.required(
          intl.formatMessage({
            id: 'ProfileSettingsForm.displayNameRequired',
            defaultMessage: 'Display name is required',
          })
        ),
      }
    : {};

  return (
    <div className={css.sectionContainer}>
      <H4 as="h2" className={css.sectionTitle}>
        <FormattedMessage
          id="ProfileSettingsForm.displayNameHeading"
          defaultMessage="Your display name"
        />
      </H4>
      <FieldTextInput
        className={css.row}
        type="text"
        id="displayName"
        name="displayName"
        label={intl.formatMessage({
          id: 'ProfileSettingsForm.displayNameLabel',
          defaultMessage: 'Display name',
        })}
        placeholder={intl.formatMessage({
          id: 'ProfileSettingsForm.displayNamePlaceholder',
          defaultMessage: 'John Doe',
        })}
        {...validateMaybe}
      />
      <p className={css.extraInfo}>
        <FormattedMessage
          id="ProfileSettingsForm.displayNameInfo"
          defaultMessage="The display name defaults to first name plus initial of last name."
        />
      </p>
    </div>
  );
};

class ProfileSettingsFormComponent extends Component {
  constructor(props) {
    super(props);
    this.uploadDelayTimeoutId = null;
    this.state = { uploadDelay: false };
    this.submittedValues = {};
  }

  componentDidUpdate(prevProps) {
    if (prevProps.uploadInProgress && !this.props.uploadInProgress) {
      this.setState({ uploadDelay: true });
      this.uploadDelayTimeoutId = window.setTimeout(() => {
        this.setState({ uploadDelay: false });
      }, UPLOAD_CHANGE_DELAY);
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.uploadDelayTimeoutId);
  }

  render() {
    return (
      <FinalForm
        {...this.props}
        mutators={{ ...arrayMutators }}
        render={fieldRenderProps => {
          const {
            className,
            currentUser,
            handleSubmit,
            intl,
            invalid,
            onImageUpload,
            pristine,
            profileImage,
            rootClassName,
            updateInProgress,
            updateProfileError,
            uploadImageError,
            uploadInProgress,
            form,
            formId,
            marketplaceName,
            values,
            userFields,
            userTypeConfig,
          } = fieldRenderProps;

          const user = ensureCurrentUser(currentUser);

          // Labels with safe fallbacks
          const firstNameLabel = intl.formatMessage({
            id: 'ProfileSettingsForm.firstNameLabel',
            defaultMessage: 'First name',
          });
          const firstNamePlaceholder = intl.formatMessage({
            id: 'ProfileSettingsForm.firstNamePlaceholder',
            defaultMessage: 'Your first name',
          });
          const firstNameRequired = validators.required(
            intl.formatMessage({
              id: 'ProfileSettingsForm.firstNameRequired',
              defaultMessage: 'First name is required',
            })
          );

          const lastNameLabel = intl.formatMessage({
            id: 'ProfileSettingsForm.lastNameLabel',
            defaultMessage: 'Last name',
          });
          const lastNamePlaceholder = intl.formatMessage({
            id: 'ProfileSettingsForm.lastNamePlaceholder',
            defaultMessage: 'Your last name',
          });
          const lastNameRequired = validators.required(
            intl.formatMessage({
              id: 'ProfileSettingsForm.lastNameRequired',
              defaultMessage: 'Last name is required',
            })
          );

          const bioLabel = intl.formatMessage({
            id: 'ProfileSettingsForm.bioLabel',
            defaultMessage: 'Bio',
          });
          const bioPlaceholder = intl.formatMessage({
            id: 'ProfileSettingsForm.bioPlaceholder',
            defaultMessage: 'Tell us a little bit about yourself…',
          });

          // Read-only company data (from values/publicData)
          const accountType = values?.accountType || values?.publicData?.accountType || '';
          const isCompany = accountType === 'company';
          const companyName = values?.companyName || values?.publicData?.companyName || '';
          const companyType = values?.companyType || values?.publicData?.companyType || '';
          const taxId = values?.taxId || values?.publicData?.taxId || '';
          const businessRegistrationNumber =
            values?.businessRegistrationNumber ||
            values?.publicData?.businessRegistrationNumber ||
            '';

          const uploadingOverlay =
            uploadInProgress || this.state.uploadDelay ? (
              <div className={css.uploadingImageOverlay}>
                <IconSpinner />
              </div>
            ) : null;

          const hasUploadError = !!uploadImageError && !uploadInProgress;
          const errorClasses = classNames({ [css.avatarUploadError]: hasUploadError });
          const transientUserProfileImage = profileImage.uploadedImage || user.profileImage;
          const transientUser = { ...user, profileImage: transientUserProfileImage };

          const fileExists = !!profileImage.file;
          const fileUploadInProgress = uploadInProgress && fileExists;
          const delayAfterUpload = profileImage.imageId && this.state.uploadDelay;

          const imageFromFile =
            fileExists && (fileUploadInProgress || delayAfterUpload) ? (
              <ImageFromFile
                id={profileImage.id}
                className={errorClasses}
                rootClassName={css.uploadingImage}
                aspectWidth={1}
                aspectHeight={1}
                file={profileImage.file}
              >
                {uploadingOverlay}
              </ImageFromFile>
            ) : null;

          const avatarClasses = classNames(errorClasses, css.avatar, {
            [css.avatarInvisible]: this.state.uploadDelay,
          });
          const avatarComponent =
            !fileUploadInProgress && profileImage.imageId ? (
              <Avatar
                className={avatarClasses}
                renderSizes="(max-width: 767px) 96px, 240px"
                user={transientUser}
                disableProfileLink
              />
            ) : null;

          const chooseAvatarLabel =
            profileImage.imageId || fileUploadInProgress ? (
              <div className={css.avatarContainer}>
                {imageFromFile}
                {avatarComponent}
                <div className={css.changeAvatar}>
                  <FormattedMessage
                    id="ProfileSettingsForm.changeAvatar"
                    defaultMessage="Change picture"
                  />
                </div>
              </div>
            ) : (
              <div className={css.avatarPlaceholder}>
                <div className={css.avatarPlaceholderText}>
                  <FormattedMessage
                    id="ProfileSettingsForm.addYourProfilePicture"
                    defaultMessage="Add your profile picture"
                  />
                </div>
                <div className={css.avatarPlaceholderTextMobile}>
                  <FormattedMessage
                    id="ProfileSettingsForm.addYourProfilePictureMobile"
                    defaultMessage="Add your profile picture"
                  />
                </div>
              </div>
            );

          const submitError = updateProfileError ? (
            <div className={css.error}>
              <FormattedMessage
                id="ProfileSettingsForm.updateProfileFailed"
                defaultMessage="Updating profile failed"
              />
            </div>
          ) : null;

          const classes = classNames(rootClassName || css.root, className);
          const submitInProgress = updateInProgress;
          const submittedOnce = Object.keys(this.submittedValues).length > 0;
          const pristineSinceLastSubmit = submittedOnce && isEqual(values, this.submittedValues);
          const submitDisabled =
            invalid || pristine || pristineSinceLastSubmit || uploadInProgress || submitInProgress;

          const userFieldProps = getPropsForCustomUserFieldInputs(
            userFields,
            intl,
            userTypeConfig?.userType,
            false
          );

          return (
            <Form
              className={classes}
              onSubmit={e => {
                this.submittedValues = values;
                handleSubmit(e);
              }}
            >
              {/* Avatar */}
              <div className={css.sectionContainer}>
                <H4 as="h2" className={css.sectionTitle}>
                  <FormattedMessage
                    id="ProfileSettingsForm.yourProfilePicture"
                    defaultMessage="Your profile picture"
                  />
                </H4>
                <Field
                  accept={ACCEPT_IMAGES}
                  id="profileImage"
                  name="profileImage"
                  label={chooseAvatarLabel}
                  type="file"
                  form={null}
                  uploadImageError={uploadImageError}
                  disabled={uploadInProgress}
                >
                  {fieldProps => {
                    const { accept, id, input, label, disabled, uploadImageError } = fieldProps;
                    const { name, type } = input;
                    const onChange = e => {
                      const file = e.target.files[0];
                      form.change(`profileImage`, file);
                      form.blur(`profileImage`);
                      if (file != null) {
                        const tempId = `${file.name}_${Date.now()}`;
                        onImageUpload({ id: tempId, file });
                      }
                    };

                    let error = null;
                    if (isUploadImageOverLimitError(uploadImageError)) {
                      error = (
                        <div className={css.error}>
                          <FormattedMessage
                            id="ProfileSettingsForm.imageUploadFailedFileTooLarge"
                            defaultMessage="Image is too large"
                          />
                        </div>
                      );
                    } else if (uploadImageError) {
                      error = (
                        <div className={css.error}>
                          <FormattedMessage
                            id="ProfileSettingsForm.imageUploadFailed"
                            defaultMessage="Image upload failed"
                          />
                        </div>
                      );
                    }

                    return (
                      <div className={css.uploadAvatarWrapper}>
                        <label className={css.label} htmlFor={id}>
                          {label}
                        </label>
                        <input
                          accept={accept}
                          id={id}
                          name={name}
                          className={css.uploadAvatarInput}
                          disabled={disabled}
                          onChange={onChange}
                          type={type}
                        />
                        {error}
                      </div>
                    );
                  }}
                </Field>
                <div className={css.tip}>
                  <FormattedMessage
                    id="ProfileSettingsForm.tip"
                    defaultMessage="Use a clear, square image."
                  />
                </div>
                <div className={css.fileInfo}>
                  <FormattedMessage
                    id="ProfileSettingsForm.fileInfo"
                    defaultMessage="JPG, PNG, or GIF"
                  />
                </div>
              </div>

              {/* Name */}
              <div className={css.sectionContainer}>
                <H4 as="h2" className={css.sectionTitle}>
                  <FormattedMessage id="ProfileSettingsForm.yourName" defaultMessage="Your name" />
                </H4>
                <div className={css.nameContainer}>
                  <FieldTextInput
                    className={css.firstName}
                    type="text"
                    id="firstName"
                    name="firstName"
                    label={firstNameLabel}
                    placeholder={firstNamePlaceholder}
                    validate={firstNameRequired}
                  />
                  <FieldTextInput
                    className={css.lastName}
                    type="text"
                    id="lastName"
                    name="lastName"
                    label={lastNameLabel}
                    placeholder={lastNamePlaceholder}
                    validate={lastNameRequired}
                  />
                </div>
              </div>

              {/* Display name (maybe) */}
              <DisplayNameMaybe userTypeConfig={userTypeConfig} intl={intl} />

              {/* READ-ONLY Company info */}
              {isCompany ? (
                <div className={css.sectionContainer}>
                  <H4 as="h2" className={css.sectionTitle}>
                    <FormattedMessage
                      id="ProfileSettingsForm.companySectionHeading"
                      defaultMessage="Company information"
                    />
                  </H4>

                  <div className={css.row}>
                    <strong>
                      {intl.formatMessage({
                        id: 'ProfileSettingsForm.companyNameLabel',
                        defaultMessage: 'Company name',
                      })}
                      :
                    </strong>{' '}
                    <span>{companyName || '—'}</span>
                  </div>

                  <div className={css.row}>
                    <strong>
                      {intl.formatMessage({
                        id: 'ProfileSettingsForm.companyTypeLabel',
                        defaultMessage: 'Company type',
                      })}
                      :
                    </strong>{' '}
                    <span>{formatCompanyType(companyType, intl)}</span>
                  </div>

                  <div className={css.row}>
                    <strong>
                      {intl.formatMessage({
                        id: 'ProfileSettingsForm.taxIdLabel',
                        defaultMessage: 'Tax ID',
                      })}
                      :
                    </strong>{' '}
                    <span>{taxId || '—'}</span>
                  </div>

                  <div className={css.row}>
                    <strong>
                      {intl.formatMessage({
                        id: 'ProfileSettingsForm.businessRegNoLabel',
                        defaultMessage: 'Business registration number',
                      })}
                      :
                    </strong>{' '}
                    <span>{businessRegistrationNumber || '—'}</span>
                  </div>
                </div>
              ) : null}

              {/* Bio */}
              <div className={classNames(css.sectionContainer)}>
                <H4 as="h2" className={css.sectionTitle}>
                  <FormattedMessage
                    id="ProfileSettingsForm.bioHeading"
                    defaultMessage="Your profile bio"
                  />
                </H4>
                <FieldTextInput
                  type="textarea"
                  id="bio"
                  name="bio"
                  label={bioLabel}
                  placeholder={bioPlaceholder}
                />
                <p className={css.extraInfo}>
                  <FormattedMessage
                    id="ProfileSettingsForm.bioInfo"
                    defaultMessage="Tell others more about yourself on {marketplaceName}."
                    values={{ marketplaceName }}
                  />
                </p>
              </div>

              {/* Custom configured user fields */}
              <div className={classNames(css.sectionContainer, css.lastSection)}>
                {userFieldProps.map(({ key, ...fieldProps }) => (
                  <CustomExtendedDataField key={key} {...fieldProps} formId={formId} />
                ))}
              </div>

              {submitError}
              <Button
                className={css.submitButton}
                type="submit"
                inProgress={submitInProgress}
                disabled={submitDisabled}
                ready={pristineSinceLastSubmit}
              >
                <FormattedMessage
                  id="ProfileSettingsForm.saveChanges"
                  defaultMessage="Save changes"
                />
              </Button>
            </Form>
          );
        }}
      />
    );
  }
}

ProfileSettingsFormComponent.defaultProps = {
  uploadImageError: null,
  updateProfileError: null,
  profileImage: {},
  userTypeConfig: null,
};

ProfileSettingsFormComponent.propTypes = {
  intl: intlShape.isRequired,
};

const ProfileSettingsForm = compose(injectIntl)(ProfileSettingsFormComponent);
ProfileSettingsForm.displayName = 'ProfileSettingsForm';

export default ProfileSettingsForm;
