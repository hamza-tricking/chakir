import { Router } from 'express';
import { getMedia, getPublicContent } from '../controllers/content.controller.js';
import { requireDb } from '../middleware/db.js';

const router = Router();

// Read-only, published content only. The frontend falls back to bundled data when this returns 404 or fails.
router.get('/content', requireDb, getPublicContent);
router.get('/media/:id', requireDb, getMedia);

export default router;
