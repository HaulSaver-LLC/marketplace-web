import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { getMapProviderApiAccess } from '../../util/maps';
import * as mapboxMap from './MapboxMap';
import * as googleMapsMap from './GoogleMap';

import css from './Map.module.css';

/**
 * Map component that uses StaticMap or DynamicMap from the configured map provider: Mapbox or Google Maps
 *
 * Props of interest (forwarded to provider):
 * - center | obfuscatedCenter
 * - zoom
 * - markers: [{ lng, lat, popup?, popupHtml?, color?, element?, id? }]
 * - height
 * - address, mapsConfig, useStaticMap
 */
export const Map = props => {
  const config = useConfiguration();
  const {
    className,
    rootClassName,
    mapRootClassName,
    address,
    center,
    obfuscatedCenter,
    zoom,
    mapsConfig,
    useStaticMap,
    // NEW: forward markers and height (and anything else via ...rest)
    markers = [],
    height,
    ...rest
  } = props;

  const mapsConfiguration = mapsConfig || config.maps;
  const hasApiAccessForMapProvider = !!getMapProviderApiAccess(mapsConfiguration);
  const isGoogleMapsInUse = mapsConfiguration.mapProvider === 'googleMaps';
  const StaticMap = isGoogleMapsInUse ? googleMapsMap.StaticMap : mapboxMap.StaticMap;
  const DynamicMap = isGoogleMapsInUse ? googleMapsMap.DynamicMap : mapboxMap.DynamicMap;
  const isMapsLibLoaded = isGoogleMapsInUse
    ? googleMapsMap.isMapsLibLoaded
    : mapboxMap.isMapsLibLoaded;

  const classes = classNames(rootClassName || css.root, className);
  const mapClasses = mapRootClassName || css.mapRoot;

  if (mapsConfiguration.fuzzy.enabled && !obfuscatedCenter) {
    throw new Error(
      'Map: obfuscatedCenter prop is required when config.maps.fuzzy.enabled === true'
    );
  }
  if (!mapsConfiguration.fuzzy.enabled && !center) {
    throw new Error('Map: center prop is required when config.maps.fuzzy.enabled === false');
  }

  const location = mapsConfiguration.fuzzy.enabled ? obfuscatedCenter : center;

  // FIX precedence: use provided zoom, otherwise fallback based on fuzzy setting
  const zoomLevel =
    zoom || (mapsConfiguration.fuzzy.enabled ? mapsConfiguration.fuzzy.defaultZoomLevel : 11);

  const isMapProviderAvailable = hasApiAccessForMapProvider && isMapsLibLoaded();

  if (!isMapProviderAvailable) {
    return <div className={classes} />;
  }

  if (useStaticMap) {
    return (
      <StaticMap
        center={location}
        zoom={zoomLevel}
        address={address}
        mapsConfig={mapsConfiguration}
        markers={markers}
        height={height}
        {...rest}
      />
    );
  }

  return (
    <DynamicMap
      containerClassName={classes}
      mapClassName={mapClasses}
      center={location}
      zoom={zoomLevel}
      address={address}
      mapsConfig={mapsConfiguration}
      markers={markers}
      height={height}
      {...rest}
    />
  );
};

export default Map;
