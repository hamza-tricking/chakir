import { isDbReady } from '../config/db.js';
import { HttpError } from '../utils/errors.js';

// Content routes need MongoDB. Without it they fail fast with 503 instead of hanging on buffered queries.
export function requireDb(_req, _res, next) {
  if (!isDbReady()) return next(new HttpError(503, 'Database not available'));
  return next();
}
