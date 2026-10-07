-- =====================================================================
-- Places, and who is allowed to teach what.
--
-- Two changes, both from the October demo.
--
-- 1. "Branch" meant two different things.
--
--    The programme calls a training location a branch: country, then
--    city, then branch. The database used the same word for AI, DevOps,
--    Cybersecurity and Software Development. One word for a place and
--    for a subject, in the same model, is the kind of ambiguity that
--    produces a bug nobody can see in review — so the subject is now a
--    COURSE, everywhere, and branch is only ever a place.
--
--    Renamed here rather than aliased. A column called branch_id that
--    means a course would outlive every comment explaining it.
--
-- 2. An instructor is not qualified for a whole course.
--
--    The example given: five modules, and this instructor can teach one
--    to three but not four and five. That is the normal case, not an
--    exception — and it matters because a cohort does not stall when an
--    instructor leaves, it stalls when the cohort reaches material its
--    instructor cannot teach, which is foreseeable weeks ahead.
--
--    Competence is therefore recorded per MODULE, not per course, and
--    there is one source of truth: a row means approved, no row means
--    not. Approving a whole course writes one row per module. The
--    alternative — course-level approval with per-module exceptions —
--    gives two places to look and two ways to disagree.
--
-- Safe to run on the existing database. Nothing is deleted, and the
-- renames carry their data.
-- =====================================================================

BEGIN;

/* ---------- 1. country, city, branch ---------- */

CREATE TABLE IF NOT EXISTS country (
    code        text     PRIMARY KEY,        -- ISO-3166 alpha-2: 'BF'
    name_en     text     NOT NULL,
    name_fr     text     NOT NULL,
    position    smallint NOT NULL DEFAULT 1
);

COMMENT ON TABLE country IS
    'Countries the programme runs in. Present from the start because the '
    'Selltis work next door is already multi-country, and retrofitting a '
    'country column onto live site data is worse than carrying one now.';

-- A site row has always been a place to teach. It is now explicitly a
-- branch inside a city inside a country. The existing rows hold a city
-- name, so that is what they become; the branch takes the same name
-- until somebody gives it a better one.
ALTER TABLE site ADD COLUMN IF NOT EXISTS country_code text REFERENCES country(code);
ALTER TABLE site ADD COLUMN IF NOT EXISTS city         text;

INSERT INTO country (code, name_en, name_fr, position) VALUES
    ('BF', 'Burkina Faso', 'Burkina Faso', 1)
ON CONFLICT (code) DO NOTHING;

UPDATE site SET country_code = 'BF' WHERE country_code IS NULL;
UPDATE site SET city = name     WHERE city IS NULL;

-- A branch name is only unique within its city: two countries may both
-- have a "Centre-Ville", and that is not a conflict.
ALTER TABLE site DROP CONSTRAINT IF EXISTS site_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS site_place_unique
    ON site (country_code, city, name);

/* ---------- 2. a branch is a place; a course is a subject ---------- */

ALTER TABLE track DROP CONSTRAINT IF EXISTS track_kind_check;
UPDATE track SET kind = 'course' WHERE kind = 'branch';
ALTER TABLE track ADD CONSTRAINT track_kind_check
    CHECK (kind IN ('foundation', 'course'));

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'cohort' AND column_name = 'branch_id') THEN
        ALTER TABLE cohort RENAME COLUMN branch_id TO course_id;
    END IF;
END $$;

COMMENT ON COLUMN cohort.course_id IS
    'The specialism this cohort is heading into: AI, Cybersecurity, '
    'DevOps or Software Development. Was called branch_id until October '
    '2026, when branch came to mean the training location instead.';

/* ---------- 3. what each instructor is approved to teach ---------- */

CREATE TABLE IF NOT EXISTS instructor_module (
    instructor_id uuid        NOT NULL REFERENCES instructor(id),
    module_id     int         NOT NULL REFERENCES module(id),
    approved_on   date        NOT NULL DEFAULT CURRENT_DATE,
    approved_by   text,
    note          text,
    PRIMARY KEY (instructor_id, module_id)
);

