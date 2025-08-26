import { initMap } from '../../util/maplibreMap';

let mapApi;

function mountSearchMap() {
  const el = document.getElementById('searchMap');
  if (!el) return;
  mapApi = initMap(el, { center: [120.9842, 14.5995], zoom: 11 });
  mapApi.onMoveEnd(({ ne, sw }) => {
    const bounds = `${sw[0]},${sw[1]},${ne[0]},${ne[1]}`; // minLng,minLat,maxLng,maxLat
    // dispatch your existing FTW search with { bounds }
  });
}

function updateMarkersFromListings(listings) {
  if (!mapApi) return;
  mapApi.setMarkers(
    listings.map(l => ({
      id: l.id.uuid,
      lng: l.attributes.geolocation.lng,
      lat: l.attributes.geolocation.lat,
    }))
  );
}
