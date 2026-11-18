import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fetchCurrentTemperature } from '../src/weather/openMeteo.js';

describe('openMeteo client', () => {
  it('returns temperature, observedAt, and source when fetch returns valid data', async () => {
    let calledUrl = null;
    const fakeFetch = async (url) => {
      calledUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          current: {
            time: '2026-11-18T10:00',
            temperature_2m: 21.5
          }
        })
      };
    };

    const result = await fetchCurrentTemperature(12.9716, 77.5946, { fetchImpl: fakeFetch });

    assert.strictEqual(result.temperatureC, 21.5);
    assert.strictEqual(result.observedAt, '2026-11-18T10:00');
    assert.strictEqual(result.source, 'Weather_API');

    const parsed = new URL(calledUrl);
    assert.strictEqual(parsed.hostname, 'api.open-meteo.com');
    assert.strictEqual(parsed.pathname, '/v1/forecast');
    assert.strictEqual(parsed.searchParams.get('latitude'), '12.9716');
    assert.strictEqual(parsed.searchParams.get('longitude'), '77.5946');
    assert.strictEqual(parsed.searchParams.get('current'), 'temperature_2m');
  });

  it('throws when the underlying fetch throws (network failure / timeout)', async () => {
    const fakeFetch = async () => {
      throw new Error('Network timeout');
    };

    await assert.rejects(
      () => fetchCurrentTemperature(12.9716, 77.5946, { fetchImpl: fakeFetch }),
      /Network timeout/
    );
  });

  it('throws an error when HTTP status is not ok', async () => {
    const fakeFetch = async () => ({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway'
    });

    await assert.rejects(
      () => fetchCurrentTemperature(12.9716, 77.5946, { fetchImpl: fakeFetch }),
      /Open-Meteo HTTP error: status 502 Bad Gateway/
    );
  });

  it('throws an error when response is not valid JSON', async () => {
    const fakeFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Unexpected token <');
      }
    });

    await assert.rejects(
      () => fetchCurrentTemperature(12.9716, 77.5946, { fetchImpl: fakeFetch }),
      /Failed to parse Open-Meteo JSON response/
    );
  });

  it('throws an error when temperature_2m is missing or not a finite number', async () => {
    const fakeFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        current: {
          time: '2026-11-18T10:00',
          temperature_2m: null
        }
      })
    });

    await assert.rejects(
      () => fetchCurrentTemperature(12.9716, 77.5946, { fetchImpl: fakeFetch }),
      /current\.temperature_2m must be a finite number/
    );
  });
});
