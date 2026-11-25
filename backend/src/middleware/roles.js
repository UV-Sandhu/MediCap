import { forbidden } from '../utils/errors.js';

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(forbidden('Access denied'));
    }
    next();
  };
}

export function assertStationAccess(user, stationId) {
  if (!user) {
    throw forbidden('User not authenticated');
  }
  if (user.role === 'Admin') {
    return true;
  }
  if (user.role === 'Operator') {
    if (
      stationId !== undefined &&
      stationId !== null &&
      Number(user.stationId) === Number(stationId)
    ) {
      return true;
    }
    throw forbidden('Forbidden: access to this station is not allowed');
  }
  throw forbidden('Forbidden');
}

export function resolveStationScope(user, requestedStationId) {
  if (!user) {
    throw forbidden('User not authenticated');
  }
  if (user.role === 'Operator') {
    if (
      requestedStationId !== undefined &&
      requestedStationId !== null &&
      requestedStationId !== '' &&
      Number(requestedStationId) !== Number(user.stationId)
    ) {
      throw forbidden('Forbidden: operator cannot access other stations');
    }
    return user.stationId;
  }
  if (user.role === 'Admin') {
    return requestedStationId !== undefined && requestedStationId !== null && requestedStationId !== ''
      ? Number(requestedStationId)
      : null;
  }
  throw forbidden('Forbidden');
}

export default {
  requireRole,
  assertStationAccess,
  resolveStationScope
};
