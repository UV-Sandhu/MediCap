import { roadKm, interpolate } from '../utils/geo.js';
import env from '../config/env.js';

/**
 * Starts a new movement leg from one station position to another.
 * @param {{ latitude: number, longitude: number }} from Starting position
 * @param {{ latitude: number, longitude: number }} to Destination position
 * @param {number} [roadFactor] Road distance multiplier (defaults to env.ROAD_FACTOR)
 * @returns {{ from: object, to: object, legKm: number, traveledKm: number }}
 */
export function startLeg(from, to, roadFactor = env.ROAD_FACTOR ?? 1.3) {
  const legKm = roadKm(from, to, roadFactor);
  return { from, to, legKm, traveledKm: 0 };
}

/**
 * Advances a truck along its current leg by the given simulated time.
 * Does NOT mutate the input leg object.
 *
 * @param {{ from: object, to: object, legKm: number, traveledKm: number }} leg
 * @param {number} dtSimSeconds Simulated seconds elapsed since last tick
 * @param {number} speedKmh Truck speed in km/h
 * @returns {{ leg: object, position: { latitude: number, longitude: number }, arrived: boolean, leftoverKm: number }}
 */
export function advance(leg, dtSimSeconds, speedKmh) {
  const distanceTraveled = speedKmh * (dtSimSeconds / 3600);
  const newTraveledKm = Math.min(leg.legKm, leg.traveledKm + distanceTraveled);
  const arrived = newTraveledKm >= leg.legKm;
  const leftoverKm = arrived ? distanceTraveled - (leg.legKm - leg.traveledKm) : 0;

  let position;
  if (leg.legKm === 0) {
    position = { latitude: leg.to.latitude ?? leg.to.lat, longitude: leg.to.longitude ?? leg.to.lng };
  } else {
    position = interpolate(leg.from, leg.to, newTraveledKm / leg.legKm);
  }

  const updatedLeg = { ...leg, traveledKm: newTraveledKm };

  return { leg: updatedLeg, position, arrived, leftoverKm };
}

/**
 * Returns the remaining distance on the current leg.
 * @param {{ legKm: number, traveledKm: number }} leg
 * @returns {number}
 */
export function remainingKm(leg) {
  return leg.legKm - leg.traveledKm;
}
