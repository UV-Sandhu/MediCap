import { legKm } from './graph.js';
import { round1 } from '../utils/geo.js';

/**
 * Generates all permutations of an array.
 * @template T
 * @param {T[]} arr
 * @returns {T[][]}
 */
function getPermutations(arr) {
  if (arr.length <= 1) return [arr];
  const permutations = [];

  for (let i = 0; i < arr.length; i++) {
    const current = arr[i];
    const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const subPermutations = getPermutations(remaining);
    for (const sub of subPermutations) {
      permutations.push([current, ...sub]);
    }
  }

  return permutations;
}

/**
 * Compares two number arrays lexicographically in ascending order.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} -1 if a < b, 1 if a > b, 0 if equal
 */
function compareIdLists(a, b) {
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      return a[i] < b[i] ? -1 : 1;
    }
  }
  return a.length - b.length;
}

/**
 * Finds the destination order with the shortest total road distance.
 * @param {number} originId Starting station ID
 * @param {number[]} destinationIds List of destination station IDs
 * @param {Record<number, Record<number, number>>} dist Road distance lookup table
 * @returns {{ order: number[], totalKm: number, legs: Array<{ fromId: number, toId: number, km: number }> }}
 */
export function bestOrder(originId, destinationIds, dist) {
  // Remove duplicates and origin station
  const uniqueDestinations = [...new Set(destinationIds)].filter(id => id !== originId);

  if (uniqueDestinations.length > 8) {
    throw new Error(`Too many destinations to optimize order (${uniqueDestinations.length} provided, maximum 8).`);
  }

  if (uniqueDestinations.length === 0) {
    return {
      order: [],
      totalKm: 0,
      legs: []
    };
  }

  const permutations = getPermutations(uniqueDestinations);
  let best = null;

  for (const perm of permutations) {
    const legs = [];
    let prev = originId;
    let total = 0;

    for (const toId of perm) {
      const km = legKm(dist, prev, toId);
      legs.push({ fromId: prev, toId, km });
      total += km;
      prev = toId;
    }

    const roundedTotal = round1(total);

    if (!best || roundedTotal < best.totalKm) {
      best = { order: perm, totalKm: roundedTotal, legs };
    } else if (Math.abs(roundedTotal - best.totalKm) < 1e-6) {
      if (compareIdLists(perm, best.order) < 0) {
        best = { order: perm, totalKm: roundedTotal, legs };
      }
    }
  }

  return best;
}
