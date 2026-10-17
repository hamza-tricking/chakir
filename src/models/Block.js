import mongoose from 'mongoose';

// One editable copy/asset block per key, e.g. "home.stats". `data` is a JSON object whose shape the frontend owns
// (its bundled defaults). A missing block means the site keeps showing the bundled defaults.
const blockSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export const Block = mongoose.model('Block', blockSchema);
