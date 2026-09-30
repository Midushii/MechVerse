const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/labController');

const router = express.Router();
router.use(requireAuth);

router.get('/labs', ctrl.listLabs);
router.get('/labs/:labId', ctrl.getLab);

router.get('/admin/labs', requireAdmin, ctrl.adminListLabs);
router.delete('/labs/:labId', requireAdmin, ctrl.deleteLab);
router.delete('/lab-files/:fileId', requireAdmin, ctrl.deleteLabFile);

router.post(
  '/labs',
  requireAdmin,
  [body('name').trim().notEmpty(), body('semester').isInt({ min: 1, max: 8 })],
  validate,
  ctrl.createLab
);

router.patch(
  '/labs/:labId',
  requireAdmin,
  [body('name').optional().trim().notEmpty(), body('icon').optional().trim().notEmpty()],
  validate,
  ctrl.renameLab
);

router.post(
  '/lab-files',
  requireAdmin,
  upload.single('file'),
  [body('labId').isInt(), body('title').trim().notEmpty().isLength({ max: 200 })],
  validate,
  ctrl.createLabFile
);

router.patch(
  '/lab-files/:fileId',
  requireAdmin,
  [body('title').optional().trim().notEmpty().isLength({ max: 200 })],
  validate,
  ctrl.updateLabFile
);

module.exports = router;