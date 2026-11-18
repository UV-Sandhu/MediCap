import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm, roadKm, interpolate, round1 } from '../src/utils/geo.js';

describe('geo helpers', () => {
  // Coordinates from seed data
  const A = { latitude: 12.9716, longitude: 77.5946 }; // Bengaluru
  const B = { latitude: 13.3392, longitude: 77.1140 }; // Tumakuru
  const C = { latitude: 14.2226, longitude: 76.3980 }; // Chitradurga
  const D = { latitude: 12.2958, longitude: 76.6394 }; // Mysuru

  describe('haversineKm', () => {
    it('calculates distance between identical points as 0', () => {
      assert.strictEqual(haversineKm(A, A), 0);
      assert.strictEqual(haversineKm(B, B), 0);
    });

    it('calculates A to B within 0.5 km of 66.2', () => {
      const dist = haversineKm(A, B);
      assert.ok(Math.abs(dist - 66.2) <= 0.5, `Expected ~66.2, got ${dist}`);
    });

    it('calculates B to C within 0.5 km of 125.0', () => {
      const dist = haversineKm(B, C);
      assert.ok(Math.abs(dist - 125.0) <= 0.5, `Expected ~125.0, got ${dist}`);
    });

    it('calculates A to C within 0.5 km of 189.9', () => {
      const dist = haversineKm(A, C);
      assert.ok(Math.abs(dist - 189.9) <= 0.5, `Expected ~189.9, got ${dist}`);
    });

    it('calculates A to D within 0.5 km of 128.0', () => {
      const dist = haversineKm(A, D);
      assert.ok(Math.abs(dist - 128.0) <= 0.5, `Expected ~128.0, got ${dist}`);
    });
  });

  describe('roadKm', () => {
    it('applies default factor of 1.3', () => {
      const straight = haversineKm(A, B);
      const road = roadKm(A, B);
      assert.strictEqual(road, straight * 1.3);
    });

    it('applies custom factor when supplied', () => {
      const straight = haversineKm(A, B);
      const road = roadKm(A, B, 1.5);
      assert.strictEqual(road, straight * 1.5);
    });
  });

  describe('interpolate', () => {
    it('returns point a when fraction is 0', () => {
      const result = interpolate(A, B, 0);
      assert.deepEqual(result, { latitude: A.latitude, longitude: A.longitude });
    });

    it('returns point b when fraction is 1', () => {
      const result = interpolate(A, B, 1);
      assert.deepEqual(result, { latitude: B.latitude, longitude: B.longitude });
    });

    it('clamps fraction below 0 to point a', () => {
      const result = interpolate(A, B, -0.5);
      assert.deepEqual(result, { latitude: A.latitude, longitude: A.longitude });
    });

    it('clamps fraction above 1 to point b', () => {
      const result = interpolate(A, B, 1.5);
      assert.deepEqual(result, { latitude: B.latitude, longitude: B.longitude });
    });

    it('returns midpoint when fraction is 0.5', () => {
      const result = interpolate(A, B, 0.5);
      const expectedLat = (A.latitude + B.latitude) / 2;
      const expectedLng = (A.longitude + B.longitude) / 2;
      assert.strictEqual(result.latitude, expectedLat);
      assert.strictEqual(result.longitude, expectedLng);
    });
  });

  describe('round1', () => {
    it('rounds numbers to one decimal place', () => {
      assert.strictEqual(round1(66.17), 66.2);
      assert.strictEqual(round1(125.01), 125.0);
      assert.strictEqual(round1(189.93), 189.9);
      assert.strictEqual(round1(128.02), 128.0);
      assert.strictEqual(round1(42), 42);
    });
  });
});
