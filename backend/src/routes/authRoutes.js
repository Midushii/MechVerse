const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters.'),
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('branch').optional().trim().isLength({ max: 60 }),
    body('semester').optional().isInt({ min: 1, max: 8 }),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').isLength({ min: 1 }).withMessage('Password is required.'),
  ],
  validate,
  ctrl.login
);

router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

router.post(
  '/forgot-password',
  authLimiter,
  [body('email').isEmail().withMessage('A valid email is required.')],
  validate,
  ctrl.requestPasswordReset
);

router.post(
  '/reset-password',
  authLimiter,
  [
    body('token').notEmpty().withMessage('Reset token is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  validate,
  ctrl.resetPassword
);

module.exports = router;
