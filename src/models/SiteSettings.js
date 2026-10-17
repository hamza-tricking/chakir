import mongoose from 'mongoose';

// Singleton: exactly one document, always keyed 'main'.
const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    phone: { type: String, default: '', trim: true },
    whatsapp: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
  },
  { timestamps: true },
);

export const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);
