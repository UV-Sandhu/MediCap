import { notFound } from '../utils/errors.js';

export function notFoundHandler(req, res, next) {
  next(notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export default notFoundHandler;
