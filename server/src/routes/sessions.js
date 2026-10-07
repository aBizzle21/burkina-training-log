/*
 * Session ingest.
 *
 * The endpoint that has to be right, because it is the one a phone on a
 * bad connection will retry against. Three rules govern it, all of them
 * from docs/data-model.md:
 *
 *   - The DEVICE supplies the session id. A retry carries the same id and
 *     is recognised as a duplicate rather than stored twice. A phantom
 *     second session nobody can explain is worse than a lost entry.
 *   - The SERVER stamps submitted_at. The device never supplies it, so
 *     entry lag cannot be erased by changing a phone's clock.
 *   - Sessions are APPEND ONLY. There is no update route. A correction is
 *     a new row carrying supersedes_id, and the database refuses anything
 *     else.
 */

const express = require('express');
const { query, transaction } = require('../db');

const router = express.Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate one submitted session against the database's own vocabulary.
 * Returns a list of problems, empty when the entry is good.
 *
 * Everything here is also enforced by constraints in the schema. This
 * layer exists so the instructor gets a sentence they can act on rather
 * than a Postgres error, and so a bad entry is rejected before any of
 * its four tables are touched.
 */
async function validate(body) {
  const problems = [];
  const p = (msg) => problems.push(msg);

  if (!body || typeof body !== 'object') return ['The submission was empty.'];

  if (!UUID_RE.test(body.id || '')) p('id must be a UUID generated on the device.');
  if (!DATE_RE.test(body.session_date || '')) p('session_date must look like 2026-09-28.');
  if (body.submitted_at) p('submitted_at is set by the server and must not be sent.');

  if (!Number.isInteger(body.present_count) || body.present_count < 0) {
    p('present_count must be a whole number, zero or more.');
  }
  if (!Array.isArray(body.lessons_covered) || body.lessons_covered.length === 0) {
    p('At least one lesson must be recorded as covered.');
  }
  if (!Array.isArray(body.methods) || body.methods.length === 0) {
    p('At least one teaching method must be recorded.');
  }
  if (!body.resume_lesson) p('resume_lesson is required — it is what lets a stand-in pick up.');
  if (body.flag_note && body.flag_note.length > 240) {
    p('flag_note is limited to 240 characters.');
  }
  if (problems.length) return problems;

  // Resolve every code against the database in one round trip each.
  const [cohort, lessons, resume, methods, disruption] = await Promise.all([
    query(
      `SELECT c.id, c.enrolled_count, c.entry_level, c.pace,
              t.code AS track_code
         FROM cohort c JOIN track t ON t.id = COALESCE(c.course_id, c.track_id)
        WHERE c.code = $1`,
      [body.cohort_code]
    ),
    // Against the cohort's PATHWAY, not its track. A track holds lessons
    // this cohort is not being taught, and accepting one of those would
    // put a resume point somewhere the cohort can never reach.
    query(
      `SELECT lesson_code AS code FROM v_cohort_pathway
        WHERE cohort_code = $1 AND lesson_code = ANY($2)`,
      [body.cohort_code, body.lessons_covered]
    ),
    query(
      `SELECT lesson_code AS code FROM v_cohort_pathway
        WHERE cohort_code = $1 AND lesson_code = $2`,
      [body.cohort_code, body.resume_lesson]
    ),
    query(`SELECT id, code FROM teaching_method WHERE code = ANY($1) AND active`, [
      body.methods,
    ]),
    body.disruption
      ? query(`SELECT id FROM disruption_reason WHERE code = $1 AND active`, [
          body.disruption,
        ])
      : Promise.resolve({ rows: [] }),
  ]);

  if (!cohort.rows.length) return [`Unknown cohort "${body.cohort_code}".`];
  const c = cohort.rows[0];

  if (body.present_count > c.enrolled_count) {
    p(`present_count (${body.present_count}) is higher than the ${c.enrolled_count} learners enrolled.`);
  }

  const foundLessons = new Set(lessons.rows.map((r) => r.code));
  for (const code of body.lessons_covered) {
    if (!foundLessons.has(code)) {
      p(`Lesson "${code}" is not in ${body.cohort_code}'s pathway. ` +
        `That cohort entered at ${c.entry_level || 'L0'} on the ${c.pace || 'standard'} pace, ` +
        `which does not include it.`);
    }
  }

  if (!resume.rows.length) {
    p(`Resume lesson "${body.resume_lesson}" is not in ${body.cohort_code}'s pathway, ` +
      `so the cohort could never reach it.`);
  }

  const foundMethods = new Set(methods.rows.map((r) => r.code));
  for (const code of body.methods) {
    if (!foundMethods.has(code)) p(`Unknown teaching method "${code}".`);
  }
  if (body.dominant_method && !foundMethods.has(body.dominant_method)) {
    p('dominant_method must be one of the methods listed for this session.');
  }
  if (body.disruption && !disruption.rows.length) {
    p(`Unknown disruption reason "${body.disruption}".`);
  }

  // Objective counts: each must belong to a covered lesson, and none may
  // exceed the number of learners who were actually there.
  if (Array.isArray(body.objectives) && body.objectives.length) {
    const codes = body.objectives.map((o) => o.code);
    const objs = await query(
      `SELECT o.code, l.code AS lesson_code
         FROM objective o JOIN lesson l ON l.id = o.lesson_id
        WHERE o.code = ANY($1) AND o.retired_on IS NULL`,
      [codes]
    );
    const byCode = new Map(objs.rows.map((r) => [r.code, r]));
    for (const o of body.objectives) {
      const found = byCode.get(o.code);
      if (!found) { p(`Unknown objective "${o.code}".`); continue; }
      if (!foundLessons.has(found.lesson_code)) {
        p(`Objective ${o.code} belongs to lesson ${found.lesson_code}, which is not recorded as covered.`);
      }
      if (!Number.isInteger(o.demonstrated) || o.demonstrated < 0) {
        p(`Objective ${o.code} needs a whole number of learners.`);
      } else if (o.demonstrated > body.present_count) {
        p(`Objective ${o.code}: ${o.demonstrated} demonstrated, but only ${body.present_count} were present.`);
      }
    }
  }

  return problems;
}

