// Earth's radius in kilometres
const EARTH_RADIUS_KM = 6371;

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates straight-line distance over the Earth's surface in kilometres (haversine formula).
 * @param {{ latitude: number, longitude: number }} a
 * @param {{ latitude: number, longitude: number }} b
 * @returns {number} Distance in km
 */
export function haversineKm(a, b) {
  const lat1 = toRad(a.latitude ?? a.lat);
  const lon1 = toRad(a.longitude ?? a.lng);
  const lat2 = toRad(b.latitude ?? b.lat);
  const lon2 = toRad(b.longitude ?? b.lng);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  return EARTH_RADIUS_KM * c;
}

/**
 * Estimates road distance between two points by multiplying haversine distance by a factor.
 * @param {{ latitude: number, longitude: number }} a
 * @param {{ latitude: number, longitude: number }} b
 * @param {number} [factor=1.3]
 * @returns {number} Road distance in km
 */
export function roadKm(a, b, factor = 1.3) {
  return haversineKm(a, b) * factor;
}

/**
 * Finds the point fraction (0 to 1, clamped) of the way from a to b by linear interpolation.
 * @param {{ latitude: number, longitude: number }} a
 * @param {{ latitude: number, longitude: number }} b
 * @param {number} fraction
 * @returns {{ latitude: number, longitude: number }}
 */
export function interpolate(a, b, fraction) {
  const f = Math.max(0, Math.min(1, fraction));
  const aLat = a.latitude ?? a.lat;
  const aLng = a.longitude ?? a.lng;
  const bLat = b.latitude ?? b.lat;
  const bLng = b.longitude ?? b.lng;

  return {
    latitude: aLat + (bLat - aLat) * f,
    longitude: aLng + (bLng - aLng) * f
  };
}

/**
 * Rounds a number to one decimal place for display values.
 * @param {number} x
 * @returns {number}
 */
export function round1(x) {
  return Math.round(x * 10) / 10;
}
