import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDistanceMatrix } from '../src/planner/graph.js';
import { selectTransfers } from '../src/planner/selectTransfers.js';

describe('selectTransfers', () => {
  const stations = [
    { stationId: 1, latitude: 12.9716, longitude: 77.5946 }, // A: Bengaluru
    { stationId: 2, latitude: 13.3392, longitude: 77.1140 }, // B: Tumakuru
    { stationId: 3, latitude: 14.2226, longitude: 76.3980 }, // C: Chitradurga
    { stationId: 4, latitude: 12.2958, longitude: 76.6394 }  // D: Mysuru
  ];

  const dist = buildDistanceMatrix(stations, 1.3);

  it('chosen [A to C], candidate [A to B] includes B as suggested (detour ~0.7%)', () => {
    const chosen = [
      { transferId: 10, sourceStationId: 1, destinationStationId: 3, units: 20, needsCold: false }
    ];
    const candidates = [
      { transferId: 20, sourceStationId: 1, destinationStationId: 2, units: 10, needsCold: false }
    ];

    const result = selectTransfers({
      chosen,
      candidates,
      originId: 1,
      dist,
      maxDetourPercent: 10,
      truckCapacity: 100,
      truckHasRefrigeration: false
    });

    assert.deepEqual(result.includedTransferIds, [10, 20]);
    assert.deepEqual(result.suggestedTransferIds, [20]);
    assert.deepEqual(result.order, [2, 3]);
    assert.ok(Math.abs(result.totalKm - 248.5) <= 0.5);
    assert.strictEqual(result.totalUnits, 30);
    assert.strictEqual(result.requiresRefrigeration, false);
    assert.deepEqual(result.excluded, []);
  });

  it('candidate [A to D] is excluded with a reason containing 81%', () => {
    const chosen = [
      { transferId: 10, sourceStationId: 1, destinationStationId: 3, units: 20, needsCold: false }
    ];
    const candidates = [
      { transferId: 30, sourceStationId: 1, destinationStationId: 4, units: 10, needsCold: false }
    ];

    const result = selectTransfers({
      chosen,
      candidates,
      originId: 1,
      dist,
      maxDetourPercent: 10,
      truckCapacity: 100,
      truckHasRefrigeration: false
    });

    assert.deepEqual(result.includedTransferIds, [10]);
    assert.deepEqual(result.suggestedTransferIds, []);
    assert.strictEqual(result.excluded.length, 1);
    assert.strictEqual(result.excluded[0].transferId, 30);
    assert.ok(
      result.excluded[0].reason.includes('81%'),
      `Expected reason to include '81%', got: ${result.excluded[0].reason}`
    );
  });

  it('a candidate that would exceed capacity is excluded with the capacity reason', () => {
    const chosen = [
      { transferId: 10, sourceStationId: 1, destinationStationId: 3, units: 80, needsCold: false }
    ];
    const candidates = [
      { transferId: 20, sourceStationId: 1, destinationStationId: 2, units: 30, needsCold: false }
    ];

    const result = selectTransfers({
      chosen,
      candidates,
      originId: 1,
      dist,
      maxDetourPercent: 10,
      truckCapacity: 100,
      truckHasRefrigeration: false
    });

    assert.deepEqual(result.includedTransferIds, [10]);
    assert.deepEqual(result.suggestedTransferIds, []);
    assert.strictEqual(result.excluded.length, 1);
    assert.strictEqual(result.excluded[0].transferId, 20);
    assert.strictEqual(result.excluded[0].reason, 'Truck capacity exceeded');
  });

  it('a candidate going to a station already on the route is free (detour 0)', () => {
    const chosen = [
      { transferId: 10, sourceStationId: 1, destinationStationId: 3, units: 20, needsCold: false }
    ];
    const candidates = [
      { transferId: 11, sourceStationId: 1, destinationStationId: 3, units: 15, needsCold: false }
    ];

    const result = selectTransfers({
      chosen,
      candidates,
      originId: 1,
      dist,
      maxDetourPercent: 0, // Even with 0% max detour, 0 detour is accepted
      truckCapacity: 100,
      truckHasRefrigeration: false
    });

    assert.deepEqual(result.includedTransferIds, [10, 11]);
    assert.deepEqual(result.suggestedTransferIds, [11]);
    assert.strictEqual(result.totalUnits, 35);
    assert.deepEqual(result.excluded, []);
  });

  it('a cold candidate is refused for a non-refrigerated truck', () => {
    const chosen = [
      { transferId: 10, sourceStationId: 1, destinationStationId: 3, units: 20, needsCold: false }
    ];
    const candidates = [
      { transferId: 20, sourceStationId: 1, destinationStationId: 2, units: 10, needsCold: true }
    ];

    const result = selectTransfers({
      chosen,
      candidates,
      originId: 1,
      dist,
      maxDetourPercent: 10,
      truckCapacity: 100,
      truckHasRefrigeration: false
    });

    assert.deepEqual(result.includedTransferIds, [10]);
    assert.strictEqual(result.excluded.length, 1);
    assert.strictEqual(result.excluded[0].transferId, 20);
    assert.strictEqual(result.excluded[0].reason, 'Needs refrigeration');
  });

  it('excludes chosen and candidate transfers from a different source station', () => {
    const chosen = [
      { transferId: 10, sourceStationId: 1, destinationStationId: 3, units: 20, needsCold: false },
      { transferId: 12, sourceStationId: 2, destinationStationId: 3, units: 10, needsCold: false }
    ];
    const candidates = [
      { transferId: 25, sourceStationId: 4, destinationStationId: 3, units: 5, needsCold: false }
    ];

    const result = selectTransfers({
      chosen,
      candidates,
      originId: 1,
      dist
    });

    assert.deepEqual(result.includedTransferIds, [10]);
    assert.strictEqual(result.excluded.length, 2);
    assert.deepEqual(result.excluded, [
      { transferId: 12, reason: 'Different source station' },
      { transferId: 25, reason: 'Different source station' }
    ]);
  });
});
