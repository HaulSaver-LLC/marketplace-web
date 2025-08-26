import { OPENCAGE_KEY } from '../config/configMaps';

const BASE = 'https://api.opencagedata.com/geocode/v1/json';

export async function forwardGeocode(q) {
  const url = `${BASE}?key=${OPENCAGE_KEY}&q=${encodeURIComponent(q)}&limit=5&no_annotations=1`;
  const r = await fetch(url);
  const data = await r.json();
  return (data.results || []).map(x => ({
    label: x.formatted,
    lat: x.geometry.lat,
    lng: x.geometry.lng,
    country: x.components.country,
    city: x.components.city || x.components.town || x.components.village,
    state: x.components.state,
    postalCode: x.components.postcode,
  }));
}

export async function reverseGeocode(lat, lng) {
  const url = `${BASE}?key=${OPENCAGE_KEY}&q=${lat}%2C${lng}&limit=1&no_annotations=1`;
  const r = await fetch(url);
  const data = await r.json();
  const x = data.results && data.results[0];
  return x
    ? {
        label: x.formatted,
        lat: x.geometry.lat,
        lng: x.geometry.lng,
        country: x.components.country,
        city: x.components.city || x.components.town || x.components.village,
        state: x.components.state,
        postalCode: x.components.postcode,
      }
    : null;
}
