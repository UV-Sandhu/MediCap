import { fetchCurrentTemperature } from './openMeteo.js';
import env from '../config/env.js';

/** @type {Map<string, { temperatureC: number, fetchedAt: string, observedAt: string }>} */
const cache = new Map();

/** @type {Map<string, Promise<any>>} */
const inFlight = new Map();

/** Throttled warn: log at most once per minute */
let lastWarnMs = 0;
function throttledWarn(msg) {
  const now = Date.now();
  if (now - lastWarnMs >= 60_000) {
    console.warn('[weatherService]', msg);
    lastWarnMs = now;
  }
}

/**
 * Builds the cache key from lat/lng each rounded to 1 decimal place (~11 km grid).
 */
function cacheKey(latitude, longitude) {
  return `${Math.round(latitude * 10) / 10},${Math.round(longitude * 10) / 10}`;
}

/**
 * Simulated temperature based on longitude-adjusted local hour.
 * Formula: 26 + 5 * sin(2 * PI * (localHour - 9) / 24), rounded to 1 decimal.
 */
export function simulatedTemperature(latitude, longitude, nowMs = Date.now()) {
  const utcHour = new Date(nowMs).getUTCHours() + new Date(nowMs).getUTCMinutes() / 60;
  const localHour = ((utcHour + longitude / 15) % 24 + 24) % 24;
  return Math.round((26 + 5 * Math.sin(2 * Math.PI * (localHour - 9) / 24)) * 10) / 10;
}

/**
 * Fetches the current temperature for a location, using the cache and offline fallback.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} [now] Override for Date.now() – used in tests
 * @returns {Promise<{ temperatureC: number, source: 'Weather_API' | 'Simulated', fetchedAt: string, stale: boolean }>}
 */
export async function getTemperature(latitude, longitude, now = Date.now()) {
  const key = cacheKey(latitude, longitude);
  const cacheMinMs = (env.WEATHER_CACHE_MIN ?? 10) * 60 * 1000;
  const staleMaxMs = 6 * 60 * 60 * 1000;

  // (a) WEATHER_OFFLINE: skip to simulated
  if (env.WEATHER_OFFLINE) {
    return {
      temperatureC: simulatedTemperature(latitude, longitude, now),
      source: 'Simulated',
      fetchedAt: new Date(now).toISOString(),
      stale: false
    };
  }

  // (b) Fresh cache hit
  const cached = cache.get(key);
  if (cached) {
    const age = now - new Date(cached.fetchedAt).getTime();
    if (age <= cacheMinMs) {
      return {
        temperatureC: cached.temperatureC,
        source: 'Weather_API',
        fetchedAt: cached.fetchedAt,
        stale: false
      };
    }
  }

  // (c) Call fetchCurrentTemperature with in-flight sharing
  if (!inFlight.has(key)) {
    const promise = fetchCurrentTemperature(latitude, longitude)
      .then(result => {
        const fetchedAt = new Date(now).toISOString();
        cache.set(key, {
          temperatureC: result.temperatureC,
          fetchedAt,
          observedAt: result.observedAt
        });
        return result;
      })
      .finally(() => {
        inFlight.delete(key);
      });
    inFlight.set(key, promise);
  }

  try {
    const result = await inFlight.get(key);
    const fetchedAt = cache.get(key)?.fetchedAt ?? new Date(now).toISOString();
    return {
      temperatureC: result.temperatureC,
      source: 'Weather_API',
      fetchedAt,
      stale: false
    };
  } catch (err) {
    throttledWarn(`API call failed for ${key}: ${err.message}. Trying stale cache or simulated.`);

    // (d) Stale cache (up to 6 hours old)
    if (cached) {
      const age = now - new Date(cached.fetchedAt).getTime();
      if (age <= staleMaxMs) {
        return {
          temperatureC: cached.temperatureC,
          source: 'Weather_API',
          fetchedAt: cached.fetchedAt,
          stale: true
        };
      }
    }

    // (e) Simulated fallback
    return {
      temperatureC: simulatedTemperature(latitude, longitude, now),
      source: 'Simulated',
      fetchedAt: new Date(now).toISOString(),
      stale: false
    };
  }
}

/**
 * Clears the weather cache (for use in tests).
 */
export function clearWeatherCache() {
  cache.clear();
  inFlight.clear();
}
