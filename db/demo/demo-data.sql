-- =====================================================================
-- Demo data — NOT FOR PRODUCTION
--
--   psql training_log -f db/demo/demo-data.sql
--
-- Mirrors the seed data in the two prototypes so a fresh database shows
-- the same picture the mockups do. Five cohorts, four instructors, and a
-- deliberate spread of situations:
--
--   BF-01  Computer Science, Ouagadougou — instructor changes mid-module
--          on 27 Aug. This is the handover case: Clarisse picks up from
--          the log alone, with no meeting and no call.
--   BF-02  Cybersecurity, Bobo-Dioulasso — lecture-only, learners not
--          clearing objectives, entries filed days late. Three separate
--          oversight flags on one instructor.
--   BF-03  DevOps, Koudougou — moving fast, high demonstration rate,
--          broad method mix. The control case: it should raise nothing.
--   BF-04  AI, Ouagadougou — logging stopped on 21 Aug. Stale-entry case.
--   BF-05  Computer Science, Banfora — no sessions at all. Day-one case.
--
-- Dates are anchored to 2026-09-01 as "today", matching the prototypes.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Sites
-- ---------------------------------------------------------------------
INSERT INTO site (name, region) VALUES
    ('Ouagadougou',    'Centre'),
    ('Bobo-Dioulasso', 'Hauts-Bassins'),
    ('Koudougou',      'Centre-Ouest'),
    ('Banfora',        'Cascades')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- Instructors
-- ---------------------------------------------------------------------
INSERT INTO instructor (id, full_name, role, started_on) VALUES
    ('11111111-1111-4111-8111-111111111111', 'Aminata Ouédraogo', 'instructor', '2026-08-01'),
    ('22222222-2222-4222-8222-222222222222', 'Issouf Sawadogo',   'instructor', '2026-08-01'),
    ('33333333-3333-4333-8333-333333333333', 'Clarisse Zongo',    'instructor', '2026-08-01'),
    ('44444444-4444-4444-8444-444444444444', 'Boureima Traoré',   'instructor', '2026-08-01')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- Cohorts
