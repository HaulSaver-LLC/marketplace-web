import React, { useMemo } from 'react';
import Map from '../../../components/Map/Map';
import css from './SectionMap.module.css';

const isNum = n => Number.isFinite(Number(n));

export default function SectionMap({ listing }) {
  const attrs = listing?.attributes || {};
  const pd = attrs.publicData || {};
  const geo = attrs.geolocation; // { lat, lng }

  // Build markers from default location + optional pickup/drop-off
  const markers = useMemo(() => {
    const m = [];

    // 1) Built-in single location (blue)
    if (geo && isNum(geo.lat) && isNum(geo.lng)) {
      m.push({
        id: 'default',
        lat: Number(geo.lat),
        lng: Number(geo.lng),
        popup: pd?.location?.address || attrs.title || 'Listing location',
        color: '#3b82f6', // blue
      });
    }

    // 2) Pickup (green)
    if (isNum(pd.pickupLat) && isNum(pd.pickupLng)) {
      m.push({
        id: 'pickup',
        lat: Number(pd.pickupLat),
        lng: Number(pd.pickupLng),
        popup: `Pickup: ${pd.pickupLocation || ''}`.trim(),
        color: '#16a34a', // green
      });
    }

    // 3) Drop-off (red/pink)
    if (isNum(pd.dropoffLat) && isNum(pd.dropoffLng)) {
      m.push({
        id: 'dropoff',
        lat: Number(pd.dropoffLat),
        lng: Number(pd.dropoffLng),
        popup: `Drop-off: ${pd.dropoffLocation || ''}`.trim(),
        color: '#e11d48', // rose/red
      });
    }

    return m;
  }, [
    attrs.title,
    geo?.lat,
    geo?.lng,
    pd.pickupLat,
    pd.pickupLng,
    pd.dropoffLat,
    pd.dropoffLng,
    pd.pickupLocation,
    pd.dropoffLocation,
    pd?.location?.address,
  ]);

  if (!markers.length) return null;

  // Choose a sensible center: pickup → drop-off → default geolocation
  const center = useMemo(() => {
    if (isNum(pd.pickupLng) && isNum(pd.pickupLat)) {
      return [Number(pd.pickupLng), Number(pd.pickupLat)];
    }
    if (isNum(pd.dropoffLng) && isNum(pd.dropoffLat)) {
      return [Number(pd.dropoffLng), Number(pd.dropoffLat)];
    }
    if (geo && isNum(geo.lng) && isNum(geo.lat)) {
      return [Number(geo.lng), Number(geo.lat)];
    }
    // Fallback (won't be used since we early-return if no markers)
    return [121.613, 13.936];
  }, [pd.pickupLng, pd.pickupLat, pd.dropoffLng, pd.dropoffLat, geo?.lng, geo?.lat]);

  return (
    <section className={css.section} id="listing-map">
      <h2 className={css.title}>Map</h2>
      <Map center={center} markers={markers} height={380} />
    </section>
  );
}
