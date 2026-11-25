import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, api, loginAs } from './helpers.js';
import { query } from '../src/db/pool.js';

describe('stations endpoints', () => {
  let server;
  let baseUrl;
  let adminToken;
  let opToken;
  let createdStationId = null;

  before(async () => {
    server = await startServer();
    baseUrl = server.baseUrl;
    adminToken = await loginAs(baseUrl, 'admin@medicap.local');
    opToken = await loginAs(baseUrl, 'karthik@medicap.local');
  });

  after(async () => {
    if (createdStationId) {
      await query('DELETE FROM stations WHERE station_id = ?', [createdStationId]);
    }
    if (server) await server.close();
  });

  it('GET /stations returns active stations by default', async () => {
    const { status, json } = await api(baseUrl, 'GET', '/stations', { token: opToken });
    assert.strictEqual(status, 200);
    assert(Array.isArray(json.data));
    assert(json.data.length >= 5);
    for (const s of json.data) {
      assert.strictEqual(s.status, 'Active');
    }
  });

  it('operator is blocked from creating a station (403)', async () => {
    const { status, json } = await api(baseUrl, 'POST', '/stations', {
      token: opToken,
      body: { stationName: 'Op Station', latitude: 12.0, longitude: 77.0 }
    });
    assert.strictEqual(status, 403);
    assert.strictEqual(json.error.code, 'FORBIDDEN');
  });

  it('admin creates a station (201)', async () => {
    const { status, json } = await api(baseUrl, 'POST', '/stations', {
      token: adminToken,
      body: {
        stationName: 'Test Hub Foundation',
        locationText: 'Test City',
        latitude: 12.95,
        longitude: 77.6,
        contact: '+91-999-000-1111'
      }
    });
    assert.strictEqual(status, 201);
    assert(json.data.stationId);
    createdStationId = json.data.stationId;
    assert.strictEqual(json.data.stationName, 'Test Hub Foundation');
    assert.strictEqual(json.data.status, 'Active');
  });

  it('duplicate station name returns 409 DUPLICATE_VALUE', async () => {
    const { status, json } = await api(baseUrl, 'POST', '/stations', {
      token: adminToken,
      body: {
        stationName: 'Test Hub Foundation',
        latitude: 13.0,
        longitude: 78.0
      }
    });
    assert.strictEqual(status, 409);
    assert.strictEqual(json.error.code, 'DUPLICATE_VALUE');
  });

  it('admin updates a station (PATCH)', async () => {
    const { status, json } = await api(baseUrl, 'PATCH', `/stations/${createdStationId}`, {
      token: adminToken,
      body: { locationText: 'Updated Location' }
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.data.locationText, 'Updated Location');
  });

  it('admin soft-deletes an unused station (DELETE -> sets Inactive)', async () => {
    const { status, json } = await api(baseUrl, 'DELETE', `/stations/${createdStationId}`, {
      token: adminToken
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.data.ok, true);

    // Verify excluded from default list
    const { json: activeList } = await api(baseUrl, 'GET', '/stations', { token: adminToken });
    const foundActive = activeList.data.find((s) => s.stationId === createdStationId);
    assert.strictEqual(foundActive, undefined);

    // Verify included in ?status=all
    const { json: allList } = await api(baseUrl, 'GET', '/stations?status=all', { token: adminToken });
    const foundAll = allList.data.find((s) => s.stationId === createdStationId);
    assert(foundAll);
    assert.strictEqual(foundAll.status, 'Inactive');
  });

  it('admin deleting station with history returns 409 STATION_IN_USE', async () => {
    const { status, json } = await api(baseUrl, 'DELETE', '/stations/1', {
      token: adminToken
    });
    assert.strictEqual(status, 409);
    assert.strictEqual(json.error.code, 'STATION_IN_USE');
    assert(json.error.details);
  });
});
