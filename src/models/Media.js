import mongoose from 'mongoose';

// Uploaded images live in the database so they survive redeploys and need no extra storage setup.
// The file bytes are served from /api/public/media/:id; listings never select `data`.
const mediaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    mime: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);

mediaSchema.index({ createdAt: -1 });

export const Media = mongoose.model('Media', mediaSchema);
