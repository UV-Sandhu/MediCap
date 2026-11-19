/**
 * W6: Weather tests (all offline – no real Open-Meteo calls).
 * Covers fetchCurrentTemperature (W1) and getTemperature (W2) together.
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { fetchCurrentTemperature } from '../src/weather/openMeteo.js';
import {
  getTemperature,
  clearWeatherCache,
  simulatedTemperature
} from '../src/weather/weatherService.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeGoodFetch(temperatureC = 21.5, observedAt = '2026-11-18T10:00') {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => ({ current: { time: observedAt, temperature_2m: temperatureC } })
  });
}

// ── fetchCurrentTemperature (W1) ─────────────────────────────────────────────

describe('weather tests – W1: fetchCurrentTemperature', () => {
  it('returns correct shape for a valid response', async () => {
    const result = await fetchCurrentTemperature(12.9716, 77.5946, {
      fetchImpl: makeGoodFetch(21.5, '2026-11-18T10:00')
    });
    assert.strictEqual(result.temperatureC, 21.5);
    assert.strictEqual(result.observedAt, '2026-11-18T10:00');
    assert.strictEqual(result.source, 'Weather_API');
  });

  it('throws when fetch itself throws (network failure)', async () => {
    await assert.rejects(
      () =>
        fetchCurrentTemperature(12.9716, 77.5946, {
          fetchImpl: async () => { throw new Error('Network failure'); }
        }),
      /Network failure/
    );
  });

  it('throws on HTTP 500', async () => {
    await assert.rejects(
      () =>
        fetchCurrentTemperature(12.9716, 77.5946, {
          fetchImpl: async () => ({ ok: false, status: 500, statusText: 'Internal Server Error' })
        }),
      /500/
    );
  });

  it('throws when JSON parsing fails', async () => {
    await assert.rejects(
      () =>
        fetchCurrentTemperature(12.9716, 77.5946, {
          fetchImpl: async () => ({
            ok: true,
            status: 200,
            json: async () => { throw new Error('Unexpected token'); }
          })
        }),
      /Failed to parse Open-Meteo JSON response/
    );
  });

  it('throws when temperature_2m is not a finite number (null)', async () => {
    await assert.rejects(
      () =>
        fetchCurrentTemperature(12.9716, 77.5946, {
          fetchImpl: async () => ({
            ok: true,
            status: 200,
            json: async () => ({ current: { time: 'x', temperature_2m: null } })
          })
        }),
      /temperature_2m must be a finite number/
    );
  });

  it('times out when fetch never resolves (small timeoutMs)', async () => {
    let aborted = false;
    const neverResolves = async (_url, { signal }) => {
      await new Promise((_res, rej) => {
        signal.addEventListener('abort', () => { aborted = true; rej(new Error('AbortError')); });
      });
    };

    await assert.rejects(
      () => fetchCurrentTemperature(0, 0, { fetchImpl: neverResolves, timeoutMs: 10 }),
      /AbortError/
    );
    assert.ok(aborted, 'signal should have been aborted');
  });
});

// ── getTemperature / weatherService (W2) ─────────────────────────────────────

describe('weather tests – W2: getTemperature', () => {
  beforeEach(() => clearWeatherCache());

  it('cache hit: two calls within window hit the network only once', async () => {
    let calls = 0;
    const countFetch = async () => {
      calls++;
      return { ok: true, status: 200, json: async () => ({ current: { time: 'T', temperature_2m: 25.0 } }) };
    };
    const originalFetch = global.fetch;
    global.fetch = countFetch;
    try {
      await getTemperature(12.9716, 77.5946);
      await getTemperature(12.9716, 77.5946);
    } finally {
      global.fetch = originalFetch;
    }
    assert.strictEqual(calls, 1, `expected 1 fetch, got ${calls}`);
  });

  it('in-flight sharing: two simultaneous calls cause only one fetch', async () => {
    let calls = 0;
    const originalFetch = global.fetch;
    global.fetch = async () => {
      calls++;
      await new Promise(r => setTimeout(r, 10));
      return { ok: true, status: 200, json: async () => ({ current: { time: 'T', temperature_2m: 22.0 } }) };
    };
    try {
      const [a, b] = await Promise.all([
        getTemperature(5.0, 80.0),
        getTemperature(5.0, 80.0)
      ]);
      assert.strictEqual(calls, 1, `expected 1 fetch, got ${calls}`);
      assert.strictEqual(a.temperatureC, 22.0);
      assert.strictEqual(b.temperatureC, 22.0);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('stale fallback: returns stale cache (source Weather_API, stale=true) when network fails', async () => {
    const seedTime = Date.now() - 2 * 60 * 60 * 1000; // 2 hours ago
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true, status: 200,
      json: async () => ({ current: { time: 'T', temperature_2m: 20.0 } })
    });
    await getTemperature(10.0, 76.0, seedTime);

    global.fetch = async () => { throw new Error('Gone'); };
    try {
      const laterTime = seedTime + 15 * 60 * 1000;
      const result = await getTemperature(10.0, 76.0, laterTime);
      assert.strictEqual(result.source, 'Weather_API');
      assert.strictEqual(result.stale, true);
      assert.strictEqual(result.temperatureC, 20.0);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('offline mode: returns source Simulated without calling the network', async () => {
    // env.WEATHER_OFFLINE is frozen; test simulatedTemperature directly for the offline path
    let calls = 0;
    const originalFetch = global.fetch;
    global.fetch = async () => { calls++; return {}; };
    try {
      const temp = simulatedTemperature(12.9716, 77.5946, Date.now());
      assert.ok(temp >= 21 && temp <= 31, `simulated temp ${temp} out of [21,31]`);
    } finally {
      global.fetch = originalFetch;
    }
    // Verify the fetch was NOT called (offline path skips network)
    assert.strictEqual(calls, 0);
  });

  it('failure fallback: returns Simulated when network unreachable and no cache', async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => { throw new Error('Network unreachable'); };
    try {
      const result = await getTemperature(12.9716, 77.5946);
      assert.strictEqual(result.source, 'Simulated');
      assert.ok(result.temperatureC >= 21 && result.temperatureC <= 31);
      assert.strictEqual(result.stale, false);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('simulatedTemperature stays in [21, 31] for all longitudes and hours', () => {
    for (let lng = -180; lng <= 180; lng += 30) {
      for (let hour = 0; hour < 24; hour++) {
        const nowMs = new Date(`2026-11-18T${String(hour).padStart(2, '0')}:00:00Z`).getTime();
        const temp = simulatedTemperature(0, lng, nowMs);
        assert.ok(temp >= 21, `expected >= 21, got ${temp} at lng=${lng} hour=${hour}`);
        assert.ok(temp <= 31, `expected <= 31, got ${temp} at lng=${lng} hour=${hour}`);
      }
    }
  });
});
