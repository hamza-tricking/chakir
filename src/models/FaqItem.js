import mongoose from 'mongoose';

const faqItemSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

faqItemSchema.index({ order: 1 });

export const FaqItem = mongoose.model('FaqItem', faqItemSchema);
