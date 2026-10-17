import mongoose from 'mongoose';

// A published snapshot of the full draft (including hidden items), so restore is lossless.
// The newest revision is what the public API serves.
const revisionSchema = new mongoose.Schema(
  {
    label: { type: String, default: '', trim: true, maxlength: 120 },
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

revisionSchema.index({ createdAt: -1 });

export const Revision = mongoose.model('Revision', revisionSchema);
