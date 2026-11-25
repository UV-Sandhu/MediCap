import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, api, loginAs } from './helpers.js';
import { query } from '../src/db/pool.js';

describe('users endpoints', () => {
  let server;
  let baseUrl;
  let adminToken;
  let opToken;
  let createdUserId = null;

  before(async () => {
    server = await startServer();
    baseUrl = server.baseUrl;
    adminToken = await loginAs(baseUrl, 'admin@medicap.local');
    opToken = await loginAs(baseUrl, 'karthik@medicap.local');
  });

  after(async () => {
    if (createdUserId) {
      await query('DELETE FROM users WHERE user_id = ?', [createdUserId]);
    }
    if (server) await server.close();
  });

  it('operator is blocked from /users endpoints (403)', async () => {
    const { status, json } = await api(baseUrl, 'GET', '/users', { token: opToken });
    assert.strictEqual(status, 403);
    assert.strictEqual(json.error.code, 'FORBIDDEN');
  });

  it('admin lists users and password hashes are never exposed', async () => {
    const { status, json } = await api(baseUrl, 'GET', '/users', { token: adminToken });
    assert.strictEqual(status, 200);
    assert(Array.isArray(json.data));
    assert(json.data.length >= 6);
    for (const u of json.data) {
      assert.strictEqual(u.password_hash, undefined);
      assert.strictEqual(u.passwordHash, undefined);
      assert(u.email);
      assert(u.role);
    }
  });

  it('creating an operator without stationId returns 400 VALIDATION_ERROR', async () => {
    const { status, json } = await api(baseUrl, 'POST', '/users', {
      token: adminToken,
      body: {
        fullName: 'Missing Station Op',
        email: 'missing@medicap.local',
        password: 'Password@123',
        role: 'Operator'
      }
    });
    assert.strictEqual(status, 400);
    assert.strictEqual(json.error.code, 'VALIDATION_ERROR');
  });

  it('admin creates an operator with valid stationId (201)', async () => {
    const { status, json } = await api(baseUrl, 'POST', '/users', {
      token: adminToken,
      body: {
        fullName: 'Foundation Test User',
        email: 'foundation.user@medicap.local',
        password: 'Password@123',
        role: 'Operator',
        stationId: 4
      }
    });
    assert.strictEqual(status, 201);
    assert(json.data.userId);
    createdUserId = json.data.userId;
    assert.strictEqual(json.data.email, 'foundation.user@medicap.local');
    assert.strictEqual(json.data.stationId, 4);
    assert.strictEqual(json.data.password_hash, undefined);
    assert.strictEqual(json.data.passwordHash, undefined);

    // Verify user can log in
    const userToken = await loginAs(baseUrl, 'foundation.user@medicap.local');
    assert(userToken);
  });

  it('duplicate email returns 409 DUPLICATE_VALUE', async () => {
    const { status, json } = await api(baseUrl, 'POST', '/users', {
      token: adminToken,
      body: {
        fullName: 'Duplicate Email',
        email: 'foundation.user@medicap.local',
        password: 'Password@123',
        role: 'Admin'
      }
    });
    assert.strictEqual(status, 409);
    assert.strictEqual(json.error.code, 'DUPLICATE_VALUE');
  });

  it('admin updates user details (PATCH)', async () => {
    const { status, json } = await api(baseUrl, 'PATCH', `/users/${createdUserId}`, {
      token: adminToken,
      body: { fullName: 'Updated Foundation User' }
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.data.fullName, 'Updated Foundation User');
  });

  it('admin deleting self returns 409 CANNOT_DELETE_SELF', async () => {
    const { status, json } = await api(baseUrl, 'DELETE', '/users/1', {
      token: adminToken
    });
    assert.strictEqual(status, 409);
    assert.strictEqual(json.error.code, 'CANNOT_DELETE_SELF');
  });

  it('admin deleting user with history (Karthik, id 2) returns 409 USER_IN_USE', async () => {
    const { status, json } = await api(baseUrl, 'DELETE', '/users/2', {
      token: adminToken
    });
    assert.strictEqual(status, 409);
    assert.strictEqual(json.error.code, 'USER_IN_USE');
  });

  it('admin deleting newly created user succeeds (200)', async () => {
    const { status, json } = await api(baseUrl, 'DELETE', `/users/${createdUserId}`, {
      token: adminToken
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.data.ok, true);
    createdUserId = null; // Cleaned up
  });
});
