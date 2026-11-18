import { roadKm, round1 } from '../utils/geo.js';
import env from '../config/env.js';

/**
 * Builds a distance matrix between stations in road kilometres.
 * @param {Array<{ stationId?: number, station_id?: number, latitude: number, longitude: number }>} stations
 * @param {number} [factor] Road multiplier factor, defaults to env.ROAD_FACTOR (1.3)
 * @returns {Record<number, Record<number, number>>} Symmetric road distance lookup table
 */
export function buildDistanceMatrix(stations, factor = env.ROAD_FACTOR ?? 1.3) {
  const dist = {};

  for (const s of stations) {
    const id = s.stationId ?? s.station_id;
    dist[id] = {};
  }

  for (let i = 0; i < stations.length; i++) {
    const s1 = stations[i];
    const id1 = s1.stationId ?? s1.station_id;
    dist[id1][id1] = 0;

    for (let j = i + 1; j < stations.length; j++) {
      const s2 = stations[j];
      const id2 = s2.stationId ?? s2.station_id;
      const km = round1(roadKm(s1, s2, factor));
      dist[id1][id2] = km;
      dist[id2][id1] = km;
    }
  }

  return dist;
}

/**
 * Helper to look up road kilometres between two stations in a distance matrix.
 * Throws a clear error if either station id is unknown.
 * @param {Record<number, Record<number, number>>} dist
 * @param {number} fromId
 * @param {number} toId
 * @returns {number}
 */
export function legKm(dist, fromId, toId) {
  if (!dist || dist[fromId] === undefined) {
    throw new Error(`Unknown origin station ID: ${fromId}`);
  }
  if (dist[fromId][toId] === undefined) {
    throw new Error(`Unknown destination station ID: ${toId}`);
  }
  return dist[fromId][toId];
}
