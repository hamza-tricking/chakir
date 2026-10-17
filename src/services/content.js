import { Car } from '../models/Car.js';
import { FaqItem } from '../models/FaqItem.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { Section } from '../models/Section.js';
import { Revision } from '../models/Revision.js';
import { HttpError } from '../utils/errors.js';

// The home hero, compare lab and scanner index into the car list, so the site needs at least this many.
export const MIN_VISIBLE_CARS = 3;

const SETTINGS_KEY = 'main';

// Shape the frontend already uses (CarSpec in src/components/SpecsHUD.tsx). slug is exposed as `id`.
export const toCarOut = (car) => ({
  id: car.slug,
  name: car.name,
  fullName: car.fullName,
  category: car.category,
  type: car.type,
  hp: car.hp,
  accel: car.accel,
  range: car.range,
  topSpeed: car.topSpeed,
  price: car.price,
  powertrain: car.powertrain,
});

// Full draft: includes hidden items. Used by the admin editor, preview and revisions.
export async function readDraft() {
  const [cars, faq, settings, sections] = await Promise.all([
    Car.find().sort({ order: 1, name: 1 }).lean(),
    FaqItem.find().sort({ order: 1 }).lean(),
    SiteSettings.findOne({ key: SETTINGS_KEY }).lean(),
    Section.find().sort({ key: 1 }).lean(),
  ]);
  return {
    cars: cars.map((c) => ({ ...toCarOut(c), order: c.order, visible: c.visible, _id: String(c._id) })),
    faq: faq.map((f) => ({ _id: String(f._id), question: f.question, answer: f.answer, order: f.order, visible: f.visible })),
    settings: { phone: settings?.phone ?? '', whatsapp: settings?.whatsapp ?? '', email: settings?.email ?? '' },
    sections: sections.map((s) => ({ _id: String(s._id), key: s.key, page: s.page, data: s.data, visible: s.visible })),
  };
}

// What the public site sees: visible items only, in order, without internal fields.
export function publicView(content) {
  const cars = (content.cars || []).filter((c) => c.visible).map(({ _id, order, visible, ...car }) => car);
  const faq = (content.faq || [])
    .filter((f) => f.visible)
    .map(({ question, answer }) => ({ q: question, a: answer }));
  const sections = {};
  for (const s of content.sections || []) {
    if (s.visible) sections[s.key] = s.data;
  }
  return { cars, faq, settings: content.settings, sections };
}

// Copies a full content snapshot into the working collections (used by restore).
export async function replaceDraft(content) {
  await Promise.all([Car.deleteMany({}), FaqItem.deleteMany({}), Section.deleteMany({})]);
  if (content.cars?.length) {
    await Car.insertMany(content.cars.map(({ id, _id, ...c }) => ({ ...c, slug: id })));
  }
  if (content.faq?.length) {
    await FaqItem.insertMany(content.faq.map(({ _id, ...f }) => f));
  }
  if (content.sections?.length) {
    await Section.insertMany(content.sections.map(({ _id, ...s }) => s));
  }
  await SiteSettings.updateOne({ key: SETTINGS_KEY }, { $set: content.settings ?? {} }, { upsert: true });
}

// Latest revision is the live site.
export async function getLiveRevision() {
  return Revision.findOne().sort({ createdAt: -1 }).lean();
}

export async function publishDraft({ label, userId }) {
  const content = await readDraft();
  const visibleCars = content.cars.filter((c) => c.visible).length;
  if (visibleCars < MIN_VISIBLE_CARS) {
    throw new HttpError(422, `Publish needs at least ${MIN_VISIBLE_CARS} visible cars (${visibleCars} now)`);
  }
  const revision = await Revision.create({ label, content, publishedBy: userId });
  return revision;
}
