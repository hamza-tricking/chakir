import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { connectDb, isDbReady } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();

app.disable('x-powered-by');
// Behind one reverse proxy (e.g. on the server), so secure cookies and rate limits see the real client.
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: isDbReady() ? 'connected' : 'disconnected' });
});

app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

async function start() {
  // The API still starts without a database so /api/health works; data routes return 503 until it connects.
  try {
    await connectDb(env.MONGODB_URI);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
  }
  app.listen(env.PORT, () => console.log(`API listening on http://localhost:${env.PORT}`));
}

start();
