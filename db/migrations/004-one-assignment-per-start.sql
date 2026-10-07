-- =====================================================================
-- An assignment is unique, and the table now says so.
--
-- Split out of 003 rather than added to it. A migration that has run
-- anywhere is finished: editing it means a database that already applied
-- the old version silently never gets the new part, and nothing reports
-- that. Cheaper to add a file than to rely on nobody having run it.
--
-- The bug: cohort_instructor has a serial primary key, so "ON CONFLICT
-- DO NOTHING" in the demo file could never fire — every re-apply of that
-- file inserted each assignment again. It surfaced as "which Aminata
-- Ouédraogo, Aminata Ouédraogo cannot teach" on the dashboard, which is
-- the harmless version; the same duplication would also have
-- double-counted how many people are on a group.
--
-- The natural key is the person, the group, and the day they started.
-- =====================================================================

BEGIN;

DELETE FROM cohort_instructor a
 USING cohort_instructor b
 WHERE a.id > b.id
   AND a.cohort_id = b.cohort_id
   AND a.instructor_id = b.instructor_id
   AND a.assigned_from = b.assigned_from;

CREATE UNIQUE INDEX IF NOT EXISTS cohort_instructor_unique
    ON cohort_instructor (cohort_id, instructor_id, assigned_from);

COMMIT;
