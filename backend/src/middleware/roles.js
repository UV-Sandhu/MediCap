// STUB
export function requireRole(...roles) {
  return (req, res, next) => next();
}

export function assertStationAccess(user, stationId) {
  return true;
}

export function resolveStationScope(user, requestedStationId) {
  return requestedStationId ?? null;
}

export default {
  requireRole,
  assertStationAccess,
  resolveStationScope
};
