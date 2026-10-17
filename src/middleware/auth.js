import { HttpError } from '../utils/errors.js';
import { verifyAccessToken } from '../utils/tokens.js';

// Reads the access token from the httpOnly cookie, or from "Authorization: Bearer" for API clients.
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = req.cookies?.access_token || bearer;
  if (!token) return next(new HttpError(401, 'Not signed in'));
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new HttpError(401, 'Session expired'));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Not allowed'));
    }
    return next();
  };
}