/** Write one validated session and its three child tables, in one transaction. */
async function insertSession(client, body, instructorId) {
  await client.query(
    `INSERT INTO session (
        id, cohort_id, instructor_id, session_date, device_created_at,
        present_count, resume_lesson_id, dominant_method_id, disruption_id,
        flag_note, supersedes_id, device_id, app_version)
     VALUES (
        $1,
        (SELECT id FROM cohort WHERE code = $2),
        $3, $4, $5, $6,
        (SELECT id FROM lesson WHERE code = $7),
        (SELECT id FROM teaching_method WHERE code = $8),
        (SELECT id FROM disruption_reason WHERE code = $9),
        $10, $11, $12, $13)`,
    [
      body.id, body.cohort_code, instructorId, body.session_date,
      body.device_created_at || null, body.present_count, body.resume_lesson,
      body.dominant_method || null, body.disruption || null,
      body.flag_note || null, body.supersedes_id || null,
      body.device_id || null, body.app_version || null,
    ]
  );

  await client.query(
    `INSERT INTO session_lesson (session_id, lesson_id)
     SELECT $1, id FROM lesson WHERE code = ANY($2)`,
    [body.id, body.lessons_covered]
  );

  await client.query(
    `INSERT INTO session_method (session_id, method_id)
     SELECT $1, id FROM teaching_method WHERE code = ANY($2)`,
    [body.id, body.methods]
  );

  for (const o of body.objectives || []) {
    await client.query(
      `INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
       SELECT $1, id, $3 FROM objective WHERE code = $2`,
      [body.id, o.code, o.demonstrated]
    );
  }
}

