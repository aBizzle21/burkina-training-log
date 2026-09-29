-- =====================================================================
-- 002 — Pathways
--
-- The curriculum stopped being one ladder per track. It is now a shared
-- foundation plus four branches, and a cohort follows a PATHWAY through
-- it: a filter defined by where the learners started and how fast they
-- are going.
--
-- What changes:
--   lesson  gains level, tier and hours — the tags a pathway filters on
--   track   gains kind, so the foundation is distinguishable from a branch
--   cohort  gains entry_level and pace, and branch replaces track
--
-- What this breaks if it is not thought about:
--   The resume point used to mean "the next lesson in this track". It now
--   means "the next lesson IN THIS COHORT'S PATHWAY", which is a
--   different lesson whenever the pathway skips one. v_cohort_position is
--   rewritten accordingly.
--
-- Safe to run on a database holding the old curriculum. Existing cohorts
-- are given a sensible default rather than being left in a broken state.
-- =====================================================================

BEGIN;

/* ---------- levels and paces as reference data ---------- */

CREATE TABLE IF NOT EXISTS learner_level (
    code        text     PRIMARY KEY,           -- L0 … L4
    rank        smallint NOT NULL UNIQUE,
    name_en     text     NOT NULL,
    name_fr     text     NOT NULL,
    desc_en     text,
    desc_fr     text
);

COMMENT ON TABLE learner_level IS
    'Entry levels. rank is what the pathway filter compares: a learner '
    'entering at rank N takes every lesson tagged rank N or above, because '
    'anything below is what they already know.';

CREATE TABLE IF NOT EXISTS pace (
    code        text     PRIMARY KEY,           -- steady | standard | fast
    position    smallint NOT NULL,
    name_en     text     NOT NULL,
    name_fr     text     NOT NULL,
    desc_en     text,
    desc_fr     text,
    tiers       text[]   NOT NULL               -- which lesson tiers are in
);

COMMENT ON COLUMN pace.tiers IS
    'The lesson tiers this pace includes. Held as an array rather than a '
    'join table because it is three rows that change once a year at most, '
    'and the filter reads better as an array containment test.';

CREATE TABLE IF NOT EXISTS lesson_tier (
    code        text     PRIMARY KEY,           -- scaffold|core|extension|advanced
    position    smallint NOT NULL,
    name_en     text     NOT NULL,
    name_fr     text     NOT NULL
);

/* ---------- curriculum gains its tags ---------- */

ALTER TABLE track  ADD COLUMN IF NOT EXISTS kind text
                   CHECK (kind IN ('foundation', 'branch'));
ALTER TABLE track  ADD COLUMN IF NOT EXISTS blurb_en text;
ALTER TABLE track  ADD COLUMN IF NOT EXISTS blurb_fr text;

ALTER TABLE module ADD COLUMN IF NOT EXISTS note_en text;
ALTER TABLE module ADD COLUMN IF NOT EXISTS note_fr text;

ALTER TABLE lesson ADD COLUMN IF NOT EXISTS level text REFERENCES learner_level(code);
ALTER TABLE lesson ADD COLUMN IF NOT EXISTS tier  text REFERENCES lesson_tier(code);
ALTER TABLE lesson ADD COLUMN IF NOT EXISTS hours numeric(4,1);
ALTER TABLE lesson ADD COLUMN IF NOT EXISTS note_en text;
ALTER TABLE lesson ADD COLUMN IF NOT EXISTS note_fr text;

COMMENT ON COLUMN lesson.level IS
    'The level of learner this lesson is FOR. Not a difficulty rating — '
    'a learner entering above this level skips it as already known.';
COMMENT ON COLUMN lesson.tier IS
    'How essential. The pace decides which tiers are included.';

/* ---------- cohorts follow a pathway ---------- */

ALTER TABLE cohort ADD COLUMN IF NOT EXISTS entry_level text REFERENCES learner_level(code);
ALTER TABLE cohort ADD COLUMN IF NOT EXISTS pace        text REFERENCES pace(code);
ALTER TABLE cohort ADD COLUMN IF NOT EXISTS branch_id   smallint REFERENCES track(id);

-- Mixed-level cohorts. Recorded rather than ignored, because the lessons
-- between the two levels are where the group has to split and the
-- instructor needs to know that in advance, not mid-session.
ALTER TABLE cohort ADD COLUMN IF NOT EXISTS mixed_upper_level text REFERENCES learner_level(code);

COMMENT ON COLUMN cohort.mixed_upper_level IS
    'Set only for a mixed cohort. The cohort follows entry_level (its '
    'lowest entrant); lessons between entry_level and this are flagged as '
    'places the group will need to split.';

COMMIT;


-- =====================================================================
-- The pathway filter, as a function.
--
-- One definition, used by every view and every endpoint. If this and the
-- curriculum's JavaScript ever disagree, learners get taught the wrong
-- lessons — so the API resolves pathways here, in the database, and the
-- JavaScript is only used for authoring and the browsable page.
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION lesson_in_pathway(
    p_lesson_level text,
    p_lesson_tier  text,
    p_entry_level  text,
    p_pace         text
) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
    SELECT
        -- level: the lesson is at or above where this cohort started
        (SELECT ll.rank FROM learner_level ll WHERE ll.code = p_lesson_level)
        >=
        (SELECT el.rank FROM learner_level el WHERE el.code = p_entry_level)
        AND
        -- tier: this pace includes that kind of lesson
        p_lesson_tier = ANY (SELECT unnest(pc.tiers) FROM pace pc WHERE pc.code = p_pace);
$$;

/**
 * Every lesson in a cohort's pathway, in teaching order.
 *
 * Foundation first, then the cohort's branch. Ordering is by track kind,
 * then module position, then lesson position — which is the order they
 * were authored in and the order they are taught in.
 */
