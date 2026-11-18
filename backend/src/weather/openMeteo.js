/**
 * Fetches the current ambient temperature from Open-Meteo for a given latitude and longitude.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {object} [options]
 * @param {typeof fetch} [options.fetchImpl=fetch] Custom fetch implementation
 * @param {number} [options.timeoutMs=5000] Request timeout in milliseconds
 * @returns {Promise<{ temperatureC: number, observedAt: string, source: 'Weather_API' }>}
 */
export async function fetchCurrentTemperature(
  latitude,
  longitude,
  { fetchImpl = fetch, timeoutMs = 5000 } = {}
) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'temperature_2m');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url.toString(), { signal: controller.signal });

    if (!response || !response.ok) {
      const status = response ? response.status : 'UNKNOWN';
      const statusText = response ? response.statusText : '';
      throw new Error(`Open-Meteo HTTP error: status ${status} ${statusText}`.trim());
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new Error(`Failed to parse Open-Meteo JSON response: ${err.message}`);
    }

    if (
      !data ||
      !data.current ||
      typeof data.current.temperature_2m !== 'number' ||
      !Number.isFinite(data.current.temperature_2m)
    ) {
      throw new Error('Invalid Open-Meteo response shape: current.temperature_2m must be a finite number');
    }

    return {
      temperatureC: data.current.temperature_2m,
      observedAt: data.current.time,
      source: 'Weather_API'
    };
  } finally {
    clearTimeout(timer);
  }
}
