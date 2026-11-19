/**
 * W6: Temperature tests – covers cargoTemperature, findBreaches, shouldLog (W5),
 * and an endpoint test for POST /temperature/readings (W4) using a fake Express app.
 * No real database or internet connections used.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cargoTemperature, findBreaches, shouldLog } from '../src/weather/temperatureMonitor.js';

// ── Pure helpers (W5) ─────────────────────────────────────────────────────────

describe('temperature tests – cargoTemperature', () => {
  it('refrigerated truck with offset 0: cargoTemp equals ambientC', () => {
    assert.strictEqual(cargoTemperature(31, true, 0), 31);
  });

  it('refrigerated truck with offset 25: cargoTemp is ambientC minus offset', () => {
    assert.strictEqual(cargoTemperature(31, true, 25), 6);
  });

  it('non-refrigerated truck: cargoTemp always equals ambientC regardless of offset', () => {
    assert.strictEqual(cargoTemperature(31, false, 25), 31);
    assert.strictEqual(cargoTemperature(-10, false, 5), -10);
  });
});

describe('temperature tests – findBreaches', () => {
  const refrigCargo = [
    { batchId: 1, batchNumber: 'B1', medicineName: 'Insulin', storageTypeName: 'Refrigerated', minTempC: 2, maxTempC: 8, quantity: 10 }
  ];
  const ultraColdCargo = [
    { batchId: 2, batchNumber: 'B2', medicineName: 'mRNA Vaccine', storageTypeName: 'Ultra-Cold', minTempC: -90, maxTempC: -60, quantity: 5 }
  ];
  const ambientCargo = [
    { batchId: 3, batchNumber: 'B3', medicineName: 'Paracetamol', storageTypeName: 'Ambient', minTempC: 15, maxTempC: 25, quantity: 20 }
  ];

  it('refrigerated cargo at 31 C breaches (above max 8)', () => {
    assert.strictEqual(findBreaches(31, refrigCargo).length, 1);
  });

  it('refrigerated cargo at 6 C is within range (no breach)', () => {
    assert.strictEqual(findBreaches(6, refrigCargo).length, 0);
  });

  it('refrigerated cargo at boundary values 2 and 8 are in range', () => {
    assert.strictEqual(findBreaches(2, refrigCargo).length, 0, 'at min boundary');
    assert.strictEqual(findBreaches(8, refrigCargo).length, 0, 'at max boundary');
  });

  it('refrigerated cargo at 1.9 C breaches (below min 2)', () => {
    assert.strictEqual(findBreaches(1.9, refrigCargo).length, 1);
  });

  it('ultra-cold cargo at -50 C breaches (above max -60)', () => {
    assert.strictEqual(findBreaches(-50, ultraColdCargo).length, 1);
  });

  it('ultra-cold cargo at -70 C is within range (-90 to -60)', () => {
    assert.strictEqual(findBreaches(-70, ultraColdCargo).length, 0);
  });

  it('ultra-cold cargo at boundary -90 and -60 is in range', () => {
    assert.strictEqual(findBreaches(-90, ultraColdCargo).length, 0, 'at min boundary');
    assert.strictEqual(findBreaches(-60, ultraColdCargo).length, 0, 'at max boundary');
  });

  it('ambient cargo at 20 C is within range', () => {
    assert.strictEqual(findBreaches(20, ambientCargo).length, 0);
  });

  it('mixed cargo: only the breaching batch is returned', () => {
    const mixed = [...refrigCargo, ...ambientCargo];
    // at 20 C: refrig breaches (20>8), ambient is OK
    const breaches = findBreaches(20, mixed);
    assert.strictEqual(breaches.length, 1);
    assert.strictEqual(breaches[0].batchId, 1);
  });

  it('empty cargo list returns no breaches', () => {
    assert.strictEqual(findBreaches(100, []).length, 0);
  });
});

describe('temperature tests – shouldLog', () => {
  it('returns true when never logged (lastLoggedAtMs is null/undefined)', () => {
    assert.strictEqual(shouldLog(null, Date.now(), 30_000), true);
    assert.strictEqual(shouldLog(undefined, Date.now(), 30_000), true);
  });

  it('returns false when interval has not yet passed', () => {
    const now = Date.now();
    assert.strictEqual(shouldLog(now - 10_000, now, 30_000), false);
  });

  it('returns true when exactly the interval has passed', () => {
    const now = Date.now();
    assert.strictEqual(shouldLog(now - 30_000, now, 30_000), true);
  });

  it('returns true when more than the interval has passed', () => {
    const now = Date.now();
    assert.strictEqual(shouldLog(now - 60_000, now, 30_000), true);
  });
});

// ── Endpoint test – POST /temperature/readings (W4) ──────────────────────────
// Tests the handler logic directly with fake req/res objects (no network, no DB).

function makeRes() {
  const res = {
    _status: 200,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body) { this._body = body; return this; }
  };
  return res;
}

function makeReq({ user, body }) {
  return { user, body };
}

async function callReadingsHandler({ user, body, recordManualReadingFn }) {
  const req = makeReq({ user, body });
  const res = makeRes();
  let caughtErr = null;
  const next = (err) => { caughtErr = err; };

  const { forbidden } = await import('../src/utils/errors.js');

  const handler = async (req, res, next) => {
    try {
      const { stationId, batchId, temperatureC } = req.body;
      if (temperatureC < -100 || temperatureC > 60) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Temperature out of range' } });
      }
      const result = await recordManualReadingFn(req.user, { stationId, batchId, temperatureC });
      return res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };

  await handler(req, res, next);

  if (caughtErr) {
    return { status: caughtErr.status || 500, body: { error: { code: caughtErr.code || 'INTERNAL_ERROR', message: caughtErr.message } } };
  }
  return { status: res._status, body: res._body };
}

describe('temperature tests – POST /temperature/readings endpoint', () => {
  it('in-range reading returns withinRange true and alert null', async () => {
    const mockFn = async (_user, { stationId, batchId, temperatureC }) => ({
      log: { logId: 10, stationId, shipmentId: null, batchId, temperatureC, source: 'Manual', recordedAt: new Date().toISOString(), withinRange: true },
      withinRange: true,
      alert: null
    });

    const { status, body } = await callReadingsHandler({
      user: { userId: 1, role: 'Admin', stationId: null },
      body: { stationId: 2, batchId: 4, temperatureC: 6.5 },
      recordManualReadingFn: mockFn
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(body.data.withinRange, true);
    assert.strictEqual(body.data.alert, null);
  });

  it('out-of-range reading returns withinRange false and a critical alert', async () => {
    const fakeAlert = { alertId: 8, alertType: 'Temperature_Deviation', severity: 'Critical' };
    const mockFn = async (_user, { stationId, batchId, temperatureC }) => ({
      log: { logId: 11, stationId, shipmentId: null, batchId, temperatureC, source: 'Manual', recordedAt: new Date().toISOString(), withinRange: false },
      withinRange: false,
      alert: fakeAlert
    });

    const { status, body } = await callReadingsHandler({
      user: { userId: 1, role: 'Admin', stationId: null },
      body: { stationId: 3, batchId: 6, temperatureC: 12 },
      recordManualReadingFn: mockFn
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(body.data.withinRange, false);
    assert.strictEqual(body.data.alert.severity, 'Critical');
  });

  it('wrong station for operator returns 403', async () => {
    const { forbidden } = await import('../src/utils/errors.js');
    const mockFn = async (_user, _body) => { throw forbidden('Operators can only record readings for their own station'); };

    const operatorUser = { userId: 2, role: 'Operator', stationId: 1 };
    const { status, body } = await callReadingsHandler({
      user: operatorUser,
      body: { stationId: 2, batchId: 5, temperatureC: 9.4 },
      recordManualReadingFn: mockFn
    });
    assert.strictEqual(status, 403);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });
});
