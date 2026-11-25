import { ApiError } from '../api/client.js';
import { findUserById } from './fixtures/auth.js';
import { authHandlers } from './handlers/auth.js';
import { stationHandlers } from './handlers/stations.js';
import { healthHandlers } from './handlers/health.js';
import { alertHandlers } from './handlers/alerts.js';

const handlers = [
  ...authHandlers,
  ...stationHandlers,
  ...healthHandlers,
  ...alertHandlers,
];

export function registerHandlers(newHandlers) {
  handlers.push(...newHandlers);
}

export function decodeMockToken(token) {
  if (!token) return null;
  const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
  const match = raw.match(/^mock-(\d+)$/);
  if (!match) return null;
  return findUserById(match[1]);
}

export async function mockRouter(method, path, { query = {}, body = null, token = null } = {}) {
  const cleanPath = path.split('?')[0];
  const user = decodeMockToken(token);

  for (const h of handlers) {
    if (h.method.toUpperCase() === method.toUpperCase()) {
      const match = cleanPath.match(h.pattern);
      if (match) {
        try {
          const result = await h.handle({
            params: match,
            query,
            body,
            user,
            token,
          });
          return result;
        } catch (err) {
          if (err instanceof ApiError) throw err;
          throw new ApiError(500, 'INTERNAL_ERROR', null, err.message);
        }
      }
    }
  }

  throw new ApiError(404, 'NOT_FOUND', null, `No mock handler found for ${method} ${cleanPath}`);
}
