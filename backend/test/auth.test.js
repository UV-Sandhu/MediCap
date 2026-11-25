import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, api, loginAs } from './helpers.js';

describe('auth endpoints', () => {
  let server;
  let baseUrl;

  before(async () => {
    server = await startServer();
    baseUrl = server.baseUrl;
  });

  after(async () => {
    if (server) await server.close();
  });

  it('login with email succeeds for admin and returns User shape without password hash', async () => {
    const { status, json } = await api(baseUrl, 'POST', '/auth/login', {
      body: { identifier: 'admin@medicap.local', password: 'Password@123' }
    });
    assert.strictEqual(status, 200);
    assert(json.data.token);
    assert.strictEqual(json.data.user.role, 'Admin');
    assert.strictEqual(json.data.user.stationId, null);
    assert.strictEqual(json.data.user.password_hash, undefined);
    assert.strictEqual(json.data.user.passwordHash, undefined);
  });

  it('login with username prefix succeeds for operator', async () => {
    const { status, json } = await api(baseUrl, 'POST', '/auth/login', {
      body: { identifier: 'meera', password: 'Password@123' }
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.data.user.role, 'Operator');
    assert.strictEqual(json.data.user.stationId, 2);
    assert.strictEqual(json.data.user.stationName, 'Station B - Tumakuru');
  });

  it('login with wrong password returns 401 INVALID_CREDENTIALS', async () => {
    const { status, json } = await api(baseUrl, 'POST', '/auth/login', {
      body: { identifier: 'admin@medicap.local', password: 'wrong' }
    });
    assert.strictEqual(status, 401);
    assert.strictEqual(json.error.code, 'INVALID_CREDENTIALS');
  });

  it('login with unknown identifier returns 401 INVALID_CREDENTIALS', async () => {
    const { status, json } = await api(baseUrl, 'POST', '/auth/login', {
      body: { identifier: 'nonexistent@medicap.local', password: 'Password@123' }
    });
    assert.strictEqual(status, 401);
    assert.strictEqual(json.error.code, 'INVALID_CREDENTIALS');
  });

  it('GET /auth/me without token returns 401 UNAUTHENTICATED', async () => {
    const { status, json } = await api(baseUrl, 'GET', '/auth/me');
    assert.strictEqual(status, 401);
    assert.strictEqual(json.error.code, 'UNAUTHENTICATED');
  });

  it('GET /auth/me with valid token returns current user', async () => {
    const token = await loginAs(baseUrl, 'admin@medicap.local');
    const { status, json } = await api(baseUrl, 'GET', '/auth/me', { token });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.data.email, 'admin@medicap.local');
    assert.strictEqual(json.data.role, 'Admin');
  });

  it('POST /auth/logout returns ok true', async () => {
    const token = await loginAs(baseUrl, 'admin@medicap.local');
    const { status, json } = await api(baseUrl, 'POST', '/auth/logout', { token });
    assert.strictEqual(status, 200);
    assert.strictEqual(json.data.ok, true);
  });
});
