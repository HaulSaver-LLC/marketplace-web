import React, { useState } from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingLocationForm from './EditListingLocationForm';
import css from './EditListingLocationPanel.module.css';

const getInitialValues = props => {
  const { listing } = props;
  const { geolocation, publicData } = listing?.attributes || {};

  // Default (built-in) location fields
  const locationFieldsPresent = publicData?.location?.address && geolocation;
  const location = publicData?.location || {};
  const { address, building } = location;

  // Extended fields for pickup & drop-off (saved in publicData)
  const pd = publicData || {};
  const pickup =
    pd.pickupLocation && Number.isFinite(pd.pickupLat) && Number.isFinite(pd.pickupLng)
      ? { address: pd.pickupLocation, lat: pd.pickupLat, lng: pd.pickupLng }
      : null;

  const dropoff =
    pd.dropoffLocation && Number.isFinite(pd.dropoffLat) && Number.isFinite(pd.dropoffLng)
      ? { address: pd.dropoffLocation, lat: pd.dropoffLat, lng: pd.dropoffLng }
      : null;

  return {
    building,
    location: locationFieldsPresent
      ? {
          search: address,
          selectedPlace: { address, origin: geolocation },
        }
      : null,
    pickup,
    dropoff,
  };
};

/**
 * The EditListingLocationPanel component.
 */
const EditListingLocationPanel = props => {
  // State is needed since LocationAutocompleteInput doesn't have internal state
  // and therefore re-rendering would overwrite the values during XHR call.
  const [state, setState] = useState({ initialValues: getInitialValues(props) });
  const {
    className,
    rootClassName,
    listing,
    disabled,
    ready,
    onSubmit,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    errors,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const isPublished = listing?.id && listing?.attributes.state !== LISTING_STATE_DRAFT;

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingLocationPanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingLocationPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>

      <EditListingLocationForm
        className={css.form}
        initialValues={state.initialValues}
        onSubmit={values => {
          const { building = '', location, pickup, dropoff } = values;

          // Built-in location (default single location in Flex)
          const {
            selectedPlace: { address, origin },
          } = location;

          // Preserve other publicData keys to avoid overwriting unrelated fields
          const currentPublicData = listing?.attributes?.publicData || {};

          // New values for listing attributes
          const updateValues = {
            geolocation: origin, // default location geolocation
            publicData: {
              ...currentPublicData,

              // Default location block (kept as-is for search/location filters)
              location: { address, building },

              // === Custom fields (text) + coordinates for Mapbox pins ===
              // If your Console keys differ, rename these 2 IDs:
              pickupLocation: pickup?.address || '',
              dropoffLocation: dropoff?.address || '',

              pickupLat: pickup?.lat ?? null,
              pickupLng: pickup?.lng ?? null,
              dropoffLat: dropoff?.lat ?? null,
              dropoffLng: dropoff?.lng ?? null,
            },
          };

          // Save the initialValues to state so UI stays in sync after submit
          setState({
            initialValues: {
              building,
              location: { search: address, selectedPlace: { address, origin } },
              pickup: pickup || null,
              dropoff: dropoff || null,
            },
          });

          onSubmit(updateValues);
        }}
        saveActionMsg={submitButtonText}
        disabled={disabled}
        ready={ready}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        fetchErrors={errors}
        autoFocus
      />
    </div>
  );
};

export default EditListingLocationPanel;
