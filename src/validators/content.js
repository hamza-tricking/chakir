import { z } from 'zod';
import { SECTION_PAGES } from '../models/Section.js';

// Input schemas. No .default() here on purpose: PATCH uses .partial(), and defaults would overwrite stored values.
const text = (max) => z.string().trim().min(1).max(max);
const longText = (max) => z.string().trim().min(1).max(max);
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const carFields = {
  slug: z.string().trim().toLowerCase().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Use lowercase letters, digits and dashes'),
  name: text(80),
  fullName: text(160),
  category: z.enum(['EV', 'SUV', 'Sedan', 'Luxury']),
  type: text(120),
  hp: text(40),
  accel: text(40),
  range: text(40),
  topSpeed: text(40),
  price: text(40),
  powertrain: text(160),
  order: z.number().int().min(0).max(100000),
  visible: z.boolean(),
};

export const carCreateSchema = z.object(carFields);
export const carUpdateSchema = z.object(carFields).partial();

const faqFields = {
  question: text(300),
  answer: longText(2000),
  order: z.number().int().min(0).max(100000),
  visible: z.boolean(),
};

export const faqCreateSchema = z.object(faqFields);
export const faqUpdateSchema = z.object(faqFields).partial();

export const settingsSchema = z.object({
  phone: z.string().trim().max(40),
  whatsapp: z.string().trim().max(40),
  email: z.union([z.literal(''), z.email().max(200)]),
});

export const sectionSchema = z.object({
  key: z.string().trim().min(1).max(120).regex(/^[a-z0-9._-]+$/, 'Use lowercase letters, digits, dots, dashes or underscores'),
  page: z.enum(SECTION_PAGES),
  data: z.record(z.string(), z.unknown()),
  visible: z.boolean(),
});

export const revisionLabelSchema = z.object({
  label: z.string().trim().max(120).default(''),
});

export const idParamSchema = objectId;
