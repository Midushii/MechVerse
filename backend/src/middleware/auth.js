const jwt = require('jsonwebtoken');
const db = require('../config/db');


async function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.mv_session;
  if (!token) return res.status(401).json({ error: 'Not logged in.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db.prepare('SELECT id, name, email, role, branch, semester FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'Session is no longer valid.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

// For the PUBLIC list endpoints (subjects, labs, courses) shown to guests on the
// feature pages. A valid session behaves exactly like requireAuth; with no/invalid
// session the request continues as a read-only guest (id -1 => no progress/marks).
async function optionalAuth(req, res, next) {
  const token = req.cookies && req.cookies.mv_session;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.prepare('SELECT id, name, email, role, branch, semester FROM users WHERE id = ?').get(payload.sub);
      if (user) { req.user = user; return next(); }
    } catch (err) { /* fall through to guest */ }
  }
  req.user = { id: -1, name: 'Guest', role: 'guest', semester: 1 };
  next();
}

// Only lets admins (seniors/moderators) through. Always used after requireAuth.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };