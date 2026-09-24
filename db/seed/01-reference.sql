-- =====================================================================
-- Reference vocabulary: methods, disruption reasons, observation rubric
--
-- GENERATED FILE — do not edit by hand.
-- Source:    data/curriculum.json (version 1.0.0)
-- Regenerate: node tools/build-seed.js
-- =====================================================================

BEGIN;

-- Teaching methods. A closed list on purpose: free text cannot be
-- compared across instructors, and comparison is the whole point.
INSERT INTO teaching_method (code, position, name_en, name_fr, color) VALUES
    ('expose', 1, 'Lecture', 'Exposé', '#16233A'),
    ('demo', 2, 'Demonstration', 'Démonstration', '#2E5E4E'),
    ('guidee', 3, 'Guided practice', 'Pratique guidée', '#A83A2C'),
    ('autonome', 4, 'Independent work', 'Travail autonome', '#8A7B4F'),
    ('labo', 5, 'Lab exercise', 'Travaux pratiques', '#5C7A8A'),
    ('eval', 6, 'Assessment', 'Évaluation', '#4A5B78'),
    ('discussion', 7, 'Discussion', 'Discussion', '#7B8B6F')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    name_en  = EXCLUDED.name_en,
    name_fr  = EXCLUDED.name_fr,
    color    = EXCLUDED.color;

-- Disruption reasons.
INSERT INTO disruption_reason (code, position, label_en, label_fr) VALUES
    ('heavy_absence', 1, 'Heavy absence', 'Absences nombreuses'),
    ('power_cut', 2, 'Power cut', 'Coupure de courant'),
    ('no_connectivity', 3, 'No connectivity', 'Connexion indisponible'),
    ('slow_pace', 4, 'Slower pace than planned', 'Rythme plus lent que prévu'),
    ('missing_equipment', 5, 'Missing equipment or workstations', 'Matériel ou postes manquants'),
    ('cut_short', 6, 'Session cut short', 'Séance écourtée'),
    ('other', 7, 'Other', 'Autre')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    label_en = EXCLUDED.label_en,
    label_fr = EXCLUDED.label_fr;

-- Observation scale.
INSERT INTO observation_scale (score, label_en, label_fr) VALUES
    (1, 'Not evident', 'Absent'),
    (2, 'Developing', 'En développement'),
    (3, 'Secure', 'Acquis'),
    (4, 'Strong', 'Maîtrisé')
ON CONFLICT (score) DO UPDATE SET
    label_en = EXCLUDED.label_en,
    label_fr = EXCLUDED.label_fr;

-- Observation criteria. Eight of them, scored 1-4 by whoever sat in.
-- Keyed on position, so reordering them mid-programme would silently
-- rewrite past scores. Add new criteria at the end instead.
INSERT INTO observation_criterion (position, text_en, text_fr) VALUES
    (1, 'The lesson''s objective was stated to learners at the start', 'L''objectif de la leçon a été annoncé aux apprenants en début de séance'),
    (2, 'Explanations were accurate and pitched at the right level', 'Les explications étaient justes et adaptées au niveau du groupe'),
    (3, 'Learners spent real time practising, not only listening', 'Les apprenants ont réellement pratiqué, pas seulement écouté'),
    (4, 'Understanding was checked during the session, not only at the end', 'La compréhension a été vérifiée pendant la séance, pas uniquement à la fin'),
    (5, 'Questions and mistakes were handled well', 'Les questions et les erreurs ont été bien traitées'),
    (6, 'Equipment and materials were ready before the session', 'Le matériel et les équipements étaient prêts avant la séance'),
    (7, 'Quieter learners were drawn in, not just the confident ones', 'Les apprenants les plus discrets ont été sollicités, pas seulement les plus à l''aise'),
    (8, 'The session closed with a check and a clear next step', 'La séance s''est close par une vérification et une consigne claire pour la suite')
ON CONFLICT DO NOTHING;

COMMIT;
