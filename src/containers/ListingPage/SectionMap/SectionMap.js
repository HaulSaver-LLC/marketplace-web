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
  }, [attrs.title, geo, pd]);

  if (!markers.length) return null;

  // Map wrapper requires a center when fuzzy is disabled: use first marker
  const center = useMemo(() => [Number(markers[0].lng), Number(markers[0].lat)], [markers]);

  return (
    <section className={css.section} id="listing-map">
      <h2 className={css.title}>Map</h2>
      <Map center={center} markers={markers} height={380} />
    </section>
  );
}
