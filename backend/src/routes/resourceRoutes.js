const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/resourceController');

const router = express.Router();
router.use(requireAuth); // every Resource Hub route requires login

router.get('/subjects', ctrl.listSubjects);
router.get('/type-counts', ctrl.typeCounts);
router.get('/subjects/:subjectId', ctrl.getSubject);
router.get('/units/:unitId', ctrl.getUnit);
router.get('/search', ctrl.search);
router.get('/by-type', ctrl.byType);
router.get('/bookmarks', ctrl.listBookmarks);
router.get('/recently-viewed', ctrl.recentlyViewed);

router.post('/resources/:resourceId/progress', ctrl.toggleProgress);
router.post('/resources/:resourceId/bookmark', ctrl.toggleBookmark);

// Admin overview: every subject across every semester, with counts, so you
// can see everything that's been uploaded in one place.
router.get('/admin/subjects', requireAdmin, ctrl.adminListSubjects);

router.delete('/subjects/:subjectId', requireAdmin, ctrl.deleteSubject);
router.delete('/units/:unitId', requireAdmin, ctrl.deleteUnit);
router.delete('/resources/:resourceId', requireAdmin, ctrl.deleteResource);

router.patch(
  '/units/:unitId',
  requireAdmin,
  [body('title').trim().notEmpty().isLength({ max: 200 })],
  validate,
  ctrl.renameUnit
);
router.patch(
  '/subjects/:subjectId',
  requireAdmin,
  [body('name').trim().notEmpty().isLength({ max: 200 })],
  validate,
  ctrl.renameSubject
);
router.patch(
  '/resources/:resourceId',
  requireAdmin,
  [body('title').trim().notEmpty().isLength({ max: 200 })],
  validate,
  ctrl.renameResource
);
router.patch('/units/:unitId/reorder', requireAdmin, ctrl.reorderUnit);
router.patch('/resources/:resourceId/reorder', requireAdmin, ctrl.reorderResource);

// Admin-only content management
router.post(
  '/subjects',
  requireAdmin,
  [body('name').trim().notEmpty(), body('semester').isInt({ min: 1, max: 8 })],
  validate,
  ctrl.createSubject
);

router.post(
  '/units',
  requireAdmin,
  [body('subjectId').isInt(), body('title').trim().notEmpty()],
  validate,
  ctrl.createUnit
);

router.post(
  '/resources',
  requireAdmin,
  upload.single('file'),
  [
    body('unitId').isInt(),
    body('type').isIn(['note', 'video', 'pyq', 'practice', 'book', 'important_topic']),
    body('title').trim().notEmpty().isLength({ max: 200 }),
  ],
  validate,
  ctrl.createResource
);

module.exports = router;