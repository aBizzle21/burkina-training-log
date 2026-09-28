/*
 * CSV export for the India team.
 *
 * Matches the column shape the prototypes already produce, so anything
 * built against those files keeps working.
 */

const express = require('express');
const { query } = require('../db');

const router = express.Router();

const HEADERS = [
  'session_date', 'submitted_date', 'entry_lag_days', 'cohort', 'track',
  'instructor', 'lessons_covered', 'stopping_point', 'present', 'enrolled',
  'methods', 'dominant_method', 'objectives', 'disruption', 'flag',
];

const cell = (v) =>
  v === null || v === undefined ? '""' : `"${String(v).replace(/"/g, '""')}"`;

router.get('/export.csv', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT s.session_date,
             s.submitted_at::date            AS submitted_date,
             s.entry_lag_days,
             c.code                          AS cohort,
             t.name_en                       AS track,
             i.full_name                     AS instructor,
             rl.code                         AS stopping_point,
             s.present_count                 AS present,
             c.enrolled_count                AS enrolled,
             tm.code                         AS dominant_method,
             dr.code                         AS disruption,
             s.flag_note                     AS flag,
             (SELECT string_agg(l.code, ' ' ORDER BY l.code)
                FROM session_lesson sl JOIN lesson l ON l.id = sl.lesson_id
               WHERE sl.session_id = s.id)   AS lessons_covered,
             (SELECT string_agg(m2.code, ' ' ORDER BY m2.position)
                FROM session_method sm JOIN teaching_method m2 ON m2.id = sm.method_id
               WHERE sm.session_id = s.id)   AS methods,
             (SELECT string_agg(o.code || '=' || so.demonstrated_count, ' ' ORDER BY o.code)
                FROM session_objective so JOIN objective o ON o.id = so.objective_id
               WHERE so.session_id = s.id)   AS objectives
        FROM v_session_current s
        JOIN cohort c     ON c.id = s.cohort_id
        JOIN track t      ON t.id = c.track_id
        JOIN instructor i ON i.id = s.instructor_id
        JOIN lesson rl    ON rl.id = s.resume_lesson_id
        LEFT JOIN teaching_method tm   ON tm.id = s.dominant_method_id
        LEFT JOIN disruption_reason dr ON dr.id = s.disruption_id
       ORDER BY c.code, s.session_date`);

    const lines = rows.map((r) =>
      [
        r.session_date && r.session_date.toISOString().slice(0, 10),
        r.submitted_date && r.submitted_date.toISOString().slice(0, 10),
        r.entry_lag_days, r.cohort, r.track, r.instructor,
        r.lessons_covered, r.stopping_point, r.present, r.enrolled,
        r.methods, r.dominant_method, r.objectives, r.disruption, r.flag,
      ].map(cell).join(',')
    );

    // The byte order mark is not optional. Without it Excel mangles every
    // accented character in the French data and the export arrives looking
    // broken to whoever opens it.
    const csv = '﻿' + [HEADERS.join(','), ...lines].join('\n');

    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="training-log.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
