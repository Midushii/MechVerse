const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/gradeController');

const router = express.Router();
router.use(requireAuth);

router.get('/courses', ctrl.listCourses);
router.get('/courses/:courseId/historical', ctrl.historicalComparison);

router.post(
  '/marks',
  [body('componentId').isInt(), body('marks').optional({ nullable: true }).isFloat({ min: 0 })],
  validate,
  ctrl.saveMarks
);

router.post(
  '/target',
  [body('courseId').isInt(), body('targetPercent').isFloat({ min: 0, max: 100 })],
  validate,
  ctrl.setTarget
);

module.exports = router;
