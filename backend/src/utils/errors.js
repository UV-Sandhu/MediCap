export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message = 'Validation error', details) {
  return new AppError(400, 'VALIDATION_ERROR', message, details);
}

export function unauthenticated(message = 'Unauthenticated') {
  return new AppError(401, 'UNAUTHENTICATED', message);
}

export function forbidden(message = 'Forbidden') {
  return new AppError(403, 'FORBIDDEN', message);
}

export function notFound(message = 'Not found') {
  return new AppError(404, 'NOT_FOUND', message);
}

export function conflict(code, message = 'Conflict', details) {
  return new AppError(409, code, message, details);
}

export default {
  AppError,
  badRequest,
  unauthenticated,
  forbidden,
  notFound,
  conflict
};
