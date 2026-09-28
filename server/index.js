/*
 * Burkina Faso training log — API and instructor app.
 *
 * Phase 1 of docs/build-order.md: an instructor can file an entry from a
 * phone with no connection, and a replacement can pick up a cohort from
 * the log alone.
 *
 * Not in here, deliberately: the oversight queue, observations, and any
 * user management. Those are Phases 2 and 3. See docs/build-order.md.
 */

const path = require('path');
const express = require('express');

const { query } = require('./db');
const { login, requireInstructor } = require('./auth');
const curriculumRoutes = require('./routes/curriculum');
const sessionRoutes = require('./routes/sessions');
const exportRoutes = require('./routes/exports');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);          // Railway terminates TLS in front of us
app.use(express.json({ limit: '1mb' }));

/* ---------- the instructor app ---------- */
// Served from the same origin as the API so there is no CORS to configure
// and nothing to break when the Railway domain changes.
app.use(express.static(path.join(__dirname, '..', 'public'), {
  setHeaders(res, filePath) {
    // The service worker must never be cached, or a phone can be stuck on
    // an old one for weeks with no way to tell.
    if (filePath.endsWith('sw.js')) res.set('Cache-Control', 'no-cache');
  },
}));

/* ---------- health ---------- */
app.get('/health', async (req, res) => {
  try {
    const { rows } = await query('SELECT count(*)::int AS lessons FROM lesson');
    res.json({ ok: true, lessons: rows[0].lessons });
  } catch (err) {
    res.status(503).json({ ok: false, error: 'Database unreachable.' });
  }
});

/* ---------- open routes ---------- */
app.post('/api/login', login);

/* ---------- administration ----------
 * Guarded by its own key, checked inside the router, rather than by an
 * instructor token. Issuing codes is a site lead's job, not an
 * instructor's, and the two should not share a credential.
 */
app.use('/api/admin', adminRoutes);

/* ---------- authenticated routes ---------- */
app.use('/api', requireInstructor, curriculumRoutes);
app.use('/api/sessions', requireInstructor, sessionRoutes);
app.use('/api', requireInstructor, sessionRoutes);   // /api/cohorts/:code/position
app.use('/api', requireInstructor, exportRoutes);

/* ---------- errors ---------- */
app.use((req, res) => res.status(404).json({ error: 'No such endpoint.' }));

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  // Never leak a database error to a phone; it is not actionable there and
  // may name columns. The log has the detail.
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const server = app.listen(PORT, () => {
  console.log(`Training log server listening on ${PORT}`);
});

// Railway sends SIGTERM on redeploy. Finish in-flight requests rather than
// dropping a session an instructor just submitted.
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down.');
  server.close(() => process.exit(0));
});

module.exports = app;
