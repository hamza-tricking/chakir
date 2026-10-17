import { HttpError } from '../utils/errors.js';

export function notFound(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Last middleware: never leaks stack traces or internal messages to the client in production.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  const status = err.status && err.status < 600 ? err.status : 500;
  if (status >= 500) console.error(err);
  const body = { error: status >= 500 ? 'Server error' : err.message };
  if (err.details) body.details = err.details;
  return res.status(status).json(body);
}
