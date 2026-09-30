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

// Only lets admins (seniors/moderators) through. Always used after requireAuth.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
