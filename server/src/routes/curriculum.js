/*
 * Everything the instructor app needs to render the form.
 *
 * The app caches this and works from the cache. The server's job is to
 * say when the cache is stale, not to be reachable every morning — an
 * instructor in Banfora may not have a connection for days, and the form
 * has to work anyway.
 */

const express = require('express');
const crypto = require('crypto');
const { query } = require('../db');

const router = express.Router();

/**
 * GET /api/bootstrap?lang=fr
 *
 * One call returns everything the app needs on first run: the cohorts,
 * the instructors, the full lesson ladder for every track, the method
 * and disruption vocabularies, and each cohort's current resume point.
 *
 * One call rather than five because it may be made over a connection
 * that only holds for a few seconds.
 */
router.get('/bootstrap', async (req, res, next) => {
  try {
    const lang = req.query.lang === 'en' ? 'en' : 'fr';

    const [tracks, lessons, cohorts, instructors, methods, reasons, positions] =
      await Promise.all([
        query(`SELECT code, position, name_en, name_fr, color
                 FROM track WHERE retired_on IS NULL ORDER BY position`),
        query(`SELECT l.code, l.position, l.title_en, l.title_fr,
                      m.code AS module_code, m.position AS module_position,
                      m.title_en AS module_title_en, m.title_fr AS module_title_fr,
                      t.code AS track_code,
                      COALESCE(
                        json_agg(
                          json_build_object('code', o.code, 'text_en', o.text_en,
                                            'text_fr', o.text_fr)
                          ORDER BY o.position
                        ) FILTER (WHERE o.id IS NOT NULL), '[]'
                      ) AS objectives
                 FROM lesson l
                 JOIN module m ON m.id = l.module_id
                 JOIN track  t ON t.id = m.track_id
                 LEFT JOIN objective o ON o.lesson_id = l.id AND o.retired_on IS NULL
                WHERE l.retired_on IS NULL
                GROUP BY l.id, m.id, t.id
                ORDER BY t.position, m.position, l.position`),
        query(`SELECT c.id, c.code, c.enrolled_count, c.status,
                      s.name AS site, t.code AS track_code
                 FROM cohort c
                 JOIN site  s ON s.id = c.site_id
                 JOIN track t ON t.id = c.track_id
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

    const pick = (row, base) => (lang === 'en' ? row[`${base}_en`] : row[`${base}_fr`]);

    // Group lessons under their track, preserving curriculum order.
    const byTrack = {};
    for (const l of lessons.rows) {
      (byTrack[l.track_code] ||= []).push({
        code: l.code,
        title: pick(l, 'title'),
        module: { code: l.module_code, title: pick(l, 'module_title') },
        objectives: l.objectives.map((o) => ({
          code: o.code,
          text: lang === 'en' ? o.text_en : o.text_fr,
        })),
      });
    }

    const positionByCohort = {};
    for (const p of positions.rows) positionByCohort[p.cohort_code] = p;

    // No timestamp in here. An earlier version carried generated_at, which
    // changed on every call and so changed the ETag every call — meaning a
    // phone re-downloaded the whole curriculum each morning over a metered
    // connection while appearing to cache correctly. The device records
    // when it fetched; the payload only carries what changes when the data
    // changes.
    const payload = {
      lang,
      tracks: tracks.rows.map((t) => ({
        code: t.code,
        name: pick(t, 'name'),
        color: t.color,
        lessons: byTrack[t.code] || [],
      })),
      cohorts: cohorts.rows.map((c) => ({
        id: c.id,
        code: c.code,
        site: c.site,
        track_code: c.track_code,
        enrolled_count: c.enrolled_count,
        status: c.status,
        position: positionByCohort[c.code] || null,
      })),
      instructors: instructors.rows.map((i) => ({ id: i.id, name: i.full_name })),
      methods: methods.rows.map((m) => ({
        code: m.code, name: pick(m, 'name'), color: m.color,
      })),
      disruptions: reasons.rows.map((r) => ({ code: r.code, label: pick(r, 'label') })),
    };

    // ETag so a phone on a metered connection re-downloads only on change.
    // Positions move daily, so this mostly helps the curriculum itself.
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
