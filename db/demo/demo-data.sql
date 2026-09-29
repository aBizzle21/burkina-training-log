-- =====================================================================
-- Demo data — NOT FOR PRODUCTION
--
--   psql training_log -f db/demo/demo-data.sql
--
-- GENERATED FILE — do not edit by hand.
-- Regenerate: node tools/build-demo.js
--
-- Sessions walk the first lessons of each cohort's own resolved pathway,
-- so this cannot drift when the curriculum changes. Dates are relative to
-- load, so the demo always shows a programme that is running.
--
-- The five cohorts show the system working and failing:
--   BF-01  healthy, with an instructor handover mid-module
--   BF-02  struggling — lecture only, weak outcomes, entries filed late
--   BF-03  the control: nothing here should raise a flag
--   BF-04  silent for twelve days, and a mixed-level cohort
--   BF-05  never started
-- =====================================================================

BEGIN;

INSERT INTO site (name, region) VALUES
    ('Ouagadougou', 'Centre'), ('Bobo-Dioulasso', 'Hauts-Bassins'),
    ('Koudougou', 'Centre-Ouest'), ('Banfora', 'Cascades')
ON CONFLICT (name) DO NOTHING;

INSERT INTO instructor (id, full_name, role, started_on) VALUES
    ('11111111-1111-4111-8111-111111111111', 'Aminata Ouédraogo', 'instructor', CURRENT_DATE - 30),
    ('22222222-2222-4222-8222-222222222222', 'Issouf Sawadogo', 'instructor', CURRENT_DATE - 30),
    ('33333333-3333-4333-8333-333333333333', 'Clarisse Zongo', 'instructor', CURRENT_DATE - 30),
    ('44444444-4444-4444-8444-444444444444', 'Boureima Traoré', 'instructor', CURRENT_DATE - 30)
ON CONFLICT (id) DO NOTHING;

-- Cohorts follow a pathway: a branch, an entry level and a pace. The
-- spread is deliberate, so the demo shows what the filter actually does.
INSERT INTO cohort (id, code, site_id, track_id, branch_id, entry_level, pace,
                    mixed_upper_level, enrolled_count, started_on, status) VALUES
    ('aaaaaaaa-0001-4000-8000-000000000001', 'BF-01',
     (SELECT id FROM site WHERE name = 'Ouagadougou'),
     (SELECT id FROM track WHERE code = 'DEV'),
     (SELECT id FROM track WHERE code = 'DEV'),
     'L0', 'standard', NULL, 14,
     CURRENT_DATE - 8, 'active'),
    ('aaaaaaaa-0002-4000-8000-000000000002', 'BF-02',
     (SELECT id FROM site WHERE name = 'Bobo-Dioulasso'),
     (SELECT id FROM track WHERE code = 'SEC'),
     (SELECT id FROM track WHERE code = 'SEC'),
     'L1', 'steady', NULL, 11,
     CURRENT_DATE - 7, 'active'),
    ('aaaaaaaa-0003-4000-8000-000000000003', 'BF-03',
     (SELECT id FROM site WHERE name = 'Koudougou'),
     (SELECT id FROM track WHERE code = 'OPS'),
     (SELECT id FROM track WHERE code = 'OPS'),
     'L2', 'fast', NULL, 9,
     CURRENT_DATE - 6, 'active'),
    ('aaaaaaaa-0004-4000-8000-000000000004', 'BF-04',
     (SELECT id FROM site WHERE name = 'Ouagadougou'),
     (SELECT id FROM track WHERE code = 'AI'),
     (SELECT id FROM track WHERE code = 'AI'),
     'L1', 'standard', 'L2', 12,
     CURRENT_DATE - 13, 'active'),
    ('aaaaaaaa-0005-4000-8000-000000000005', 'BF-05',
     (SELECT id FROM site WHERE name = 'Banfora'),
     (SELECT id FROM track WHERE code = 'DEV'),
     (SELECT id FROM track WHERE code = 'DEV'),
     'L3', 'standard', NULL, 10,
     CURRENT_DATE - -7, 'planned')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cohort_instructor (cohort_id, instructor_id, assigned_from, assigned_to, is_primary) VALUES
    ('aaaaaaaa-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', CURRENT_DATE - 8, CURRENT_DATE - 6, true),
    ('aaaaaaaa-0001-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', CURRENT_DATE - 5, CURRENT_DATE - 4, true),
    ('aaaaaaaa-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', CURRENT_DATE - 1, NULL, true),
    ('aaaaaaaa-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', CURRENT_DATE - 7, NULL, true),
    ('aaaaaaaa-0003-4000-8000-000000000003', '44444444-4444-4444-8444-444444444444', CURRENT_DATE - 6, NULL, true),
    ('aaaaaaaa-0004-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333', CURRENT_DATE - 13, NULL, true)