-- ---------------------------------------------------------------------
INSERT INTO cohort (id, code, site_id, track_id, enrolled_count, started_on, status) VALUES
    ('aaaaaaaa-0001-4000-8000-000000000001', 'BF-01',
     (SELECT id FROM site WHERE name='Ouagadougou'),
     (SELECT id FROM track WHERE code='CS'),  14, '2026-08-24', 'active'),
    ('aaaaaaaa-0002-4000-8000-000000000002', 'BF-02',
     (SELECT id FROM site WHERE name='Bobo-Dioulasso'),
     (SELECT id FROM track WHERE code='SEC'), 11, '2026-08-25', 'active'),
    ('aaaaaaaa-0003-4000-8000-000000000003', 'BF-03',
     (SELECT id FROM site WHERE name='Koudougou'),
     (SELECT id FROM track WHERE code='OPS'),  9, '2026-08-26', 'active'),
    ('aaaaaaaa-0004-4000-8000-000000000004', 'BF-04',
     (SELECT id FROM site WHERE name='Ouagadougou'),
     (SELECT id FROM track WHERE code='AI'),  12, '2026-08-20', 'active'),
    ('aaaaaaaa-0005-4000-8000-000000000005', 'BF-05',
     (SELECT id FROM site WHERE name='Banfora'),
     (SELECT id FROM track WHERE code='CS'),  10, '2026-09-07', 'planned')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cohort_instructor (cohort_id, instructor_id, assigned_from, assigned_to, is_primary) VALUES
    ('aaaaaaaa-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '2026-08-24', '2026-08-26', true),
    -- Aminata away on assignment; Clarisse covers, then Aminata returns.
    ('aaaaaaaa-0001-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', '2026-08-27', '2026-08-28', true),
    ('aaaaaaaa-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', '2026-08-31', NULL, true),
    ('aaaaaaaa-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', '2026-08-25', NULL, true),
    ('aaaaaaaa-0003-4000-8000-000000000003', '44444444-4444-4444-8444-444444444444', '2026-08-26', NULL, true),
    ('aaaaaaaa-0004-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333', '2026-08-20', NULL, true)
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------
-- Sessions
--
-- Written through a helper so the demo file stays readable. submitted_at
-- is set explicitly here ONLY because this is backdated demo data; in
-- production the server default (now()) is what stamps it, and nothing
-- in the application may set it.
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pg_temp.demo_session(
    p_id            uuid,
    p_cohort        text,
    p_instructor    text,
    p_date          date,
    p_submitted     date,
    p_present       int,
    p_lessons       text[],
    p_resume        text,
    p_methods       text[],
    p_dominant      text,
    p_objectives    text[],       -- alternating code, count
    p_disruption    text,
    p_flag          text
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    i int;
BEGIN
    INSERT INTO session (
        id, cohort_id, instructor_id, session_date, submitted_at,
        present_count, resume_lesson_id, dominant_method_id, disruption_id,
        flag_note, device_id, app_version
    ) VALUES (
        p_id,
        (SELECT id FROM cohort WHERE code = p_cohort),
        p_instructor::uuid,
        p_date,
        p_submitted::timestamptz + time '17:30',
        p_present::smallint,
        (SELECT id FROM lesson WHERE code = p_resume),
        (SELECT id FROM teaching_method WHERE code = p_dominant),
        (SELECT id FROM disruption_reason WHERE code = p_disruption),
        p_flag,
        'demo-device',
        'demo'
    );

    INSERT INTO session_lesson (session_id, lesson_id)
    SELECT p_id, l.id FROM lesson l WHERE l.code = ANY(p_lessons);

    INSERT INTO session_method (session_id, method_id)
    SELECT p_id, tm.id FROM teaching_method tm WHERE tm.code = ANY(p_methods);

    IF p_objectives IS NOT NULL THEN
        i := 1;
        WHILE i < array_length(p_objectives, 1) LOOP
            INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
            SELECT p_id, o.id, p_objectives[i+1]::smallint
              FROM objective o WHERE o.code = p_objectives[i];
            i := i + 2;
        END LOOP;
    END IF;
END;
$$;


-- ===== BF-01 · Computer Science · the handover case =====

SELECT pg_temp.demo_session(
    'b0000001-0000-4000-8000-000000000001',
    'BF-01', '11111111-1111-4111-8111-111111111111',
    '2026-08-24', '2026-08-24', 13,
    ARRAY['CS-1.1','CS-1.2'], 'CS-1.3',
    ARRAY['expose','demo'], 'expose',
    ARRAY['CS-1.1.1','13','CS-1.1.2','11','CS-1.2.1','10','CS-1.2.2','12'],
    NULL, NULL);

SELECT pg_temp.demo_session(
    'b0000001-0000-4000-8000-000000000002',
    'BF-01', '11111111-1111-4111-8111-111111111111',
    '2026-08-25', '2026-08-25', 14,
    ARRAY['CS-1.3','CS-2.1'], 'CS-2.2',
    ARRAY['demo','guidee','labo'], 'guidee',
    ARRAY['CS-1.3.1','12','CS-2.1.1','13'],
    NULL, NULL);

SELECT pg_temp.demo_session(
    'b0000001-0000-4000-8000-000000000003',
    'BF-01', '11111111-1111-4111-8111-111111111111',
    '2026-08-26', '2026-08-26', 12,
    ARRAY['CS-2.2'], 'CS-2.3',
    ARRAY['guidee','autonome'], 'guidee',
    ARRAY['CS-2.2.1','9'],
    'power_cut', 'Two hours without power in the afternoon. Lesson CS-2.3 was not started.');

-- The handover. Clarisse has never taught this cohort. She reads the
-- resume point from the previous row and starts exactly there.
SELECT pg_temp.demo_session(
    'b0000001-0000-4000-8000-000000000004',
    'BF-01', '33333333-3333-4333-8333-333333333333',
    '2026-08-27', '2026-08-27', 13,
    ARRAY['CS-2.3'], 'CS-2.4',
    ARRAY['demo','guidee','eval'], 'guidee',
    ARRAY['CS-2.3.1','11'],
    NULL, 'Aminata away on assignment this week. Picked up from the log without trouble.');

SELECT pg_temp.demo_session(
    'b0000001-0000-4000-8000-000000000005',
    'BF-01', '33333333-3333-4333-8333-333333333333',
    '2026-08-28', '2026-08-29', 14,    -- filed a day late
    ARRAY['CS-2.4','CS-3.1'], 'CS-3.2',
    ARRAY['expose','guidee','labo'], 'guidee',
    ARRAY['CS-2.4.1','12','CS-3.1.1','10'],
    NULL, NULL);

SELECT pg_temp.demo_session(
    'b0000001-0000-4000-8000-000000000006',
    'BF-01', '11111111-1111-4111-8111-111111111111',
    '2026-08-31', '2026-08-31', 13,
    ARRAY['CS-3.2'], 'CS-3.3',
    ARRAY['guidee','labo'], 'labo',
    ARRAY['CS-3.2.1','10'],
    'power_cut', 'Power out again for most of the morning. Third time this month.');


-- ===== BF-02 · Cybersecurity · lecture-only, weak outcomes, late filing =====

SELECT pg_temp.demo_session(
    'b0000002-0000-4000-8000-000000000001',
    'BF-02', '22222222-2222-4222-8222-222222222222',
    '2026-08-25', '2026-08-28', 10,
    ARRAY['SEC-1.1'], 'SEC-1.2',
    ARRAY['expose'], 'expose',
    ARRAY['SEC-1.1.1','6'],
    'slow_pace', 'Group has very little computer experience. Plan a catch-up session.');

SELECT pg_temp.demo_session(
    'b0000002-0000-4000-8000-000000000002',
    'BF-02', '22222222-2222-4222-8222-222222222222',
    '2026-08-26', '2026-08-28', 11,
    ARRAY['SEC-1.2'], 'SEC-1.3',
    ARRAY['expose','demo'], 'expose',
    ARRAY['SEC-1.2.1','7','SEC-1.2.2','5'],
    NULL, NULL);

SELECT pg_temp.demo_session(
    'b0000002-0000-4000-8000-000000000003',
    'BF-02', '22222222-2222-4222-8222-222222222222',
    '2026-08-27', '2026-08-31', 9,
    ARRAY['SEC-1.3'], 'SEC-2.1',
    ARRAY['expose','demo'], 'expose',
    ARRAY['SEC-1.3.1','6'],
    'heavy_absence', NULL);

SELECT pg_temp.demo_session(
    'b0000002-0000-4000-8000-000000000004',
    'BF-02', '22222222-2222-4222-8222-222222222222',
    '2026-08-28', '2026-08-31', 8,
    ARRAY['SEC-2.1'], 'SEC-2.2',
    ARRAY['expose'], 'expose',
    ARRAY['SEC-2.1.1','5'],
    'heavy_absence', NULL);

SELECT pg_temp.demo_session(
    'b0000002-0000-4000-8000-000000000005',
    'BF-02', '22222222-2222-4222-8222-222222222222',
    '2026-08-31', '2026-08-31', 9,
    ARRAY['SEC-2.2'], 'SEC-2.3',
    ARRAY['expose','demo'], 'expose',
    ARRAY['SEC-2.2.1','5'],
    NULL, NULL);


-- ===== BF-03 · DevOps · the control case, should raise nothing =====

SELECT pg_temp.demo_session(
    'b0000003-0000-4000-8000-000000000001',
    'BF-03', '44444444-4444-4444-8444-444444444444',
    '2026-08-26', '2026-08-26', 9,
    ARRAY['OPS-1.1','OPS-1.2','OPS-1.3'], 'OPS-2.1',
    ARRAY['expose','discussion','labo'], 'discussion',
    ARRAY['OPS-1.1.1','9','OPS-1.2.1','8','OPS-1.3.1','8'],
    NULL, NULL);

SELECT pg_temp.demo_session(
    'b0000003-0000-4000-8000-000000000002',
    'BF-03', '44444444-4444-4444-8444-444444444444',
    '2026-08-27', '2026-08-27', 8,
    ARRAY['OPS-2.1','OPS-2.2'], 'OPS-2.3',
    ARRAY['demo','labo','autonome'], 'labo',
    ARRAY['OPS-2.1.1','8','OPS-2.2.1','7','OPS-2.2.2','7'],
    NULL, NULL);

SELECT pg_temp.demo_session(
    'b0000003-0000-4000-8000-000000000003',
    'BF-03', '44444444-4444-4444-8444-444444444444',
    '2026-08-28', '2026-08-28', 9,
    ARRAY['OPS-2.3'], 'OPS-3.1',
    ARRAY['labo','autonome','eval'], 'labo',
    ARRAY['OPS-2.3.1','7'],
    NULL, NULL);

SELECT pg_temp.demo_session(
    'b0000003-0000-4000-8000-000000000004',
    'BF-03', '44444444-4444-4444-8444-444444444444',
    '2026-08-31', '2026-08-31', 9,
    ARRAY['OPS-3.1','OPS-3.2'], 'OPS-3.3',
    ARRAY['demo','labo','autonome'], 'labo',
    ARRAY['OPS-3.1.1','8','OPS-3.2.1','8','OPS-3.2.2','6'],
    NULL, NULL);


-- ===== BF-04 · AI · logging stopped 21 Aug =====

SELECT pg_temp.demo_session(
    'b0000004-0000-4000-8000-000000000001',
    'BF-04', '33333333-3333-4333-8333-333333333333',
    '2026-08-20', '2026-08-20', 12,
    ARRAY['AI-1.1'], 'AI-1.2',
    ARRAY['expose','discussion'], 'expose',
    ARRAY['AI-1.1.1','10'],
    NULL, NULL);

SELECT pg_temp.demo_session(
    'b0000004-0000-4000-8000-000000000002',
    'BF-04', '33333333-3333-4333-8333-333333333333',
    '2026-08-21', '2026-08-21', 11,
    ARRAY['AI-1.2'], 'AI-1.3',
    ARRAY['expose','demo','discussion'], 'expose',
    ARRAY['AI-1.2.1','9'],
    'missing_equipment', 'Only four workstations available for twelve learners.');


-- ===== BF-05 · no sessions. Intentionally empty. =====


-- ---------------------------------------------------------------------
-- One observation, so the dormant tables have something in them.
-- ---------------------------------------------------------------------
INSERT INTO observation (id, cohort_id, instructor_id, observed_on, lesson_id,
                         observer_name, observer_role, summary_note) VALUES
    ('c0000001-0000-4000-8000-000000000001',
     'aaaaaaaa-0001-4000-8000-000000000001',
     '11111111-1111-4111-8111-111111111111',
     '2026-08-25',
     (SELECT id FROM lesson WHERE code = 'CS-1.3'),
     'Site lead — Ouagadougou', 'Site lead',
     'Strong subject knowledge. Practice time was cut short by the setup taking too long.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO observation_score (observation_id, criterion_id, score)
SELECT 'c0000001-0000-4000-8000-000000000001', oc.id, s.score
  FROM observation_criterion oc
  JOIN (VALUES (1,3),(2,3),(3,2),(4,3),(5,3),(6,2),(7,2),(8,3)) AS s(pos, score)
    ON s.pos = oc.position
ON CONFLICT DO NOTHING;

COMMIT;
