import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { startLeg, advance, remainingKm } from '../src/sim/movement.js';

describe('movement math', () => {
  const A = { latitude: 12.9716, longitude: 77.5946 }; // Bengaluru
  const B = { latitude: 13.3392, longitude: 77.1140 }; // Tumakuru (A to B road km ~86.0)

  describe('startLeg', () => {
    it('creates a leg with traveledKm 0 and correct legKm', () => {
      const leg = startLeg(A, B, 1.3);
      assert.strictEqual(leg.traveledKm, 0);
      assert.ok(Math.abs(leg.legKm - 86.0) <= 0.5, `Expected legKm ~86.0, got ${leg.legKm}`);
      assert.strictEqual(leg.from, A);
      assert.strictEqual(leg.to, B);
    });

    it('returns a zero-length leg when from and to are the same point', () => {
      const leg = startLeg(A, A, 1.3);
      assert.strictEqual(leg.legKm, 0);
      assert.strictEqual(leg.traveledKm, 0);
    });
  });

  describe('advance', () => {
    it('60 km/h for 3600 simulated seconds travels 60 km', () => {
      const leg = startLeg(A, B, 1.3); // legKm ~86 so not arrived yet
      const result = advance(leg, 3600, 60);
      assert.ok(!result.arrived);
      assert.ok(Math.abs(result.leg.traveledKm - 60) <= 0.1, `Expected ~60 km, got ${result.leg.traveledKm}`);
    });

    it('a 10 km leg arrives exactly after 600 simulated seconds at 60 km/h', () => {
      // Build a synthetic 10 km leg using nearby points
      const shortLeg = { from: A, to: B, legKm: 10, traveledKm: 0 };
      const result = advance(shortLeg, 600, 60);
      assert.ok(result.arrived, 'Expected arrived to be true');
      assert.strictEqual(result.leg.traveledKm, 10);
    });

    it('arrived truck position equals the destination', () => {
      const shortLeg = { from: A, to: B, legKm: 10, traveledKm: 0 };
      const result = advance(shortLeg, 3600, 60); // way past arrival
      assert.ok(result.arrived);
      assert.strictEqual(result.position.latitude, B.latitude);
      assert.strictEqual(result.position.longitude, B.longitude);
    });

    it('a zero-length leg arrives immediately with the destination as position', () => {
      const zeroLeg = { from: A, to: B, legKm: 0, traveledKm: 0 };
      const result = advance(zeroLeg, 1, 60);
      assert.ok(result.arrived, 'Zero-length leg should arrive immediately');
      assert.strictEqual(result.position.latitude, B.latitude);
      assert.strictEqual(result.position.longitude, B.longitude);
    });

    it('does not mutate the input leg object', () => {
      const leg = startLeg(A, B, 1.3);
      const originalTraveled = leg.traveledKm;
      advance(leg, 3600, 60);
      assert.strictEqual(leg.traveledKm, originalTraveled);
    });

    it('leftoverKm is 0 when the truck has not arrived', () => {
      const leg = { from: A, to: B, legKm: 100, traveledKm: 0 };
      const result = advance(leg, 1800, 60); // 30 km, not arrived
      assert.strictEqual(result.arrived, false);
      assert.strictEqual(result.leftoverKm, 0);
    });
  });

  describe('remainingKm', () => {
    it('returns the full legKm when traveledKm is 0', () => {
      const leg = startLeg(A, B, 1.3);
      assert.ok(Math.abs(remainingKm(leg) - leg.legKm) < 0.001);
    });

    it('returns 0 when the leg is complete', () => {
      const leg = { from: A, to: B, legKm: 86.0, traveledKm: 86.0 };
      assert.strictEqual(remainingKm(leg), 0);
    });

    it('returns correct remaining km mid-leg', () => {
      const leg = { from: A, to: B, legKm: 100, traveledKm: 40 };
      assert.strictEqual(remainingKm(leg), 60);
    });
  });
});