ON CONFLICT DO NOTHING;


-- ===== BF-01 · DEV · entering at L0, standard pace
--       pathway is 64 lessons / 180h; these sessions walk the first few

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000001-0000-4000-8000-000000000001', 'aaaaaaaa-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
        CURRENT_DATE - 8,
        (CURRENT_DATE - 8)::timestamptz + time '17:30',
        13,
        (SELECT id FROM lesson WHERE code = 'F-1.4'),
        (SELECT id FROM teaching_method WHERE code = 'expose'),
        NULL,
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000001-0000-4000-8000-000000000001', id FROM lesson WHERE code IN ('F-1.1', 'F-1.2');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000001-0000-4000-8000-000000000001', id FROM teaching_method WHERE code IN ('expose', 'demo');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000001-0000-4000-8000-000000000001', id, 12 FROM objective WHERE code = 'F-1.1.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000001-0000-4000-8000-000000000001', id, 12 FROM objective WHERE code = 'F-1.2.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000001-0000-4000-8000-000000000001', id, 12 FROM objective WHERE code = 'F-1.2.2';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000002-0000-4000-8000-000000000002', 'aaaaaaaa-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
        CURRENT_DATE - 7,
        (CURRENT_DATE - 7)::timestamptz + time '17:30',
        12,
        (SELECT id FROM lesson WHERE code = 'F-2.1'),
        (SELECT id FROM teaching_method WHERE code = 'guidee'),
        NULL,
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000002-0000-4000-8000-000000000002', id FROM lesson WHERE code IN ('F-1.4', 'F-1.5');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000002-0000-4000-8000-000000000002', id FROM teaching_method WHERE code IN ('demo', 'guidee', 'labo');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000002-0000-4000-8000-000000000002', id, 11 FROM objective WHERE code = 'F-1.4.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000002-0000-4000-8000-000000000002', id, 11 FROM objective WHERE code = 'F-1.5.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000002-0000-4000-8000-000000000002', id, 11 FROM objective WHERE code = 'F-1.5.2';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000003-0000-4000-8000-000000000003', 'aaaaaaaa-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
        CURRENT_DATE - 6,
        (CURRENT_DATE - 6)::timestamptz + time '17:30',
        11,
        (SELECT id FROM lesson WHERE code = 'F-2.2'),
        (SELECT id FROM teaching_method WHERE code = 'guidee'),
        (SELECT id FROM disruption_reason WHERE code = 'power_cut'),
        'Deux heures sans électricité l''après-midi. La leçon suivante n''a pas été atteinte.', 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000003-0000-4000-8000-000000000003', id FROM lesson WHERE code IN ('F-2.1');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000003-0000-4000-8000-000000000003', id FROM teaching_method WHERE code IN ('guidee', 'autonome');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000003-0000-4000-8000-000000000003', id, 8 FROM objective WHERE code = 'F-2.1.1';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000004-0000-4000-8000-000000000004', 'aaaaaaaa-0001-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
        CURRENT_DATE - 5,
        (CURRENT_DATE - 5)::timestamptz + time '17:30',
        12,
        (SELECT id FROM lesson WHERE code = 'F-2.3'),
        (SELECT id FROM teaching_method WHERE code = 'guidee'),
        NULL,
        'Aminata en mission cette semaine. Reprise à partir du registre, sans difficulté.', 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000004-0000-4000-8000-000000000004', id FROM lesson WHERE code IN ('F-2.2');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000004-0000-4000-8000-000000000004', id FROM teaching_method WHERE code IN ('demo', 'guidee', 'eval');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000004-0000-4000-8000-000000000004', id, 10 FROM objective WHERE code = 'F-2.2.1';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000005-0000-4000-8000-000000000005', 'aaaaaaaa-0001-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
        CURRENT_DATE - 4,
        (CURRENT_DATE - 3)::timestamptz + time '17:30',
        13,
        (SELECT id FROM lesson WHERE code = 'F-3.1'),
        (SELECT id FROM teaching_method WHERE code = 'guidee'),
        NULL,
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000005-0000-4000-8000-000000000005', id FROM lesson WHERE code IN ('F-2.3', 'F-2.5');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000005-0000-4000-8000-000000000005', id FROM teaching_method WHERE code IN ('expose', 'guidee', 'labo');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000005-0000-4000-8000-000000000005', id, 11 FROM objective WHERE code = 'F-2.3.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000005-0000-4000-8000-000000000005', id, 11 FROM objective WHERE code = 'F-2.3.2';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000005-0000-4000-8000-000000000005', id, 11 FROM objective WHERE code = 'F-2.5.1';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000006-0000-4000-8000-000000000006', 'aaaaaaaa-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
        CURRENT_DATE - 1,
        (CURRENT_DATE - 1)::timestamptz + time '17:30',
        12,
        (SELECT id FROM lesson WHERE code = 'F-3.2'),
        (SELECT id FROM teaching_method WHERE code = 'labo'),
        (SELECT id FROM disruption_reason WHERE code = 'power_cut'),
        'Courant coupé la majeure partie de la matinée. Troisième fois ce mois-ci.', 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000006-0000-4000-8000-000000000006', id FROM lesson WHERE code IN ('F-3.1');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000006-0000-4000-8000-000000000006', id FROM teaching_method WHERE code IN ('guidee', 'labo');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000006-0000-4000-8000-000000000006', id, 9 FROM objective WHERE code = 'F-3.1.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000006-0000-4000-8000-000000000006', id, 9 FROM objective WHERE code = 'F-3.1.2';

