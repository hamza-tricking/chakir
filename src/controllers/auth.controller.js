import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../config/env.js';
import { isDbReady } from '../config/db.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/errors.js';
import { sha256, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';

const MAX_SESSIONS = 5;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

// Cookies are httpOnly so page scripts cannot read them.
// Cross-site deployments (frontend and API on different domains) need SameSite=None + Secure.
const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge,
});

function setSessionCookies(res, accessToken, refreshToken) {
  res.cookie('access_token', accessToken, cookieOptions(ACCESS_MAX_AGE));
  res.cookie('refresh_token', refreshToken, { ...cookieOptions(REFRESH_MAX_AGE), path: '/api/auth' });
}

function clearSessionCookies(res) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth' });
}

const publicUser = (user) => ({ id: String(user._id), email: user.email, role: user.role });

export async function login(req, res) {
  if (!isDbReady()) throw new HttpError(503, 'Database not available');
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(400, 'Invalid email or password format');

  const email = parsed.data.email.toLowerCase();
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokenHashes');
  // Same message for unknown email and wrong password, so the endpoint does not reveal which accounts exist.
  const invalid = () => new HttpError(401, 'Invalid email or password');
  if (!user) throw invalid();

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new HttpError(429, 'Too many failed attempts. Try again later.');
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    user.failedLogins += 1;
    if (user.failedLogins >= MAX_FAILED) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failedLogins = 0;
    }
    await user.save();
    throw invalid();
  }

  const accessToken = signAccessToken(user);
  const { token: refreshToken, hash } = signRefreshToken(user);
  user.failedLogins = 0;
  user.lockedUntil = null;
  user.refreshTokenHashes = [...user.refreshTokenHashes, hash].slice(-MAX_SESSIONS);
  await user.save();

  setSessionCookies(res, accessToken, refreshToken);
  return res.json({ user: publicUser(user) });
}

export async function refresh(req, res) {
  if (!isDbReady()) throw new HttpError(503, 'Database not available');
  const token = req.cookies?.refresh_token;
  if (!token) throw new HttpError(401, 'Not signed in');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearSessionCookies(res);
    throw new HttpError(401, 'Session expired');
  }

  const user = await User.findById(payload.sub).select('+refreshTokenHashes');
  const hash = sha256(token);
  if (!user || !user.refreshTokenHashes.includes(hash)) {
    // Unknown or already-rotated token: treat it as reuse and drop every session for this user.
    if (user) {
      user.refreshTokenHashes = [];
      await user.save();
    }
    clearSessionCookies(res);
    throw new HttpError(401, 'Session expired');
  }

  // Rotation: the used refresh token is replaced by a new one.
  const { token: newRefresh, hash: newHash } = signRefreshToken(user);
  user.refreshTokenHashes = user.refreshTokenHashes.filter((h) => h !== hash).concat(newHash).slice(-MAX_SESSIONS);
  await user.save();

  setSessionCookies(res, signAccessToken(user), newRefresh);
  return res.json({ user: publicUser(user) });
}

export async function logout(req, res) {
  const token = req.cookies?.refresh_token;
  if (token && isDbReady()) {
    const hash = sha256(token);
    await User.updateOne({ refreshTokenHashes: hash }, { $pull: { refreshTokenHashes: hash } });
  }
  clearSessionCookies(res);
  return res.status(204).end();
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(401, 'Session expired');
  return res.json({ user: publicUser(user) });
}
