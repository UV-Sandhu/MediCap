import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDistanceMatrix, legKm } from '../src/planner/graph.js';
import env from '../src/config/env.js';

describe('planner graph and distance matrix', () => {
  const stations = [
    { stationId: 1, latitude: 12.9716, longitude: 77.5946 }, // A: Bengaluru
    { stationId: 2, latitude: 13.3392, longitude: 77.1140 }, // B: Tumakuru
    { stationId: 3, latitude: 14.2226, longitude: 76.3980 }, // C: Chitradurga
    { stationId: 4, latitude: 12.2958, longitude: 76.6394 }  // D: Mysuru
  ];

  const dist = buildDistanceMatrix(stations, 1.3);

  describe('buildDistanceMatrix', () => {
    it('sets zero on the diagonal for all stations', () => {
      for (const s of stations) {
        assert.strictEqual(dist[s.stationId][s.stationId], 0);
      }
    });

    it('ensures symmetric distances between station pairs', () => {
      for (const s1 of stations) {
        for (const s2 of stations) {
          assert.strictEqual(dist[s1.stationId][s2.stationId], dist[s2.stationId][s1.stationId]);
        }
      }
    });

    it('matches the worked example road distances at factor 1.3 within 0.5 km', () => {
      // A to B (Bengaluru to Tumakuru): ~86.0 km
      assert.ok(Math.abs(dist[1][2] - 86.0) <= 0.5, `Expected ~86.0, got ${dist[1][2]}`);
      // B to C (Tumakuru to Chitradurga): ~162.5 km
      assert.ok(Math.abs(dist[2][3] - 162.5) <= 0.5, `Expected ~162.5, got ${dist[2][3]}`);
      // A to C (direct): ~246.9 km
      assert.ok(Math.abs(dist[1][3] - 246.9) <= 0.5, `Expected ~246.9, got ${dist[1][3]}`);
      // A to D (Bengaluru to Mysuru): ~166.4 km
      assert.ok(Math.abs(dist[1][4] - 166.4) <= 0.5, `Expected ~166.4, got ${dist[1][4]}`);
      // D to C: ~280.5 km
      assert.ok(Math.abs(dist[4][3] - 280.5) <= 0.5, `Expected ~280.5, got ${dist[4][3]}`);
      // B to D: ~165.0 km
      assert.ok(Math.abs(dist[2][4] - 165.0) <= 0.5, `Expected ~165.0, got ${dist[2][4]}`);
    });

    it('builds matrix using snake_case station_id property', () => {
      const snakeStations = [
        { station_id: 10, latitude: 12.9716, longitude: 77.5946 },
        { station_id: 20, latitude: 13.3392, longitude: 77.1140 }
      ];
      const m = buildDistanceMatrix(snakeStations, 1.3);
      assert.strictEqual(m[10][10], 0);
      assert.strictEqual(m[10][20], 86.0);
    });
  });

  describe('legKm', () => {
    it('returns distance between two known stations', () => {
      assert.strictEqual(legKm(dist, 1, 2), 86.0);
      assert.strictEqual(legKm(dist, 2, 1), 86.0);
      assert.strictEqual(legKm(dist, 1, 1), 0);
    });

    it('throws when origin station ID is unknown', () => {
      assert.throws(
        () => legKm(dist, 999, 1),
        /Unknown origin station ID: 999/
      );
    });

    it('throws when destination station ID is unknown', () => {
      assert.throws(
        () => legKm(dist, 1, 999),
        /Unknown destination station ID: 999/
      );
    });
  });

  describe('environment constants', () => {
    it('provides TRUCK_SPEED_KMH with default 60', () => {
      assert.strictEqual(env.TRUCK_SPEED_KMH, 60);
    });

    it('provides STOP_DWELL_MIN with default 15', () => {
      assert.strictEqual(env.STOP_DWELL_MIN, 15);
    });
  });
});
