-- =====================================================================
-- Constraint tests
--
--   psql training_log -f db/test-constraints.sql
--
-- Confirms the four schema decisions are actually enforced, rather than
-- just documented. Run after loading schema, seed and demo data.
--
-- Every test rolls back. Nothing here changes the database.
-- Expected output: eight lines, all starting PASS.
-- =====================================================================

\set ON_ERROR_STOP off
\set QUIET on
\pset tuples_only on
\pset format unaligned

DO $$
DECLARE
    ok      boolean;
    msg     text;
    sid     uuid := 'b0000001-0000-4000-8000-000000000001';
    newid   uuid := 'deadbeef-0000-4000-8000-000000000099';
BEGIN

-- ---- 1. A session row cannot be UPDATEd ----
BEGIN
    UPDATE session SET present_count = 99 WHERE id = sid;
    RAISE NOTICE 'FAIL  1. session UPDATE was allowed';
EXCEPTION WHEN restrict_violation THEN
    RAISE NOTICE 'PASS  1. session UPDATE refused';
END;

-- ---- 2. A session row cannot be DELETEd ----
BEGIN
    DELETE FROM session WHERE id = sid;
    RAISE NOTICE 'FAIL  2. session DELETE was allowed';
EXCEPTION WHEN restrict_violation THEN
    RAISE NOTICE 'PASS  2. session DELETE refused';
END;

-- ---- 3. A correction IS allowed, as a new superseding row ----
BEGIN
    INSERT INTO session (id, cohort_id, instructor_id, session_date,
                         present_count, resume_lesson_id, supersedes_id)
    SELECT newid, cohort_id, instructor_id, session_date,
           12, resume_lesson_id, sid
      FROM session WHERE id = sid;

    SELECT superseded_by_id = newid INTO ok FROM session WHERE id = sid;
    IF ok THEN
        RAISE NOTICE 'PASS  3. correction accepted and back-linked';
    ELSE
        RAISE NOTICE 'FAIL  3. correction inserted but not back-linked';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL  3. correction refused: %', SQLERRM;
END;

-- ---- 4. The superseded row drops out of the live view ----
BEGIN
    SELECT NOT EXISTS (SELECT 1 FROM v_session_current WHERE id = sid)
      INTO ok;
    IF ok THEN
        RAISE NOTICE 'PASS  4. superseded row hidden from v_session_current';
    ELSE
        RAISE NOTICE 'FAIL  4. superseded row still visible';
    END IF;
END;

-- ---- 5. A taught lesson cannot be rewritten ----
BEGIN
    UPDATE lesson SET title_en = 'Rewritten' WHERE code = 'CS-1.1';
    RAISE NOTICE 'FAIL  5. taught lesson was rewritten';
EXCEPTION WHEN restrict_violation THEN
    RAISE NOTICE 'PASS  5. rewriting a taught lesson refused';
END;

-- ---- 6. An untaught lesson CAN still be corrected ----
BEGIN
    UPDATE lesson SET title_en = title_en WHERE code = 'CS-7.3';
    RAISE NOTICE 'PASS  6. untaught lesson still editable';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL  6. untaught lesson edit refused: %', SQLERRM;
END;

-- ---- 7. An objective with results cannot be rewritten ----
BEGIN
    UPDATE objective SET text_en = 'Rewritten' WHERE code = 'CS-1.1.1';
    RAISE NOTICE 'FAIL  7. scored objective was rewritten';
EXCEPTION WHEN restrict_violation THEN
    RAISE NOTICE 'PASS  7. rewriting a scored objective refused';
END;

-- ---- 8. demonstrated_count cannot exceed present_count ----
BEGIN
    INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
    VALUES (newid, (SELECT id FROM objective WHERE code = 'CS-3.3.1'), 99);
    RAISE NOTICE 'FAIL  8. impossible demonstrated_count accepted';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS  8. demonstrated_count above present_count refused';
END;

RAISE EXCEPTION 'rollback: tests complete'
    USING ERRCODE = 'query_canceled';
EXCEPTION WHEN query_canceled THEN
    RAISE NOTICE '--- all tests rolled back, database unchanged ---';
END;
$$;
