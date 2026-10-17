// Usage (values come from the environment, never from the repo):
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD="a-long-password-here" npm run create-admin
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';

if (!email || password.length < 12) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (password must be at least 12 characters).');
  process.exit(1);
}

await mongoose.connect(env.MONGODB_URI);
const passwordHash = await bcrypt.hash(password, 12);
await User.findOneAndUpdate(
  { email },
  { $set: { passwordHash, role: 'admin', failedLogins: 0, lockedUntil: null } },
  { upsert: true, returnDocument: "after" },
);
console.log(`Admin ready: ${email}`);
await mongoose.disconnect();