-- ===== BF-02 · SEC · entering at L1, steady pace
--       pathway is 69 lessons / 189h; these sessions walk the first few

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000007-0000-4000-8000-000000000007', 'aaaaaaaa-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
        CURRENT_DATE - 7,
        (CURRENT_DATE - 4)::timestamptz + time '17:30',
        9,
        (SELECT id FROM lesson WHERE code = 'F-2.3'),
        (SELECT id FROM teaching_method WHERE code = 'expose'),
        (SELECT id FROM disruption_reason WHERE code = 'slow_pace'),
        'Groupe très peu à l''aise avec l''ordinateur. Prévoir une séance de rattrapage.', 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000007-0000-4000-8000-000000000007', id FROM lesson WHERE code IN ('F-2.2');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000007-0000-4000-8000-000000000007', id FROM teaching_method WHERE code IN ('expose');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000007-0000-4000-8000-000000000007', id, 5 FROM objective WHERE code = 'F-2.2.1';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000008-0000-4000-8000-000000000008', 'aaaaaaaa-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
        CURRENT_DATE - 6,
        (CURRENT_DATE - 4)::timestamptz + time '17:30',
        10,
        (SELECT id FROM lesson WHERE code = 'F-2.4'),
        (SELECT id FROM teaching_method WHERE code = 'expose'),
        NULL,
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000008-0000-4000-8000-000000000008', id FROM lesson WHERE code IN ('F-2.3');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000008-0000-4000-8000-000000000008', id FROM teaching_method WHERE code IN ('expose', 'demo');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000008-0000-4000-8000-000000000008', id, 6 FROM objective WHERE code = 'F-2.3.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000008-0000-4000-8000-000000000008', id, 6 FROM objective WHERE code = 'F-2.3.2';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000009-0000-4000-8000-000000000009', 'aaaaaaaa-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
        CURRENT_DATE - 5,
        (CURRENT_DATE - 1)::timestamptz + time '17:30',
        11,
        (SELECT id FROM lesson WHERE code = 'F-2.5'),
        (SELECT id FROM teaching_method WHERE code = 'expose'),
        (SELECT id FROM disruption_reason WHERE code = 'heavy_absence'),
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000009-0000-4000-8000-000000000009', id FROM lesson WHERE code IN ('F-2.4');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000009-0000-4000-8000-000000000009', id FROM teaching_method WHERE code IN ('expose', 'demo');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000009-0000-4000-8000-000000000009', id, 7 FROM objective WHERE code = 'F-2.4.1';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000010-0000-4000-8000-000000000010', 'aaaaaaaa-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
        CURRENT_DATE - 4,
        (CURRENT_DATE - 1)::timestamptz + time '17:30',
        11,
        (SELECT id FROM lesson WHERE code = 'F-3.1'),
        (SELECT id FROM teaching_method WHERE code = 'expose'),
        (SELECT id FROM disruption_reason WHERE code = 'heavy_absence'),
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000010-0000-4000-8000-000000000010', id FROM lesson WHERE code IN ('F-2.5');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000010-0000-4000-8000-000000000010', id FROM teaching_method WHERE code IN ('expose');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000010-0000-4000-8000-000000000010', id, 6 FROM objective WHERE code = 'F-2.5.1';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000011-0000-4000-8000-000000000011', 'aaaaaaaa-0002-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222',
        CURRENT_DATE - 1,
        (CURRENT_DATE - 1)::timestamptz + time '17:30',
        9,
        (SELECT id FROM lesson WHERE code = 'F-3.2'),
        (SELECT id FROM teaching_method WHERE code = 'expose'),
        NULL,
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000011-0000-4000-8000-000000000011', id FROM lesson WHERE code IN ('F-3.1');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000011-0000-4000-8000-000000000011', id FROM teaching_method WHERE code IN ('expose', 'demo');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000011-0000-4000-8000-000000000011', id, 5 FROM objective WHERE code = 'F-3.1.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000011-0000-4000-8000-000000000011', id, 5 FROM objective WHERE code = 'F-3.1.2';

