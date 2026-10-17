import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  });
}

// Refresh tokens carry a random jti; only its hash is stored, so a leaked DB cannot be replayed.
export function signRefreshToken(user) {
  const jti = crypto.randomBytes(32).toString('hex');
  const token = jwt.sign({ sub: String(user._id), jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
  });
  return { token, hash: sha256(token) };
}

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);
export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
