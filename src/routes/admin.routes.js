import { Router } from 'express';
import * as c from '../controllers/content.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireDb } from '../middleware/db.js';

const router = Router();

// Every admin route needs a signed-in user. Editors can change the draft; only admins publish or restore.
router.use(requireAuth, requireDb);
const editor = requireRole('admin', 'editor');
const admin = requireRole('admin');

router.get('/draft', editor, c.getDraft);
router.post('/publish', admin, c.publish);
router.get('/revisions', editor, c.listRevisions);
router.post('/revisions/:id/restore', admin, c.restoreRevision);

router.get('/cars', editor, c.listCars);
router.post('/cars', editor, c.createCar);
router.patch('/cars/:id', editor, c.updateCar);
router.delete('/cars/:id', editor, c.deleteCar);

router.get('/faq', editor, c.listFaq);
router.post('/faq', editor, c.createFaq);
router.patch('/faq/:id', editor, c.updateFaq);
router.delete('/faq/:id', editor, c.deleteFaq);

router.get('/settings', editor, c.getSettings);
router.put('/settings', editor, c.updateSettings);

router.get('/sections', editor, c.listSections);
router.put('/sections', editor, c.upsertSection);
router.delete('/sections/:key', editor, c.deleteSection);

export default router;