COMMENT ON TABLE instructor_module IS
    'One row per module an instructor is approved to teach. A row means '
    'yes; no row means no. There is deliberately no course-level table: '
    'two places to record the same permission is two places to disagree.';

CREATE INDEX IF NOT EXISTS instructor_module_by_module
    ON instructor_module (module_id);

/* ---------- 4. rebuild the views that named the old word ---------- */

/*
 * Renaming a column carries into dependent views on its own; a string
 * literal does not. Both pathway views sorted on (kind = 'branch') to
 * put the foundation first, and that test is now always false — the
 * foundation and the course would interleave by module position, which
 * reads as a curriculum that teaches file management halfway through
 * threat modelling. So both are rebuilt against the new word.
 *
 * v_cohort_position is recreated too, because CASCADE takes it with the
 * pathway view it is built on.
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
           ORDER BY (t.kind = 'course'), m.position, l.position
       )                            AS teaching_order
  FROM cohort c
  JOIN track  t ON t.kind = 'foundation' OR t.id = COALESCE(c.course_id, c.track_id)
  JOIN module m ON m.track_id = t.id
  JOIN lesson l ON l.module_id = m.id
 WHERE l.retired_on IS NULL
   AND t.retired_on IS NULL
   AND m.retired_on IS NULL
   AND lesson_in_pathway(l.level, l.tier,
                         COALESCE(c.entry_level, 'L0'),
                         COALESCE(c.pace, 'standard'));

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
    SELECT cohort_id, count(*)::int AS total_lessons, sum(hours) AS total_hours
      FROM v_cohort_pathway GROUP BY cohort_id
),
first_lesson AS (
    SELECT DISTINCT ON (cohort_id) cohort_id, lesson_id
      FROM v_cohort_pathway ORDER BY cohort_id, teaching_order
)
SELECT c.id                         AS cohort_id,
       c.code                       AS cohort_code,
       si.name                      AS site,
       si.city                      AS city,
       si.country_code              AS country_code,
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
  JOIN track t  ON t.id  = COALESCE(c.course_id, c.track_id)
  LEFT JOIN latest       ON latest.cohort_id = c.id
  LEFT JOIN covered      ON covered.cohort_id = c.id
  LEFT JOIN pathway_size ps ON ps.cohort_id = c.id
  LEFT JOIN first_lesson fl ON fl.cohort_id = c.id
  LEFT JOIN instructor i ON i.id = latest.instructor_id
  LEFT JOIN lesson l  ON l.id = COALESCE(latest.resume_lesson_id, fl.lesson_id)
  LEFT JOIN module mo ON mo.id = l.module_id;

CREATE VIEW v_cohort_split_points AS
SELECT p.cohort_id, p.cohort_code, p.lesson_id, p.lesson_code,
       p.title_en, p.title_fr, p.level, p.teaching_order
  FROM v_cohort_pathway p
  JOIN cohort c ON c.id = p.cohort_id
 WHERE c.mixed_upper_level IS NOT NULL
   AND NOT lesson_in_pathway(p.level, p.tier,
                             c.mixed_upper_level,
                             COALESCE(c.pace, 'standard'));

/* ---------- 5. the course view, derived ---------- */

DROP VIEW IF EXISTS v_instructor_course CASCADE;