-- ===== BF-03 · OPS · entering at L2, fast pace
--       pathway is 38 lessons / 115h; these sessions walk the first few

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000012-0000-4000-8000-000000000012', 'aaaaaaaa-0003-4000-8000-000000000003', '44444444-4444-4444-8444-444444444444',
        CURRENT_DATE - 6,
        (CURRENT_DATE - 6)::timestamptz + time '17:30',
        8,
        (SELECT id FROM lesson WHERE code = 'F-5.6'),
        (SELECT id FROM teaching_method WHERE code = 'discussion'),
        NULL,
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000012-0000-4000-8000-000000000012', id FROM lesson WHERE code IN ('F-3.4', 'F-4.4', 'F-4.5');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000012-0000-4000-8000-000000000012', id FROM teaching_method WHERE code IN ('expose', 'discussion', 'labo');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000012-0000-4000-8000-000000000012', id, 7 FROM objective WHERE code = 'F-3.4.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000012-0000-4000-8000-000000000012', id, 7 FROM objective WHERE code = 'F-4.4.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000012-0000-4000-8000-000000000012', id, 7 FROM objective WHERE code = 'F-4.5.1';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000013-0000-4000-8000-000000000013', 'aaaaaaaa-0003-4000-8000-000000000003', '44444444-4444-4444-8444-444444444444',
        CURRENT_DATE - 5,
        (CURRENT_DATE - 5)::timestamptz + time '17:30',
        9,
        (SELECT id FROM lesson WHERE code = 'F-5.9'),
        (SELECT id FROM teaching_method WHERE code = 'labo'),
        NULL,
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000013-0000-4000-8000-000000000013', id FROM lesson WHERE code IN ('F-5.6', 'F-5.7');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000013-0000-4000-8000-000000000013', id FROM teaching_method WHERE code IN ('demo', 'labo', 'autonome');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000013-0000-4000-8000-000000000013', id, 8 FROM objective WHERE code = 'F-5.6.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000013-0000-4000-8000-000000000013', id, 8 FROM objective WHERE code = 'F-5.7.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000013-0000-4000-8000-000000000013', id, 8 FROM objective WHERE code = 'F-5.7.2';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000014-0000-4000-8000-000000000014', 'aaaaaaaa-0003-4000-8000-000000000003', '44444444-4444-4444-8444-444444444444',
        CURRENT_DATE - 4,
        (CURRENT_DATE - 4)::timestamptz + time '17:30',
        8,
        (SELECT id FROM lesson WHERE code = 'F-6.2'),
        (SELECT id FROM teaching_method WHERE code = 'labo'),
        NULL,
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000014-0000-4000-8000-000000000014', id FROM lesson WHERE code IN ('F-5.9');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000014-0000-4000-8000-000000000014', id FROM teaching_method WHERE code IN ('labo', 'autonome', 'eval');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000014-0000-4000-8000-000000000014', id, 7 FROM objective WHERE code = 'F-5.9.1';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000015-0000-4000-8000-000000000015', 'aaaaaaaa-0003-4000-8000-000000000003', '44444444-4444-4444-8444-444444444444',
        CURRENT_DATE - 1,
        (CURRENT_DATE - 1)::timestamptz + time '17:30',
        9,
        (SELECT id FROM lesson WHERE code = 'F-6.5'),
        (SELECT id FROM teaching_method WHERE code = 'labo'),
        NULL,
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000015-0000-4000-8000-000000000015', id FROM lesson WHERE code IN ('F-6.2', 'F-6.4');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000015-0000-4000-8000-000000000015', id FROM teaching_method WHERE code IN ('demo', 'labo', 'autonome');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000015-0000-4000-8000-000000000015', id, 8 FROM objective WHERE code = 'F-6.2.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000015-0000-4000-8000-000000000015', id, 8 FROM objective WHERE code = 'F-6.4.1';