DROP VIEW IF EXISTS v_cohort_pathway CASCADE;

CREATE VIEW v_cohort_pathway AS
SELECT c.id                         AS cohort_id,
       c.code                       AS cohort_code,
       l.id                         AS lesson_id,
       l.code                       AS lesson_code,
       l.title_en, l.title_fr,
       l.level, l.tier, l.hours,
       m.code                       AS module_code,
       m.title_en                   AS module_title_en,
       m.title_fr                   AS module_title_fr,
       t.code                       AS track_code,
       t.kind                       AS track_kind,
       row_number() OVER (
           PARTITION BY c.id
           ORDER BY (t.kind = 'branch'), m.position, l.position
       )                            AS teaching_order
  FROM cohort c
  JOIN track  t ON t.kind = 'foundation' OR t.id = COALESCE(c.branch_id, c.track_id)
  JOIN module m ON m.track_id = t.id
  JOIN lesson l ON l.module_id = m.id
 WHERE l.retired_on IS NULL
   AND t.retired_on IS NULL
   AND lesson_in_pathway(l.level, l.tier,
                         COALESCE(c.entry_level, 'L0'),
                         COALESCE(c.pace, 'standard'));

COMMENT ON VIEW v_cohort_pathway IS
    'What this cohort is actually being taught, in order. Anything that '
    'lists lessons for a cohort reads this, never the lesson table — the '
    'lesson table holds the whole curriculum, most of which this cohort '
    'is not doing.';

/**
 * Where each cohort stands.
 *
 * Rewritten from migration 001. The change that matters: progress and the
 * fallback starting lesson are now counted against the cohort's own
 * pathway, not the whole track. A cohort on a fast track through L2 has a
 * denominator of 36, not 152, and saying "9 of 152" to an instructor
 * would be both wrong and demoralising.
 */
-- Dropped rather than replaced: CREATE OR REPLACE cannot change a view's
-- column list, and this one gains entry_level, pace and total_hours.
DROP VIEW IF EXISTS v_cohort_position;

CREATE VIEW v_cohort_position AS
WITH latest AS (
    SELECT DISTINCT ON (cohort_id)
           cohort_id, id AS session_id, session_date, instructor_id,
           resume_lesson_id, entry_lag_days
      FROM v_session_current
     ORDER BY cohort_id, session_date DESC, submitted_at DESC
),
covered AS (
    SELECT s.cohort_id, count(DISTINCT sl.lesson_id) AS lessons_covered
      FROM v_session_current s
      JOIN session_lesson sl ON sl.session_id = s.id
     GROUP BY s.cohort_id
),
pathway_size AS (
    SELECT cohort_id,
           count(*)::int            AS total_lessons,
           sum(hours)               AS total_hours
      FROM v_cohort_pathway
     GROUP BY cohort_id
),
first_lesson AS (
    SELECT DISTINCT ON (cohort_id) cohort_id, lesson_id
      FROM v_cohort_pathway
     ORDER BY cohort_id, teaching_order
)
SELECT c.id                         AS cohort_id,
       c.code                       AS cohort_code,
       si.name                      AS site,
       t.code                       AS track_code,
       t.name_en                    AS track_name_en,
       t.name_fr                    AS track_name_fr,
       c.entry_level,
       c.pace,
       c.mixed_upper_level,
       c.enrolled_count,
       c.status,
       l.id                         AS resume_lesson_id,
       l.code                       AS resume_lesson_code,
       l.title_en                   AS resume_lesson_en,
       l.title_fr                   AS resume_lesson_fr,
       mo.code                      AS resume_module_code,
       mo.title_en                  AS resume_module_en,
       mo.title_fr                  AS resume_module_fr,
       latest.session_date          AS last_session_date,
       i.full_name                  AS last_instructor,
       (CURRENT_DATE - latest.session_date) AS days_since_last_session,
       COALESCE(covered.lessons_covered, 0) AS lessons_covered,
       COALESCE(ps.total_lessons, 0)        AS total_lessons,
       ps.total_hours
  FROM cohort c
  JOIN site  si ON si.id = c.site_id
  JOIN track t  ON t.id  = COALESCE(c.branch_id, c.track_id)
  LEFT JOIN latest      ON latest.cohort_id = c.id
  LEFT JOIN covered     ON covered.cohort_id = c.id
  LEFT JOIN pathway_size ps ON ps.cohort_id = c.id
  LEFT JOIN first_lesson fl ON fl.cohort_id = c.id
  LEFT JOIN instructor i ON i.id = latest.instructor_id
  -- No sessions yet: the first lesson OF THIS COHORT'S PATHWAY, which for
  -- an L2 cohort is not the first lesson of the foundation.
  LEFT JOIN lesson l ON l.id = COALESCE(latest.resume_lesson_id, fl.lesson_id)
  LEFT JOIN module mo ON mo.id = l.module_id;

/**
 * Where a mixed cohort will have to split.
 *
 * Lessons the lower entrants need that the higher ones do not. Named in
 * advance so an instructor can prepare something for the group that is
 * ahead, rather than discovering the problem with twelve people in a room.
 */
CREATE VIEW v_cohort_split_points AS
SELECT p.cohort_id, p.cohort_code, p.lesson_id, p.lesson_code,
       p.title_en, p.title_fr, p.level, p.teaching_order
  FROM v_cohort_pathway p
  JOIN cohort c ON c.id = p.cohort_id
 WHERE c.mixed_upper_level IS NOT NULL
   AND (SELECT rank FROM learner_level WHERE code = p.level)
       < (SELECT rank FROM learner_level WHERE code = c.mixed_upper_level);

COMMIT;
