import mongoose from 'mongoose';

// Mirrors the CarSpec shape used by the frontend (src/data/cars.ts). `slug` becomes the public `id`.
const carSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['EV', 'SUV', 'Sedan', 'Luxury'] },
    type: { type: String, required: true, trim: true },
    hp: { type: String, required: true, trim: true },
    accel: { type: String, required: true, trim: true },
    range: { type: String, required: true, trim: true },
    topSpeed: { type: String, required: true, trim: true },
    price: { type: String, required: true, trim: true },
    powertrain: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

carSchema.index({ order: 1, name: 1 });

export const Car = mongoose.model('Car', carSchema);
