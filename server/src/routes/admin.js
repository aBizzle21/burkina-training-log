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
const { query, transaction } = require('../db');

const router = express.Router();

// Every country, as served to the admin page (tools/build-countries.js).
const WORLD = new Map(
  require('../../public/countries.json').map((c) => [c.code, c]));

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

/* =====================================================================
 * Setting up a cohort.
 *
 * Until this existed, creating a real group meant writing INSERT
 * statements: a site, a cohort, its entry level and pace, and a row per
 * instructor assignment. That is not a workable instruction for the
 * people who will actually run this programme, and the rest of the admin
 * page exists precisely so that nobody has to do it.
 *
 * The hard part here is not the form. It is that entry level and pace
 * are consequential choices made by someone who has not read the
 * curriculum design — six levels and three paces, 72 combinations, and
 * the wrong pick either bores a group for a month or loses them in week
 * one. So the choice is never presented as a bare dropdown: the preview
 * endpoint below turns it into a concrete answer — how many lessons,
 * how many hours, which lesson they start on.
 * ===================================================================== */

/** GET /api/admin/reference — everything the setup form needs to render. */
router.get('/reference', async (req, res, next) => {
  try {
    const [countries, branches, courses, modules, levels, paces, instructors] =
      await Promise.all([
        query(`SELECT code, name_en, name_fr FROM country ORDER BY position, name_en`),
        // Country, then city, then branch. Sent flat with its place on each
        // row, because the form narrows down one level at a time and a
        // nested shape would just be unpicked again on the device.
        query(`SELECT id, country_code, city, name, region FROM site
                ORDER BY country_code, city, name`),
        // Only courses are choosable. The foundation is not a choice —
        // every cohort does the part of it their level and pace include.
        query(`SELECT id, code, name_en, name_fr, blurb_en, blurb_fr
                 FROM track WHERE kind = 'course' AND retired_on IS NULL
                ORDER BY position`),
        // Every module of every course, so approving an instructor is a
        // matter of ticking boxes rather than knowing the codes.
        query(`SELECT m.id, m.code, m.position, m.title_en, m.title_fr,
                      t.id AS track_id, t.code AS course_code, t.kind AS course_kind,
                      t.name_en AS course_name_en, t.name_fr AS course_name_fr,
                      t.position AS course_position
                 FROM module m JOIN track t ON t.id = m.track_id
                WHERE m.retired_on IS NULL AND t.retired_on IS NULL
                ORDER BY t.position, m.position`),
        query(`SELECT code, rank, name_en, name_fr, desc_en, desc_fr
                 FROM learner_level ORDER BY rank`),
        query(`SELECT code, name_en, name_fr, desc_en, desc_fr, tiers
                 FROM pace ORDER BY position`),
        query(`SELECT id, full_name FROM instructor
                WHERE active AND ended_on IS NULL ORDER BY full_name`),
      ]);
    res.json({
      countries: countries.rows,
      branches: branches.rows,
      // Kept under the old name as well, so an admin page that has not been
      // reloaded since the rename keeps working rather than emptying its
      // dropdown silently.
      sites: branches.rows,
      courses: courses.rows,
      modules: modules.rows,
      levels: levels.rows,
      paces: paces.rows,
      instructors: instructors.rows.map((i) => ({ id: i.id, name: i.full_name })),
      statuses: ['planned', 'active'],
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/pathway-preview?course=DEV&entry_level=L1&pace=fast
 *
 * What that combination actually means, before anything is saved.
 *
 * This is the point of the whole screen. "Entry level L2, fast pace" is
 * an abstraction; "38 lessons, 104 hours, starting at F-6.5" is a thing
 * a site lead can sanity-check against the group sitting in front of
 * them. Someone who sees that their beginners would start two-thirds of
 * the way through the foundation will change the answer.
 *
 * It runs the same lesson_in_pathway() the database uses, so the preview
 * cannot drift from what the cohort is later taught.
 */
router.get('/pathway-preview', async (req, res, next) => {
  try {
    const course = String(req.query.course || '');
    const entry = String(req.query.entry_level || '');
    const pace = String(req.query.pace || '');
    const upper = req.query.mixed_upper_level ? String(req.query.mixed_upper_level) : null;

    if (!course || !entry || !pace) {
      return res.status(400).json({
        error: 'Choose a course, an entry level and a pace to see the pathway.',
      });
    }

    const { rows } = await query(
      `WITH chosen AS (
           SELECT l.code, l.title_en, l.title_fr, l.level, l.tier, l.hours,
                  t.kind AS track_kind, m.position AS mpos, l.position AS lpos
             FROM track t
             JOIN module m ON m.track_id = t.id
             JOIN lesson l ON l.module_id = m.id
            WHERE (t.kind = 'foundation' OR t.code = $1)
              AND l.retired_on IS NULL AND t.retired_on IS NULL
              AND lesson_in_pathway(l.level, l.tier, $2, $3)
       ),
       ordered AS (
           SELECT *, row_number() OVER (ORDER BY (track_kind = 'course'), mpos, lpos) AS n
             FROM chosen
       )
       SELECT (SELECT count(*) FROM ordered)::int              AS total_lessons,
              (SELECT count(*) FROM ordered
                WHERE track_kind = 'foundation')::int          AS foundation_lessons,
              (SELECT count(*) FROM ordered
                WHERE track_kind = 'course')::int              AS course_lessons,
              (SELECT round(sum(hours)::numeric, 1) FROM ordered) AS total_hours,
              (SELECT code      FROM ordered WHERE n = 1)      AS first_lesson_code,
              (SELECT title_en  FROM ordered WHERE n = 1)      AS first_lesson_en,
              (SELECT title_fr  FROM ordered WHERE n = 1)      AS first_lesson_fr`,
      [course, entry, pace]
    );

    const preview = rows[0];

    // A mixed cohort follows its lowest entrant, so the lessons between
    // the two levels are ones part of the room already knows. Counting
    // them is the difference between "mixed group" as a note and as a
    // number of sessions somebody has to plan around.
    let splitPoints = null;
    if (upper && upper !== entry) {
      const { rows: sp } = await query(
        `SELECT count(*)::int AS n
           FROM track t JOIN module m ON m.track_id = t.id
           JOIN lesson l ON l.module_id = m.id
          WHERE (t.kind = 'foundation' OR t.code = $1)
            AND l.retired_on IS NULL AND t.retired_on IS NULL
            AND lesson_in_pathway(l.level, l.tier, $2, $3)
            AND NOT lesson_in_pathway(l.level, l.tier, $4, $3)`,
        [course, entry, pace, upper]
      );
      splitPoints = sp[0].n;
    }

    // Warnings, not refusals. Every one of these is a combination
    // somebody might legitimately want; they are just far more often a
    // mis-click, and the cost of finding out in week one is a month of a
    // group's time.
    const warnings = [];

    if (!preview.total_lessons) {
      warnings.push(
        'That combination has no lessons in it at all. Check the entry level — ' +
        'above L2 the curriculum thins out and a fast pace can empty it.'
      );
    } else if (preview.total_lessons < 12) {
      warnings.push(
        `Only ${preview.total_lessons} lessons — about ${preview.total_hours} hours. ` +
        'That is a short course, not a programme. If these learners are not ' +
        'already specialists, the entry level is probably set too high.'
      );
    }

    if (preview.total_lessons && !preview.foundation_lessons) {
      warnings.push(
        'This group skips the shared foundation entirely and starts straight ' +
        'into the course. Right for people already working in the field; wrong ' +
        'for anyone else.'
      );
    }

    if (splitPoints > 0) {
      warnings.push(
        `${splitPoints} lessons are ones the more advanced half already knows. ` +
        'The group will need to split for those, or they will sit through them.'
      );
    }

    res.json({
      ...preview,
      total_hours: preview.total_hours === null ? null : Number(preview.total_hours),
      split_points: splitPoints,
      warnings,
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/admin/countries — add a country the programme runs in. */
router.post('/countries', async (req, res, next) => {
  try {
    const b = req.body || {};
    const code = String(b.code || '').trim().toUpperCase();
    const name = String(b.name_en || b.name || '').trim();
    if (!/^[A-Z]{2}$/.test(code)) {
      return res.status(400).json({ error: 'A two-letter country code is required, like BF.' });
    }
    if (name.length < 2) return res.status(400).json({ error: 'A country name is required.' });
    const { rows } = await query(
      `INSERT INTO country (code, name_en, name_fr, position)
       VALUES ($1, $2, $3, (SELECT COALESCE(max(position), 0) + 1 FROM country))
       ON CONFLICT (code) DO NOTHING RETURNING code, name_en, name_fr`,
      [code, name, String(b.name_fr || name).trim()]
    );
    if (!rows.length) {
      return res.status(409).json({ error: `${code} is already on the list.` });
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/branches — add a training location.
 *
 * A branch sits in a city, in a country. Two cities may each have a
 * branch of the same name without that being a clash, which is why the
 * uniqueness check is on all three together.
 */
router.post('/branches', async (req, res, next) => {
  try {
    const b = req.body || {};
    const name = String(b.name || '').trim();
    const city = String(b.city || '').trim();
    const country = String(b.country_code || '').trim().toUpperCase();
    const region = b.region ? String(b.region).trim() : null;

    const known = WORLD.get(country);
    if (!known) {
      return res.status(400).json({ error: 'Choose a country from the suggestions.' });
    }
    if (city.length < 2) return res.status(400).json({ error: 'A city is required.' });
    if (name.length < 2) return res.status(400).json({ error: 'A branch name is required.' });

    // Add the country on the way past if it is new. Making someone add
    // the country, then come back and add the branch, is two steps to
    // record one fact — and the first branch in a country is exactly
    // when somebody is least sure they are using the thing correctly.
    // The names come from the server's own list, never from the request,
    // so a typo on one admin page cannot become a country's name.
    await query(
      `INSERT INTO country (code, name_en, name_fr, position)
       VALUES ($1, $2, $3, (SELECT COALESCE(max(position), 0) + 1 FROM country))
       ON CONFLICT (code) DO NOTHING`,
      [country, known.en, known.fr]);

    const { rows } = await query(
      `INSERT INTO site (country_code, city, name, region) VALUES ($1, $2, $3, $4)
       ON CONFLICT (country_code, city, name) DO NOTHING
       RETURNING id, country_code, city, name, region`,
      [country, city, name, region]
    );
    if (!rows.length) {
      return res.status(409).json({ error: `${city} already has a branch called ${name}.` });
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'That country could not be added. Pick one from the list.' });
    }
    next(err);
  }
});

/**
 * POST /api/admin/cohorts — create a group and set its pathway.
 *
 * Validation refuses combinations that would produce a cohort with
 * nothing to teach, rather than creating it and leaving an instructor to
 * discover an empty lesson list at a site with no connection.
 */
router.post('/cohorts', async (req, res, next) => {
  const b = req.body || {};
  try {
    const code = String(b.code || '').trim().toUpperCase();
    const enrolled = Number.parseInt(b.enrolled_count, 10);

    if (!/^[A-Z0-9][A-Z0-9-]{1,19}$/.test(code)) {
      return res.status(400).json({
        error: 'A cohort code is required — letters, digits and dashes, like BF-06.',
      });
    }
    if (!Number.isInteger(enrolled) || enrolled < 0 || enrolled > 500) {
      return res.status(400).json({ error: 'Enter how many learners are enrolled.' });
    }
    if (!b.site_id) return res.status(400).json({ error: 'Choose a site.' });
    if (!b.course) return res.status(400).json({ error: 'Choose a course.' });
    if (!b.entry_level) return res.status(400).json({ error: 'Choose an entry level.' });
    if (!b.pace) return res.status(400).json({ error: 'Choose a pace.' });

    const status = ['planned', 'active'].includes(b.status) ? b.status : 'planned';
    const upper = b.mixed_upper_level || null;

    if (upper) {
      const { rows: ok } = await query(
        `SELECT (SELECT rank FROM learner_level WHERE code = $1)
              < (SELECT rank FROM learner_level WHERE code = $2) AS valid`,
        [b.entry_level, upper]
      );
      if (!ok[0] || ok[0].valid !== true) {
        return res.status(400).json({
          error:
            'For a mixed group, the upper level must be above the entry level. ' +
            'The cohort follows its lowest entrant.',
        });
      }
    }

    // Refuse an empty pathway before creating anything.
    const { rows: count } = await query(
      `SELECT count(*)::int AS n
         FROM track t JOIN module m ON m.track_id = t.id
         JOIN lesson l ON l.module_id = m.id
        WHERE (t.kind = 'foundation' OR t.code = $1)
          AND l.retired_on IS NULL AND t.retired_on IS NULL
          AND lesson_in_pathway(l.level, l.tier, $2, $3)`,
      [b.course, b.entry_level, b.pace]
    );
    if (!count[0].n) {
      return res.status(400).json({
        error:
          'That entry level and pace leave no lessons to teach. ' +
          'Lower the entry level, or choose a steadier pace.',
      });
    }

    const { rows } = await query(
      `INSERT INTO cohort (code, site_id, track_id, course_id, entry_level, pace,
                           mixed_upper_level, enrolled_count, started_on, status)
       VALUES ($1, $2,
               (SELECT id FROM track WHERE code = $3),
               (SELECT id FROM track WHERE code = $3),
               $4, $5, $6, $7, $8, $9)
       ON CONFLICT (code) DO NOTHING
       RETURNING id, code`,
      [code, b.site_id, b.course, b.entry_level, b.pace, upper, enrolled,
       b.started_on || null, status]
    );
    if (!rows.length) {
      return res.status(409).json({ error: `Cohort ${code} already exists.` });
    }
    res.status(201).json({ ...rows[0], total_lessons: count[0].n });
  } catch (err) {
    if (err.code === '23503') {
      return res.status(400).json({ error: 'That branch or course no longer exists.' });
    }
    next(err);
  }
});

/**
 * POST /api/admin/cohorts/:code/instructors — put someone in front of a group.
 *
 * Assignments are dated and never deleted. Ending one and starting
 * another is exactly what a handover is, and the record of who taught
 * which group when is the thing a replacement instructor and a
 * supervisor both need. Re-assigning someone already on the cohort is
 * refused rather than silently duplicated.
 */
router.post('/cohorts/:code/instructors', async (req, res, next) => {
  try {
    const from = (req.body && req.body.assigned_from) || null;
    const { rows } = await query(
      `INSERT INTO cohort_instructor (cohort_id, instructor_id, assigned_from, is_primary)
       SELECT c.id, i.id, COALESCE($3::date, CURRENT_DATE), true
         FROM cohort c, instructor i
        WHERE c.code = $1 AND i.id = $2 AND i.ended_on IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM cohort_instructor ci
               WHERE ci.cohort_id = c.id AND ci.instructor_id = i.id
                 AND ci.assigned_to IS NULL)
       RETURNING id`,
      [req.params.code, req.body && req.body.instructor_id, from]
    );
    if (!rows.length) {
      return res.status(409).json({
        error:
          'Nothing to do — either the cohort or instructor was not found, ' +
          'the instructor has left, or they are already assigned to this group.',
      });
    }
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

/** POST /api/admin/assignments/:id/end — hand a cohort over. */
router.post('/assignments/:id/end', async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE cohort_instructor
          SET assigned_to = COALESCE($2::date, CURRENT_DATE)
        WHERE id = $1 AND assigned_to IS NULL
    RETURNING id`,
      [req.params.id, (req.body && req.body.assigned_to) || null]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'No such open assignment.' });
    }
    res.json({ id: rows[0].id, note: 'Assign a replacement so the group is covered.' });
  } catch (err) {
    next(err);
  }
});

/** GET /api/admin/cohorts/:code/instructors — who is on this group, and who was. */
router.get('/cohorts/:code/instructors', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ci.id, i.full_name, ci.assigned_from::text, ci.assigned_to::text
         FROM cohort_instructor ci
         JOIN cohort c     ON c.id = ci.cohort_id
         JOIN instructor i ON i.id = ci.instructor_id
        WHERE c.code = $1
        ORDER BY ci.assigned_to IS NOT NULL, ci.assigned_from DESC`,
      [req.params.code]
    );
    res.json({ assignments: rows });
  } catch (err) {
    next(err);
  }
});

/* =====================================================================
 * What an instructor is approved to teach.
 *
 * Recorded per module, because that is how competence actually falls:
 * somebody who can take a group through the first three modules of the
 * foundation and no further is the normal case, not an edge one.
 *
 * It is worth being clear about what this does NOT do. It does not stop
 * an instructor logging a lesson outside their approval. An unlogged
 * session is a worse outcome than an unapproved one — if a stand-in
 * taught module four in an emergency, the programme needs that in the
 * record, not refused at the door. What it does instead is let the
 * dashboard say, weeks ahead, that a cohort is going to reach material
 * nobody on it can teach.
 * ===================================================================== */

/** GET /api/admin/instructors/:id/modules — what they may teach today. */
router.get('/instructors/:id/modules', async (req, res, next) => {
  try {
    const [approved, courses] = await Promise.all([
      query(`SELECT module_id FROM instructor_module WHERE instructor_id = $1`,
        [req.params.id]),
      query(`SELECT course_code, course_kind, course_name_en, course_name_fr,
                    modules_total, modules_approved, teaches_whole_course
               FROM v_instructor_course
              WHERE instructor_id = $1
              ORDER BY course_kind <> 'foundation', course_code`,
        [req.params.id]),
    ]);
    res.json({
      module_ids: approved.rows.map((r) => r.module_id),
      courses: courses.rows,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/admin/instructors/:id/modules — set the whole list at once.
 *
 * The complete set is sent each time and replaces what was there. Adding
 * and removing through separate calls would leave the record disagreeing
 * with the screen whenever one of them failed.
 */
router.put('/instructors/:id/modules', async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body && req.body.module_ids)
      ? req.body.module_ids.map((n) => Number.parseInt(n, 10)).filter(Number.isInteger)
      : null;
    if (!ids) {
      return res.status(400).json({ error: 'Send module_ids as a list, even an empty one.' });
    }

    const who = await query(
      `SELECT full_name FROM instructor WHERE id = $1 AND ended_on IS NULL`,
      [req.params.id]);
    if (!who.rows.length) {
      return res.status(404).json({ error: 'No such instructor, or they have left.' });
    }

    await transaction(async (client) => {
      await client.query(
        `DELETE FROM instructor_module
          WHERE instructor_id = $1 AND NOT (module_id = ANY($2::int[]))`,
        [req.params.id, ids]);
      if (ids.length) {
        await client.query(
          `INSERT INTO instructor_module (instructor_id, module_id)
           SELECT $1, m.id FROM module m
            WHERE m.id = ANY($2::int[]) AND m.retired_on IS NULL
           ON CONFLICT DO NOTHING`,
          [req.params.id, ids]);
      }
    });

    const { rows } = await query(
      `SELECT course_code, modules_approved, modules_total, teaches_whole_course
         FROM v_instructor_course
        WHERE instructor_id = $1 AND modules_approved > 0
        ORDER BY course_code`,
      [req.params.id]);
    res.json({ name: who.rows[0].full_name, approved: ids.length, courses: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/coverage — which groups are going to run out of cover.
 *
 * The oversight queue already reports a cohort that has stalled. This
 * reports one that is going to, which is the version somebody can still
 * act on.
 */
router.get('/coverage', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT cov.cohort_code, cov.instructors_assigned,
              cov.first_uncovered_module, cov.first_uncovered_module_en,
              cov.first_uncovered_module_fr, cov.lessons_until_gap,
              cov.covered_to_the_end,
              p.site, p.city, p.track_code, p.status,
              (SELECT string_agg(i.full_name, ', ' ORDER BY i.full_name)
                 FROM cohort_instructor ci JOIN instructor i ON i.id = ci.instructor_id
                WHERE ci.cohort_id = cov.cohort_id AND ci.assigned_to IS NULL) AS instructors
         FROM v_cohort_coverage cov
         JOIN v_cohort_position p ON p.cohort_code = cov.cohort_code
        ORDER BY cov.covered_to_the_end,
                 cov.lessons_until_gap NULLS LAST,
                 cov.cohort_code`);
    res.json({
      cohorts: rows,
      // A gap this close is the one worth interrupting someone about.
      urgent_within_lessons: 10,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
