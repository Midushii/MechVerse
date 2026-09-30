const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/mailer');

const COOKIE_OPTS = {
  httpOnly: true,               // JS on the page can't read the session cookie
  secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

// Emails are trimmed and lowercased for consistent lookups, but dots are
// preserved exactly as typed -- no Gmail-style dot normalization. This is
// intentional: john.doe@gmail.com and johndoe@gmail.com are treated as
// different accounts.
function normalizeCase(rawEmail) {
  return String(rawEmail).trim().toLowerCase();
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, branch, semester } = req.body;
  const emailAddress = normalizeCase(email);

  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(emailAddress);
  if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

  const passwordHash = await bcrypt.hash(password, 12);
  const role = adminEmails().includes(emailAddress) ? 'admin' : 'student';

  const info = await db
    .prepare('INSERT INTO users (name, email, password_hash, role, branch, semester) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name.trim(), emailAddress, passwordHash, role, branch || null, semester || null);

  const token = signToken(info.lastInsertRowid);

  // On serverless hosting (Vercel) the function can be frozen the moment the
  // response is sent, so a background "fire-and-forget" email may never go
  // out. We wait for it here instead. sendWelcomeEmail() never throws (it
  // returns { sent: false } on any failure) and has a short timeout, so a
  // mail hiccup can't break signup.
  await sendWelcomeEmail({ to: emailAddress, name: name.trim() }).catch(() => {});

  res.cookie('mv_session', token, COOKIE_OPTS);
  res.status(201).json({
    user: { id: info.lastInsertRowid, name: name.trim(), email: emailAddress, role, branch, semester },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const emailAddress = normalizeCase(email);
  const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(emailAddress);

  // Same generic error whether the email doesn't exist or the password is
  // wrong -- don't let attackers use this endpoint to enumerate accounts.
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

  const token = signToken(user.id);
  res.cookie('mv_session', token, COOKIE_OPTS);
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, branch: user.branch, semester: user.semester },
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('mv_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ ok: true });
});

const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// Step 1: user submits their email. We generate a random token, store only
// its SHA-256 hash (so a leaked database row can't be used as a valid
// token), and actually email the raw token as a link.
//
// Note: this deliberately does NOT check ALLOWED_EMAIL_DOMAIN. Signup is
// gated to the college domain, but reset is just "does an account with
// this exact email exist" -- so it naturally works for every registered
// account regardless of domain, with no special-casing needed here.
const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const emailAddress = normalizeCase(email);
  const user = await db.prepare('SELECT id, name FROM users WHERE email = ?').get(emailAddress);

  // Same response whether the account exists or not, so this endpoint
  // can't be used to check which emails are registered.
  if (!user) {
    return res.json({ ok: true, emailSent: false, resetUrl: null });
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

  await db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);
  await db.prepare(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, tokenHash, expiresAt);

  const frontendOrigin = process.env.FRONTEND_ORIGIN || `${req.protocol}://${req.get('host')}`;
  // Using a hash fragment (#token=...) rather than a query string
  // (?token=...) here is deliberate: fragments are never sent to the
  // server at all (the browser strips them before the request even goes
  // out), so they can't get dropped by a dev server's redirect (e.g. tools
  // like `serve` redirecting reset-password.html -> reset-password and
  // losing the query string in the process). The fragment survives
  // regardless of what static server is fronting the frontend.
  const resetUrl = `${frontendOrigin}/reset-password.html#token=${rawToken}`;

  const { sent } = await sendPasswordResetEmail({ to: emailAddress, name: user.name, resetUrl });

  // If SMTP is actually configured and the send worked, don't echo the raw
  // token back in the API response -- that would let anyone who can see
  // network traffic (or a shared/public computer) hijack the account
  // without ever touching the real inbox. Only fall back to returning the
  // link when there's genuinely no other way to get it (local dev with no
  // mail server set up yet).
  if (sent) {
    return res.json({ ok: true, emailSent: true, resetUrl: null });
  }
  // Only reveal the link in local dev, never on the live site.
  const isProd = process.env.NODE_ENV === 'production';
  return res.json({ ok: true, emailSent: false, resetUrl: isProd ? null : resetUrl });
});

// Step 2: user opens that link (token in the URL) and submits a new
// password. We hash the submitted token and look for a matching, unused,
// unexpired row.
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

  const row = await db
    .prepare('SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used = 0')
    .get(tokenHash);

  if (!row || new Date(row.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, row.user_id);
  await db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(row.id);

  res.json({ ok: true });
});

module.exports = { register, login, logout, me, requestPasswordReset, resetPassword };