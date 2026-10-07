-- =====================================================================
-- Curriculum: tracks, modules, lessons, objectives
--
-- GENERATED FILE — do not edit by hand.
-- Source:     curriculum/*.js
-- Regenerate: node tools/build-seed.js
-- =====================================================================

-- 152 lessons, 163 objectives, 450 hours, written once.
--
--   F     9 modules   45 lessons   51 objectives  111h
--   DEV   6 modules   23 lessons   25 objectives   78h
--   OPS   6 modules   25 lessons   26 objectives   82h
--   SEC   7 modules   30 lessons   30 objectives   91h
--   AI    7 modules   29 lessons   31 objectives   88h
--
-- A cohort is taught a PATHWAY through this, not the whole thing: see
-- v_cohort_pathway. Lesson codes are the stable identifiers that session
-- rows point at and handover sheets print, so they are never reused for
-- different content.

BEGIN;

-- Tracks
INSERT INTO track (code, position, kind, name_en, name_fr, color, blurb_en, blurb_fr) VALUES
    ('F', 1, 'foundation', 'Foundation', 'Tronc commun', '#16233A', 'Shared by every track. Ends where the four specialisms genuinely diverge.', 'Commun à toutes les filières. Se termine là où les quatre spécialités divergent réellement.'),
    ('DEV', 2, 'course', 'Software Development', 'Développement logiciel', '#16233A', 'Building and shipping software other people rely on.', 'Construire et livrer des logiciels dont d''autres dépendent.'),
    ('OPS', 3, 'course', 'DevOps and Infrastructure', 'DevOps et infrastructure', '#2E5E4E', 'Getting software running, keeping it running, and knowing when it is not.', 'Faire tourner les logiciels, les maintenir, et savoir quand ils ne tournent plus.'),
    ('SEC', 4, 'course', 'Cybersecurity', 'Cybersécurité', '#A83A2C', 'Defending systems that do not have a security team.', 'Défendre des systèmes qui n''ont pas d''équipe sécurité.'),
    ('AI', 5, 'course', 'Artificial Intelligence', 'Intelligence artificielle', '#4A5B78', 'Using models well, and knowing when not to trust them.', 'Bien utiliser les modèles, et savoir quand s''en méfier.')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, kind = EXCLUDED.kind,
    name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr,
    color = EXCLUDED.color, blurb_en = EXCLUDED.blurb_en, blurb_fr = EXCLUDED.blurb_fr;


-- ---------------------------------------------------------------
-- F — Foundation
-- ---------------------------------------------------------------

INSERT INTO module (track_id, code, position, title_en, title_fr, note_en, note_fr) VALUES
    ((SELECT id FROM track WHERE code = 'F'), 'M1', 1, 'Using a computer', 'Se servir d''un ordinateur', 'For learners who have not used a computer before. Skipped from L1 up.', 'Pour les apprenants n''ayant jamais utilisé d''ordinateur. Ignoré à partir de N1.'),
    ((SELECT id FROM track WHERE code = 'F'), 'M2', 2, 'Files and where things live', 'Fichiers et emplacements', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'F'), 'M3', 3, 'How a computer represents things', 'Comment l''ordinateur représente les choses', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'F'), 'M4', 4, 'Thinking in steps', 'Raisonner par étapes', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'F'), 'M5', 5, 'Writing programs', 'Écrire des programmes', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'F'), 'M6', 6, 'Holding data', 'Structurer les données', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'F'), 'M7', 7, 'How machines talk to each other', 'Comment les machines communiquent', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'F'), 'M8', 8, 'Working with other people', 'Travailler avec les autres', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'F'), 'M9', 9, 'Choosing a direction', 'Choisir une direction', 'Last on purpose. Someone who has never used a terminal cannot meaningfully choose between DevOps and AI, so the choice is deferred until they can.', 'Volontairement en dernier. Qui n''a jamais utilisé de terminal ne peut pas choisir entre DevOps et IA en connaissance de cause.')
ON CONFLICT (track_id, code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;

-- F M1 · Using a computer
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M1'), 'F-1.1', 1, 'Switching on, logging in, shutting down', 'Allumer, se connecter, éteindre', 'L0', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M1'), 'F-1.2', 2, 'Keyboard and mouse', 'Clavier et souris', 'L0', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M1'), 'F-1.3', 3, 'Practice: typing with confidence', 'Pratique : gagner en aisance au clavier', 'L0', 'scaffold', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M1'), 'F-1.4', 4, 'Windows, menus and moving between programs', 'Fenêtres, menus et navigation entre programmes', 'L0', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M1'), 'F-1.5', 5, 'Staying safe: passwords and what not to click', 'Sécurité de base : mots de passe et pièges à éviter', 'L0', 'core', 2, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'F-1.1'), 'F-1.1.1', 1, 'Start the machine, log in, and shut it down properly without help', 'Démarrer la machine, se connecter et l''éteindre correctement, sans aide'),
    ((SELECT id FROM lesson WHERE code = 'F-1.2'), 'F-1.2.1', 1, 'Type a short paragraph including accented characters and punctuation', 'Saisir un court paragraphe avec accents et ponctuation'),
    ((SELECT id FROM lesson WHERE code = 'F-1.2'), 'F-1.2.2', 2, 'Select, copy, cut and paste text between two windows', 'Sélectionner, copier, couper et coller du texte entre deux fenêtres'),
    ((SELECT id FROM lesson WHERE code = 'F-1.3'), 'F-1.3.1', 1, 'Type continuously for five minutes without looking at the keyboard', 'Taper cinq minutes sans regarder le clavier'),
    ((SELECT id FROM lesson WHERE code = 'F-1.4'), 'F-1.4.1', 1, 'Open two programs, move between them, and resize both windows', 'Ouvrir deux programmes, passer de l''un à l''autre et redimensionner les deux fenêtres'),
    ((SELECT id FROM lesson WHERE code = 'F-1.5'), 'F-1.5.1', 1, 'Choose a password that meets a stated policy and explain why length beats complexity', 'Choisir un mot de passe conforme à une règle donnée et expliquer pourquoi la longueur prime sur la complexité'),
    ((SELECT id FROM lesson WHERE code = 'F-1.5'), 'F-1.5.2', 2, 'Identify three warning signs in a suspicious message shown to them', 'Repérer trois signaux d''alerte dans un message suspect qu''on leur présente')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- F M2 · Files and where things live
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M2'), 'F-2.1', 1, 'What a file is, and what a folder is', 'Qu''est-ce qu''un fichier, qu''est-ce qu''un dossier', 'L0', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M2'), 'F-2.2', 2, 'File types, extensions and what opens what', 'Types de fichiers, extensions et applications associées', 'L1', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M2'), 'F-2.3', 3, 'The command line, and why it exists', 'La ligne de commande, et sa raison d''être', 'L1', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M2'), 'F-2.4', 4, 'Practice: a filing system that survives', 'Pratique : un classement qui tient dans le temps', 'L1', 'scaffold', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M2'), 'F-2.5', 5, 'Permissions: who can read, write and run', 'Permissions : lire, écrire, exécuter', 'L2', 'extension', 2, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'F-2.1'), 'F-2.1.1', 1, 'Create a folder, save a file into it, close everything, and find that file again', 'Créer un dossier, y enregistrer un fichier, tout fermer, puis retrouver ce fichier'),
    ((SELECT id FROM lesson WHERE code = 'F-2.2'), 'F-2.2.1', 1, 'Predict which program opens a given file from its extension, and open it with a different one deliberately', 'Prédire quel programme ouvre un fichier d''après son extension, puis l''ouvrir volontairement avec un autre'),
    ((SELECT id FROM lesson WHERE code = 'F-2.3'), 'F-2.3.1', 1, 'Move around the filesystem, list a directory, and create, copy and delete a file from a terminal', 'Se déplacer dans l''arborescence, lister un répertoire, créer, copier et supprimer un fichier depuis un terminal'),
    ((SELECT id FROM lesson WHERE code = 'F-2.3'), 'F-2.3.2', 2, 'Name one task that is faster from the terminal than from a file browser, and do it', 'Nommer une tâche plus rapide au terminal qu''à la souris, et la réaliser'),
    ((SELECT id FROM lesson WHERE code = 'F-2.4'), 'F-2.4.1', 1, 'Organise twenty loose files into a structure they can explain to someone else', 'Ranger vingt fichiers épars dans une structure qu''ils peuvent expliquer à un tiers'),
    ((SELECT id FROM lesson WHERE code = 'F-2.5'), 'F-2.5.1', 1, 'Read a permissions string and change a file so only its owner can modify it', 'Lire une chaîne de permissions et modifier un fichier pour que seul son propriétaire puisse l''éditer')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- F M3 · How a computer represents things
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M3'), 'F-3.1', 1, 'Everything is numbers underneath', 'Tout est nombre en dessous', 'L1', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M3'), 'F-3.2', 2, 'Why accented characters break', 'Pourquoi les caractères accentués posent problème', 'L1', 'extension', 2, 'Deliberately included. Every learner here will hit mangled French text.', 'Volontairement inclus. Chaque apprenant rencontrera du texte français mal encodé.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M3'), 'F-3.3', 3, 'What the parts of a computer do', 'Le rôle des composants', 'L1', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M3'), 'F-3.4', 4, 'What an operating system is for', 'À quoi sert un système d''exploitation', 'L2', 'core', 2, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'F-3.1'), 'F-3.1.1', 1, 'Convert a number under 256 between binary and decimal, both directions', 'Convertir un nombre inférieur à 256 entre binaire et décimal, dans les deux sens'),
    ((SELECT id FROM lesson WHERE code = 'F-3.1'), 'F-3.1.2', 2, 'Explain how text becomes numbers, naming the role of a character encoding', 'Expliquer comment le texte devient des nombres, en nommant le rôle d''un encodage de caractères'),
    ((SELECT id FROM lesson WHERE code = 'F-3.2'), 'F-3.2.1', 1, 'Take a file whose accents display as nonsense and correct its encoding', 'Corriger l''encodage d''un fichier dont les accents s''affichent en charabia'),
    ((SELECT id FROM lesson WHERE code = 'F-3.3'), 'F-3.3.1', 1, 'Say what processor, memory and storage each do, and what is lost when power is cut', 'Dire ce que font processeur, mémoire et stockage, et ce qui est perdu en cas de coupure'),
    ((SELECT id FROM lesson WHERE code = 'F-3.4'), 'F-3.4.1', 1, 'Explain what sits between a program and the hardware, and name two things it stops programs doing', 'Expliquer ce qui se place entre un programme et le matériel, et nommer deux choses qu''il empêche')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- F M4 · Thinking in steps
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M4'), 'F-4.1', 1, 'Breaking a task into unambiguous steps', 'Décomposer une tâche en étapes non ambiguës', 'L1', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M4'), 'F-4.2', 2, 'Practice: instructions that go wrong', 'Pratique : quand les instructions dérapent', 'L1', 'scaffold', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M4'), 'F-4.3', 3, 'Decisions and repetition', 'Décisions et répétitions', 'L1', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M4'), 'F-4.4', 4, 'Tracing: predicting what code will do', 'Dérouler : prédire le comportement du code', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M4'), 'F-4.5', 5, 'Finding the faulty step', 'Trouver l''étape fautive', 'L2', 'core', 2, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'F-4.1'), 'F-4.1.1', 1, 'Write instructions for an everyday task that a stranger can follow with no guessing', 'Rédiger les instructions d''une tâche courante qu''un inconnu peut suivre sans deviner'),
    ((SELECT id FROM lesson WHERE code = 'F-4.2'), 'F-4.2.1', 1, 'Follow a classmate''s instructions literally and identify every ambiguity that caused a wrong result', 'Suivre littéralement les instructions d''un camarade et relever chaque ambiguïté ayant produit une erreur'),
    ((SELECT id FROM lesson WHERE code = 'F-4.3'), 'F-4.3.1', 1, 'Write pseudocode for a problem that needs both a decision and a repetition', 'Écrire le pseudocode d''un problème nécessitant une décision et une répétition'),
    ((SELECT id FROM lesson WHERE code = 'F-4.4'), 'F-4.4.1', 1, 'Trace a short algorithm by hand and state its output before running it — correctly', 'Dérouler un algorithme court à la main et annoncer sa sortie avant exécution — correctement'),
    ((SELECT id FROM lesson WHERE code = 'F-4.5'), 'F-4.5.1', 1, 'Given an algorithm that produces the wrong answer, locate the faulty step and correct it', 'Face à un algorithme qui donne un mauvais résultat, localiser l''étape fautive et la corriger')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- F M5 · Writing programs
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M5'), 'F-5.1', 1, 'Your first program: input, store, output', 'Premier programme : lire, stocker, afficher', 'L1', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M5'), 'F-5.2', 2, 'Types, and what happens when they are wrong', 'Types, et ce qui arrive quand ils sont faux', 'L1', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M5'), 'F-5.3', 3, 'Practice: small programs, many of them', 'Pratique : beaucoup de petits programmes', 'L1', 'scaffold', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M5'), 'F-5.4', 4, 'Conditions in real code', 'Les conditions en vrai code', 'L1', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M5'), 'F-5.5', 5, 'Loops', 'Les boucles', 'L1', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M5'), 'F-5.6', 6, 'Functions: naming a piece of work', 'Fonctions : nommer un traitement', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M5'), 'F-5.7', 7, 'Reading errors', 'Lire les erreurs', 'L2', 'core', 3, 'The single highest-leverage lesson in the foundation. A learner who can read a stack trace can teach themselves; one who cannot stays dependent.', 'La leçon la plus rentable du tronc commun. Qui sait lire une trace d''erreur peut apprendre seul ; sinon il reste dépendant.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M5'), 'F-5.8', 8, 'Debugging deliberately', 'Déboguer avec méthode', 'L2', 'extension', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M5'), 'F-5.9', 9, 'A program of your own', 'Un programme à soi', 'L2', 'core', 4, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'F-5.1'), 'F-5.1.1', 1, 'Write and run a program that reads something typed in, stores it, and prints a result derived from it', 'Écrire et exécuter un programme qui lit une saisie, la stocke et affiche un résultat qui en dérive'),
    ((SELECT id FROM lesson WHERE code = 'F-5.2'), 'F-5.2.1', 1, 'Predict and then demonstrate what happens when a number is treated as text and vice versa', 'Prédire puis démontrer ce qui se passe quand un nombre est traité comme du texte, et l''inverse'),
    ((SELECT id FROM lesson WHERE code = 'F-5.3'), 'F-5.3.1', 1, 'Complete six short exercises with no more than one prompt each from the instructor', 'Réaliser six exercices courts avec au plus une aide de l''instructeur chacun'),
    ((SELECT id FROM lesson WHERE code = 'F-5.4'), 'F-5.4.1', 1, 'Write a working program that behaves differently for at least three distinct inputs', 'Écrire un programme fonctionnel qui se comporte différemment selon au moins trois entrées distinctes'),
    ((SELECT id FROM lesson WHERE code = 'F-5.5'), 'F-5.5.1', 1, 'Write a loop that processes a list, and a loop that stops when a condition is met', 'Écrire une boucle qui parcourt une liste, et une boucle qui s''arrête à une condition'),
    ((SELECT id FROM lesson WHERE code = 'F-5.5'), 'F-5.5.2', 2, 'Cause a loop that never ends, explain why, and fix it', 'Provoquer une boucle infinie, expliquer pourquoi, puis la corriger'),
    ((SELECT id FROM lesson WHERE code = 'F-5.6'), 'F-5.6.1', 1, 'Take a program with repeated code and rewrite it as a function with parameters and a return value', 'Transformer du code répété en une fonction avec paramètres et valeur de retour'),
    ((SELECT id FROM lesson WHERE code = 'F-5.7'), 'F-5.7.1', 1, 'Given an unfamiliar error, name the file, the line and the cause without help', 'Face à une erreur inconnue, nommer le fichier, la ligne et la cause, sans aide'),
    ((SELECT id FROM lesson WHERE code = 'F-5.7'), 'F-5.7.2', 2, 'Find the answer to an error message using a search engine and say which result was reliable and why', 'Trouver la réponse à un message d''erreur via un moteur de recherche et dire quel résultat était fiable, et pourquoi'),
    ((SELECT id FROM lesson WHERE code = 'F-5.8'), 'F-5.8.1', 1, 'Find a bug by narrowing down where it is, rather than by reading the whole program', 'Localiser un bogue en réduisant la zone de recherche, plutôt qu''en relisant tout le programme'),
    ((SELECT id FROM lesson WHERE code = 'F-5.9'), 'F-5.9.1', 1, 'Deliver a working program that meets a one-page written specification', 'Livrer un programme fonctionnel conforme à un cahier des charges d''une page')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- F M6 · Holding data
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M6'), 'F-6.1', 1, 'Lists', 'Les listes', 'L1', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M6'), 'F-6.2', 2, 'Key and value', 'Clé et valeur', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M6'), 'F-6.3', 3, 'Choosing how to hold something', 'Choisir une structure', 'L2', 'extension', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M6'), 'F-6.4', 4, 'Data that outlives the program: tables and rows', 'Des données qui survivent au programme : tables et lignes', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M6'), 'F-6.5', 5, 'Asking a database a question', 'Interroger une base de données', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M6'), 'F-6.6', 6, 'Joining two tables', 'Joindre deux tables', 'L2', 'extension', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'F-6.1'), 'F-6.1.1', 1, 'Store a collection in a list and process every item in it', 'Stocker une collection dans une liste et en traiter chaque élément'),
    ((SELECT id FROM lesson WHERE code = 'F-6.2'), 'F-6.2.1', 1, 'Look a value up by key, and explain why that beats searching a list when the list is long', 'Récupérer une valeur par sa clé et expliquer pourquoi cela bat un parcours de liste quand elle est longue'),
    ((SELECT id FROM lesson WHERE code = 'F-6.3'), 'F-6.3.1', 1, 'Pick a suitable structure for a stated problem and defend the choice against one alternative', 'Choisir une structure adaptée à un problème donné et défendre ce choix face à une alternative'),
    ((SELECT id FROM lesson WHERE code = 'F-6.4'), 'F-6.4.1', 1, 'Design a table for a described situation, with a primary key they can justify', 'Concevoir une table pour une situation décrite, avec une clé primaire justifiable'),
    ((SELECT id FROM lesson WHERE code = 'F-6.5'), 'F-6.5.1', 1, 'Write a query with a filter and a sort that answers a question posed in words', 'Écrire une requête avec filtre et tri répondant à une question posée en français'),
    ((SELECT id FROM lesson WHERE code = 'F-6.6'), 'F-6.6.1', 1, 'Join two related tables and say in words what each row of the result represents', 'Joindre deux tables liées et dire en mots ce que représente chaque ligne du résultat')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- F M7 · How machines talk to each other
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M7'), 'F-7.1', 1, 'What happens when you open a web page', 'Ce qui se passe quand on ouvre une page web', 'L1', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M7'), 'F-7.2', 2, 'Addresses, names and ports', 'Adresses, noms et ports', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M7'), 'F-7.3', 3, 'Requests and responses in detail', 'Requêtes et réponses en détail', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M7'), 'F-7.4', 4, 'When the network is the problem', 'Quand le problème vient du réseau', 'L2', 'extension', 2, 'Written for where this runs. Connectivity here is intermittent, and knowing whether a failure is yours or the network''s is a daily skill, not an advanced one.', 'Écrit pour le contexte local. La connectivité y est intermittente : savoir si une panne vient de soi ou du réseau est une compétence quotidienne.')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'F-7.1'), 'F-7.1.1', 1, 'Describe the path a request takes from a device to a server and back, naming four stages', 'Décrire le trajet d''une requête d''un appareil au serveur et retour, en nommant quatre étapes'),
    ((SELECT id FROM lesson WHERE code = 'F-7.2'), 'F-7.2.1', 1, 'Explain how a domain name becomes a machine address, and what a port adds', 'Expliquer comment un nom de domaine devient une adresse machine, et ce qu''ajoute un port'),
    ((SELECT id FROM lesson WHERE code = 'F-7.3'), 'F-7.3.1', 1, 'Read a request and its response and say what was asked for and what came back', 'Lire une requête et sa réponse et dire ce qui a été demandé et ce qui est revenu'),
    ((SELECT id FROM lesson WHERE code = 'F-7.4'), 'F-7.4.1', 1, 'Given something that will not load, determine whether the fault is local, the network, or the far end', 'Face à quelque chose qui ne charge pas, déterminer si la panne est locale, réseau, ou à distance')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- F M8 · Working with other people
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M8'), 'F-8.1', 1, 'Version control: never losing work again', 'Gestion de versions : ne plus jamais perdre son travail', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M8'), 'F-8.2', 2, 'Branches, and merging them back', 'Branches et fusions', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M8'), 'F-8.3', 3, 'Reading code you did not write', 'Lire du code qu''on n''a pas écrit', 'L2', 'extension', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M8'), 'F-8.4', 4, 'Asking a question that gets answered', 'Poser une question qui obtient une réponse', 'L2', 'extension', 2, 'Sounds soft; is not. A learner who cannot describe a problem precisely stays blocked, and the habit transfers directly to the workplace.', 'Paraît accessoire ; ne l''est pas. Qui ne sait pas décrire un problème reste bloqué, et l''habitude se transpose au travail.')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'F-8.1'), 'F-8.1.1', 1, 'Commit work, then recover a file as it was three commits ago', 'Valider son travail, puis récupérer un fichier tel qu''il était trois commits plus tôt'),
    ((SELECT id FROM lesson WHERE code = 'F-8.2'), 'F-8.2.1', 1, 'Work on a branch, merge it back, and resolve a conflict deliberately created for them', 'Travailler sur une branche, la fusionner, et résoudre un conflit créé exprès pour eux'),
    ((SELECT id FROM lesson WHERE code = 'F-8.3'), 'F-8.3.1', 1, 'Summarise in three sentences what an unfamiliar program does, without running it', 'Résumer en trois phrases ce que fait un programme inconnu, sans le lancer'),
    ((SELECT id FROM lesson WHERE code = 'F-8.4'), 'F-8.4.1', 1, 'Write a problem report containing what was expected, what happened, and what has already been tried', 'Rédiger un rapport de problème indiquant l''attendu, l''observé et ce qui a déjà été tenté')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- F M9 · Choosing a direction
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M9'), 'F-9.1', 1, 'What each of the four does all day', 'Le quotidien de chacune des quatre filières', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M9'), 'F-9.2', 2, 'A taste of each', 'Un aperçu de chacune', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'F' AND m.code = 'M9'), 'F-9.3', 3, 'Choosing, and what the choice commits you to', 'Choisir, et ce que le choix engage', 'L2', 'core', 1, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'F-9.1'), 'F-9.1.1', 1, 'Describe the daily work of each of the four tracks and name one thing they would find hard about each', 'Décrire le travail quotidien des quatre filières et nommer une difficulté propre à chacune'),
    ((SELECT id FROM lesson WHERE code = 'F-9.2'), 'F-9.2.1', 1, 'Complete one short exercise from each of the four tracks', 'Réaliser un court exercice issu de chacune des quatre filières'),
    ((SELECT id FROM lesson WHERE code = 'F-9.3'), 'F-9.3.1', 1, 'State a track choice with a reason that refers to the work rather than to the job title', 'Énoncer un choix de filière avec un motif portant sur le travail plutôt que sur l''intitulé du poste')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;


-- ---------------------------------------------------------------
-- DEV — Software Development
-- ---------------------------------------------------------------

INSERT INTO module (track_id, code, position, title_en, title_fr, note_en, note_fr) VALUES
    ((SELECT id FROM track WHERE code = 'DEV'), 'M1', 1, 'Writing code that lasts', 'Écrire du code qui dure', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'DEV'), 'M2', 2, 'Testing', 'Les tests', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'DEV'), 'M3', 3, 'Building for other programs', 'Construire pour d''autres programmes', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'DEV'), 'M4', 4, 'Interfaces people use', 'Des interfaces utilisables', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'DEV'), 'M5', 5, 'Working on a real codebase', 'Travailler sur un vrai dépôt', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'DEV'), 'M6', 6, 'The project', 'Le projet', 'The portfolio piece. Assessed against the written specification, not against how impressive it looks.', 'La pièce de portfolio. Évaluée sur le cahier des charges, non sur son apparence.')
ON CONFLICT (track_id, code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;

-- DEV M1 · Writing code that lasts
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M1'), 'DEV-1.1', 1, 'Naming things', 'Nommer les choses', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M1'), 'DEV-1.2', 2, 'Splitting a program into pieces', 'Découper un programme', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M1'), 'DEV-1.3', 3, 'Comments that earn their place', 'Des commentaires qui méritent leur place', 'L2', 'extension', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M1'), 'DEV-1.4', 4, 'Handling what goes wrong', 'Gérer ce qui tourne mal', 'L3', 'core', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'DEV-1.1'), 'DEV-1.1.1', 1, 'Rename every identifier in a deliberately badly named program so a stranger can follow it', 'Renommer chaque identifiant d''un programme mal nommé pour qu''un inconnu puisse le suivre'),
    ((SELECT id FROM lesson WHERE code = 'DEV-1.2'), 'DEV-1.2.1', 1, 'Break a single long file into modules and explain the boundary chosen for each', 'Découper un long fichier en modules et justifier chaque frontière choisie'),
    ((SELECT id FROM lesson WHERE code = 'DEV-1.3'), 'DEV-1.3.1', 1, 'Remove every comment that restates the code, and add one that explains a decision', 'Supprimer tout commentaire qui paraphrase le code, et en ajouter un qui explique une décision'),
    ((SELECT id FROM lesson WHERE code = 'DEV-1.4'), 'DEV-1.4.1', 1, 'Make a program fail usefully — naming what went wrong and what the user should do', 'Faire échouer un programme utilement : dire ce qui a échoué et ce que l''utilisateur doit faire'),
    ((SELECT id FROM lesson WHERE code = 'DEV-1.4'), 'DEV-1.4.2', 2, 'Identify three inputs that would break a given program, and defend against them', 'Identifier trois entrées qui casseraient un programme donné, et se prémunir')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- DEV M2 · Testing
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M2'), 'DEV-2.1', 1, 'Your first automated test', 'Premier test automatisé', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M2'), 'DEV-2.2', 2, 'What is worth testing', 'Ce qui vaut la peine d''être testé', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M2'), 'DEV-2.3', 3, 'Tests that lie', 'Les tests qui mentent', 'L3', 'extension', 3, 'From this project: a test read the CSV as text, where the decoder strips the very byte-order mark it was checking for. It reported a working protection as missing. Tests fail in both directions.', 'Tiré de ce projet : un test lisait le CSV en texte, où le décodeur supprime justement la marque qu''il vérifiait. Il signalait comme absente une protection fonctionnelle.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M2'), 'DEV-2.4', 4, 'Tests that only pass once', 'Les tests qui ne passent qu''une fois', 'L4', 'advanced', 3, 'Also from this project. Two suites shared a fixture and fixed dates, so they passed on a clean database and failed on every run after — which reads as a product bug and is not one.', 'Également tiré de ce projet. Deux suites partageaient des données et des dates fixes : elles passaient sur base neuve puis échouaient ensuite.')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'DEV-2.1'), 'DEV-2.1.1', 1, 'Write a test that fails, fix the code, and watch it pass', 'Écrire un test qui échoue, corriger le code, et le voir passer'),
    ((SELECT id FROM lesson WHERE code = 'DEV-2.2'), 'DEV-2.2.1', 1, 'Given a program, name the three tests that would catch the most likely failures, and justify the choice', 'Pour un programme donné, nommer les trois tests attrapant les pannes les plus probables, et justifier'),
    ((SELECT id FROM lesson WHERE code = 'DEV-2.3'), 'DEV-2.3.1', 1, 'Show that a given test passes even when the behaviour it claims to check is broken', 'Montrer qu''un test donné passe alors même que le comportement vérifié est cassé'),
    ((SELECT id FROM lesson WHERE code = 'DEV-2.4'), 'DEV-2.4.1', 1, 'Take a test suite that passes once and make it repeatable, without simply resetting the database', 'Rendre répétable une suite qui ne passe qu''une fois, sans se contenter de réinitialiser la base')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- DEV M3 · Building for other programs
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M3'), 'DEV-3.1', 1, 'What an API is', 'Qu''est-ce qu''une API', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M3'), 'DEV-3.2', 2, 'Building one', 'En construire une', 'L3', 'core', 4, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M3'), 'DEV-3.3', 3, 'Doing the same thing twice safely', 'Faire deux fois la même chose sans dégât', 'L3', 'core', 3, 'Directly from the training log this course is logged in. A phone on a bad connection sends the same entry twice; a second stored session nobody can explain is worse than a lost one.', 'Directement tiré du journal de formation utilisé par ce cours. Un téléphone renvoie deux fois la même saisie ; une séance dupliquée inexplicable est pire qu''une perdue.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M3'), 'DEV-3.4', 4, 'Who is allowed to do what', 'Qui a le droit de faire quoi', 'L3', 'extension', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'DEV-3.1'), 'DEV-3.1.1', 1, 'Call an existing API and use what comes back in a program of their own', 'Appeler une API existante et exploiter la réponse dans leur propre programme'),
    ((SELECT id FROM lesson WHERE code = 'DEV-3.2'), 'DEV-3.2.1', 1, 'Build an endpoint that accepts data, validates it, stores it, and returns a useful error when the data is wrong', 'Construire un point d''entrée qui accepte, valide et stocke des données, et renvoie une erreur utile si elles sont mauvaises'),
    ((SELECT id FROM lesson WHERE code = 'DEV-3.3'), 'DEV-3.3.1', 1, 'Make an endpoint safe to call twice with the same data, and demonstrate it', 'Rendre un point d''entrée sûr à appeler deux fois avec les mêmes données, et le démontrer'),
    ((SELECT id FROM lesson WHERE code = 'DEV-3.4'), 'DEV-3.4.1', 1, 'Add sign-in to an API so one user cannot act on another user''s behalf, and show the attempt failing', 'Ajouter une authentification pour qu''un utilisateur ne puisse agir au nom d''un autre, et montrer l''échec de la tentative')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- DEV M4 · Interfaces people use
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M4'), 'DEV-4.1', 1, 'Structure and style on a page', 'Structure et style d''une page', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M4'), 'DEV-4.2', 2, 'Making a page do something', 'Rendre une page interactive', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M4'), 'DEV-4.3', 3, 'When there is no connection', 'Quand il n''y a pas de connexion', 'L3', 'core', 3, 'Not an advanced topic here. It is the normal case, and an application that assumes a connection is an application that does not work in Banfora.', 'Pas un sujet avancé ici. C''est le cas normal : une application qui suppose une connexion ne fonctionne pas à Banfora.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M4'), 'DEV-4.4', 4, 'Interfaces that do not exclude people', 'Des interfaces qui n''excluent personne', 'L4', 'advanced', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'DEV-4.1'), 'DEV-4.1.1', 1, 'Build a page that is readable on a phone as well as a laptop', 'Construire une page lisible sur téléphone comme sur ordinateur portable'),
    ((SELECT id FROM lesson WHERE code = 'DEV-4.2'), 'DEV-4.2.1', 1, 'Take input from a form, send it to an API, and show the result without reloading', 'Récupérer une saisie, l''envoyer à une API et afficher le résultat sans recharger'),
    ((SELECT id FROM lesson WHERE code = 'DEV-4.3'), 'DEV-4.3.1', 1, 'Make a form that saves on the device first and sends later, and demonstrate it with the network switched off', 'Réaliser un formulaire qui enregistre d''abord sur l''appareil puis envoie plus tard, et le démontrer réseau coupé'),
    ((SELECT id FROM lesson WHERE code = 'DEV-4.4'), 'DEV-4.4.1', 1, 'Operate their own interface using only a keyboard, and fix what cannot be reached', 'Utiliser leur propre interface au clavier seul, et corriger ce qui est inaccessible')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- DEV M5 · Working on a real codebase
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M5'), 'DEV-5.1', 1, 'Arriving at code someone else wrote', 'Arriver sur du code écrit par d''autres', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M5'), 'DEV-5.2', 2, 'Review, given and received', 'La revue, donnée et reçue', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M5'), 'DEV-5.3', 3, 'Changing something without breaking it', 'Modifier sans casser', 'L4', 'advanced', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M5'), 'DEV-5.4', 4, 'Deciding what not to build', 'Décider de ne pas construire', 'L4', 'advanced', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'DEV-5.1'), 'DEV-5.1.1', 1, 'Make a small correct change to an unfamiliar codebase without breaking anything else', 'Apporter une petite modification correcte à un dépôt inconnu sans rien casser'),
    ((SELECT id FROM lesson WHERE code = 'DEV-5.2'), 'DEV-5.2.1', 1, 'Review a classmate''s change with at least one comment about correctness rather than style', 'Relire la modification d''un camarade avec au moins un commentaire sur la justesse, pas le style'),
    ((SELECT id FROM lesson WHERE code = 'DEV-5.2'), 'DEV-5.2.2', 2, 'Respond to review of their own work, changing what should change and defending what should not', 'Répondre à une revue de son propre travail, en modifiant ce qui doit l''être et en défendant le reste'),
    ((SELECT id FROM lesson WHERE code = 'DEV-5.3'), 'DEV-5.3.1', 1, 'Restructure working code so its behaviour is provably unchanged, using tests as the proof', 'Restructurer du code fonctionnel en prouvant par les tests que son comportement est inchangé'),
    ((SELECT id FROM lesson WHERE code = 'DEV-5.4'), 'DEV-5.4.1', 1, 'Given a feature request, argue for a smaller version and say what is given up', 'Face à une demande de fonctionnalité, plaider pour une version réduite et dire ce qu''on abandonne')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- DEV M6 · The project
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M6'), 'DEV-6.1', 1, 'Writing the specification', 'Rédiger le cahier des charges', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M6'), 'DEV-6.2', 2, 'Building it', 'Le construire', 'L2', 'core', 12, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'DEV' AND m.code = 'M6'), 'DEV-6.3', 3, 'Showing it to people', 'Le présenter', 'L2', 'core', 2, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'DEV-6.1'), 'DEV-6.1.1', 1, 'Write a specification a second person could build from without asking questions', 'Rédiger un cahier des charges qu''un tiers pourrait suivre sans poser de questions'),
    ((SELECT id FROM lesson WHERE code = 'DEV-6.2'), 'DEV-6.2.1', 1, 'Deliver software that meets their own specification, with tests and a README', 'Livrer un logiciel conforme à leur cahier des charges, avec tests et README'),
    ((SELECT id FROM lesson WHERE code = 'DEV-6.3'), 'DEV-6.3.1', 1, 'Demonstrate the project in ten minutes, including one thing that does not work and why', 'Présenter le projet en dix minutes, en incluant une chose qui ne marche pas, et pourquoi')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;


-- ---------------------------------------------------------------
-- OPS — DevOps and Infrastructure
-- ---------------------------------------------------------------

INSERT INTO module (track_id, code, position, title_en, title_fr, note_en, note_fr) VALUES
    ((SELECT id FROM track WHERE code = 'OPS'), 'M1', 1, 'Living on the command line', 'Vivre en ligne de commande', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'OPS'), 'M2', 2, 'Servers', 'Les serveurs', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'OPS'), 'M3', 3, 'Containers', 'Les conteneurs', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'OPS'), 'M4', 4, 'Shipping changes', 'Livrer des changements', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'OPS'), 'M5', 5, 'Knowing what is happening', 'Savoir ce qui se passe', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'OPS'), 'M6', 6, 'The project', 'Le projet', NULL, NULL)
ON CONFLICT (track_id, code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;

-- OPS M1 · Living on the command line
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M1'), 'OPS-1.1', 1, 'Finding things', 'Trouver', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M1'), 'OPS-1.2', 2, 'Joining commands together', 'Enchaîner des commandes', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M1'), 'OPS-1.3', 3, 'Users, permissions and processes', 'Utilisateurs, permissions et processus', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M1'), 'OPS-1.4', 4, 'Practice: a day without a mouse', 'Pratique : une journée sans souris', 'L2', 'scaffold', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M1'), 'OPS-1.5', 5, 'Scripting what you do twice', 'Scripter ce qu''on fait deux fois', 'L3', 'core', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-1.1'), 'OPS-1.1.1', 1, 'Find every file changed in the last day, and every file containing a given word', 'Trouver tous les fichiers modifiés depuis un jour, et tous ceux contenant un mot donné'),
    ((SELECT id FROM lesson WHERE code = 'OPS-1.2'), 'OPS-1.2.1', 1, 'Answer a question about a large log file using a single chain of commands', 'Répondre à une question sur un gros fichier de journal avec un seul enchaînement de commandes'),
    ((SELECT id FROM lesson WHERE code = 'OPS-1.3'), 'OPS-1.3.1', 1, 'Diagnose and fix a permission problem stopping a program from running', 'Diagnostiquer et corriger un problème de droits empêchant un programme de tourner'),
    ((SELECT id FROM lesson WHERE code = 'OPS-1.3'), 'OPS-1.3.2', 2, 'Find a process using too much memory and stop it without taking down anything else', 'Repérer un processus consommant trop de mémoire et l''arrêter sans affecter le reste'),
    ((SELECT id FROM lesson WHERE code = 'OPS-1.4'), 'OPS-1.4.1', 1, 'Complete a set of everyday tasks using only the terminal', 'Réaliser un ensemble de tâches courantes au terminal seul'),
    ((SELECT id FROM lesson WHERE code = 'OPS-1.5'), 'OPS-1.5.1', 1, 'Turn a repeated manual task into a script that stops safely when a step fails', 'Transformer une tâche manuelle répétée en script qui s''arrête proprement si une étape échoue')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- OPS M2 · Servers
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M2'), 'OPS-2.1', 1, 'Getting onto a machine that is not yours', 'Accéder à une machine distante', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M2'), 'OPS-2.2', 2, 'Running something that stays running', 'Faire tourner quelque chose en continu', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M2'), 'OPS-2.3', 3, 'Power cuts and what survives them', 'Coupures de courant et ce qui y survit', 'L3', 'core', 3, 'Written for where this runs. A service that needs a clean shutdown is not deployable in a place with an unreliable grid.', 'Écrit pour le contexte local. Un service exigeant un arrêt propre n''est pas déployable là où le réseau électrique est instable.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M2'), 'OPS-2.4', 4, 'Backups, and restoring from them', 'Sauvegardes, et restauration', 'L3', 'extension', 3, 'The objective is restoring, not backing up. An untested backup is a rumour.', 'L''objectif porte sur la restauration, pas la sauvegarde. Une sauvegarde non testée est une rumeur.')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-2.1'), 'OPS-2.1.1', 1, 'Connect to a remote machine with a key rather than a password, and explain why that is better', 'Se connecter à une machine distante par clé plutôt que mot de passe, et expliquer pourquoi c''est mieux'),
    ((SELECT id FROM lesson WHERE code = 'OPS-2.2'), 'OPS-2.2.1', 1, 'Set a program to start on boot and restart if it crashes, then prove both by causing them', 'Configurer un programme pour démarrer au boot et redémarrer après un plantage, puis prouver les deux'),
    ((SELECT id FROM lesson WHERE code = 'OPS-2.3'), 'OPS-2.3.1', 1, 'Cut power to a running service mid-write and show that the data survived', 'Couper l''alimentation d''un service en pleine écriture et montrer que les données ont survécu'),
    ((SELECT id FROM lesson WHERE code = 'OPS-2.4'), 'OPS-2.4.1', 1, 'Destroy a database and restore it from a backup they took themselves', 'Détruire une base de données et la restaurer depuis une sauvegarde qu''ils ont eux-mêmes prise')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- OPS M3 · Containers
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M3'), 'OPS-3.1', 1, 'Why it works on your machine and not theirs', 'Pourquoi ça marche chez vous et pas chez eux', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M3'), 'OPS-3.2', 2, 'Packaging an application', 'Empaqueter une application', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M3'), 'OPS-3.3', 3, 'Several things that need each other', 'Plusieurs services interdépendants', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M3'), 'OPS-3.4', 4, 'Images that are not enormous', 'Des images qui ne pèsent pas des tonnes', 'L4', 'advanced', 3, 'Matters more here than in a datacentre. A 2GB image over an intermittent link is a deploy that never finishes.', 'Compte plus ici qu''en datacentre. Une image de 2 Go sur un lien instable, c''est un déploiement qui n''aboutit jamais.')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-3.1'), 'OPS-3.1.1', 1, 'Reproduce a works-on-my-machine failure and name the difference that caused it', 'Reproduire une panne « ça marche chez moi » et nommer la différence qui l''a causée'),
    ((SELECT id FROM lesson WHERE code = 'OPS-3.2'), 'OPS-3.2.1', 1, 'Write a Dockerfile for an application they did not write, and run it', 'Écrire un Dockerfile pour une application qu''ils n''ont pas écrite, et la lancer'),
    ((SELECT id FROM lesson WHERE code = 'OPS-3.3'), 'OPS-3.3.1', 1, 'Run an application and its database together, and make the application wait for the database', 'Lancer une application et sa base ensemble, et faire attendre l''application que la base soit prête'),
    ((SELECT id FROM lesson WHERE code = 'OPS-3.4'), 'OPS-3.4.1', 1, 'Cut an image to under a quarter of its size without changing what it does', 'Réduire une image au quart de sa taille sans changer son comportement')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- OPS M4 · Shipping changes
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M4'), 'OPS-4.1', 1, 'Automating the build', 'Automatiser la construction', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M4'), 'OPS-4.2', 2, 'Deploying', 'Déployer', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M4'), 'OPS-4.3', 3, 'Going back', 'Revenir en arrière', 'L3', 'core', 3, 'The one that matters at 2am. Rolling back has to be faster and less frightening than fixing forward.', 'Ce qui compte à 2 h du matin. Un retour arrière doit être plus rapide et moins effrayant qu''un correctif en urgence.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M4'), 'OPS-4.4', 4, 'Configuration and secrets', 'Configuration et secrets', 'L3', 'extension', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M4'), 'OPS-4.5', 5, 'Infrastructure written down', 'Une infrastructure décrite en fichiers', 'L4', 'advanced', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-4.1'), 'OPS-4.1.1', 1, 'Set up a pipeline that builds and tests on every change, and show it blocking a broken one', 'Mettre en place un pipeline qui construit et teste à chaque modification, et le montrer bloquant une régression'),
    ((SELECT id FROM lesson WHERE code = 'OPS-4.2'), 'OPS-4.2.1', 1, 'Deploy a change to a running service without taking it offline', 'Déployer une modification sur un service en fonctionnement sans interruption'),
    ((SELECT id FROM lesson WHERE code = 'OPS-4.3'), 'OPS-4.3.1', 1, 'Roll back a bad deploy in under five minutes, from noticing to resolved', 'Annuler un mauvais déploiement en moins de cinq minutes, du constat à la résolution'),
    ((SELECT id FROM lesson WHERE code = 'OPS-4.4'), 'OPS-4.4.1', 1, 'Move a hardcoded password out of a codebase and explain what to do about the one in its history', 'Sortir un mot de passe codé en dur, et dire quoi faire de celui qui reste dans l''historique'),
    ((SELECT id FROM lesson WHERE code = 'OPS-4.5'), 'OPS-4.5.1', 1, 'Destroy their own environment and rebuild it from files alone', 'Détruire leur environnement et le reconstruire à partir des seuls fichiers')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- OPS M5 · Knowing what is happening
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M5'), 'OPS-5.1', 1, 'Logs worth reading', 'Des journaux qui servent', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M5'), 'OPS-5.2', 2, 'Measuring things', 'Mesurer', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M5'), 'OPS-5.3', 3, 'Alerts people do not ignore', 'Des alertes qu''on n''ignore pas', 'L3', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M5'), 'OPS-5.4', 4, 'After it breaks', 'Après la panne', 'L4', 'advanced', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-5.1'), 'OPS-5.1.1', 1, 'Find the cause of a failure in a log file they have never seen before', 'Trouver la cause d''une panne dans un journal qu''ils découvrent'),
    ((SELECT id FROM lesson WHERE code = 'OPS-5.2'), 'OPS-5.2.1', 1, 'Add a measurement to a service and show it changing under load', 'Ajouter une mesure à un service et la montrer varier sous charge'),
    ((SELECT id FROM lesson WHERE code = 'OPS-5.3'), 'OPS-5.3.1', 1, 'Say what makes an alert worth waking someone for, and delete three that are not', 'Dire ce qui justifie de réveiller quelqu''un, et supprimer trois alertes qui ne le justifient pas'),
    ((SELECT id FROM lesson WHERE code = 'OPS-5.4'), 'OPS-5.4.1', 1, 'Write up an incident naming what happened and what will change, without naming who to blame', 'Rédiger un compte rendu d''incident : ce qui s''est passé et ce qui va changer, sans désigner de coupable')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- OPS M6 · The project
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M6'), 'OPS-6.1', 1, 'Planning a deployment', 'Planifier un déploiement', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M6'), 'OPS-6.2', 2, 'Taking an application to production', 'Mettre une application en production', 'L2', 'core', 12, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M6'), 'OPS-6.3', 3, 'Breaking someone else''s', 'Casser celui d''un autre', 'L2', 'core', 3, 'Borrowed from Branch Test Day, where the prize for finding the most bugs produced more useful results than the scripted testing did.', 'Emprunté au Branch Test Day, où la prime au plus grand nombre de bogues a produit plus de résultats que les tests scriptés.')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-6.1'), 'OPS-6.1.1', 1, 'Write a plan covering what is deployed, how it is rolled back, and how you know it worked', 'Écrire un plan couvrant ce qui est déployé, comment revenir en arrière, et comment savoir que ça a marché'),
    ((SELECT id FROM lesson WHERE code = 'OPS-6.2'), 'OPS-6.2.1', 1, 'Deploy an application they did not write, with monitoring, backups and a tested rollback', 'Déployer une application qu''ils n''ont pas écrite, avec supervision, sauvegardes et retour arrière testé'),
    ((SELECT id FROM lesson WHERE code = 'OPS-6.3'), 'OPS-6.3.1', 1, 'Take down a classmate''s deployment, then help them make it survive the same attack', 'Faire tomber le déploiement d''un camarade, puis l''aider à y résister')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;


-- ---------------------------------------------------------------
-- SEC — Cybersecurity
-- ---------------------------------------------------------------

INSERT INTO module (track_id, code, position, title_en, title_fr, note_en, note_fr) VALUES
    ((SELECT id FROM track WHERE code = 'SEC'), 'M1', 1, 'How to think about security', 'Raisonner sécurité', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'SEC'), 'M2', 2, 'Networks, from a defender''s side', 'Les réseaux, côté défense', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'SEC'), 'M3', 3, 'Identity', 'Identité', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'SEC'), 'M4', 4, 'How attacks actually happen', 'Comment les attaques arrivent vraiment', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'SEC'), 'M5', 5, 'Cryptography, enough to use it correctly', 'Cryptographie, ce qu''il faut pour bien s''en servir', 'Enough to choose and use the right thing. Not enough to build one, deliberately — nobody in this programme should be writing cryptography.', 'De quoi choisir et utiliser correctement. Pas de quoi en concevoir, volontairement : personne ici ne devrait écrire de cryptographie.'),
    ((SELECT id FROM track WHERE code = 'SEC'), 'M6', 6, 'Defending something real', 'Défendre quelque chose de réel', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'SEC'), 'M7', 7, 'The assessment', 'L''évaluation', NULL, NULL)
ON CONFLICT (track_id, code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;

-- SEC M1 · How to think about security
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M1'), 'SEC-1.1', 1, 'What you are protecting, and from whom', 'Ce que l''on protège, et contre qui', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M1'), 'SEC-1.2', 2, 'Threat, vulnerability, risk', 'Menace, vulnérabilité, risque', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M1'), 'SEC-1.3', 3, 'Spending effort where it pays', 'Investir l''effort là où il rapporte', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M1'), 'SEC-1.4', 4, 'The law, and permission', 'La loi, et l''autorisation', 'L2', 'core', 1, 'Taught before anything offensive, not after. Everything in this branch that touches a system is done on systems the learner owns or has written permission to test.', 'Enseigné avant toute pratique offensive, pas après. Tout dans cette filière se fait sur des systèmes possédés ou testés avec autorisation écrite.')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-1.1'), 'SEC-1.1.1', 1, 'For a described organisation, name what would hurt most if lost, changed, or made public', 'Pour une organisation décrite, nommer ce dont la perte, l''altération ou la divulgation ferait le plus de mal'),
    ((SELECT id FROM lesson WHERE code = 'SEC-1.2'), 'SEC-1.2.1', 1, 'Given an incident, separate the three and say which one the organisation could actually have changed', 'Face à un incident, distinguer les trois et dire lequel l''organisation pouvait réellement changer'),
    ((SELECT id FROM lesson WHERE code = 'SEC-1.3'), 'SEC-1.3.1', 1, 'Rank five possible defences for a small organisation by what they prevent per hour spent', 'Classer cinq défenses possibles pour une petite structure selon ce qu''elles évitent par heure investie'),
    ((SELECT id FROM lesson WHERE code = 'SEC-1.4'), 'SEC-1.4.1', 1, 'State what written permission to test must contain, and why testing without it is a crime regardless of intent', 'Énoncer ce que doit contenir une autorisation écrite de test, et pourquoi tester sans elle est un délit quelle que soit l''intention')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- SEC M2 · Networks, from a defender's side
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M2'), 'SEC-2.1', 1, 'What is listening on this machine', 'Ce qui écoute sur cette machine', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M2'), 'SEC-2.2', 2, 'Firewalls', 'Pare-feux', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M2'), 'SEC-2.3', 3, 'Watching traffic', 'Observer le trafic', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M2'), 'SEC-2.4', 4, 'Keeping things apart', 'Cloisonner', 'L3', 'extension', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-2.1'), 'SEC-2.1.1', 1, 'List every open port on a machine they own and account for each one', 'Lister chaque port ouvert sur une machine leur appartenant et justifier chacun'),
    ((SELECT id FROM lesson WHERE code = 'SEC-2.2'), 'SEC-2.2.1', 1, 'Write rules that permit exactly one service and block everything else, then prove both halves', 'Écrire des règles autorisant exactement un service et bloquant le reste, puis prouver les deux'),
    ((SELECT id FROM lesson WHERE code = 'SEC-2.3'), 'SEC-2.3.1', 1, 'Capture their own traffic and find a credential sent without encryption', 'Capturer leur propre trafic et y trouver un identifiant transmis sans chiffrement'),
    ((SELECT id FROM lesson WHERE code = 'SEC-2.4'), 'SEC-2.4.1', 1, 'Design a network where compromising the guest wifi does not reach the accounting machine', 'Concevoir un réseau où compromettre le wifi invité n''atteint pas la machine comptable')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- SEC M3 · Identity
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M3'), 'SEC-3.1', 1, 'Proving who you are, and what you may do', 'Prouver qui on est, et ce qu''on peut faire', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M3'), 'SEC-3.2', 2, 'Passwords, and why they keep failing', 'Les mots de passe, et pourquoi ils échouent', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M3'), 'SEC-3.3', 3, 'Second factors', 'Second facteur', 'L3', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M3'), 'SEC-3.4', 4, 'Account recovery: the way in everyone forgets', 'La récupération de compte : la porte qu''on oublie', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M3'), 'SEC-3.5', 5, 'Least privilege, in practice', 'Moindre privilège, en pratique', 'L3', 'extension', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-3.1'), 'SEC-3.1.1', 1, 'Give an example of each failing separately, and say which is worse and why', 'Donner un exemple de chaque défaillance séparément, et dire laquelle est pire, et pourquoi'),
    ((SELECT id FROM lesson WHERE code = 'SEC-3.2'), 'SEC-3.2.1', 1, 'Explain why a stolen password database is survivable if hashed properly and catastrophic if not', 'Expliquer pourquoi une base de mots de passe volée est surmontable si bien hachée, catastrophique sinon'),
    ((SELECT id FROM lesson WHERE code = 'SEC-3.3'), 'SEC-3.3.1', 1, 'Explain what a second factor stops and what it does not, naming one attack it fails against', 'Expliquer ce qu''un second facteur arrête et ce qu''il n''arrête pas, en nommant une attaque qui le contourne'),
    ((SELECT id FROM lesson WHERE code = 'SEC-3.4'), 'SEC-3.4.1', 1, 'Find the weakest step in a described recovery flow and propose a fix that does not lock users out', 'Trouver l''étape la plus faible d''une procédure de récupération et proposer un correctif qui n''enferme pas les utilisateurs dehors'),
    ((SELECT id FROM lesson WHERE code = 'SEC-3.5'), 'SEC-3.5.1', 1, 'Cut an over-permissioned account down to its job and show the job still works', 'Réduire un compte surprivilégié à sa fonction et montrer que la fonction marche toujours')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- SEC M4 · How attacks actually happen
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M4'), 'SEC-4.1', 1, 'Phishing', 'Hameçonnage', 'L2', 'core', 3, 'First because it is how most compromises start, and because defending against it is organisational rather than technical.', 'En premier parce que c''est ainsi que commencent la plupart des compromissions, et que la défense y est organisationnelle.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M4'), 'SEC-4.2', 2, 'Ransomware', 'Rançongiciels', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M4'), 'SEC-4.3', 3, 'Injection', 'Injection', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M4'), 'SEC-4.4', 4, 'Attacks that come through the browser', 'Les attaques qui passent par le navigateur', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M4'), 'SEC-4.5', 5, 'Supply chain', 'Chaîne d''approvisionnement', 'L4', 'advanced', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-4.1'), 'SEC-4.1.1', 1, 'Identify the warning signs in a phishing message, and name one that would have fooled them', 'Repérer les signaux d''alerte d''un message d''hameçonnage, et en nommer un qui les aurait trompés'),
    ((SELECT id FROM lesson WHERE code = 'SEC-4.2'), 'SEC-4.2.1', 1, 'Trace how ransomware reaches an organisation and spreads, and name the two controls that stop it', 'Retracer comment un rançongiciel entre et se propage, et nommer les deux contrôles qui l''arrêtent'),
    ((SELECT id FROM lesson WHERE code = 'SEC-4.3'), 'SEC-4.3.1', 1, 'Exploit an injection flaw in a deliberately vulnerable application they have been given, then fix it', 'Exploiter une faille d''injection dans une application volontairement vulnérable qu''on leur a fournie, puis la corriger'),
    ((SELECT id FROM lesson WHERE code = 'SEC-4.4'), 'SEC-4.4.1', 1, 'Demonstrate a cross-site scripting flaw on a provided target and explain what the fix protects', 'Démontrer une faille de script inter-site sur une cible fournie et expliquer ce que le correctif protège'),
    ((SELECT id FROM lesson WHERE code = 'SEC-4.5'), 'SEC-4.5.1', 1, 'List everything a given application trusts that its authors did not write, and rank the risk', 'Lister tout ce qu''une application donnée fait confiance sans l''avoir écrit, et classer le risque')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- SEC M5 · Cryptography, enough to use it correctly
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M5'), 'SEC-5.1', 1, 'Hashing is not encryption', 'Hacher n''est pas chiffrer', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M5'), 'SEC-5.2', 2, 'Agreeing a secret with a stranger', 'Convenir d''un secret avec un inconnu', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M5'), 'SEC-5.3', 3, 'Certificates, and what the padlock means', 'Certificats, et ce que signifie le cadenas', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M5'), 'SEC-5.4', 4, 'Getting it wrong in ways that look right', 'Se tromper d''une manière qui paraît juste', 'L4', 'advanced', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-5.1'), 'SEC-5.1.1', 1, 'Say which to use for stored passwords and why the other is wrong', 'Dire lequel utiliser pour stocker des mots de passe et pourquoi l''autre est faux'),
    ((SELECT id FROM lesson WHERE code = 'SEC-5.2'), 'SEC-5.2.1', 1, 'Explain how two machines that have never met agree a key over a network anyone can read', 'Expliquer comment deux machines qui ne se connaissent pas conviennent d''une clé sur un réseau lisible par tous'),
    ((SELECT id FROM lesson WHERE code = 'SEC-5.3'), 'SEC-5.3.1', 1, 'Say what a valid certificate proves and what it does not — specifically, that it says nothing about honesty', 'Dire ce qu''un certificat valide prouve et ne prouve pas — notamment qu''il ne dit rien sur l''honnêteté du site'),
    ((SELECT id FROM lesson WHERE code = 'SEC-5.4'), 'SEC-5.4.1', 1, 'Find the flaw in an encryption scheme that appears to work and passes its own tests', 'Trouver la faille d''un schéma de chiffrement qui semble marcher et passe ses propres tests')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- SEC M6 · Defending something real
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M6'), 'SEC-6.1', 1, 'Hardening a machine', 'Durcir une machine', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M6'), 'SEC-6.2', 2, 'Noticing', 'Détecter', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M6'), 'SEC-6.3', 3, 'Responding', 'Réagir', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M6'), 'SEC-6.4', 4, 'Telling people', 'Informer', 'L3', 'extension', 2, 'Usually left out of technical courses and usually the part that goes worst. Whom to tell and how fast is often a legal question, not a technical one.', 'Souvent absent des cours techniques et souvent la partie la plus mal gérée. Qui prévenir et à quelle vitesse est une question juridique.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M6'), 'SEC-6.5', 5, 'Policy that people follow', 'Une politique que les gens suivent', 'L4', 'advanced', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-6.1'), 'SEC-6.1.1', 1, 'Take a default install and close everything not needed, without breaking what is', 'Partir d''une installation par défaut et fermer tout le superflu, sans casser le nécessaire'),
    ((SELECT id FROM lesson WHERE code = 'SEC-6.2'), 'SEC-6.2.1', 1, 'Find evidence of a brute-force attempt in a log, and set up something that would have told them sooner', 'Trouver la trace d''une attaque par force brute dans un journal, et mettre en place ce qui aurait alerté plus tôt'),
    ((SELECT id FROM lesson WHERE code = 'SEC-6.3'), 'SEC-6.3.1', 1, 'Order the response steps for a live compromise and say why containment comes before cleanup', 'Ordonner les étapes de réponse à une compromission en cours et dire pourquoi le confinement précède le nettoyage'),
    ((SELECT id FROM lesson WHERE code = 'SEC-6.4'), 'SEC-6.4.1', 1, 'Draft the notification for a breach, saying what is known, what is not, and what people should do', 'Rédiger la notification d''une violation : ce qui est connu, ce qui ne l''est pas, et ce que les gens doivent faire'),
    ((SELECT id FROM lesson WHERE code = 'SEC-6.5'), 'SEC-6.5.1', 1, 'Rewrite a security policy people ignore into one they will follow, and explain each change', 'Réécrire une politique ignorée en une politique appliquée, et justifier chaque changement')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- SEC M7 · The assessment
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M7'), 'SEC-7.1', 1, 'Scoping a review', 'Cadrer un audit', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M7'), 'SEC-7.2', 2, 'Reviewing a system end to end', 'Auditer un système de bout en bout', 'L2', 'core', 12, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M7'), 'SEC-7.3', 3, 'A report someone will act on', 'Un rapport sur lequel on agira', 'L2', 'core', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-7.1'), 'SEC-7.1.1', 1, 'Write a scope stating what will be tested, what will not, and what happens if something breaks', 'Rédiger un périmètre indiquant ce qui sera testé, ce qui ne le sera pas, et la conduite à tenir en cas de casse'),
    ((SELECT id FROM lesson WHERE code = 'SEC-7.2'), 'SEC-7.2.1', 1, 'Assess a system provided for the purpose and produce findings ranked by what they would actually cost', 'Évaluer un système fourni à cet effet et produire des constats classés par coût réel'),
    ((SELECT id FROM lesson WHERE code = 'SEC-7.3'), 'SEC-7.3.1', 1, 'Present findings to someone non-technical who leaves knowing what to fix first', 'Présenter des constats à un non-technicien qui repart en sachant quoi corriger en premier')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;


-- ---------------------------------------------------------------
-- AI — Artificial Intelligence
-- ---------------------------------------------------------------

INSERT INTO module (track_id, code, position, title_en, title_fr, note_en, note_fr) VALUES
    ((SELECT id FROM track WHERE code = 'AI'), 'M1', 1, 'What these systems are', 'Ce que sont ces systèmes', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'AI'), 'M2', 2, 'Data', 'Les données', 'The largest module, because this is where most of the work is and where most projects fail.', 'Le plus gros module, parce que c''est là qu''est le travail et là que la plupart des projets échouent.'),
    ((SELECT id FROM track WHERE code = 'AI'), 'M3', 3, 'Making predictions', 'Faire des prédictions', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'AI'), 'M4', 4, 'Neural networks', 'Réseaux de neurones', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'AI'), 'M5', 5, 'Language models', 'Modèles de langue', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'AI'), 'M6', 6, 'Putting it in front of people', 'Le mettre entre les mains des gens', NULL, NULL),
    ((SELECT id FROM track WHERE code = 'AI'), 'M7', 7, 'The project', 'Le projet', NULL, NULL)
ON CONFLICT (track_id, code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;

-- AI M1 · What these systems are
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M1'), 'AI-1.1', 1, 'Learning from examples instead of rules', 'Apprendre d''exemples plutôt que de règles', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M1'), 'AI-1.2', 2, 'AI, machine learning, deep learning', 'IA, apprentissage automatique, apprentissage profond', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M1'), 'AI-1.3', 3, 'Where it fails', 'Où cela échoue', 'L2', 'core', 2, 'Third lesson, not last. Knowing the limits early stops a learner spending a term building something that could never have worked.', 'En troisième, pas en dernier. Connaître les limites tôt évite de passer un trimestre sur un projet condamné.')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-1.1'), 'AI-1.1.1', 1, 'Given two problems, say which suits rules and which suits learning, and why', 'Face à deux problèmes, dire lequel relève de règles et lequel de l''apprentissage, et pourquoi'),
    ((SELECT id FROM lesson WHERE code = 'AI-1.2'), 'AI-1.2.1', 1, 'Place the three terms correctly inside one another and give an example of each', 'Emboîter correctement les trois termes et donner un exemple de chacun'),
    ((SELECT id FROM lesson WHERE code = 'AI-1.3'), 'AI-1.3.1', 1, 'Given a proposed use, judge whether it is a good fit and name the specific reason', 'Face à un usage proposé, juger sa pertinence et nommer la raison précise')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- AI M2 · Data
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M2'), 'AI-2.1', 1, 'Features and labels', 'Variables et étiquettes', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M2'), 'AI-2.2', 2, 'Cleaning', 'Nettoyer', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M2'), 'AI-2.3', 3, 'Practice: data that is genuinely messy', 'Pratique : des données vraiment sales', 'L2', 'scaffold', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M2'), 'AI-2.4', 4, 'Bias, and who gets left out', 'Biais, et qui se retrouve exclu', 'L2', 'core', 3, 'Concrete rather than abstract. A model trained on data from one region, one language or one gender fails on everyone else, and the learners here are usually the everyone else.', 'Concret plutôt qu''abstrait. Un modèle entraîné sur une seule région, langue ou population échoue sur les autres — et les apprenants ici sont souvent ces autres.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M2'), 'AI-2.5', 5, 'Training and testing must be separate', 'Entraînement et test doivent rester séparés', 'L2', 'core', 2, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-2.1'), 'AI-2.1.1', 1, 'Identify the features and the label in a dataset they have not seen before', 'Identifier variables et étiquette dans un jeu de données qu''ils découvrent'),
    ((SELECT id FROM lesson WHERE code = 'AI-2.2'), 'AI-2.2.1', 1, 'Handle missing and inconsistent values, and justify each choice rather than deleting rows by default', 'Traiter valeurs manquantes et incohérentes, en justifiant chaque choix plutôt que de supprimer par défaut'),
    ((SELECT id FROM lesson WHERE code = 'AI-2.3'), 'AI-2.3.1', 1, 'Take a real, unhelpful spreadsheet and get it into a usable shape', 'Prendre un vrai tableur inexploitable et le mettre en forme utilisable'),
    ((SELECT id FROM lesson WHERE code = 'AI-2.4'), 'AI-2.4.1', 1, 'Find who is under-represented in a dataset and predict how the model will fail them specifically', 'Trouver qui est sous-représenté dans un jeu de données et prédire comment le modèle leur nuira précisément'),
    ((SELECT id FROM lesson WHERE code = 'AI-2.5'), 'AI-2.5.1', 1, 'Show what happens to a score when test data leaks into training, and explain the number', 'Montrer ce qui arrive au score quand les données de test fuitent dans l''entraînement, et expliquer le chiffre')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- AI M3 · Making predictions
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M3'), 'AI-3.1', 1, 'Supervised and unsupervised', 'Supervisé et non supervisé', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M3'), 'AI-3.2', 2, 'A first model, end to end', 'Un premier modèle, de bout en bout', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M3'), 'AI-3.3', 3, 'Why accuracy is usually the wrong number', 'Pourquoi l''exactitude est souvent le mauvais chiffre', 'L3', 'core', 3, 'A model that always says "no" is 99% accurate on a problem where yes happens 1% of the time, and is useless. This is the most common way a beginner fools themselves.', 'Un modèle qui dit toujours « non » est exact à 99 % quand « oui » arrive 1 % du temps — et il est inutile. C''est l''auto-illusion la plus courante.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M3'), 'AI-3.4', 4, 'Overfitting', 'Surapprentissage', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M3'), 'AI-3.5', 5, 'When the world changes underneath', 'Quand le monde change sous le modèle', 'L4', 'advanced', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-3.1'), 'AI-3.1.1', 1, 'Sort five described problems into the right category', 'Ranger cinq problèmes décrits dans la bonne catégorie'),
    ((SELECT id FROM lesson WHERE code = 'AI-3.2'), 'AI-3.2.1', 1, 'Train a model on a prepared dataset and get a prediction out of it', 'Entraîner un modèle sur un jeu préparé et en obtenir une prédiction'),
    ((SELECT id FROM lesson WHERE code = 'AI-3.3'), 'AI-3.3.1', 1, 'Build a useless model with a high accuracy score and explain exactly why the number lies', 'Construire un modèle inutile au score élevé et expliquer précisément pourquoi le chiffre ment'),
    ((SELECT id FROM lesson WHERE code = 'AI-3.3'), 'AI-3.3.2', 2, 'Read a confusion matrix and say which kind of mistake would matter more in a stated situation', 'Lire une matrice de confusion et dire quelle erreur compte le plus dans une situation donnée'),
    ((SELECT id FROM lesson WHERE code = 'AI-3.4'), 'AI-3.4.1', 1, 'Cause overfitting deliberately, show it in the numbers, and then reduce it', 'Provoquer volontairement un surapprentissage, le montrer dans les chiffres, puis le réduire'),
    ((SELECT id FROM lesson WHERE code = 'AI-3.5'), 'AI-3.5.1', 1, 'Explain how a model that worked last year silently stops working, and what would detect it', 'Expliquer comment un modèle efficace l''an dernier cesse silencieusement de l''être, et ce qui le détecterait')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- AI M4 · Neural networks
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M4'), 'AI-4.1', 1, 'What a layer does', 'Ce que fait une couche', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M4'), 'AI-4.2', 2, 'How it learns', 'Comment il apprend', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M4'), 'AI-4.3', 3, 'Different shapes for different data', 'Des architectures selon les données', 'L3', 'extension', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M4'), 'AI-4.4', 4, 'Using someone else''s trained model', 'Réutiliser un modèle déjà entraîné', 'L4', 'advanced', 3, 'The practical path. Training from scratch needs hardware these learners will not have; adapting an existing model needs a laptop.', 'La voie réaliste. Entraîner de zéro demande du matériel indisponible ici ; adapter un modèle existant demande un portable.')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-4.1'), 'AI-4.1.1', 1, 'Describe what one layer does to its input, without using the word "neuron"', 'Décrire ce qu''une couche fait de son entrée, sans employer le mot « neurone »'),
    ((SELECT id FROM lesson WHERE code = 'AI-4.2'), 'AI-4.2.1', 1, 'Explain the loop of predict, measure the error, adjust — and what makes it stop', 'Expliquer la boucle prédire, mesurer l''erreur, ajuster — et ce qui l''arrête'),
    ((SELECT id FROM lesson WHERE code = 'AI-4.3'), 'AI-4.3.1', 1, 'Say why images and text need different architectures, referring to what each preserves', 'Dire pourquoi images et texte appellent des architectures différentes, selon ce que chacune préserve'),
    ((SELECT id FROM lesson WHERE code = 'AI-4.4'), 'AI-4.4.1', 1, 'Adapt a pre-trained model to a new task with a small dataset, and report honestly how well it did', 'Adapter un modèle pré-entraîné à une nouvelle tâche avec peu de données, et rapporter honnêtement le résultat')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- AI M5 · Language models
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M5'), 'AI-5.1', 1, 'Predicting the next word, and why that is enough', 'Prédire le mot suivant, et pourquoi cela suffit', 'L2', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M5'), 'AI-5.2', 2, 'Asking well', 'Bien demander', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M5'), 'AI-5.3', 3, 'Answering from your own documents', 'Répondre à partir de ses propres documents', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M5'), 'AI-5.4', 4, 'Confidently wrong', 'Sûr de soi et faux', 'L3', 'core', 3, 'Core, not an ethics footnote. Someone who cannot catch a fluent false answer is more dangerous with these tools than without them.', 'Central, pas une note d''éthique. Qui ne sait pas repérer une réponse fausse mais fluide est plus dangereux avec ces outils que sans.'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M5'), 'AI-5.5', 5, 'Judging whether it is actually working', 'Juger si cela marche vraiment', 'L4', 'advanced', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-5.1'), 'AI-5.1.1', 1, 'Explain next-token prediction without jargon, to someone who has not studied this', 'Expliquer la prédiction du mot suivant sans jargon, à quelqu''un qui n''a pas étudié le sujet'),
    ((SELECT id FROM lesson WHERE code = 'AI-5.2'), 'AI-5.2.1', 1, 'Improve a weak prompt and say which specific change made the difference', 'Améliorer une instruction faible et dire quel changement précis a fait la différence'),
    ((SELECT id FROM lesson WHERE code = 'AI-5.3'), 'AI-5.3.1', 1, 'Build something that answers questions from a document collection, and show it refusing when the answer is not there', 'Construire un outil qui répond à partir d''un corpus, et le montrer refuser quand la réponse n''y est pas'),
    ((SELECT id FROM lesson WHERE code = 'AI-5.4'), 'AI-5.4.1', 1, 'Catch a fluent false answer in their own subject area and describe how they verified it', 'Repérer une réponse fausse mais fluide dans leur domaine et décrire comment ils l''ont vérifiée'),
    ((SELECT id FROM lesson WHERE code = 'AI-5.4'), 'AI-5.4.2', 2, 'Name two kinds of question where these models should not be trusted at all', 'Nommer deux types de questions où ces modèles ne doivent pas être crus du tout'),
    ((SELECT id FROM lesson WHERE code = 'AI-5.5'), 'AI-5.5.1', 1, 'Design a test set for a language application and use it to compare two approaches', 'Concevoir un jeu de test pour une application de langue et comparer deux approches avec')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- AI M6 · Putting it in front of people
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M6'), 'AI-6.1', 1, 'What may not leave the building', 'Ce qui ne doit pas sortir', 'L3', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M6'), 'AI-6.2', 2, 'Where a person has to stay in the loop', 'Où un humain doit rester dans la boucle', 'L3', 'core', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M6'), 'AI-6.3', 3, 'Telling people what it is', 'Dire aux gens ce que c''est', 'L3', 'extension', 2, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M6'), 'AI-6.4', 4, 'What it costs to run', 'Ce que cela coûte à faire tourner', 'L4', 'advanced', 3, NULL, NULL)
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-6.1'), 'AI-6.1.1', 1, 'Given a dataset, identify what must not be sent to a third-party model and explain the reasoning', 'Pour un jeu de données, identifier ce qui ne doit pas être envoyé à un modèle tiers, et pourquoi'),
    ((SELECT id FROM lesson WHERE code = 'AI-6.2'), 'AI-6.2.1', 1, 'For three described uses, decide where human approval is required and justify each', 'Pour trois usages décrits, décider où l''approbation humaine est requise et justifier'),
    ((SELECT id FROM lesson WHERE code = 'AI-6.3'), 'AI-6.3.1', 1, 'Write what a user should be told about an AI feature so they can judge its output', 'Rédiger ce qu''un utilisateur doit savoir d''une fonction d''IA pour en juger le résultat'),
    ((SELECT id FROM lesson WHERE code = 'AI-6.4'), 'AI-6.4.1', 1, 'Estimate the cost of running a described application for a year, and find the cheaper approach', 'Estimer le coût annuel d''une application décrite, et trouver l''approche moins chère')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;

-- AI M7 · The project
INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M7'), 'AI-7.1', 1, 'Choosing a problem worth solving', 'Choisir un problème qui vaut la peine', 'L2', 'core', 3, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M7'), 'AI-7.2', 2, 'Building it', 'Le construire', 'L2', 'core', 12, NULL, NULL),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M7'), 'AI-7.3', 3, 'Presenting it honestly', 'Le présenter honnêtement', 'L2', 'core', 3, 'The honesty is assessed. A presentation that hides where the model fails is marked down, however good the model is.', 'L''honnêteté est évaluée. Une présentation qui cache les échecs du modèle est pénalisée, aussi bon soit le modèle.')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-7.1'), 'AI-7.1.1', 1, 'Propose a project, state how success will be measured, and say what result would mean abandoning it', 'Proposer un projet, dire comment le succès sera mesuré, et quel résultat justifierait de l''abandonner'),
    ((SELECT id FROM lesson WHERE code = 'AI-7.2'), 'AI-7.2.1', 1, 'Deliver a working project from raw data to result, with its evaluation', 'Livrer un projet fonctionnel des données brutes au résultat, avec son évaluation'),
    ((SELECT id FROM lesson WHERE code = 'AI-7.3'), 'AI-7.3.1', 1, 'Present the project including where it fails and who it would fail for', 'Présenter le projet en incluant ses échecs et pour qui il échouerait')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;


-- Retire anything from the previous curriculum that is no longer authored.
-- Retired rather than deleted: sessions taught against those lessons stay
-- valid and readable, and a handover sheet from last term still resolves.
UPDATE lesson SET retired_on = CURRENT_DATE
 WHERE retired_on IS NULL
   AND code NOT IN ('F-1.1', 'F-1.2', 'F-1.3', 'F-1.4', 'F-1.5', 'F-2.1', 'F-2.2', 'F-2.3', 'F-2.4', 'F-2.5', 'F-3.1', 'F-3.2', 'F-3.3', 'F-3.4', 'F-4.1', 'F-4.2', 'F-4.3', 'F-4.4', 'F-4.5', 'F-5.1', 'F-5.2', 'F-5.3', 'F-5.4', 'F-5.5', 'F-5.6', 'F-5.7', 'F-5.8', 'F-5.9', 'F-6.1', 'F-6.2', 'F-6.3', 'F-6.4', 'F-6.5', 'F-6.6', 'F-7.1', 'F-7.2', 'F-7.3', 'F-7.4', 'F-8.1', 'F-8.2', 'F-8.3', 'F-8.4', 'F-9.1', 'F-9.2', 'F-9.3', 'DEV-1.1', 'DEV-1.2', 'DEV-1.3', 'DEV-1.4', 'DEV-2.1', 'DEV-2.2', 'DEV-2.3', 'DEV-2.4', 'DEV-3.1', 'DEV-3.2', 'DEV-3.3', 'DEV-3.4', 'DEV-4.1', 'DEV-4.2', 'DEV-4.3', 'DEV-4.4', 'DEV-5.1', 'DEV-5.2', 'DEV-5.3', 'DEV-5.4', 'DEV-6.1', 'DEV-6.2', 'DEV-6.3', 'OPS-1.1', 'OPS-1.2', 'OPS-1.3', 'OPS-1.4', 'OPS-1.5', 'OPS-2.1', 'OPS-2.2', 'OPS-2.3', 'OPS-2.4', 'OPS-3.1', 'OPS-3.2', 'OPS-3.3', 'OPS-3.4', 'OPS-4.1', 'OPS-4.2', 'OPS-4.3', 'OPS-4.4', 'OPS-4.5', 'OPS-5.1', 'OPS-5.2', 'OPS-5.3', 'OPS-5.4', 'OPS-6.1', 'OPS-6.2', 'OPS-6.3', 'SEC-1.1', 'SEC-1.2', 'SEC-1.3', 'SEC-1.4', 'SEC-2.1', 'SEC-2.2', 'SEC-2.3', 'SEC-2.4', 'SEC-3.1', 'SEC-3.2', 'SEC-3.3', 'SEC-3.4', 'SEC-3.5', 'SEC-4.1', 'SEC-4.2', 'SEC-4.3', 'SEC-4.4', 'SEC-4.5', 'SEC-5.1', 'SEC-5.2', 'SEC-5.3', 'SEC-5.4', 'SEC-6.1', 'SEC-6.2', 'SEC-6.3', 'SEC-6.4', 'SEC-6.5', 'SEC-7.1', 'SEC-7.2', 'SEC-7.3', 'AI-1.1', 'AI-1.2', 'AI-1.3', 'AI-2.1', 'AI-2.2', 'AI-2.3', 'AI-2.4', 'AI-2.5', 'AI-3.1', 'AI-3.2', 'AI-3.3', 'AI-3.4', 'AI-3.5', 'AI-4.1', 'AI-4.2', 'AI-4.3', 'AI-4.4', 'AI-5.1', 'AI-5.2', 'AI-5.3', 'AI-5.4', 'AI-5.5', 'AI-6.1', 'AI-6.2', 'AI-6.3', 'AI-6.4', 'AI-7.1', 'AI-7.2', 'AI-7.3');

UPDATE objective SET retired_on = CURRENT_DATE
 WHERE retired_on IS NULL
   AND code NOT IN ('F-1.1.1', 'F-1.2.1', 'F-1.2.2', 'F-1.3.1', 'F-1.4.1', 'F-1.5.1', 'F-1.5.2', 'F-2.1.1', 'F-2.2.1', 'F-2.3.1', 'F-2.3.2', 'F-2.4.1', 'F-2.5.1', 'F-3.1.1', 'F-3.1.2', 'F-3.2.1', 'F-3.3.1', 'F-3.4.1', 'F-4.1.1', 'F-4.2.1', 'F-4.3.1', 'F-4.4.1', 'F-4.5.1', 'F-5.1.1', 'F-5.2.1', 'F-5.3.1', 'F-5.4.1', 'F-5.5.1', 'F-5.5.2', 'F-5.6.1', 'F-5.7.1', 'F-5.7.2', 'F-5.8.1', 'F-5.9.1', 'F-6.1.1', 'F-6.2.1', 'F-6.3.1', 'F-6.4.1', 'F-6.5.1', 'F-6.6.1', 'F-7.1.1', 'F-7.2.1', 'F-7.3.1', 'F-7.4.1', 'F-8.1.1', 'F-8.2.1', 'F-8.3.1', 'F-8.4.1', 'F-9.1.1', 'F-9.2.1', 'F-9.3.1', 'DEV-1.1.1', 'DEV-1.2.1', 'DEV-1.3.1', 'DEV-1.4.1', 'DEV-1.4.2', 'DEV-2.1.1', 'DEV-2.2.1', 'DEV-2.3.1', 'DEV-2.4.1', 'DEV-3.1.1', 'DEV-3.2.1', 'DEV-3.3.1', 'DEV-3.4.1', 'DEV-4.1.1', 'DEV-4.2.1', 'DEV-4.3.1', 'DEV-4.4.1', 'DEV-5.1.1', 'DEV-5.2.1', 'DEV-5.2.2', 'DEV-5.3.1', 'DEV-5.4.1', 'DEV-6.1.1', 'DEV-6.2.1', 'DEV-6.3.1', 'OPS-1.1.1', 'OPS-1.2.1', 'OPS-1.3.1', 'OPS-1.3.2', 'OPS-1.4.1', 'OPS-1.5.1', 'OPS-2.1.1', 'OPS-2.2.1', 'OPS-2.3.1', 'OPS-2.4.1', 'OPS-3.1.1', 'OPS-3.2.1', 'OPS-3.3.1', 'OPS-3.4.1', 'OPS-4.1.1', 'OPS-4.2.1', 'OPS-4.3.1', 'OPS-4.4.1', 'OPS-4.5.1', 'OPS-5.1.1', 'OPS-5.2.1', 'OPS-5.3.1', 'OPS-5.4.1', 'OPS-6.1.1', 'OPS-6.2.1', 'OPS-6.3.1', 'SEC-1.1.1', 'SEC-1.2.1', 'SEC-1.3.1', 'SEC-1.4.1', 'SEC-2.1.1', 'SEC-2.2.1', 'SEC-2.3.1', 'SEC-2.4.1', 'SEC-3.1.1', 'SEC-3.2.1', 'SEC-3.3.1', 'SEC-3.4.1', 'SEC-3.5.1', 'SEC-4.1.1', 'SEC-4.2.1', 'SEC-4.3.1', 'SEC-4.4.1', 'SEC-4.5.1', 'SEC-5.1.1', 'SEC-5.2.1', 'SEC-5.3.1', 'SEC-5.4.1', 'SEC-6.1.1', 'SEC-6.2.1', 'SEC-6.3.1', 'SEC-6.4.1', 'SEC-6.5.1', 'SEC-7.1.1', 'SEC-7.2.1', 'SEC-7.3.1', 'AI-1.1.1', 'AI-1.2.1', 'AI-1.3.1', 'AI-2.1.1', 'AI-2.2.1', 'AI-2.3.1', 'AI-2.4.1', 'AI-2.5.1', 'AI-3.1.1', 'AI-3.2.1', 'AI-3.3.1', 'AI-3.3.2', 'AI-3.4.1', 'AI-3.5.1', 'AI-4.1.1', 'AI-4.2.1', 'AI-4.3.1', 'AI-4.4.1', 'AI-5.1.1', 'AI-5.2.1', 'AI-5.3.1', 'AI-5.4.1', 'AI-5.4.2', 'AI-5.5.1', 'AI-6.1.1', 'AI-6.2.1', 'AI-6.3.1', 'AI-6.4.1', 'AI-7.1.1', 'AI-7.2.1', 'AI-7.3.1');

UPDATE track SET retired_on = CURRENT_DATE
 WHERE retired_on IS NULL
   AND code NOT IN ('F', 'DEV', 'OPS', 'SEC', 'AI');

COMMIT;
