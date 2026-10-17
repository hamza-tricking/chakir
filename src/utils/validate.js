import { HttpError } from './errors.js';

// Parses a request body with a zod schema. Returns the cleaned data or throws a 400 with field-level details.
export function parseBody(schema, body) {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
    throw new HttpError(400, 'Invalid input', details);
  }
  return result.data;
}
