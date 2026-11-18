import { legKm } from './graph.js';
import { round1 } from '../utils/geo.js';
import env from '../config/env.js';

/**
 * Builds the timetable and ETA schedule for a shipment.
 *
 * @param {object} params
 * @param {number} params.originId Origin station ID
 * @param {number[]} [params.order=[]] Ordered list of destination station IDs
 * @param {Record<number, Record<number, number>>} params.dist Road distance matrix
 * @param {number} [params.speedKmh] Truck speed in km/h (defaults to env.TRUCK_SPEED_KMH or 60)
 * @param {number} [params.dwellMin] Stop dwell minutes for loading/unloading (defaults to env.STOP_DWELL_MIN or 15)
 * @param {number} [params.startMs] Starting timestamp in epoch milliseconds (defaults to Date.now())
 * @param {number} [params.simSpeed] Simulation speed multiplier (defaults to env.SIM_SPEED or 60)
 * @returns {{
 *   stops: Array<{
 *     sequence: number,
 *     stationId: number,
 *     distanceFromPreviousKm: number,
 *     etaMinutesFromStart: number,
 *     plannedArrivalMs: number
 *   }>,
 *   estimatedMinutes: number,
 *   totalKm: number
 * }}
 */
export function buildSchedule({
  originId,
  order = [],
  dist,
  speedKmh = env.TRUCK_SPEED_KMH ?? 60,
  dwellMin = env.STOP_DWELL_MIN ?? 15,
  startMs = Date.now(),
  simSpeed = env.SIM_SPEED ?? 60
}) {
  const stops = [
    {
      sequence: 1,
      stationId: originId,
      distanceFromPreviousKm: 0,
      etaMinutesFromStart: 0,
      plannedArrivalMs: startMs
    }
  ];

  if (!order || order.length === 0) {
    return {
      stops,
      estimatedMinutes: 0,
      totalKm: 0
    };
  }

  let currentTripMinutes = dwellMin; // truck loads at origin for dwellMin
  let prevStationId = originId;
  let totalKm = 0;

  for (let i = 0; i < order.length; i++) {
    const stationId = order[i];
    const km = legKm(dist, prevStationId, stationId);
    totalKm += km;

    const driveMinutes = (km / speedKmh) * 60;
    const arrivalTripMinutes = currentTripMinutes + driveMinutes;
    const roundedEta = round1(arrivalTripMinutes);

    // Wall-clock offset in milliseconds: (etaMinutesFromStart * 60 / simSpeed) * 1000
    const wallClockOffsetMs = Math.round((roundedEta * 60 / simSpeed) * 1000);
    const plannedArrivalMs = startMs + wallClockOffsetMs;

    stops.push({
      sequence: i + 2,
      stationId,
      distanceFromPreviousKm: round1(km),
      etaMinutesFromStart: roundedEta,
      plannedArrivalMs
    });

    // Unload at this stop before leaving
    currentTripMinutes = arrivalTripMinutes + dwellMin;
    prevStationId = stationId;
  }

  const lastStop = stops[stops.length - 1];

  return {
    stops,
    estimatedMinutes: lastStop.etaMinutesFromStart,
    totalKm: round1(totalKm)
  };
}
