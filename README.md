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

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | none | Liveness and DB state |
| POST | `/api/auth/login` | none | Sets `access_token` (15m) and `refresh_token` (7d) cookies |
| POST | `/api/auth/refresh` | refresh cookie | Rotates the refresh token |
| POST | `/api/auth/logout` | refresh cookie | Revokes this session |
| GET | `/api/auth/me` | access cookie or `Authorization: Bearer` | Current user |
| GET | `/api/public/content` | none | Published content for the site (visible items, settings and blocks). 404 until the first publish |
| GET | `/api/public/media/:id` | none | An uploaded image, cached for a year and readable from other origins |
| GET | `/api/admin/draft` | editor or admin | Full draft (including hidden items) and the public preview |
| GET/POST | `/api/admin/cars` | editor or admin | List and create cars |
| PATCH/DELETE | `/api/admin/cars/:id` | editor or admin | Edit and delete a car |
| GET/POST | `/api/admin/faq` | editor or admin | List and create FAQ items |
| PATCH/DELETE | `/api/admin/faq/:id` | editor or admin | Edit and delete a FAQ item |
| GET/PUT | `/api/admin/settings` | editor or admin | Phone, WhatsApp and email |
| GET | `/api/admin/blocks` | editor or admin | Editable page copy blocks (draft) |
| PUT/DELETE | `/api/admin/blocks/:key` | editor or admin | Save a block (`{ data }`), or delete it so the site uses its bundled copy |
| GET/POST | `/api/admin/media` | editor or admin | List images; upload one as the raw body (`Content-Type: image/*`, `?name=`, up to 10 MB) |
| DELETE | `/api/admin/media/:id` | editor or admin | Delete an uploaded image |
| POST | `/api/admin/publish` | admin | Snapshot the draft as a new revision (goes live). Needs at least 3 visible cars |
| GET | `/api/admin/revisions` | editor or admin | Last 50 revisions |
| POST | `/api/admin/revisions/:id/restore` | admin | Copy a revision into the draft. Does not publish |

Drafts are the working copies. Publish creates an immutable revision, and the newest revision is what the public API serves.

## Security notes

- Passwords are hashed with bcrypt (cost 12). The same error message is returned for unknown email and wrong password.
- Five failed logins lock the account for 15 minutes. Login is also rate-limited per IP.
- Refresh tokens are rotated on every use. The server stores only their SHA-256 hashes. Reusing an old refresh token revokes all sessions for that user.
- Cookies are `httpOnly`. In production they are `Secure` and `SameSite=None`, which is needed when the frontend (Vercel) and the API are on different domains. The API must then be served over HTTPS.
- `CLIENT_ORIGIN` must list the exact frontend origin for CORS with credentials.
