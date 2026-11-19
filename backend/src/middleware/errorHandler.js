import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';

export function errorHandler(err, req, res, next) {
  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong';
  let details;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation error';
    const issues = err.issues || err.errors || [];
    details = issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
  } else if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    status = 409;
    code = 'DUPLICATE_VALUE';
    message = 'Duplicate entry already exists';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Referenced record does not exist';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
    status = 409;
    code = 'IN_USE';
    message = 'Record is referenced by other records and cannot be deleted';
  } else if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.errno === 3819) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Check constraint violated';
  } else {
    console.error('Unhandled server error:', err);
  }

  const errorResponse = { code, message };
  if (details !== undefined) {
    errorResponse.details = details;
  }

  res.status(status).json({ error: errorResponse });
}

export default errorHandler;
