import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDistanceMatrix } from '../src/planner/graph.js';
import { bestOrder } from '../src/planner/orderStops.js';

describe('bestOrder', () => {
  const stations = [
    { stationId: 1, latitude: 12.9716, longitude: 77.5946 }, // A: Bengaluru
    { stationId: 2, latitude: 13.3392, longitude: 77.1140 }, // B: Tumakuru
    { stationId: 3, latitude: 14.2226, longitude: 76.3980 }, // C: Chitradurga
    { stationId: 4, latitude: 12.2958, longitude: 76.6394 }  // D: Mysuru
  ];

  const dist = buildDistanceMatrix(stations, 1.3);

  it('returns empty order and 0 km when destinations list is empty', () => {
    const result = bestOrder(1, [], dist);
    assert.deepEqual(result.order, []);
    assert.strictEqual(result.totalKm, 0);
    assert.deepEqual(result.legs, []);
  });

  it('returns single destination when only one destination is given', () => {
    const result = bestOrder(1, [2], dist);
    assert.deepEqual(result.order, [2]);
    assert.strictEqual(result.totalKm, 86.0);
    assert.deepEqual(result.legs, [{ fromId: 1, toId: 2, km: 86.0 }]);
  });

  it('filters out the origin station and duplicate destination IDs', () => {
    const result = bestOrder(1, [1, 2, 2], dist);
    assert.deepEqual(result.order, [2]);
    assert.strictEqual(result.totalKm, 86.0);
  });

  it('origin A with destinations C and B returns order [B, C] (~248.5 km)', () => {
    const result = bestOrder(1, [3, 2], dist);
    assert.deepEqual(result.order, [2, 3]);
    assert.ok(Math.abs(result.totalKm - 248.5) <= 0.5, `Expected ~248.5, got ${result.totalKm}`);
    assert.strictEqual(result.legs.length, 2);
    assert.strictEqual(result.legs[0].fromId, 1);
    assert.strictEqual(result.legs[0].toId, 2);
    assert.strictEqual(result.legs[1].fromId, 2);
    assert.strictEqual(result.legs[1].toId, 3);
  });

  it('origin A with destinations C and D returns order [D, C] (~446.9 km vs ~527.4 km)', () => {
    const result = bestOrder(1, [3, 4], dist);
    assert.deepEqual(result.order, [4, 3]);
    assert.ok(Math.abs(result.totalKm - 446.9) <= 0.5, `Expected ~446.9, got ${result.totalKm}`);
    assert.strictEqual(result.legs.length, 2);
    assert.strictEqual(result.legs[0].fromId, 1);
    assert.strictEqual(result.legs[0].toId, 4);
    assert.strictEqual(result.legs[1].fromId, 4);
    assert.strictEqual(result.legs[1].toId, 3);
  });

  it('throws an error if more than 8 unique destinations are provided', () => {
    const mockDist = {};
    for (let i = 1; i <= 10; i++) {
      mockDist[i] = {};
      for (let j = 1; j <= 10; j++) {
        mockDist[i][j] = i === j ? 0 : 10;
      }
    }
    assert.throws(
      () => bestOrder(1, [2, 3, 4, 5, 6, 7, 8, 9, 10], mockDist),
      /Too many destinations to optimize order/
    );
  });

  it('breaks ties deterministically in ascending ID order', () => {
    // Symmetrical distance matrix where visiting 2 then 3 has the same total distance as 3 then 2
    const symmetricDist = {
      1: { 1: 0, 2: 10, 3: 10 },
      2: { 1: 10, 2: 0, 3: 5 },
      3: { 1: 10, 2: 5, 3: 0 }
    };
    const result = bestOrder(1, [3, 2], symmetricDist);
    // [2, 3] should be chosen over [3, 2]
    assert.deepEqual(result.order, [2, 3]);
    assert.strictEqual(result.totalKm, 15);
  });
});
