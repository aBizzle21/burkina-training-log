/*
 * Everything the instructor app needs to render the form.
 *
 * The app caches this and works from the cache. The server's job is to
 * say when the cache is stale, not to be reachable every morning — an
 * instructor in Banfora may not have a connection for days, and the form
 * has to work anyway.
 *
 * Both languages are sent in one payload. Picking server-side would be a
 * smaller download, but switching language would then need a connection,
 * and the moment someone discovers they are in the wrong language is
 * exactly the moment they are least likely to have one. The difference is
 * roughly 30KB, downloaded once.
 */

const express = require('express');
const crypto = require('crypto');
const { query } = require('../db');

const router = express.Router();

/**
 * GET /api/bootstrap
 *
 * One call returns everything: cohorts, instructors, the full lesson
 * ladder for every track, the method and disruption vocabularies, and
 * each cohort's current resume point — in English and French together.
 *
 * One call rather than five because it may be made over a connection
 * that only holds for a few seconds.
 */
router.get('/bootstrap', async (req, res, next) => {
  try {
    const [tracks, lessons, cohorts, instructors, methods, reasons, positions] =
      await Promise.all([
        query(`SELECT code, position, kind, name_en, name_fr, color
                 FROM track WHERE retired_on IS NULL ORDER BY position`),
        // Per COHORT, not per track. A cohort is taught a pathway — a
        // filter over the curriculum — and showing an instructor all 152
        // lessons when their cohort is doing 38 of them is both wrong and
        // an invitation to tick the wrong one.
        query(`SELECT p.cohort_code, p.lesson_code, p.title_en, p.title_fr,
                      p.level, p.tier, p.hours, p.teaching_order,
                      p.module_code, p.module_title_en, p.module_title_fr,
                      p.track_code, p.track_kind,
                      COALESCE(
                        json_agg(
                          json_build_object('code', o.code, 'text_en', o.text_en,
                                            'text_fr', o.text_fr)
                          ORDER BY o.position
                        ) FILTER (WHERE o.id IS NOT NULL), '[]'
                      ) AS objectives
                 FROM v_cohort_pathway p
                 LEFT JOIN objective o ON o.lesson_id = p.lesson_id AND o.retired_on IS NULL
                GROUP BY p.cohort_code, p.lesson_code, p.title_en, p.title_fr,
                         p.level, p.tier, p.hours, p.teaching_order,
                         p.module_code, p.module_title_en, p.module_title_fr,
                         p.track_code, p.track_kind
                ORDER BY p.cohort_code, p.teaching_order`),
        query(`SELECT c.id, c.code, c.enrolled_count, c.status,
                      c.entry_level, c.pace, c.mixed_upper_level,
                      s.name AS site, t.code AS track_code,
                      t.name_en AS track_name_en, t.name_fr AS track_name_fr
                 FROM cohort c
                 JOIN site  s ON s.id = c.site_id
                 JOIN track t ON t.id = COALESCE(c.branch_id, c.track_id)
                WHERE c.status IN ('planned','active')
                ORDER BY c.code`),
        query(`SELECT id, full_name FROM instructor
                WHERE active AND ended_on IS NULL ORDER BY full_name`),
        query(`SELECT code, position, name_en, name_fr, color
                 FROM teaching_method WHERE active ORDER BY position`),
        query(`SELECT code, position, label_en, label_fr
                 FROM disruption_reason WHERE active ORDER BY position`),
        query(`SELECT cohort_code, resume_lesson_code, last_session_date,
                      last_instructor, days_since_last_session,
                      lessons_covered, total_lessons
                 FROM v_cohort_position`),
      ]);

    // Every user-visible string arrives as { en, fr } and the device picks.
    const both = (row, base) => ({ en: row[`${base}_en`], fr: row[`${base}_fr`] });

    // Lessons grouped by cohort, in teaching order. Each cohort carries its
    // own ladder because each cohort is on its own pathway.
    const lessonsByCohort = {};
    for (const l of lessons.rows) {
      (lessonsByCohort[l.cohort_code] ||= []).push({
        code: l.lesson_code,
        title: both(l, 'title'),
        level: l.level,
        tier: l.tier,
        hours: l.hours === null ? null : Number(l.hours),
        module: { code: l.module_code, title: both(l, 'module_title') },
        track: { code: l.track_code, kind: l.track_kind },
        objectives: l.objectives.map((o) => ({
          code: o.code,
          text: { en: o.text_en, fr: o.text_fr },
        })),
      });
    }

    const positionByCohort = {};
    for (const p of positions.rows) positionByCohort[p.cohort_code] = p;

    const payload = {
      languages: ['fr', 'en'],
      tracks: tracks.rows.map((t) => ({
        code: t.code, kind: t.kind, name: both(t, 'name'), color: t.color,
      })),
      cohorts: cohorts.rows.map((c) => ({
        id: c.id,
        code: c.code,
        site: c.site,
        track_code: c.track_code,
        track_name: both(c, 'track_name'),
        entry_level: c.entry_level,
        pace: c.pace,
        mixed_upper_level: c.mixed_upper_level,
        enrolled_count: c.enrolled_count,
        status: c.status,
        position: positionByCohort[c.code] || null,
        lessons: lessonsByCohort[c.code] || [],
      })),
      instructors: instructors.rows.map((i) => ({ id: i.id, name: i.full_name })),
      methods: methods.rows.map((m) => ({
        code: m.code, name: both(m, 'name'), color: m.color,
      })),
      disruptions: reasons.rows.map((r) => ({ code: r.code, label: both(r, 'label') })),
    };

    const body = JSON.stringify(payload);
    const etag = '"' + crypto.createHash('sha1').update(body).digest('hex') + '"';
    res.set('ETag', etag);
    res.set('Cache-Control', 'no-cache');
    if (req.headers['if-none-match'] === etag) return res.status(304).end();

    res.type('application/json').send(body);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
