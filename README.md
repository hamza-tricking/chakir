# ZHUOYUE API

Node.js + Express + Mongoose (MongoDB) + JWT. Runs on port 4000 by default and is separate from the Next.js frontend.

## Setup

```bash
cd server
npm install
cp .env.example .env   # then edit .env with real values
```

Generate two different secrets (at least 32 characters each) and paste them into `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`MONGODB_URI` points to MongoDB (local, or MongoDB Atlas). The API still starts without a database; `/api/health` reports the connection state.

## Create the first admin

Values come from the environment for one run, so they never reach a file:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD="a-long-password-of-12-chars-or-more" npm run create-admin
```

## Run

```bash
npm run dev     # watches for changes
npm start       # production
```

## Endpoints (so far)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | none | Liveness and DB state |
| POST | `/api/auth/login` | none | Sets `access_token` (15m) and `refresh_token` (7d) cookies |
| POST | `/api/auth/refresh` | refresh cookie | Rotates the refresh token |
| POST | `/api/auth/logout` | refresh cookie | Revokes this session |
| GET | `/api/auth/me` | access cookie or `Authorization: Bearer` | Current user |

## Security notes

- Passwords are hashed with bcrypt (cost 12). The same error message is returned for unknown email and wrong password.
- Five failed logins lock the account for 15 minutes. Login is also rate-limited per IP.
- Refresh tokens are rotated on every use. The server stores only their SHA-256 hashes. Reusing an old refresh token revokes all sessions for that user.
- Cookies are `httpOnly`. In production they are `Secure` and `SameSite=None`, which is needed when the frontend (Vercel) and the API are on different domains. The API must then be served over HTTPS.
- `CLIENT_ORIGIN` must list the exact frontend origin for CORS with credentials.