CREATE VIEW v_instructor_course AS
SELECT i.id                                   AS instructor_id,
       i.full_name,
       t.id                                   AS track_id,
       t.code                                 AS course_code,
       t.kind                                 AS course_kind,
       t.name_en                              AS course_name_en,
       t.name_fr                              AS course_name_fr,
       count(m.id)                            AS modules_total,
       count(im.module_id)                    AS modules_approved,
       (count(im.module_id) = count(m.id))    AS teaches_whole_course,
       (count(im.module_id) > 0)              AS teaches_any
  FROM instructor i
  CROSS JOIN track t
  JOIN module m ON m.track_id = t.id AND m.retired_on IS NULL
  LEFT JOIN instructor_module im
         ON im.module_id = m.id AND im.instructor_id = i.id
 WHERE t.retired_on IS NULL
   AND i.ended_on IS NULL
 GROUP BY i.id, i.full_name, t.id, t.code, t.kind, t.name_en, t.name_fr;

COMMENT ON VIEW v_instructor_course IS
    'Course-level competence, worked out from the module rows rather than '
    'stored. "Approved for 6 of 9 modules" is the honest answer and the '
    'one a supervisor needs.';

/* ---------- 6. where a cohort runs out of cover ---------- */

DROP VIEW IF EXISTS v_cohort_coverage CASCADE;

/*
 * The question this answers: given who is teaching this group today,
 * how far can they get before they reach a module nobody assigned to
 * the cohort is approved for?
 *
 * It is the handover problem seen in advance. The existing oversight
 * queue reports a cohort that has already stalled; this one reports a
 * cohort that is going to, with enough notice to do something about it.
 */
CREATE VIEW v_cohort_coverage AS
WITH assigned AS (
    SELECT ci.cohort_id, ci.instructor_id
      FROM cohort_instructor ci
     WHERE ci.assigned_to IS NULL
),
-- Every lesson the cohort still has to teach, in order, with whether
-- anyone currently on the cohort can teach its module.
upcoming AS (
    SELECT p.cohort_id,
           p.cohort_code,
           p.teaching_order,
           p.lesson_code,
           p.module_code,
           p.module_title_en,
           p.module_title_fr,
           l.module_id,
           EXISTS (
               SELECT 1 FROM assigned a
                JOIN instructor_module im
                  ON im.instructor_id = a.instructor_id
                 AND im.module_id = l.module_id
                WHERE a.cohort_id = p.cohort_id
           ) AS covered
      FROM v_cohort_pathway p
      JOIN lesson l ON l.id = p.lesson_id
),
pos AS (
    SELECT cohort_code, resume_lesson_code, lessons_covered
      FROM v_cohort_position
),
-- The first uncovered module at or after where the cohort now stands.
gap AS (
    SELECT DISTINCT ON (u.cohort_id)
           u.cohort_id, u.cohort_code, u.teaching_order,
           u.module_code, u.module_title_en, u.module_title_fr
      FROM upcoming u
      JOIN pos ON pos.cohort_code = u.cohort_code
     WHERE NOT u.covered
       AND u.teaching_order > pos.lessons_covered
     ORDER BY u.cohort_id, u.teaching_order
)
SELECT c.id                              AS cohort_id,
       c.code                            AS cohort_code,
       (SELECT count(*) FROM assigned a WHERE a.cohort_id = c.id)::int
                                         AS instructors_assigned,
       g.module_code                     AS first_uncovered_module,
       g.module_title_en                 AS first_uncovered_module_en,
       g.module_title_fr                 AS first_uncovered_module_fr,
       -- How many lessons of teaching are left before they hit it. Zero
       -- means they are standing at it now.
       CASE WHEN g.teaching_order IS NULL THEN NULL
            ELSE GREATEST(g.teaching_order - 1 - COALESCE(pos.lessons_covered, 0), 0)::int
       END                               AS lessons_until_gap,
       (g.module_code IS NULL)           AS covered_to_the_end
  FROM cohort c
  LEFT JOIN gap g  ON g.cohort_id = c.id
  LEFT JOIN pos    ON pos.cohort_code = c.code
 WHERE c.status IN ('planned', 'active');

COMMENT ON VIEW v_cohort_coverage IS
    'Where each active cohort runs out of people approved to teach what '
    'comes next. covered_to_the_end means the instructors on it today can '
    'finish it.';

COMMIT;
