import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDistanceMatrix } from '../src/planner/graph.js';
import { buildSchedule } from '../src/planner/schedule.js';

describe('buildSchedule', () => {
  const stations = [
    { stationId: 1, latitude: 12.9716, longitude: 77.5946 }, // A: Bengaluru
    { stationId: 2, latitude: 13.3392, longitude: 77.1140 }, // B: Tumakuru
    { stationId: 3, latitude: 14.2226, longitude: 76.3980 }, // C: Chitradurga
    { stationId: 4, latitude: 12.2958, longitude: 76.6394 }  // D: Mysuru
  ];

  const dist = buildDistanceMatrix(stations, 1.3);

  it('calculates worked example schedule with stops A -> B -> C', () => {
    const startMs = 1700000000000;
    const schedule = buildSchedule({
      originId: 1,
      order: [2, 3],
      dist,
      speedKmh: 60,
      dwellMin: 15,
      startMs,
      simSpeed: 60
    });

    assert.strictEqual(schedule.stops.length, 3);

    // Stop 1: Origin A
    const stopA = schedule.stops[0];
    assert.strictEqual(stopA.sequence, 1);
    assert.strictEqual(stopA.stationId, 1);
    assert.strictEqual(stopA.distanceFromPreviousKm, 0);
    assert.strictEqual(stopA.etaMinutesFromStart, 0);
    assert.strictEqual(stopA.plannedArrivalMs, startMs);

    // Stop 2: B (Tumakuru)
    const stopB = schedule.stops[1];
    assert.strictEqual(stopB.sequence, 2);
    assert.strictEqual(stopB.stationId, 2);
    assert.strictEqual(stopB.distanceFromPreviousKm, 86.0);
    assert.ok(Math.abs(stopB.etaMinutesFromStart - 101.0) <= 0.5, `Expected ~101.0, got ${stopB.etaMinutesFromStart}`);
    const offsetSecB = (stopB.plannedArrivalMs - startMs) / 1000;
    assert.ok(Math.abs(offsetSecB - 101.0) <= 0.5, `Expected offset ~101s, got ${offsetSecB}`);

    // Stop 3: C (Chitradurga)
    const stopC = schedule.stops[2];
    assert.strictEqual(stopC.sequence, 3);
    assert.strictEqual(stopC.stationId, 3);
    assert.strictEqual(stopC.distanceFromPreviousKm, 162.5);
    assert.ok(Math.abs(stopC.etaMinutesFromStart - 278.5) <= 0.5, `Expected ~278.5, got ${stopC.etaMinutesFromStart}`);
    const offsetSecC = (stopC.plannedArrivalMs - startMs) / 1000;
    assert.ok(Math.abs(offsetSecC - 278.5) <= 0.5, `Expected offset ~278.5s, got ${offsetSecC}`);

    // Schedule totals
    assert.ok(Math.abs(schedule.estimatedMinutes - 278.5) <= 0.5);
    assert.ok(Math.abs(schedule.totalKm - 248.5) <= 0.5);
  });

  it('handles empty order returning origin stop only with 0 minutes and 0 km', () => {
    const startMs = 1700000000000;
    const schedule = buildSchedule({
      originId: 1,
      order: [],
      dist,
      startMs
    });

    assert.strictEqual(schedule.stops.length, 1);
    assert.strictEqual(schedule.stops[0].sequence, 1);
    assert.strictEqual(schedule.stops[0].stationId, 1);
    assert.strictEqual(schedule.stops[0].plannedArrivalMs, startMs);
    assert.strictEqual(schedule.estimatedMinutes, 0);
    assert.strictEqual(schedule.totalKm, 0);
  });

  it('calculates schedule for a single destination', () => {
    const startMs = 1700000000000;
    const schedule = buildSchedule({
      originId: 1,
      order: [2],
      dist,
      speedKmh: 60,
      dwellMin: 15,
      startMs,
      simSpeed: 60
    });

    assert.strictEqual(schedule.stops.length, 2);
    assert.strictEqual(schedule.stops[1].distanceFromPreviousKm, 86.0);
    assert.strictEqual(schedule.stops[1].etaMinutesFromStart, 101.0);
    assert.strictEqual(schedule.estimatedMinutes, 101.0);
    assert.strictEqual(schedule.totalKm, 86.0);
  });
});
