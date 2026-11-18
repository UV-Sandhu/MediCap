import { bestOrder } from './orderStops.js';
import { round1 } from '../utils/geo.js';

/**
 * Selects transfers for a shipment, evaluating smart stops and capacity/refrigeration constraints.
 *
 * @param {object} params
 * @param {Array<object>} params.chosen User-selected transfers
 * @param {Array<object>} [params.candidates=[]] Candidate transfers available for consolidation
 * @param {number} params.originId Starting station ID
 * @param {Record<number, Record<number, number>>} params.dist Road distance matrix
 * @param {number} [params.maxDetourPercent=10] Maximum allowable detour percentage
 * @param {number|null} [params.truckCapacity=null] Maximum cargo units the truck can hold
 * @param {boolean} [params.truckHasRefrigeration=false] Whether the truck has active cold storage
 * @returns {{
 *   includedTransferIds: number[],
 *   suggestedTransferIds: number[],
 *   excluded: Array<{ transferId: number, reason: string }>,
 *   order: number[],
 *   totalKm: number,
 *   legs: Array<{ fromId: number, toId: number, km: number }>,
 *   totalUnits: number,
 *   requiresRefrigeration: boolean
 * }}
 */
export function selectTransfers({
  chosen = [],
  candidates = [],
  originId,
  dist,
  maxDetourPercent = 10,
  truckCapacity = null,
  truckHasRefrigeration = false
}) {
  const excluded = [];
  const includedTransfers = [];
  const includedTransferIds = [];
  const suggestedTransferIds = [];

  let totalUnits = 0;
  let requiresRefrigeration = false;

  // Step 2: Chosen transfers are always included if source matches originId;
  // otherwise excluded with "Different source station"
  for (const t of chosen) {
    const transferId = t.transferId ?? t.transfer_id;
    const sourceId = t.sourceStationId ?? t.source_station_id;
    const units = t.units ?? t.quantity ?? 0;
    const needsCold = Boolean(t.needsCold ?? t.needs_cold);

    if (sourceId !== originId) {
      excluded.push({ transferId, reason: 'Different source station' });
    } else {
      includedTransfers.push(t);
      includedTransferIds.push(transferId);
      totalUnits += units;
      if (needsCold) {
        requiresRefrigeration = true;
      }
    }
  }

  // Step 3: Compute initial best order and total distance for included destinations
  const initialDestinations = [
    ...new Set(includedTransfers.map(t => t.destinationStationId ?? t.destination_station_id))
  ];
  let currentRoute = bestOrder(originId, initialDestinations, dist);
  let currentTotalKm = currentRoute.totalKm;

  // Step 4: Smart stops from candidate transfers
  // Filter out candidates from a different source station upfront
  let remainingCandidates = [];
  for (const c of candidates) {
    const transferId = c.transferId ?? c.transfer_id;
    const sourceId = c.sourceStationId ?? c.source_station_id;
    if (sourceId !== originId) {
      excluded.push({ transferId, reason: 'Different source station' });
    } else {
      remainingCandidates.push(c);
    }
  }

  while (remainingCandidates.length > 0) {
    const candidateEvals = [];

    for (const c of remainingCandidates) {
      const transferId = c.transferId ?? c.transfer_id;
      const destId = c.destinationStationId ?? c.destination_station_id;
      const units = c.units ?? c.quantity ?? 0;
      const needsCold = Boolean(c.needsCold ?? c.needs_cold);

      let detour = 0;
      let detourPercent = 0;

      if (!currentRoute.order.includes(destId)) {
        const testDests = [...currentRoute.order, destId];
        const testRoute = bestOrder(originId, testDests, dist);
        detour = Math.max(0, round1(testRoute.totalKm - currentTotalKm));
        detourPercent = currentTotalKm === 0 ? 0 : (detour / currentTotalKm) * 100;
      }

      // Check constraints in priority order
      let failureReason = null;
      if (needsCold && !truckHasRefrigeration) {
        failureReason = 'Needs refrigeration';
      } else if (truckCapacity !== null && truckCapacity !== undefined && totalUnits + units > truckCapacity) {
        failureReason = 'Truck capacity exceeded';
      } else if (detourPercent > maxDetourPercent) {
        failureReason = `Detour of ${Math.round(detourPercent)}% exceeds the ${maxDetourPercent}% limit`;
      }

      candidateEvals.push({
        candidate: c,
        transferId,
        destId,
        units,
        needsCold,
        detour,
        detourPercent,
        failureReason
      });
    }

    // Sort candidates by detour ascending, breaking ties deterministically by transferId
    candidateEvals.sort((a, b) => a.detour - b.detour || a.transferId - b.transferId);

    const includables = candidateEvals.filter(e => !e.failureReason);

    if (includables.length > 0) {
      // Pick the includable candidate with the smallest detour
      const chosenCandidate = includables[0];
      suggestedTransferIds.push(chosenCandidate.transferId);
      includedTransferIds.push(chosenCandidate.transferId);
      includedTransfers.push(chosenCandidate.candidate);
      totalUnits += chosenCandidate.units;
      if (chosenCandidate.needsCold) {
        requiresRefrigeration = true;
      }

      const updatedDests = [
        ...new Set(includedTransfers.map(t => t.destinationStationId ?? t.destination_station_id))
      ];
      currentRoute = bestOrder(originId, updatedDests, dist);
      currentTotalKm = currentRoute.totalKm;

      remainingCandidates = remainingCandidates.filter(
        c => (c.transferId ?? c.transfer_id) !== chosenCandidate.transferId
      );
    } else {
      // No remaining candidates can be included; add them to excluded with their failure reasons
      for (const e of candidateEvals) {
        excluded.push({ transferId: e.transferId, reason: e.failureReason });
      }
      break;
    }
  }

  return {
    includedTransferIds,
    suggestedTransferIds,
    excluded,
    order: currentRoute.order,
    totalKm: currentRoute.totalKm,
    legs: currentRoute.legs,
    totalUnits,
    requiresRefrigeration
  };
}
