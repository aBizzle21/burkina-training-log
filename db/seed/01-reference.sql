-- =====================================================================
-- Reference vocabulary
--
-- GENERATED FILE — do not edit by hand.
-- Source:     curriculum/*.js
-- Regenerate: node tools/build-seed.js
-- =====================================================================

BEGIN;

-- Entry levels. rank is what the pathway filter compares.
INSERT INTO learner_level (code, rank, name_en, name_fr, desc_en, desc_fr) VALUES
    ('L0', 0, 'Beginner', 'Débutant', 'Little or no computer experience. May not have used a keyboard much.', 'Peu ou pas d''expérience de l''ordinateur. A peu utilisé un clavier.'),
    ('L1', 1, 'Computer literate', 'À l''aise avec l''outil informatique', 'Uses a phone and basic office software. No programming.', 'Utilise un téléphone et des logiciels bureautiques. Pas de programmation.'),
    ('L2', 2, 'Some technical background', 'Quelques bases techniques', 'Has written a little code or administered a machine. Self-taught or part-way through study.', 'A écrit un peu de code ou administré une machine. Autodidacte ou en cours d''études.'),
    ('L3', 3, 'Intermediate', 'Intermédiaire', 'Works in the field or has studied it formally. Wants depth, not a restart.', 'Travaille dans le domaine ou l''a étudié. Cherche de la profondeur, pas un recommencement.'),
    ('L4', 4, 'Advanced', 'Avancé', 'Experienced. Here for the specialised material at the top of a course.', 'Expérimenté. Vient pour le contenu spécialisé en haut de filière.')
ON CONFLICT (code) DO UPDATE SET
    rank = EXCLUDED.rank, name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr,
    desc_en = EXCLUDED.desc_en, desc_fr = EXCLUDED.desc_fr;

-- How essential a lesson is. The pace decides which tiers are included.
INSERT INTO lesson_tier (code, position, name_en, name_fr) VALUES
    ('scaffold', 1, 'Extra support', 'Étayage'),
    ('core', 2, 'Core', 'Essentiel'),
    ('extension', 3, 'Extension', 'Approfondissement'),
    ('advanced', 4, 'Advanced', 'Avancé')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr;

-- Paces, and the tiers each includes.
INSERT INTO pace (code, position, name_en, name_fr, desc_en, desc_fr, tiers) VALUES
    ('steady', 1, 'Steady', 'Progressif', 'Everything. Scaffolding, extra practice, the slower explanations.', 'Tout. Étayage, pratique supplémentaire, explications détaillées.', ARRAY['scaffold', 'core', 'extension', 'advanced']::text[]),
    ('standard', 2, 'Standard', 'Standard', 'Core plus the extensions most people need.', 'L''essentiel plus les approfondissements utiles à la plupart.', ARRAY['core', 'extension', 'advanced']::text[]),
    ('fast', 3, 'Fast track', 'Accéléré', 'Core only. Assumes the learner fills gaps themselves.', 'L''essentiel seul. Suppose que l''apprenant comble les lacunes lui-même.', ARRAY['core', 'advanced']::text[])
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr,
    desc_en = EXCLUDED.desc_en, desc_fr = EXCLUDED.desc_fr, tiers = EXCLUDED.tiers;

INSERT INTO teaching_method (code, position, name_en, name_fr, color) VALUES
    ('expose', 1, 'Lecture', 'Exposé', '#16233A'),
    ('demo', 2, 'Demonstration', 'Démonstration', '#2E5E4E'),
    ('guidee', 3, 'Guided practice', 'Pratique guidée', '#A83A2C'),
    ('autonome', 4, 'Independent work', 'Travail autonome', '#8A7B4F'),
    ('labo', 5, 'Lab exercise', 'Travaux pratiques', '#5C7A8A'),
    ('eval', 6, 'Assessment', 'Évaluation', '#4A5B78'),
    ('discussion', 7, 'Discussion', 'Discussion', '#7B8B6F')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, name_en = EXCLUDED.name_en,
    name_fr = EXCLUDED.name_fr, color = EXCLUDED.color;

INSERT INTO disruption_reason (code, position, label_en, label_fr) VALUES
    ('heavy_absence', 1, 'Heavy absence', 'Absences nombreuses'),
    ('power_cut', 2, 'Power cut', 'Coupure de courant'),
    ('no_connectivity', 3, 'No connectivity', 'Connexion indisponible'),
    ('slow_pace', 4, 'Slower pace than planned', 'Rythme plus lent que prévu'),
    ('missing_equipment', 5, 'Missing equipment or workstations', 'Matériel ou postes manquants'),
    ('cut_short', 6, 'Session cut short', 'Séance écourtée'),
    ('other', 7, 'Other', 'Autre')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, label_en = EXCLUDED.label_en, label_fr = EXCLUDED.label_fr;

INSERT INTO observation_scale (score, label_en, label_fr) VALUES
    (1, 'Not evident', 'Absent'),
    (2, 'Developing', 'En développement'),
    (3, 'Secure', 'Acquis'),
    (4, 'Strong', 'Maîtrisé')
ON CONFLICT (score) DO UPDATE SET
    label_en = EXCLUDED.label_en, label_fr = EXCLUDED.label_fr;

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
