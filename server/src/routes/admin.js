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

/**
 * GET /api/admin/instructors
 *
 * Who exists, whether they can sign in, and — the point of this endpoint —
 * where each of them left off and whether they are still going.
 *
 * "Where they left off" means two different things and both matter:
 *   - the lesson they last taught, which says what they were doing;
 *   - where that cohort now resumes, which is what a replacement needs.
 * They are usually adjacent but not always, because an instructor can end
 * a session partway through a lesson and set the resume point back to it.
 *
 * Status is derived, not stored, so it cannot go stale:
 *   left        — a departure has been recorded
 *   no_code     — cannot sign in yet
 *   not_started — can sign in, has never logged
 *   active      — logged within the last two days
 *   quiet       — three to six days
 *   silent      — a week or more, which usually means gone
 *
 * The thresholds are guesses until the programme has run for a few weeks.
 * They are here rather than in the page so there is one place to change
 * them, and so the same numbers drive any later oversight queue.
 */
const QUIET_AFTER_DAYS = 3;
const SILENT_AFTER_DAYS = 7;

router.get('/instructors', async (req, res, next) => {
  try {
    const { rows } = await query(`
      WITH latest AS (
          SELECT DISTINCT ON (s.instructor_id)
                 s.instructor_id,
                 s.id           AS session_id,
                 s.session_date,
                 s.present_count,
                 s.entry_lag_days,
                 s.cohort_id,
                 s.resume_lesson_id
            FROM v_session_current s
           ORDER BY s.instructor_id, s.session_date DESC, s.submitted_at DESC
      ),
      totals AS (
          SELECT instructor_id,
                 count(*)::int          AS session_count,
                 round(avg(entry_lag_days)::numeric, 1) AS avg_entry_lag_days,
                 min(session_date)      AS first_session_date
            FROM v_session_current
           GROUP BY instructor_id
      ),
      outcomes AS (
          SELECT s.instructor_id,
                 sum(so.demonstrated_count)::int AS demonstrated,
                 sum(s.present_count)::int       AS opportunities
            FROM v_session_current s
            JOIN session_objective so ON so.session_id = s.id
           GROUP BY s.instructor_id
      )
      SELECT i.id, i.full_name, i.active, i.ended_on::text AS ended_on,
             (i.login_code IS NOT NULL) AS has_code,

             COALESCE(t.session_count, 0)  AS session_count,
             t.first_session_date::text AS first_session_date,
             t.avg_entry_lag_days,

             l.session_date::text          AS last_session_date,
             (CURRENT_DATE - l.session_date) AS days_since_last_session,
             l.present_count               AS last_present_count,

             lc.code                       AS last_cohort_code,
             site.name                     AS last_cohort_site,
             lc.enrolled_count             AS last_cohort_enrolled,

             -- what they actually taught in that session
             (SELECT string_agg(les.code, ', ' ORDER BY les.code)
                FROM session_lesson sl JOIN lesson les ON les.id = sl.lesson_id
               WHERE sl.session_id = l.session_id) AS last_lessons_covered,
             (SELECT string_agg(les.title_fr, ' · ' ORDER BY les.code)
                FROM session_lesson sl JOIN lesson les ON les.id = sl.lesson_id
               WHERE sl.session_id = l.session_id) AS last_lessons_fr,
             (SELECT string_agg(les.title_en, ' · ' ORDER BY les.code)
                FROM session_lesson sl JOIN lesson les ON les.id = sl.lesson_id
               WHERE sl.session_id = l.session_id) AS last_lessons_en,

             -- where that cohort picks up next, which is what a stand-in needs
             pos.resume_lesson_code,
             pos.resume_lesson_fr,
             pos.resume_lesson_en,
             pos.lessons_covered           AS cohort_lessons_covered,
             pos.total_lessons             AS cohort_total_lessons,
             pos.last_instructor           AS cohort_last_instructor,

             CASE WHEN o.opportunities > 0
                  THEN round(o.demonstrated::numeric / o.opportunities::numeric, 3)
             END                           AS demonstration_rate,

             -- Every cohort they are currently assigned to, with how long
             -- since anyone taught it.
             --
             -- This is the signal the page exists for. An instructor's own
             -- status only says whether THEY are logging; someone can be
             -- teaching one cohort daily while another they are responsible
             -- for has not been touched in a fortnight. Reading that off two
             -- separate sections and joining them by eye is exactly what a
             -- supervisor will not do.
             (SELECT json_agg(json_build_object(
                        'code', c2.code,
                        'site', s2.name,
                        'days_since', pos2.days_since_last_session,
                        'resume_lesson_code', pos2.resume_lesson_code,
                        'resume_lesson_en', pos2.resume_lesson_en,
                        'last_instructor', pos2.last_instructor
                     ) ORDER BY c2.code)
                FROM cohort_instructor ci
                JOIN cohort c2 ON c2.id = ci.cohort_id
                JOIN site s2   ON s2.id = c2.site_id
                LEFT JOIN v_cohort_position pos2 ON pos2.cohort_code = c2.code
               WHERE ci.instructor_id = i.id
                 AND ci.assigned_to IS NULL
                 AND c2.status IN ('planned','active')) AS assigned_cohorts

        FROM instructor i
        LEFT JOIN latest   l    ON l.instructor_id = i.id
        LEFT JOIN totals   t    ON t.instructor_id = i.id
        LEFT JOIN outcomes o    ON o.instructor_id = i.id
        LEFT JOIN cohort   lc   ON lc.id = l.cohort_id
        LEFT JOIN site     site ON site.id = lc.site_id
        LEFT JOIN v_cohort_position pos ON pos.cohort_code = lc.code
       ORDER BY i.ended_on IS NOT NULL, i.full_name`);

    const instructors = rows.map((r) => {
      const days = r.days_since_last_session;
      let status;
      if (r.ended_on) status = 'left';
      else if (!r.has_code) status = 'no_code';
      else if (r.session_count === 0) status = 'not_started';
      else if (days >= SILENT_AFTER_DAYS) status = 'silent';
      else if (days >= QUIET_AFTER_DAYS) status = 'quiet';
      else status = 'active';
      // A cohort they are responsible for that nobody has taught recently.
      // Flagged separately from their own status, because the two can
      // disagree and the disagreement is the interesting case.
      const stale = (r.assigned_cohorts || []).filter(
        (c) => c.days_since === null || c.days_since >= QUIET_AFTER_DAYS
      );
      return { ...r, status, stale_cohorts: stale };
    });

    res.json({
      instructors,
      thresholds: { quiet_after_days: QUIET_AFTER_DAYS, silent_after_days: SILENT_AFTER_DAYS },
    });
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
      `SELECT cohort_code, site, track_code, track_name_fr, track_name_en,
              entry_level, pace, mixed_upper_level,
              enrolled_count, status,
              resume_lesson_code, resume_lesson_fr, resume_lesson_en, resume_module_code,
              last_session_date, last_instructor, days_since_last_session,
              lessons_covered, total_lessons, total_hours
         FROM v_cohort_position ORDER BY cohort_code`
    );
    res.json({ cohorts: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
