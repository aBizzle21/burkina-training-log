-- =====================================================================
-- Burkina Faso Training Log — Postgres schema
--
-- Load order:
--   psql training_log -f db/schema.sql
--   psql training_log -f db/seed/01-reference.sql
--   psql training_log -f db/seed/02-curriculum.sql
--   psql training_log -f db/demo/demo-data.sql     (optional, not production)
--
-- Four decisions are built into this schema that are painful to reverse.
-- They are explained where they appear, and in full in docs/data-model.md:
--   1. Sessions are append-only. Corrections supersede, they never update.
--   2. The device generates the session id, not the server.
--   3. The server stamps arrival time; the device supplies session date.
--   4. Lessons are retired, never rewritten, once taught against.
-- =====================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive login codes


-- =====================================================================
-- SECTION 1 — CURRICULUM
--
-- Reference data, loaded from data/curriculum.json. Changes rarely.
-- Every user-visible string is stored in both English and French,
-- because the curriculum is delivered in French but reviewed in English.
-- =====================================================================

CREATE TABLE track (
    id              smallserial PRIMARY KEY,
    code            text        NOT NULL UNIQUE,     -- 'CS', 'OPS', 'SEC', 'AI'
    position        smallint    NOT NULL,
    name_en         text        NOT NULL,
    name_fr         text        NOT NULL,
    color           text,                            -- hex, for charts
    retired_on      date,                            -- set instead of deleting
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE track IS
    'A programme of study. Cohorts are enrolled against exactly one track.';

CREATE TABLE module (
    id              serial      PRIMARY KEY,
    track_id        smallint    NOT NULL REFERENCES track(id),
    code            text        NOT NULL,            -- 'M1' — unique per track
    position        smallint    NOT NULL,
    title_en        text        NOT NULL,
    title_fr        text        NOT NULL,
    retired_on      date,
    created_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (track_id, code)
);

CREATE TABLE lesson (
    id              serial      PRIMARY KEY,
    module_id       integer     NOT NULL REFERENCES module(id),
    code            text        NOT NULL UNIQUE,     -- 'CS-2.3' — unique programme-wide
    position        smallint    NOT NULL,
    title_en        text        NOT NULL,
    title_fr        text        NOT NULL,

    -- DECISION 4. A lesson that has ever been taught is never edited in
    -- place: doing so would silently rewrite what past sessions claim to
    -- have covered. To change one, set retired_on and add a replacement.
    -- The check constraint below enforces this at write time.
    retired_on      date,
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN lesson.retired_on IS
    'Set to withdraw a lesson from future planning. Past sessions that '
    'reference it stay valid and readable. Never delete a lesson row.';

CREATE INDEX lesson_module_idx ON lesson(module_id, position);

CREATE TABLE objective (
    id              serial      PRIMARY KEY,
    lesson_id       integer     NOT NULL REFERENCES lesson(id),
    code            text        NOT NULL UNIQUE,     -- 'CS-2.3.1'
    position        smallint    NOT NULL,
    text_en         text        NOT NULL,
    text_fr         text        NOT NULL,
    retired_on      date,
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE objective IS
    'What a learner must be able to do for the lesson to count as landed. '
    'Each one needs a check a second instructor could administer and mark '
    'the same way — that is what makes the resume point meaningful.';

CREATE INDEX objective_lesson_idx ON objective(lesson_id, position);


-- =====================================================================
-- SECTION 2 — VOCABULARY
--
-- Small closed lists. Kept as tables rather than enums so they can be
-- added to without a migration, and so they carry both languages.
-- =====================================================================

CREATE TABLE teaching_method (
    id              smallserial PRIMARY KEY,
    code            text        NOT NULL UNIQUE,     -- 'guidee', 'labo'
    position        smallint    NOT NULL,
    name_en         text        NOT NULL,
    name_fr         text        NOT NULL,
    color           text,
    active          boolean     NOT NULL DEFAULT true
);

COMMENT ON TABLE teaching_method IS
    'Fixed vocabulary for how a session was taught. A closed list is the '
    'whole point: free text cannot be compared across instructors.';

CREATE TABLE disruption_reason (
    id              smallserial PRIMARY KEY,
    code            text        NOT NULL UNIQUE,     -- 'power_cut'
    position        smallint    NOT NULL,
    label_en        text        NOT NULL,
    label_fr        text        NOT NULL,
    active          boolean     NOT NULL DEFAULT true
);

COMMENT ON TABLE disruption_reason IS
    'Why a session did not go to plan. A repeating reason is usually a '
    'facilities or logistics problem, not a teaching one — the oversight '
    'queue routes it that way.';

CREATE TABLE observation_criterion (
    id              smallserial PRIMARY KEY,
    position        smallint    NOT NULL,
    text_en         text        NOT NULL,
    text_fr         text        NOT NULL,
    active          boolean     NOT NULL DEFAULT true,
    retired_on      date
);

CREATE TABLE observation_scale (
    score           smallint    PRIMARY KEY CHECK (score BETWEEN 1 AND 4),
    label_en        text        NOT NULL,
    label_fr        text        NOT NULL
);


-- =====================================================================
-- SECTION 3 — PEOPLE AND COHORTS
-- =====================================================================

CREATE TABLE instructor (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       text        NOT NULL,
    phone           text,

    -- DECISION (see docs/open-decisions.md #2). Instructors identify with a
    -- personal code rather than SMS verification: SMS costs money per message
    -- and delivers unreliably in-country. The code is stored hashed. If the
    -- programme later moves to SMS or another method, this column goes unused
    -- rather than needing a schema change.
    login_code      citext      UNIQUE,
    login_code_hash text,

    role            text        NOT NULL DEFAULT 'instructor'
                                CHECK (role IN ('instructor', 'supervisor', 'admin')),
    active          boolean     NOT NULL DEFAULT true,
    started_on      date,
    ended_on        date,                            -- set when they leave
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN instructor.ended_on IS
    'Set when someone leaves. Their past sessions stay attributed to them; '
    'nothing is reassigned or deleted. Departure is expected to be abrupt '
    'and unannounced, so nothing in the system may depend on an exit interview.';

CREATE TABLE site (
    id              smallserial PRIMARY KEY,
    name            text        NOT NULL UNIQUE,     -- 'Ouagadougou'
    region          text,
    notes           text
);

CREATE TABLE cohort (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    code            text        NOT NULL UNIQUE,     -- 'BF-01'
    site_id         smallint    NOT NULL REFERENCES site(id),
    track_id        smallint    NOT NULL REFERENCES track(id),
    enrolled_count  smallint    NOT NULL CHECK (enrolled_count >= 0),
    started_on      date,
    expected_end_on date,
    ended_on        date,
    status          text        NOT NULL DEFAULT 'planned'
                                CHECK (status IN ('planned','active','paused','finished','cancelled')),
    notes           text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cohort_status_idx ON cohort(status) WHERE status = 'active';

-- Who is assigned to a cohort, and over what period. Open-ended when current.
-- This is the assignment record; the session rows are the record of who
-- actually taught. They can and do disagree, which is itself a signal.
CREATE TABLE cohort_instructor (
    id              serial      PRIMARY KEY,
    cohort_id       uuid        NOT NULL REFERENCES cohort(id),
    instructor_id   uuid        NOT NULL REFERENCES instructor(id),
    assigned_from   date        NOT NULL,
    assigned_to     date,
    is_primary      boolean     NOT NULL DEFAULT true,
    CHECK (assigned_to IS NULL OR assigned_to >= assigned_from)
);

CREATE INDEX cohort_instructor_cohort_idx ON cohort_instructor(cohort_id, assigned_from DESC);


-- =====================================================================
-- SECTION 4 — SESSIONS
--
-- The heart of the system. One row per instructor per cohort per day.
--
-- DECISION 1 — APPEND ONLY.
-- A session row is never UPDATEd once written. A correction is a NEW row
-- with supersedes_id pointing at the row it replaces. Readers take the
-- newest row in each supersede chain (v_session_current does this).
--
-- Why: entry lag, the deviation history, and the "log has no friction in
-- it" check all depend on knowing what was originally claimed and when.
-- If yesterday's entry can be quietly edited, every one of those signals
-- becomes unfalsifiable. The trigger below enforces it.
-- =====================================================================

CREATE TABLE session (
    -- DECISION 2 — the DEVICE generates this id, not the server.
    -- The entry is written on the phone before any connection exists, so it
    -- needs an identity from the moment of creation. It also makes the ingest
    -- endpoint naturally idempotent: a retry on a bad connection carries the
    -- same id and is recognised as a duplicate instead of creating a phantom
    -- second session. Never replace this with a server-side sequence.
    id                  uuid        PRIMARY KEY,

    cohort_id           uuid        NOT NULL REFERENCES cohort(id),
    instructor_id       uuid        NOT NULL REFERENCES instructor(id),

    -- DECISION 3 — two different clocks, deliberately kept apart.
    -- session_date is what the instructor typed: the day they taught.
    -- submitted_at is stamped by the SERVER on arrival, never by the device.
    -- Their difference is the entry-lag signal. If the device supplied both,
    -- changing the phone clock would erase the signal.
    session_date        date        NOT NULL,
    submitted_at        timestamptz NOT NULL DEFAULT now(),
    device_created_at   timestamptz,                 -- device clock, advisory only

    present_count       smallint    NOT NULL CHECK (present_count >= 0),

    -- Where the next session starts. This single column is the entire
    -- continuity mechanism: a replacement reads it and nothing else.
    resume_lesson_id    integer     NOT NULL REFERENCES lesson(id),

    dominant_method_id  smallint    REFERENCES teaching_method(id),
    disruption_id       smallint    REFERENCES disruption_reason(id),
    flag_note           text        CHECK (flag_note IS NULL OR length(flag_note) <= 240),

    -- Correction chain. NULL for an original entry.
    supersedes_id       uuid        REFERENCES session(id),
    superseded_by_id    uuid        REFERENCES session(id),

    device_id           text,                        -- which handset, for support
    app_version         text,

    CHECK (supersedes_id IS NULL OR supersedes_id <> id)
);

COMMENT ON TABLE session IS
    'One instructor-day of teaching. APPEND ONLY — corrections are new rows '
    'linked by supersedes_id. Read through v_session_current, never directly.';

COMMENT ON COLUMN session.resume_lesson_id IS
    'Where the next session picks up. The whole handover capability rests on '
    'this one column being filled honestly every day.';

CREATE INDEX session_cohort_date_idx  ON session(cohort_id, session_date DESC);
CREATE INDEX session_instructor_idx   ON session(instructor_id, session_date DESC);
CREATE INDEX session_submitted_idx    ON session(submitted_at DESC);
CREATE INDEX session_live_idx         ON session(cohort_id, session_date DESC)
                                       WHERE superseded_by_id IS NULL;

-- Lessons actually covered in the session. Many per session.
CREATE TABLE session_lesson (
    session_id      uuid        NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    lesson_id       integer     NOT NULL REFERENCES lesson(id),
    PRIMARY KEY (session_id, lesson_id)
);

COMMENT ON TABLE session_lesson IS
    'What was actually taught, which is not always what was planned. The '
    'difference between this and the previous resume point is the deviation.';

-- Methods used. The dominant one is also denormalised onto session.
CREATE TABLE session_method (
    session_id      uuid        NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    method_id       smallint    NOT NULL REFERENCES teaching_method(id),
    PRIMARY KEY (session_id, method_id)
);

-- How many learners demonstrated each objective.
--
-- A COUNT, not a per-learner record. Per-learner mastery would roughly double
-- the time the form takes, and a form that takes fifteen minutes gets filled
-- in on Friday from memory — which destroys the continuity data too, not just
-- the assessment data. Individual learner records belong on a separate,
-- lower-frequency end-of-module check.
CREATE TABLE session_objective (
    session_id          uuid        NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    objective_id        integer     NOT NULL REFERENCES objective(id),
    demonstrated_count  smallint    NOT NULL CHECK (demonstrated_count >= 0),
    PRIMARY KEY (session_id, objective_id)
);

COMMENT ON COLUMN session_objective.demonstrated_count IS
    'Out of session.present_count, not out of cohort.enrolled_count. Absent '
    'learners cannot demonstrate anything and must not count as failures.';


-- =====================================================================
-- SECTION 5 — OBSERVATION
--
-- Built and dormant. Nothing writes here yet.
--
-- The tables exist now so that turning observation on later is a feature,
-- not a migration. Until in-country capacity exists, the oversight queue
-- treats "never observed" as a low-priority flag rather than a failure.
--
-- This is the only evidence in the whole system that does not come from
-- the person being reviewed. That makes it structurally different from
-- everything above, and worth more per record than any of it.
-- =====================================================================

CREATE TABLE observation (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id           uuid        NOT NULL REFERENCES cohort(id),
    instructor_id       uuid        NOT NULL REFERENCES instructor(id),
    observed_on         date        NOT NULL,
    lesson_id           integer     REFERENCES lesson(id),

    -- Free text, not a foreign key: the observer may be a site lead, a
    -- school principal, or a peer instructor, and some of those will never
    -- have a row in instructor.
    observer_name       text        NOT NULL,
    observer_role       text,
    observer_id         uuid        REFERENCES instructor(id),   -- when it is a peer

    summary_note        text,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX observation_instructor_idx ON observation(instructor_id, observed_on DESC);

CREATE TABLE observation_score (
    observation_id  uuid        NOT NULL REFERENCES observation(id) ON DELETE CASCADE,
    criterion_id    smallint    NOT NULL REFERENCES observation_criterion(id),
    score           smallint    NOT NULL REFERENCES observation_scale(score),
    note            text,
    PRIMARY KEY (observation_id, criterion_id)
);


-- =====================================================================
-- SECTION 6 — CONSTRAINTS THAT ENFORCE THE DECISIONS
-- =====================================================================

-- DECISION 1. Block UPDATE and DELETE on session outright, with one
-- exception: setting superseded_by_id, which is how a correction links
-- itself to the row it replaces.
CREATE OR REPLACE FUNCTION session_is_append_only()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION
            'session rows cannot be deleted (id %). Write a correcting row '
            'with supersedes_id instead.', OLD.id
            USING ERRCODE = 'restrict_violation';
    END IF;

    -- superseded_by_id is the ONLY column an update may touch. Anything
    -- else changing means someone is editing history.
    IF OLD.id                 IS DISTINCT FROM NEW.id
    OR OLD.cohort_id          IS DISTINCT FROM NEW.cohort_id
    OR OLD.instructor_id      IS DISTINCT FROM NEW.instructor_id
    OR OLD.session_date       IS DISTINCT FROM NEW.session_date
    OR OLD.submitted_at       IS DISTINCT FROM NEW.submitted_at
    OR OLD.device_created_at  IS DISTINCT FROM NEW.device_created_at
    OR OLD.present_count      IS DISTINCT FROM NEW.present_count
    OR OLD.resume_lesson_id   IS DISTINCT FROM NEW.resume_lesson_id
    OR OLD.dominant_method_id IS DISTINCT FROM NEW.dominant_method_id
    OR OLD.disruption_id      IS DISTINCT FROM NEW.disruption_id
    OR OLD.flag_note          IS DISTINCT FROM NEW.flag_note
    OR OLD.supersedes_id      IS DISTINCT FROM NEW.supersedes_id
    OR OLD.device_id          IS DISTINCT FROM NEW.device_id
    OR OLD.app_version        IS DISTINCT FROM NEW.app_version
    THEN
        RAISE EXCEPTION
            'session rows are append-only (id %). To correct an entry, '
            'insert a new row with supersedes_id = %.', OLD.id, OLD.id
            USING ERRCODE = 'restrict_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER session_append_only
    BEFORE UPDATE OR DELETE ON session
    FOR EACH ROW EXECUTE FUNCTION session_is_append_only();

-- Keep the supersede chain consistent in both directions.
CREATE OR REPLACE FUNCTION session_link_supersede()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.supersedes_id IS NOT NULL THEN
        UPDATE session
           SET superseded_by_id = NEW.id
         WHERE id = NEW.supersedes_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER session_supersede_link
    AFTER INSERT ON session
    FOR EACH ROW EXECUTE FUNCTION session_link_supersede();

-- DECISION 4. Refuse to retire a lesson that a live session still resumes at,
-- and refuse to edit the text of a lesson that has been taught.
CREATE OR REPLACE FUNCTION lesson_protect_taught()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    taught boolean;
BEGIN
    IF OLD.title_en IS DISTINCT FROM NEW.title_en
    OR OLD.code     IS DISTINCT FROM NEW.code
    OR OLD.title_fr IS DISTINCT FROM NEW.title_fr THEN
        SELECT EXISTS (SELECT 1 FROM session_lesson WHERE lesson_id = OLD.id)
          INTO taught;
        IF taught THEN
            RAISE EXCEPTION
                'lesson % has already been taught and cannot be rewritten. '
                'Set retired_on and add a replacement lesson instead.', OLD.code
                USING ERRCODE = 'restrict_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER lesson_protect
    BEFORE UPDATE ON lesson
    FOR EACH ROW EXECUTE FUNCTION lesson_protect_taught();

-- The same protection for objectives, which is where the assessment
-- comparison actually lives.
CREATE OR REPLACE FUNCTION objective_protect_used()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    used boolean;
BEGIN
    IF OLD.text_en IS DISTINCT FROM NEW.text_en
    OR OLD.code    IS DISTINCT FROM NEW.code
    OR OLD.text_fr IS DISTINCT FROM NEW.text_fr THEN
        SELECT EXISTS (SELECT 1 FROM session_objective WHERE objective_id = OLD.id)
          INTO used;
        IF used THEN
            RAISE EXCEPTION
                'objective % has recorded results and cannot be rewritten. '
                'Retire it and add a replacement instead.', OLD.code
                USING ERRCODE = 'restrict_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER objective_protect
    BEFORE UPDATE ON objective
    FOR EACH ROW EXECUTE FUNCTION objective_protect_used();

-- A session's counts can never exceed the number of learners present.
CREATE OR REPLACE FUNCTION objective_count_within_present()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    present smallint;
BEGIN
    SELECT present_count INTO present FROM session WHERE id = NEW.session_id;
    IF NEW.demonstrated_count > present THEN
        RAISE EXCEPTION
            'demonstrated_count % exceeds present_count % for session %',
            NEW.demonstrated_count, present, NEW.session_id
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER session_objective_bounds
    BEFORE INSERT OR UPDATE ON session_objective
    FOR EACH ROW EXECUTE FUNCTION objective_count_within_present();

-- Touch updated_at on the two tables that are legitimately mutable.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER instructor_touch BEFORE UPDATE ON instructor
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER cohort_touch BEFORE UPDATE ON cohort
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- =====================================================================
-- SECTION 7 — VIEWS
--
-- Everything that reads sessions goes through v_session_current. Reading
-- the session table directly will double-count corrected entries.
-- =====================================================================

-- Live sessions only: the newest row in each supersede chain.
CREATE VIEW v_session_current AS
SELECT s.*,
       (s.submitted_at::date - s.session_date) AS entry_lag_days
  FROM session s
 WHERE s.superseded_by_id IS NULL;

COMMENT ON VIEW v_session_current IS
    'The only sanctioned way to read sessions. Excludes superseded rows.';

-- Where each cohort stands. This view IS the handover sheet.
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
track_size AS (
    SELECT m.track_id, count(*) AS total_lessons
      FROM lesson l
      JOIN module m ON m.id = l.module_id
     WHERE l.retired_on IS NULL
     GROUP BY m.track_id
)
SELECT c.id                         AS cohort_id,
       c.code                       AS cohort_code,
       si.name                      AS site,
       t.code                       AS track_code,
       t.name_en                    AS track_name_en,
       t.name_fr                    AS track_name_fr,
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
       ts.total_lessons
  FROM cohort c
  JOIN site  si ON si.id = c.site_id
  JOIN track t  ON t.id  = c.track_id
  LEFT JOIN latest    ON latest.cohort_id = c.id
  LEFT JOIN covered   ON covered.cohort_id = c.id
  LEFT JOIN track_size ts ON ts.track_id = c.track_id
  LEFT JOIN instructor i ON i.id = latest.instructor_id
  -- No sessions yet: fall back to the first lesson of the track.
  LEFT JOIN lesson l ON l.id = COALESCE(
        latest.resume_lesson_id,
        (SELECT l2.id FROM lesson l2
           JOIN module m2 ON m2.id = l2.module_id
          WHERE m2.track_id = c.track_id AND l2.retired_on IS NULL
          ORDER BY m2.position, l2.position LIMIT 1))
  LEFT JOIN module mo ON mo.id = l.module_id;

COMMENT ON VIEW v_cohort_position IS
    'One row per cohort: where it stopped, who taught last, how stale. '
    'A replacement instructor needs this row and nothing else.';

-- Objective demonstration rate per cohort. The only genuine comparator
-- across instructors, and still self-reported.
CREATE VIEW v_cohort_outcomes AS
SELECT s.cohort_id,
       count(DISTINCT s.id)                 AS session_count,
       sum(so.demonstrated_count)           AS demonstrated,
       sum(s.present_count)                 AS opportunities,
       CASE WHEN sum(s.present_count) > 0
            THEN round(sum(so.demonstrated_count)::numeric
                     / sum(s.present_count)::numeric, 4)
       END                                  AS demonstration_rate,
       round(avg(lesson_counts.n)::numeric, 2) AS lessons_per_session
  FROM v_session_current s
  JOIN session_objective so ON so.session_id = s.id
  LEFT JOIN LATERAL (
        SELECT count(*) AS n FROM session_lesson sl WHERE sl.session_id = s.id
  ) lesson_counts ON true
 GROUP BY s.cohort_id;

-- Per-instructor picture: method mix, outcome rate, entry punctuality,
-- and when they were last observed by someone else.
CREATE VIEW v_instructor_summary AS
WITH sess AS (
    SELECT s.instructor_id,
           count(*)                    AS session_count,
           avg(s.entry_lag_days)       AS avg_entry_lag_days,
           max(s.session_date)         AS last_session_date
      FROM v_session_current s
     GROUP BY s.instructor_id
),
outcomes AS (
    SELECT s.instructor_id,
           sum(so.demonstrated_count)  AS demonstrated,
           sum(s.present_count)        AS opportunities
      FROM v_session_current s
      JOIN session_objective so ON so.session_id = s.id
     GROUP BY s.instructor_id
),
methods AS (
    SELECT s.instructor_id, tm.code AS method_code, count(*) AS uses
      FROM v_session_current s
      JOIN session_method sm ON sm.session_id = s.id
      JOIN teaching_method tm ON tm.id = sm.method_id
     GROUP BY s.instructor_id, tm.code
),
method_top AS (
    SELECT DISTINCT ON (instructor_id)
           instructor_id, method_code AS top_method,
           uses::numeric / sum(uses) OVER (PARTITION BY instructor_id) AS top_share
      FROM methods
     ORDER BY instructor_id, uses DESC
),
obs AS (
    SELECT instructor_id, max(observed_on) AS last_observed_on, count(*) AS observation_count
      FROM observation GROUP BY instructor_id
)
SELECT i.id                          AS instructor_id,
       i.full_name,
       i.active,
       i.ended_on,
       COALESCE(sess.session_count, 0)      AS session_count,
       sess.last_session_date,
       round(sess.avg_entry_lag_days, 2)    AS avg_entry_lag_days,
       CASE WHEN outcomes.opportunities > 0
            THEN round(outcomes.demonstrated::numeric
                     / outcomes.opportunities::numeric, 4)
       END                                  AS demonstration_rate,
       method_top.top_method,
       round(method_top.top_share, 3)       AS top_method_share,
       obs.last_observed_on,
       COALESCE(obs.observation_count, 0)   AS observation_count
  FROM instructor i
  LEFT JOIN sess       ON sess.instructor_id = i.id
  LEFT JOIN outcomes   ON outcomes.instructor_id = i.id
  LEFT JOIN method_top ON method_top.instructor_id = i.id
  LEFT JOIN obs        ON obs.instructor_id = i.id;

COMMENT ON VIEW v_instructor_summary IS
    'Every column except last_observed_on was entered by the instructor it '
    'describes. Read it as a pointer to a conversation, not as a rating.';

COMMIT;
