
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const labRoutes = require('./routes/labRoutes');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set -- logins will fail. Set it in backend/.env (local) or your host\'s environment variables.');
}

const app = express();

// Vercel/Render sit behind a proxy; trust it so req.ip, req.protocol and the
// rate limiter see the real visitor instead of the proxy.
app.set('trust proxy', 1);

// ---- Security & core middleware ---------------------------------------
// The CSP header is off because the site's pages use inline scripts/styles
// and Google Fonts; every other helmet protection stays on.
app.use(helmet({ contentSecurityPolicy: false }));

// The site and the API now share one address, so CORS isn't needed for the
// normal setup. It stays available if you ever host the frontend elsewhere.
if (process.env.FRONTEND_ORIGIN) {
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
}
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api', generalLimiter);

// ---- API routes ---------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/resource-hub', resourceRoutes);
app.use('/api/grade-planner', gradeRoutes);
app.use('/api/lab-companion', labRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---- Frontend (local use only; on Vercel the platform serves ../frontend) --
app.use(express.static(path.join(__dirname, '..', '..', 'frontend'), { index: 'home.html' }));

// ---- 404 + centralized error handler ------------------------------------
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

module.exports = app;
