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
  // Mongo duplicate key (e.g. a car slug that already exists)
  if (err.code === 11000) {
    return res.status(409).json({ error: 'An item with this value already exists' });
  }
  const status = err.status && err.status < 600 ? err.status : 500;
  // 503 is our own "database not available" message, so it is safe to show. Other 5xx hide details.
  const hideMessage = status >= 500 && status !== 503;
  if (hideMessage) console.error(err);
  const body = { error: hideMessage ? 'Server error' : err.message };
  if (err.details) body.details = err.details;
  return res.status(status).json(body);
}
