import maplibregl from 'maplibre-gl';
import { MAP_STYLE_URL } from '../config';

export function initMap(containerEl, opts = {}) {
  if (!containerEl) throw new Error('initMap: containerEl required');

  const map = new maplibregl.Map({
    container: containerEl,
    style: MAP_STYLE_URL,
    center: opts.center || [120.9842, 14.5995], // [lng, lat]
    zoom: opts.zoom || 11,
    attributionControl: true,
  });
  map.addControl(new maplibregl.NavigationControl(), 'top-right');

  if (opts.bounds && opts.bounds.length === 4) {
    const [w, s, e, n] = opts.bounds;
    map.fitBounds([[w, s], [e, n]], { padding: 32, duration: 0 });
  }

  const state = { markers: [] };

  function setMarkers(items) {
    state.markers.forEach(m => m.remove());
    state.markers = (items || []).map(m => {
      const el = document.createElement('div');
      el.style.cssText =
        'width:14px;height:14px;border-radius:9999px;background:#2563eb;box-shadow:0 0 0 2px #fff;';
      return new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
    });
  }

  function onMoveEnd(cb) {
    if (!cb) return;
    map.on('moveend', () => {
      const b = map.getBounds();
      cb({
        ne: [b.getNorthEast().lng, b.getNorthEast().lat],
        sw: [b.getSouthWest().lng, b.getSouthWest().lat],
      });
    });
  }

  function onClick(cb) {
    if (!cb) return;
    map.on('click', e => cb(e.lngLat.lng, e.lngLat.lat));
  }

  function destroy() {
    map.remove();
  }

  return { map, setMarkers, onMoveEnd, onClick, destroy };
}
