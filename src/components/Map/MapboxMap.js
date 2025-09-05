<<<<<<< HEAD
// src/components/Map/MapboxMap.js
import React, { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
if (typeof window !== 'undefined') {
  import('mapbox-gl/dist/mapbox-gl.css');
}
=======
export { default as DynamicMap } from './DynamicMapboxMap';
export { default as StaticMap } from './StaticMapboxMap';
>>>>>>> parent of 414348083 (Add new listing field for location)

export const isMapsLibLoaded = () => {
  return typeof window !== 'undefined' && window.mapboxgl;
};
