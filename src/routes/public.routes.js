import { Router } from 'express';
import { getPublicContent } from '../controllers/content.controller.js';
import { requireDb } from '../middleware/db.js';

const router = Router();

// Read-only, published content only. The frontend falls back to bundled data when this returns 404 or fails.
router.get('/content', requireDb, getPublicContent);

export default router;
