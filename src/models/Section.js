import mongoose from 'mongoose';

// Free-form copy blocks, one per key (e.g. "home.hero.title"). `data` is a JSON object owned by the frontend.
export const SECTION_PAGES = ['home', 'cars', 'about', 'contact', 'help', 'global'];

const sectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    page: { type: String, required: true, enum: SECTION_PAGES },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

sectionSchema.index({ page: 1 });

export const Section = mongoose.model('Section', sectionSchema);
