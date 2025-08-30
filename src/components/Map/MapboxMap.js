// src/components/Map/MapboxMap.js
import React, { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
if (typeof window !== 'undefined') {
  import('mapbox-gl/dist/mapbox-gl.css');
}

const TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

function BaseMap({
  center = [121.613, 13.936], // [lng, lat]
  zoom = 10,
  // markers: [{ lng, lat, popup?: string, popupHtml?: string, color?: string, element?: HTMLElement, id?: string }]
  markers = [],
  styleUrl = 'mapbox://styles/mapbox/streets-v12',
  height = 360,
  interactive = true,
}) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  // Stable keys for dependency arrays
  const centerKey = useMemo(() => JSON.stringify(center), [center]);
  const markersKey = useMemo(() => JSON.stringify(markers), [markers]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    if (!TOKEN && process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('REACT_APP_MAPBOX_ACCESS_TOKEN is not set');
    }

    mapboxgl.accessToken = TOKEN || '';
    const map = new mapboxgl.Map({
      container: ref.current,
      style: styleUrl,
      center,
      zoom,
      accessToken: TOKEN,
      interactive,
    });
    mapRef.current = map;

    if (interactive) {
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // center/zoom changes are handled by the markers effect below
  }, [styleUrl, interactive, centerKey, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    if (Array.isArray(map.__customMarkers)) {
      map.__customMarkers.forEach(m => m.remove());
    }
    map.__customMarkers = [];

    // Add markers (support color, custom element, and HTML popups)
    markers.forEach(m => {
      const lng = Number(m.lng);
      const lat = Number(m.lat);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

      const opts = {};
      if (m.element) {
        opts.element = m.element; // custom HTMLElement for full control
      } else if (m.color) {
        opts.color = m.color; // colored default marker
      }

      const mk = new mapboxgl.Marker(opts).setLngLat([lng, lat]).addTo(map);

      if (m.popupHtml) {
        mk.setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(m.popupHtml));
      } else if (m.popup) {
        mk.setPopup(new mapboxgl.Popup({ offset: 24 }).setText(m.popup));
      }

      map.__customMarkers.push(mk);
    });

    // Camera handling
    const valid = markers
      .map(m => [Number(m.lng), Number(m.lat)])
      .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat));

    if (valid.length >= 2) {
      const bounds = new mapboxgl.LngLatBounds();
      valid.forEach(([lng, lat]) => bounds.extend([lng, lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 13 });
    } else if (valid.length === 1) {
      const [lng, lat] = valid[0];
      map.setCenter([lng, lat]);
      map.setZoom(Math.max(zoom, 10));
    } else {
      // fallback to provided center/zoom
      try {
        const [lng, lat] = JSON.parse(centerKey);
        map.setCenter([lng, lat]);
      } catch {
        // ignore
      }
      map.setZoom(zoom);
    }
  }, [markersKey, centerKey, zoom]);

  return <div ref={ref} style={{ width: '100%', height }} />;
}

// ---- Named exports expected by ./Map/Map.js ----
export const StaticMap = props => <BaseMap {...props} interactive={false} />;
export const DynamicMap = props => <BaseMap {...props} interactive={true} />;
export const isMapsLibLoaded = () =>
  typeof window !== 'undefined' && typeof mapboxgl !== 'undefined';

// Optional default export
export default BaseMap;
