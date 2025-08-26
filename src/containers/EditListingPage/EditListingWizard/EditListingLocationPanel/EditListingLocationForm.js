import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { Field } from 'react-final-form';
import { required } from '../../../../util/validators';
import { FieldLocationInput } from '../../../../components'; // Mapbox geocoder field you added

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import {
  autocompleteSearchRequired,
  autocompletePlaceSelected,
  composeValidators,
} from '../../../../util/validators';

// Import shared components
import {
  Form,
  FieldLocationAutocompleteInput,
  Button,
  FieldTextInput,
} from '../../../../components';

// Import modules from this directory
import css from './EditListingLocationForm.module.css';

const identity = v => v;

/**
 * The EditListingLocationForm component.
 */
export const EditListingLocationForm = props => (
  <FinalForm
    {...props}
    render={formRenderProps => {
      const {
        formId = 'EditListingLocationForm',
        autoFocus,
        className,
        rootClassName,
        disabled,
        ready,
        handleSubmit,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress = false,
        fetchErrors,
        values,
      } = formRenderProps;

      const intl = useIntl();
      const addressRequiredMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressRequired',
      });
      const addressNotRecognizedMessage = intl.formatMessage({
        id: 'EditListingLocationForm.addressNotRecognized',
      });
      const optionalText = intl.formatMessage({
        id: 'EditListingLocationForm.optionalText',
      });

      const { updateListingError, showListingsError } = fetchErrors || {};

      const classes = classNames(rootClassName || css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingLocationForm.updateFailed" />
            </p>
          ) : null}

          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingLocationForm.showListingFailed" />
            </p>
          ) : null}

          {/* Default single "Location" field (kept as-is; powers default location & search) */}
          <FieldLocationAutocompleteInput
            rootClassName={css.locationAddress}
            inputClassName={css.locationAutocompleteInput}
            iconClassName={css.locationAutocompleteInputIcon}
            predictionsClassName={css.predictionsRoot}
            validClassName={css.validLocation}
            autoFocus={autoFocus}
            name="location"
            label={intl.formatMessage({ id: 'EditListingLocationForm.address' })}
            placeholder={intl.formatMessage({
              id: 'EditListingLocationForm.addressPlaceholder',
            })}
            useDefaultPredictions={false}
            format={identity}
            valueFromForm={values.location}
            validate={composeValidators(
              autocompleteSearchRequired(addressRequiredMessage),
              autocompletePlaceSelected(addressNotRecognizedMessage)
            )}
          />

          {/* NEW: Pickup & Drop-off fields (Mapbox geocoding via FieldLocationInput) */}
          <div className={css.locationAddress}>
            <Field
              name="pickup"
              component={FieldLocationInput}
              label="Pickup location"
              placeholder="Enter pickup address"
              validate={required('Pickup is required')}
            />
          </div>

          <div className={css.locationAddress}>
            <Field
              name="dropoff"
              component={FieldLocationInput}
              label="Drop-off location"
              placeholder="Enter drop-off address"
              validate={required('Drop-off is required')}
            />
          </div>

          {/* Optional extra text field (unchanged) */}
          <FieldTextInput
            className={css.building}
            type="text"
            name="building"
            id={`${formId}building`}
            label={intl.formatMessage({ id: 'EditListingLocationForm.building' }, { optionalText })}
            placeholder={intl.formatMessage({
              id: 'EditListingLocationForm.buildingPlaceholder',
            })}
          />

          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

export default EditListingLocationForm;
