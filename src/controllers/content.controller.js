import { Car } from '../models/Car.js';
import { FaqItem } from '../models/FaqItem.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { Section } from '../models/Section.js';
import { Revision } from '../models/Revision.js';
import {
  carCreateSchema,
  carUpdateSchema,
  faqCreateSchema,
  faqUpdateSchema,
  idParamSchema,
  revisionLabelSchema,
  sectionSchema,
  settingsSchema,
} from '../validators/content.js';
import { parseBody } from '../utils/validate.js';
import { HttpError } from '../utils/errors.js';
import { getLiveRevision, publicView, publishDraft, readDraft, replaceDraft, toCarOut } from '../services/content.js';

const SETTINGS_KEY = 'main';
const notFound = (what) => new HttpError(404, `${what} not found`);

// ---- Public -------------------------------------------------------------

export async function getPublicContent(_req, res) {
  const revision = await getLiveRevision();
  if (!revision) throw new HttpError(404, 'No published content yet');
  res.set('Cache-Control', 'public, max-age=60');
  return res.json({ publishedAt: revision.createdAt, ...publicView(revision.content) });
}

// ---- Draft, preview, publish -------------------------------------------

export async function getDraft(_req, res) {
  const draft = await readDraft();
  return res.json({ draft, preview: publicView(draft) });
}

export async function publish(req, res) {
  const { label } = parseBody(revisionLabelSchema, req.body);
  const revision = await publishDraft({ label, userId: req.user.id });
  return res.status(201).json({
    revision: { id: String(revision._id), label: revision.label, createdAt: revision.createdAt },
  });
}

export async function listRevisions(_req, res) {
  const revisions = await Revision.find().sort({ createdAt: -1 }).limit(50).select('label createdAt').lean();
  return res.json({
    items: revisions.map((r) => ({ id: String(r._id), label: r.label, createdAt: r.createdAt })),
  });
}

// Restore copies a past revision into the draft. It does not publish; the editor publishes afterwards.
export async function restoreRevision(req, res) {
  const id = parseBody(idParamSchema, req.params.id);
  const revision = await Revision.findById(id).lean();
  if (!revision) throw notFound('Revision');
  await replaceDraft(revision.content);
  return res.json({ draft: await readDraft() });
}

// ---- Cars ---------------------------------------------------------------

const carOut = (c) => ({ _id: String(c._id), ...toCarOut(c), order: c.order, visible: c.visible });

export async function listCars(_req, res) {
  const cars = await Car.find().sort({ order: 1, name: 1 }).lean();
  return res.json({ items: cars.map(carOut) });
}

export async function createCar(req, res) {
  const data = parseBody(carCreateSchema, req.body);
  const car = await Car.create(data);
  return res.status(201).json({ item: carOut(car.toObject()) });
}

export async function updateCar(req, res) {
  const id = parseBody(idParamSchema, req.params.id);
  const data = parseBody(carUpdateSchema, req.body);
  const car = await Car.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true }).lean();
  if (!car) throw notFound('Car');
  return res.json({ item: carOut(car) });
}

export async function deleteCar(req, res) {
  const id = parseBody(idParamSchema, req.params.id);
  const removed = await Car.findByIdAndDelete(id);
  if (!removed) throw notFound('Car');
  return res.status(204).end();
}

// ---- FAQ ----------------------------------------------------------------

const faqOut = (f) => ({ _id: String(f._id), question: f.question, answer: f.answer, order: f.order, visible: f.visible });

export async function listFaq(_req, res) {
  const items = await FaqItem.find().sort({ order: 1 }).lean();
  return res.json({ items: items.map(faqOut) });
}

export async function createFaq(req, res) {
  const data = parseBody(faqCreateSchema, req.body);
  const item = await FaqItem.create(data);
  return res.status(201).json({ item: faqOut(item.toObject()) });
}

export async function updateFaq(req, res) {
  const id = parseBody(idParamSchema, req.params.id);
  const data = parseBody(faqUpdateSchema, req.body);
  const item = await FaqItem.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true }).lean();
  if (!item) throw notFound('FAQ item');
  return res.json({ item: faqOut(item) });
}

export async function deleteFaq(req, res) {
  const id = parseBody(idParamSchema, req.params.id);
  const removed = await FaqItem.findByIdAndDelete(id);
  if (!removed) throw notFound('FAQ item');
  return res.status(204).end();
}

// ---- Site settings (singleton) ------------------------------------------

export async function getSettings(_req, res) {
  const s = await SiteSettings.findOne({ key: SETTINGS_KEY }).lean();
  return res.json({ settings: { phone: s?.phone ?? '', whatsapp: s?.whatsapp ?? '', email: s?.email ?? '' } });
}

export async function updateSettings(req, res) {
  const data = parseBody(settingsSchema, req.body);
  const s = await SiteSettings.findOneAndUpdate(
    { key: SETTINGS_KEY },
    { $set: data },
    { returnDocument: 'after', upsert: true, runValidators: true },
  ).lean();
  return res.json({ settings: { phone: s.phone, whatsapp: s.whatsapp, email: s.email } });
}

// ---- Sections (copy blocks keyed by name) -------------------------------

const sectionOut = (s) => ({ _id: String(s._id), key: s.key, page: s.page, data: s.data, visible: s.visible });

export async function listSections(_req, res) {
  const items = await Section.find().sort({ key: 1 }).lean();
  return res.json({ items: items.map(sectionOut) });
}

export async function upsertSection(req, res) {
  const data = parseBody(sectionSchema, req.body);
  const s = await Section.findOneAndUpdate(
    { key: data.key },
    { $set: data },
    { returnDocument: 'after', upsert: true, runValidators: true },
  ).lean();
  return res.json({ item: sectionOut(s) });
}

export async function deleteSection(req, res) {
  const removed = await Section.findOneAndDelete({ key: req.params.key });
  if (!removed) throw notFound('Section');
  return res.status(204).end();
}