/** Read one session back in the shape the app expects. */
async function readSession(id) {
  const { rows } = await query(
    `SELECT s.id, c.code AS cohort_code, i.full_name AS instructor,
            s.session_date, s.submitted_at, s.present_count,
            l.code AS resume_lesson, s.entry_lag_days,
            s.supersedes_id
       FROM v_session_current s
       JOIN cohort c     ON c.id = s.cohort_id
       JOIN instructor i ON i.id = s.instructor_id
       JOIN lesson l     ON l.id = s.resume_lesson_id
      WHERE s.id = $1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * POST /api/sessions
 *
 * Takes either one session or an array of them. A phone that has been
 * offline for three days has three queued, and one request that reports
 * per-entry results is far kinder than three requests where the second
 * fails halfway.
 */
router.post('/', async (req, res, next) => {
  try {
    const instructorId = req.instructor.id;
    const batch = Array.isArray(req.body) ? req.body : [req.body];

    if (batch.length > 50) {
      return res.status(400).json({
        error: 'Too many sessions in one request. Send at most 50.',
      });
    }

    const results = [];

    for (const body of batch) {
      const id = body && body.id;

      // Idempotency first. A retry must be cheap and must never write.
      if (UUID_RE.test(id || '')) {
        const existing = await query('SELECT id FROM session WHERE id = $1', [id]);
        if (existing.rows.length) {
          results.push({ id, status: 'already_received', session: await readSession(id) });
          continue;
        }
      }

      const problems = await validate(body);
      if (problems.length) {
        results.push({ id: id || null, status: 'rejected', problems });
        continue;
      }

      // Guard the common duplicate that a device fails to spot: the same
      // instructor filing a second original entry for one cohort-day.
      if (!body.supersedes_id) {
        const clash = await query(
          `SELECT s.id FROM v_session_current s
             JOIN cohort c ON c.id = s.cohort_id
            WHERE c.code = $1 AND s.instructor_id = $2 AND s.session_date = $3
              -- Never against itself. When a retry overlaps the original,
              -- the original can commit between this retry's "have I seen
              -- this?" check and this one, and the entry is then reported
              -- as a duplicate of itself — with its own id named as the
              -- clashing session. The instructor is told their entry
              -- collides with an entry that is theirs, and it jams.
              AND s.id <> $4::uuid`,
          [body.cohort_code, instructorId, body.session_date,
           UUID_RE.test(id || '') ? id : '00000000-0000-4000-8000-000000000000']
        );
        if (clash.rows.length) {
          results.push({
            id,
            status: 'duplicate_day',
            existing_session_id: clash.rows[0].id,
            message:
              'An entry already exists for this cohort on this date. If this is a ' +
              'correction, resend it with supersedes_id set to the existing session.',
          });
          continue;
        }
      }

      try {
        await transaction((client) => insertSession(client, body, instructorId));
        results.push({ id, status: 'stored', session: await readSession(id) });
      } catch (err) {
        // A primary key collision on the session id means this exact
        // entry is already here: the check above and this insert are not
        // one atomic step, so a retry that overlaps the original passes
        // the check and then loses the race to it.
        //
        // That is precisely the case retries exist for, and it was being
        // reported as a rejection — which flags the entry on the
        // instructor's phone, never retries it, and leaves a database
        // error sitting in their queue for the rest of the programme. On
        // a connection that drops mid-request, which is the normal
        // condition in the field, this is not an edge case.
        //
        // The right answer is the same one the pre-check gives: we have
        // it, you can stop sending it.
        if (err.code === '23505' && /session_pkey/.test(err.constraint || err.detail || '')) {
          results.push({ id, status: 'already_received', session: await readSession(id) });
          continue;
        }
        // The schema's own triggers land here — for example an attempt to
        // correct a session that has already been superseded.
        results.push({
          id,
          status: 'rejected',
          problems: [err.message.replace(/\s+/g, ' ').trim()],
        });
      }
    }

    const anyStored = results.some((r) => r.status === 'stored');
    const allKnown = results.every(
      (r) => r.status === 'stored' || r.status === 'already_received'
    );

    res.status(anyStored ? 201 : allKnown ? 200 : 400).json({
      received: results.length,
      stored: results.filter((r) => r.status === 'stored').length,
      results,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/cohorts/:code/position
 *
 * The handover sheet, as data. What a replacement instructor's app calls
 * when it opens. A cohort with no sessions yet returns the first lesson
 * of its track rather than an error — day one is a normal state.
 */
router.get('/cohorts/:code/position', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM v_cohort_position WHERE cohort_code = $1`,
      [req.params.code]
    );
    if (!rows.length) return res.status(404).json({ error: 'Unknown cohort.' });

    const p = rows[0];
    const flags = await query(
      `SELECT s.flag_note, s.session_date
         FROM v_session_current s
         JOIN cohort c ON c.id = s.cohort_id
        WHERE c.code = $1 AND s.flag_note IS NOT NULL
        ORDER BY s.session_date DESC LIMIT 2`,
      [req.params.code]
    );

    res.json({
      cohort_code: p.cohort_code,
      site: p.site,
      track: { code: p.track_code, name_en: p.track_name_en, name_fr: p.track_name_fr },
      enrolled_count: p.enrolled_count,
      resume_lesson: {
        code: p.resume_lesson_code,
        title_en: p.resume_lesson_en,
        title_fr: p.resume_lesson_fr,
        module: {
          code: p.resume_module_code,
          title_en: p.resume_module_en,
          title_fr: p.resume_module_fr,
        },
      },
      last_session_date: p.last_session_date,
      last_instructor: p.last_instructor,
      days_since_last_session: p.days_since_last_session,
      lessons_covered: p.lessons_covered,
      total_lessons: p.total_lessons,
      recent_flags: flags.rows.map((f) => ({ date: f.session_date, note: f.flag_note })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
