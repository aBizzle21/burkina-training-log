/*
 * Instructor administration.
 *
 * Exists so that nobody has to run SQL to issue a personal code. That is
 * not a one-off task — every instructor needs one, people leave and are
 * replaced, and a code that has been seen by the wrong person needs
 * reissuing. Asking a site lead to write an UPDATE statement for any of
 * that is not a workable instruction.
 *
 * Gated on ADMIN_KEY, a value set on the Railway service. Anyone holding
 * it can issue codes, so it is a real credential and belongs nowhere near
 * a shared document.
 *
 * Codes are generated here rather than chosen, because people choose
 * guessable ones. The alphabet leaves out characters that are misread
 * when a code is written on paper and typed on a phone: no O or 0, no I
 * or 1, no S or 5.
 */

const express = require('express');
const crypto = require('crypto');
const { query } = require('../db');

const router = express.Router();

const ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXYZ2346789';

function generateCode() {
  const pick = (n) => {
    const bytes = crypto.randomBytes(n);
    return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
  };
  return `${pick(4)}-${pick(4)}`;
}

/** Every route below requires the admin key. */
function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    return res.status(503).json({
      error:
        'ADMIN_KEY is not set on this service. Add it in Railway, then reload.',
    });
  }
  const given = req.get('x-admin-key') || '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'That admin key was not recognised.' });
  }
  next();
}

router.use(requireAdmin);

/** GET /api/admin/instructors — who exists, and whether they can sign in. */
router.get('/instructors', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT i.id, i.full_name, i.active, i.ended_on,
             (i.login_code IS NOT NULL) AS has_code,
             (SELECT count(*)::int FROM v_session_current s
               WHERE s.instructor_id = i.id)        AS session_count,
             (SELECT max(s.session_date) FROM v_session_current s
               WHERE s.instructor_id = i.id)        AS last_session_date,
             (SELECT string_agg(DISTINCT c.code, ', ' ORDER BY c.code)
                FROM cohort_instructor ci JOIN cohort c ON c.id = ci.cohort_id
               WHERE ci.instructor_id = i.id AND ci.assigned_to IS NULL) AS cohorts
        FROM instructor i
       ORDER BY i.ended_on IS NOT NULL, i.full_name`);
    res.json({ instructors: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/instructors/:id/code — issue a fresh code.
 *
 * Returned once, in the response, and never readable again. Reissuing
 * replaces the old one immediately, which is what makes it useful when a
 * code has gone astray.
 */
router.post('/instructors/:id/code', async (req, res, next) => {
  try {
    // Retry on the vanishingly unlikely collision rather than failing.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateCode();
      try {
        const { rows } = await query(
          `UPDATE instructor SET login_code = $1
            WHERE id = $2 AND ended_on IS NULL
        RETURNING full_name`,
          [code, req.params.id]
        );
        if (!rows.length) {
          return res.status(404).json({
            error: 'No such instructor, or they have been marked as having left.',
          });
        }
        return res.json({ name: rows[0].full_name, code });
      } catch (err) {
        if (err.code === '23505') continue;   // unique violation, try again
        throw err;
      }
    }
    res.status(500).json({ error: 'Could not generate a unique code. Try again.' });
  } catch (err) {
    next(err);
  }
});

/** POST /api/admin/instructors — add someone, and issue their code at once. */
router.post('/instructors', async (req, res, next) => {
  try {
    const name = (req.body && req.body.full_name ? String(req.body.full_name) : '').trim();
    if (name.length < 2) {
      return res.status(400).json({ error: 'A full name is required.' });
    }
    const code = generateCode();
    const { rows } = await query(
      `INSERT INTO instructor (full_name, login_code, started_on)
       VALUES ($1, $2, CURRENT_DATE)
       RETURNING id, full_name`,
      [name, code]
    );
    res.status(201).json({ id: rows[0].id, name: rows[0].full_name, code });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/instructors/:id/departure — record that someone has left.
 *
 * Their code stops working immediately and nothing of theirs is deleted or
 * reassigned. Departure in-country is expected to be abrupt and
 * unannounced, so this must work with no cooperation from the person
 * leaving — including not needing them to hand anything back.
 */
router.post('/instructors/:id/departure', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE instructor
          SET ended_on = COALESCE($2::date, CURRENT_DATE),
              active = false,
              login_code = NULL
        WHERE id = $1
    RETURNING full_name, ended_on`,
      [req.params.id, req.body && req.body.ended_on ? req.body.ended_on : null]
    );
    if (!rows.length) return res.status(404).json({ error: 'No such instructor.' });
    res.json({ name: rows[0].full_name, ended_on: rows[0].ended_on });
  } catch (err) {
    next(err);
  }
});

/** POST /api/admin/instructors/:id/return — undo a departure. */
router.post('/instructors/:id/return', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE instructor SET ended_on = NULL, active = true
        WHERE id = $1 RETURNING full_name`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No such instructor.' });
    res.json({ name: rows[0].full_name, note: 'A new code is needed before they can sign in.' });
  } catch (err) {
    next(err);
  }
});

/** GET /api/admin/cohorts — the handover view, for a supervisor. */
router.get('/cohorts', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT cohort_code, site, track_code, track_name_fr, enrolled_count, status,
              resume_lesson_code, resume_lesson_fr, resume_module_code,
              last_session_date, last_instructor, days_since_last_session,
              lessons_covered, total_lessons
         FROM v_cohort_position ORDER BY cohort_code`
    );
    res.json({ cohorts: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