-- ===== BF-04 · AI · entering at L1, standard pace
--       pathway is 64 lessons / 176h; these sessions walk the first few

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000016-0000-4000-8000-000000000016', 'aaaaaaaa-0004-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333',
        CURRENT_DATE - 13,
        (CURRENT_DATE - 13)::timestamptz + time '17:30',
        12,
        (SELECT id FROM lesson WHERE code = 'F-2.3'),
        (SELECT id FROM teaching_method WHERE code = 'expose'),
        NULL,
        NULL, 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000016-0000-4000-8000-000000000016', id FROM lesson WHERE code IN ('F-2.2');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000016-0000-4000-8000-000000000016', id FROM teaching_method WHERE code IN ('expose', 'discussion');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000016-0000-4000-8000-000000000016', id, 10 FROM objective WHERE code = 'F-2.2.1';

INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES ('b0000017-0000-4000-8000-000000000017', 'aaaaaaaa-0004-4000-8000-000000000004', '33333333-3333-4333-8333-333333333333',
        CURRENT_DATE - 12,
        (CURRENT_DATE - 12)::timestamptz + time '17:30',
        11,
        (SELECT id FROM lesson WHERE code = 'F-2.5'),
        (SELECT id FROM teaching_method WHERE code = 'expose'),
        (SELECT id FROM disruption_reason WHERE code = 'missing_equipment'),
        'Seulement quatre postes disponibles pour douze apprenants.', 'demo-device', 'demo');
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT 'b0000017-0000-4000-8000-000000000017', id FROM lesson WHERE code IN ('F-2.3');
INSERT INTO session_method (session_id, method_id)
  SELECT 'b0000017-0000-4000-8000-000000000017', id FROM teaching_method WHERE code IN ('expose', 'demo', 'discussion');
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000017-0000-4000-8000-000000000017', id, 9 FROM objective WHERE code = 'F-2.3.1';
INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT 'b0000017-0000-4000-8000-000000000017', id, 9 FROM objective WHERE code = 'F-2.3.2';

-- ===== BF-05 · DEV · no sessions. Intentionally empty. =====


-- One observation, so the dormant tables have something in them.
INSERT INTO observation (id, cohort_id, instructor_id, observed_on, lesson_id,
                         observer_name, observer_role, summary_note) VALUES
    ('c0000001-0000-4000-8000-000000000001',
     'aaaaaaaa-0001-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', CURRENT_DATE - 7,
     (SELECT id FROM lesson WHERE code = 'F-1.4'),
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
