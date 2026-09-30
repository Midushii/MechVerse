const rateLimit = require('express-rate-limit');


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

// Review/report submission: stop review spam and mass-flagging abuse.
const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please slow down.' },
});

// AI explain/summarize calls: these cost money per call, so cap hard.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached for this hour. Try again later.' },
});

// General API traffic: generous, just stops runaway scripts.
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, writeLimiter, aiLimiter, generalLimiter };