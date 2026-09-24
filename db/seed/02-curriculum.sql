-- =====================================================================
-- Curriculum: tracks, modules, lessons, objectives
--
-- GENERATED FILE — do not edit by hand.
-- Source:    data/curriculum.json (version 1.0.0)
-- Regenerate: node tools/build-seed.js
-- =====================================================================

-- 4 tracks, 25 modules, 83 lessons, 92 objectives.
--
-- Lesson and objective codes (CS-2.3, CS-2.3.1) are the stable identifiers.
-- They are what session rows point at and what a handover sheet prints, so
-- they must never be reused for different content.

BEGIN;

-- Tracks
INSERT INTO track (code, position, name_en, name_fr, color) VALUES
    ('CS', 1, 'Computer Science', 'Informatique', '#16233A'),
    ('OPS', 2, 'DevOps', 'DevOps', '#2E5E4E'),
    ('SEC', 3, 'Cybersecurity', 'Cybersécurité', '#A83A2C'),
    ('AI', 4, 'Artificial Intelligence', 'Intelligence artificielle', '#4A5B78')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    name_en  = EXCLUDED.name_en,
    name_fr  = EXCLUDED.name_fr,
    color    = EXCLUDED.color;


-- ---------------------------------------------------------------
-- CS — Computer Science / Informatique
-- ---------------------------------------------------------------

INSERT INTO module (track_id, code, position, title_en, title_fr) VALUES
    ((SELECT id FROM track WHERE code = 'CS'), 'M1', 1, 'Foundations of computing', 'Fondements de l''informatique'),
    ((SELECT id FROM track WHERE code = 'CS'), 'M2', 2, 'Thinking like a programmer', 'Raisonner comme un programmeur'),
    ((SELECT id FROM track WHERE code = 'CS'), 'M3', 3, 'Programming fundamentals', 'Bases de la programmation'),
    ((SELECT id FROM track WHERE code = 'CS'), 'M4', 4, 'Data structures', 'Structures de données'),
    ((SELECT id FROM track WHERE code = 'CS'), 'M5', 5, 'Data and databases', 'Données et bases de données'),
    ((SELECT id FROM track WHERE code = 'CS'), 'M6', 6, 'Networks and the web', 'Réseaux et web'),
    ((SELECT id FROM track WHERE code = 'CS'), 'M7', 7, 'Working as a developer', 'Travailler comme développeur')
ON CONFLICT (track_id, code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;

-- CS M1 · Foundations of computing
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M1'), 'CS-1.1', 1, 'How a computer works', 'Le fonctionnement d''un ordinateur'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M1'), 'CS-1.2', 2, 'How data is represented', 'La représentation des données'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M1'), 'CS-1.3', 3, 'Files, folders and the command line', 'Fichiers, dossiers et ligne de commande')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'CS-1.1'), 'CS-1.1.1', 1, 'Name the main hardware components and say what each does', 'Nommer les principaux composants matériels et dire à quoi sert chacun'),
    ((SELECT id FROM lesson WHERE code = 'CS-1.1'), 'CS-1.1.2', 2, 'Explain what the operating system sits between and why', 'Expliquer entre quoi et quoi se place le système d''exploitation, et pourquoi'),
    ((SELECT id FROM lesson WHERE code = 'CS-1.2'), 'CS-1.2.1', 1, 'Convert a small number between binary and decimal', 'Convertir un petit nombre entre binaire et décimal'),
    ((SELECT id FROM lesson WHERE code = 'CS-1.2'), 'CS-1.2.2', 2, 'Explain why text, images and numbers are all stored as bits', 'Expliquer pourquoi textes, images et nombres sont tous stockés en bits'),
    ((SELECT id FROM lesson WHERE code = 'CS-1.3'), 'CS-1.3.1', 1, 'Move around a filesystem and create, copy and delete files from a terminal', 'Se déplacer dans une arborescence et créer, copier et supprimer des fichiers depuis un terminal')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- CS M2 · Thinking like a programmer
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M2'), 'CS-2.1', 1, 'Breaking a problem into steps', 'Décomposer un problème en étapes'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M2'), 'CS-2.2', 2, 'Pseudocode and flowcharts', 'Pseudocode et organigrammes'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M2'), 'CS-2.3', 3, 'Sequence, selection and repetition', 'Séquence, sélection et répétition'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M2'), 'CS-2.4', 4, 'Finding faults in logic', 'Repérer une faute de logique')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'CS-2.1'), 'CS-2.1.1', 1, 'Turn an everyday task into an ordered, unambiguous list of steps', 'Transformer une tâche courante en une suite d''étapes ordonnées et sans ambiguïté'),
    ((SELECT id FROM lesson WHERE code = 'CS-2.2'), 'CS-2.2.1', 1, 'Write pseudocode for a problem containing a decision and a repetition', 'Écrire le pseudocode d''un problème comportant une décision et une répétition'),
    ((SELECT id FROM lesson WHERE code = 'CS-2.3'), 'CS-2.3.1', 1, 'Trace a short algorithm by hand and predict its output correctly', 'Dérouler un algorithme court à la main et en prédire correctement le résultat'),
    ((SELECT id FROM lesson WHERE code = 'CS-2.4'), 'CS-2.4.1', 1, 'Locate the faulty step in a broken algorithm and correct it', 'Localiser l''étape fautive d''un algorithme défectueux et la corriger')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- CS M3 · Programming fundamentals
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M3'), 'CS-3.1', 1, 'Variables, types, input and output', 'Variables, types, entrées et sorties'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M3'), 'CS-3.2', 2, 'Conditions and loops in code', 'Conditions et boucles'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M3'), 'CS-3.3', 3, 'Functions and reuse', 'Fonctions et réutilisation'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M3'), 'CS-3.4', 4, 'Reading errors and debugging', 'Lire les erreurs et déboguer')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'CS-3.1'), 'CS-3.1.1', 1, 'Write a program that takes input, stores it and prints a result', 'Écrire un programme qui lit une entrée, la stocke et affiche un résultat'),
    ((SELECT id FROM lesson WHERE code = 'CS-3.2'), 'CS-3.2.1', 1, 'Write a working program using an if statement and a loop', 'Écrire un programme fonctionnel utilisant une condition et une boucle'),
    ((SELECT id FROM lesson WHERE code = 'CS-3.3'), 'CS-3.3.1', 1, 'Rewrite repeated code as a function with parameters and a return value', 'Transformer du code répété en une fonction avec paramètres et valeur de retour'),
    ((SELECT id FROM lesson WHERE code = 'CS-3.4'), 'CS-3.4.1', 1, 'Read an error message and identify the line and cause of the fault', 'Lire un message d''erreur et identifier la ligne et la cause de la panne')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- CS M4 · Data structures
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M4'), 'CS-4.1', 1, 'Lists and arrays', 'Listes et tableaux'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M4'), 'CS-4.2', 2, 'Dictionaries and key-value data', 'Dictionnaires et données clé-valeur'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M4'), 'CS-4.3', 3, 'Stacks and queues', 'Piles et files'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M4'), 'CS-4.4', 4, 'Choosing the right structure', 'Choisir la bonne structure')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'CS-4.1'), 'CS-4.1.1', 1, 'Store a collection in a list and process every item in it', 'Stocker une collection dans une liste et en parcourir tous les éléments'),
    ((SELECT id FROM lesson WHERE code = 'CS-4.2'), 'CS-4.2.1', 1, 'Look up a value by key and explain why it beats searching a list', 'Récupérer une valeur par sa clé et expliquer l''avantage sur un parcours de liste'),
    ((SELECT id FROM lesson WHERE code = 'CS-4.3'), 'CS-4.3.1', 1, 'Describe a real situation suited to a stack and one suited to a queue', 'Décrire une situation réelle adaptée à une pile et une autre adaptée à une file'),
    ((SELECT id FROM lesson WHERE code = 'CS-4.4'), 'CS-4.4.1', 1, 'Pick an appropriate structure for a given problem and justify the choice', 'Choisir une structure adaptée à un problème donné et justifier ce choix')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- CS M5 · Data and databases
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M5'), 'CS-5.1', 1, 'Tables, rows and keys', 'Tables, lignes et clés'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M5'), 'CS-5.2', 2, 'Querying with SQL', 'Interroger avec SQL'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M5'), 'CS-5.3', 3, 'Relationships between tables', 'Relations entre les tables')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'CS-5.1'), 'CS-5.1.1', 1, 'Design a simple table with a sensible primary key', 'Concevoir une table simple avec une clé primaire pertinente'),
    ((SELECT id FROM lesson WHERE code = 'CS-5.2'), 'CS-5.2.1', 1, 'Write a SELECT query with a filter and a sort', 'Écrire une requête SELECT avec un filtre et un tri'),
    ((SELECT id FROM lesson WHERE code = 'CS-5.3'), 'CS-5.3.1', 1, 'Join two related tables and explain what the join produces', 'Joindre deux tables liées et expliquer ce que produit la jointure')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- CS M6 · Networks and the web
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M6'), 'CS-6.1', 1, 'How the internet moves data', 'Comment internet achemine les données'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M6'), 'CS-6.2', 2, 'Clients, servers and HTTP', 'Clients, serveurs et HTTP'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M6'), 'CS-6.3', 3, 'Addresses, DNS and ports', 'Adresses, DNS et ports')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'CS-6.1'), 'CS-6.1.1', 1, 'Describe the path a request takes from a device to a server and back', 'Décrire le trajet d''une requête d''un appareil au serveur et retour'),
    ((SELECT id FROM lesson WHERE code = 'CS-6.2'), 'CS-6.2.1', 1, 'Explain what a request and a response contain', 'Expliquer ce que contiennent une requête et une réponse'),
    ((SELECT id FROM lesson WHERE code = 'CS-6.3'), 'CS-6.3.1', 1, 'Explain how a domain name becomes a machine address', 'Expliquer comment un nom de domaine devient une adresse machine')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- CS M7 · Working as a developer
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M7'), 'CS-7.1', 1, 'Version control basics', 'Bases de la gestion de versions'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M7'), 'CS-7.2', 2, 'Reading other people''s code', 'Lire le code des autres'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'CS' AND m.code = 'M7'), 'CS-7.3', 3, 'Building a small project end to end', 'Réaliser un petit projet de bout en bout')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'CS-7.1'), 'CS-7.1.1', 1, 'Commit a change and retrieve an earlier version of a file', 'Valider une modification et récupérer une version antérieure d''un fichier'),
    ((SELECT id FROM lesson WHERE code = 'CS-7.2'), 'CS-7.2.1', 1, 'Summarise what an unfamiliar short program does', 'Résumer ce que fait un court programme inconnu'),
    ((SELECT id FROM lesson WHERE code = 'CS-7.3'), 'CS-7.3.1', 1, 'Deliver a working program that meets a written specification', 'Livrer un programme fonctionnel conforme à un cahier des charges écrit')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;


-- ---------------------------------------------------------------
-- OPS — DevOps / DevOps
-- ---------------------------------------------------------------

INSERT INTO module (track_id, code, position, title_en, title_fr) VALUES
    ((SELECT id FROM track WHERE code = 'OPS'), 'M1', 1, 'What DevOps is', 'Qu''est-ce que le DevOps'),
    ((SELECT id FROM track WHERE code = 'OPS'), 'M2', 2, 'Linux and the command line', 'Linux et la ligne de commande'),
    ((SELECT id FROM track WHERE code = 'OPS'), 'M3', 3, 'Version control with Git', 'Gestion de versions avec Git'),
    ((SELECT id FROM track WHERE code = 'OPS'), 'M4', 4, 'Containers', 'Conteneurs'),
    ((SELECT id FROM track WHERE code = 'OPS'), 'M5', 5, 'Continuous integration and delivery', 'Intégration et livraison continues'),
    ((SELECT id FROM track WHERE code = 'OPS'), 'M6', 6, 'Infrastructure and monitoring', 'Infrastructure et supervision')
ON CONFLICT (track_id, code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;

-- OPS M1 · What DevOps is
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M1'), 'OPS-1.1', 1, 'Why DevOps exists', 'Pourquoi le DevOps existe'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M1'), 'OPS-1.2', 2, 'The delivery lifecycle end to end', 'Le cycle de livraison de bout en bout'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M1'), 'OPS-1.3', 3, 'Shared ownership and on-call', 'Responsabilité partagée et astreinte')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-1.1'), 'OPS-1.1.1', 1, 'Describe the split between development and operations and what it costs', 'Décrire la séparation entre développement et exploitation et ce qu''elle coûte'),
    ((SELECT id FROM lesson WHERE code = 'OPS-1.2'), 'OPS-1.2.1', 1, 'List the stages from code written to code running in production', 'Énumérer les étapes entre le code écrit et le code en production'),
    ((SELECT id FROM lesson WHERE code = 'OPS-1.3'), 'OPS-1.3.1', 1, 'Explain what a team owning its own service in production means in practice', 'Expliquer concrètement ce qu''implique une équipe responsable de son service en production')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- OPS M2 · Linux and the command line
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M2'), 'OPS-2.1', 1, 'The filesystem and navigation', 'Le système de fichiers et la navigation'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M2'), 'OPS-2.2', 2, 'Users, permissions and processes', 'Utilisateurs, permissions et processus'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M2'), 'OPS-2.3', 3, 'Shell scripting basics', 'Bases du scripting shell')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-2.1'), 'OPS-2.1.1', 1, 'Find, move and inspect files from the shell without a file browser', 'Trouver, déplacer et inspecter des fichiers depuis le shell, sans explorateur'),
    ((SELECT id FROM lesson WHERE code = 'OPS-2.2'), 'OPS-2.2.1', 1, 'Read a permissions string and fix a permission problem', 'Lire une chaîne de permissions et corriger un problème de droits'),
    ((SELECT id FROM lesson WHERE code = 'OPS-2.2'), 'OPS-2.2.2', 2, 'Find a running process and stop it safely', 'Trouver un processus en cours et l''arrêter proprement'),
    ((SELECT id FROM lesson WHERE code = 'OPS-2.3'), 'OPS-2.3.1', 1, 'Write a script that automates a repeated three-step task', 'Écrire un script qui automatise une tâche répétitive en trois étapes')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- OPS M3 · Version control with Git
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M3'), 'OPS-3.1', 1, 'Repositories, commits and history', 'Dépôts, commits et historique'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M3'), 'OPS-3.2', 2, 'Branching and merging', 'Branches et fusions'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M3'), 'OPS-3.3', 3, 'Pull requests and code review', 'Demandes de fusion et revue de code')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-3.1'), 'OPS-3.1.1', 1, 'Commit work and read the history of a repository', 'Valider son travail et lire l''historique d''un dépôt'),
    ((SELECT id FROM lesson WHERE code = 'OPS-3.2'), 'OPS-3.2.1', 1, 'Work on a branch and merge it back', 'Travailler sur une branche et la fusionner'),
    ((SELECT id FROM lesson WHERE code = 'OPS-3.2'), 'OPS-3.2.2', 2, 'Resolve a simple merge conflict', 'Résoudre un conflit de fusion simple'),
    ((SELECT id FROM lesson WHERE code = 'OPS-3.3'), 'OPS-3.3.1', 1, 'Open a pull request and respond to review comments', 'Ouvrir une demande de fusion et répondre aux commentaires de revue')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- OPS M4 · Containers
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M4'), 'OPS-4.1', 1, 'The problem containers solve', 'Le problème que résolvent les conteneurs'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M4'), 'OPS-4.2', 2, 'Images, containers and Dockerfiles', 'Images, conteneurs et Dockerfile'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M4'), 'OPS-4.3', 3, 'Registries and multiple services', 'Registres et services multiples')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-4.1'), 'OPS-4.1.1', 1, 'Explain why an application behaves differently on two machines', 'Expliquer pourquoi une application se comporte différemment sur deux machines'),
    ((SELECT id FROM lesson WHERE code = 'OPS-4.2'), 'OPS-4.2.1', 1, 'Write a Dockerfile and build an image from it', 'Écrire un Dockerfile et en construire une image'),
    ((SELECT id FROM lesson WHERE code = 'OPS-4.2'), 'OPS-4.2.2', 2, 'Run a container and reach the service inside it', 'Lancer un conteneur et atteindre le service qu''il héberge'),
    ((SELECT id FROM lesson WHERE code = 'OPS-4.3'), 'OPS-4.3.1', 1, 'Push an image to a registry and pull it on another machine', 'Publier une image dans un registre et la récupérer sur une autre machine')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- OPS M5 · Continuous integration and delivery
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M5'), 'OPS-5.1', 1, 'Automated builds and tests', 'Compilations et tests automatisés'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M5'), 'OPS-5.2', 2, 'Building a pipeline', 'Construire un pipeline'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M5'), 'OPS-5.3', 3, 'Deploying safely and rolling back', 'Déployer sans risque et revenir en arrière')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-5.1'), 'OPS-5.1.1', 1, 'Explain what a build should do before code is allowed to merge', 'Expliquer ce qu''une compilation doit vérifier avant d''autoriser une fusion'),
    ((SELECT id FROM lesson WHERE code = 'OPS-5.2'), 'OPS-5.2.1', 1, 'Create a pipeline that builds and tests on every commit', 'Créer un pipeline qui compile et teste à chaque commit'),
    ((SELECT id FROM lesson WHERE code = 'OPS-5.3'), 'OPS-5.3.1', 1, 'Deploy a change and roll it back after a failure', 'Déployer une modification puis l''annuler après un incident')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- OPS M6 · Infrastructure and monitoring
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M6'), 'OPS-6.1', 1, 'Cloud infrastructure basics', 'Bases de l''infrastructure cloud'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M6'), 'OPS-6.2', 2, 'Infrastructure as code', 'L''infrastructure décrite en code'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'OPS' AND m.code = 'M6'), 'OPS-6.3', 3, 'Logs, metrics and alerts', 'Journaux, métriques et alertes')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'OPS-6.1'), 'OPS-6.1.1', 1, 'Describe what compute, storage and networking mean in a cloud account', 'Décrire ce que recouvrent calcul, stockage et réseau dans un compte cloud'),
    ((SELECT id FROM lesson WHERE code = 'OPS-6.2'), 'OPS-6.2.1', 1, 'Explain why infrastructure is described in files rather than clicked together', 'Expliquer pourquoi l''infrastructure se décrit dans des fichiers plutôt qu''à la souris'),
    ((SELECT id FROM lesson WHERE code = 'OPS-6.3'), 'OPS-6.3.1', 1, 'Find the cause of a failure in a service''s logs', 'Trouver la cause d''une panne dans les journaux d''un service'),
    ((SELECT id FROM lesson WHERE code = 'OPS-6.3'), 'OPS-6.3.2', 2, 'Say what makes an alert worth waking someone for', 'Dire ce qui justifie qu''une alerte réveille quelqu''un')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;


-- ---------------------------------------------------------------
-- SEC — Cybersecurity / Cybersécurité
-- ---------------------------------------------------------------

INSERT INTO module (track_id, code, position, title_en, title_fr) VALUES
    ((SELECT id FROM track WHERE code = 'SEC'), 'M1', 1, 'Security fundamentals', 'Fondamentaux de la sécurité'),
    ((SELECT id FROM track WHERE code = 'SEC'), 'M2', 2, 'Networking for security', 'Réseaux pour la sécurité'),
    ((SELECT id FROM track WHERE code = 'SEC'), 'M3', 3, 'Identity and access', 'Identité et accès'),
    ((SELECT id FROM track WHERE code = 'SEC'), 'M4', 4, 'Common attacks and defences', 'Attaques courantes et défenses'),
    ((SELECT id FROM track WHERE code = 'SEC'), 'M5', 5, 'Cryptography basics', 'Bases de la cryptographie'),
    ((SELECT id FROM track WHERE code = 'SEC'), 'M6', 6, 'Security operations', 'Exploitation de la sécurité')
ON CONFLICT (track_id, code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;

-- SEC M1 · Security fundamentals
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M1'), 'SEC-1.1', 1, 'Confidentiality, integrity, availability', 'Confidentialité, intégrité, disponibilité'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M1'), 'SEC-1.2', 2, 'Threats, vulnerabilities and risk', 'Menaces, vulnérabilités et risque'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M1'), 'SEC-1.3', 3, 'Who attacks, and why', 'Qui attaque, et pourquoi')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-1.1'), 'SEC-1.1.1', 1, 'Classify a given incident against the three properties', 'Classer un incident donné selon les trois propriétés'),
    ((SELECT id FROM lesson WHERE code = 'SEC-1.2'), 'SEC-1.2.1', 1, 'Tell the three apart using a worked example', 'Distinguer les trois notions à partir d''un exemple traité'),
    ((SELECT id FROM lesson WHERE code = 'SEC-1.2'), 'SEC-1.2.2', 2, 'Rank three risks by likelihood and impact', 'Classer trois risques par probabilité et impact'),
    ((SELECT id FROM lesson WHERE code = 'SEC-1.3'), 'SEC-1.3.1', 1, 'Match an attacker type to a plausible motive and method', 'Associer un type d''attaquant à un motif et une méthode plausibles')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- SEC M2 · Networking for security
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M2'), 'SEC-2.1', 1, 'Addresses, ports and protocols', 'Adresses, ports et protocoles'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M2'), 'SEC-2.2', 2, 'Firewalls and segmentation', 'Pare-feux et cloisonnement'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M2'), 'SEC-2.3', 3, 'Looking at network traffic', 'Observer le trafic réseau')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-2.1'), 'SEC-2.1.1', 1, 'Explain what a port is and why open ports matter', 'Expliquer ce qu''est un port et pourquoi les ports ouverts comptent'),
    ((SELECT id FROM lesson WHERE code = 'SEC-2.2'), 'SEC-2.2.1', 1, 'Write a firewall rule that permits one service and blocks the rest', 'Écrire une règle de pare-feu autorisant un service et bloquant le reste'),
    ((SELECT id FROM lesson WHERE code = 'SEC-2.3'), 'SEC-2.3.1', 1, 'Spot unencrypted credentials in a captured session', 'Repérer des identifiants non chiffrés dans une session capturée')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- SEC M3 · Identity and access
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M3'), 'SEC-3.1', 1, 'Authentication and authorization', 'Authentification et autorisation'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M3'), 'SEC-3.2', 2, 'Passwords, MFA and recovery', 'Mots de passe, MFA et récupération'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M3'), 'SEC-3.3', 3, 'Least privilege in practice', 'Le moindre privilège en pratique')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-3.1'), 'SEC-3.1.1', 1, 'Explain the difference with an example of each failing', 'Expliquer la différence avec un exemple de défaillance pour chacune'),
    ((SELECT id FROM lesson WHERE code = 'SEC-3.2'), 'SEC-3.2.1', 1, 'Explain why a second factor defeats a stolen password', 'Expliquer pourquoi un second facteur neutralise un mot de passe volé'),
    ((SELECT id FROM lesson WHERE code = 'SEC-3.2'), 'SEC-3.2.2', 2, 'Identify the weak point in an account recovery flow', 'Identifier le point faible d''une procédure de récupération de compte'),
    ((SELECT id FROM lesson WHERE code = 'SEC-3.3'), 'SEC-3.3.1', 1, 'Cut an over-permissioned account down to what its job needs', 'Ramener un compte surprivilégié à ce que sa fonction exige')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- SEC M4 · Common attacks and defences
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M4'), 'SEC-4.1', 1, 'Phishing and social engineering', 'Hameçonnage et ingénierie sociale'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M4'), 'SEC-4.2', 2, 'Malware and how it spreads', 'Les logiciels malveillants et leur propagation'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M4'), 'SEC-4.3', 3, 'Web application attacks', 'Attaques sur les applications web'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M4'), 'SEC-4.4', 4, 'Defending a small network', 'Défendre un petit réseau')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-4.1'), 'SEC-4.1.1', 1, 'Identify the warning signs in a phishing message', 'Repérer les signaux d''alerte dans un message d''hameçonnage'),
    ((SELECT id FROM lesson WHERE code = 'SEC-4.2'), 'SEC-4.2.1', 1, 'Describe how ransomware reaches and spreads inside an organisation', 'Décrire comment un rançongiciel entre dans une organisation et s''y propage'),
    ((SELECT id FROM lesson WHERE code = 'SEC-4.3'), 'SEC-4.3.1', 1, 'Explain how injection works and what stops it', 'Expliquer le fonctionnement d''une injection et ce qui l''empêche'),
    ((SELECT id FROM lesson WHERE code = 'SEC-4.4'), 'SEC-4.4.1', 1, 'Propose three defences for a small office and justify the order', 'Proposer trois défenses pour un petit bureau et justifier leur ordre')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- SEC M5 · Cryptography basics
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M5'), 'SEC-5.1', 1, 'Hashing versus encryption', 'Hachage et chiffrement'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M5'), 'SEC-5.2', 2, 'Symmetric and public key encryption', 'Chiffrement symétrique et à clé publique'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M5'), 'SEC-5.3', 3, 'Certificates and HTTPS', 'Certificats et HTTPS')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-5.1'), 'SEC-5.1.1', 1, 'Say which to use for stored passwords and why', 'Dire lequel utiliser pour stocker des mots de passe, et pourquoi'),
    ((SELECT id FROM lesson WHERE code = 'SEC-5.2'), 'SEC-5.2.1', 1, 'Explain how two strangers agree on a secret over an open network', 'Expliquer comment deux inconnus conviennent d''un secret sur un réseau ouvert'),
    ((SELECT id FROM lesson WHERE code = 'SEC-5.3'), 'SEC-5.3.1', 1, 'Explain what a browser padlock does and does not guarantee', 'Expliquer ce que le cadenas du navigateur garantit et ne garantit pas')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- SEC M6 · Security operations
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M6'), 'SEC-6.1', 1, 'Hardening systems', 'Durcissement des systèmes'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M6'), 'SEC-6.2', 2, 'Logging and detection', 'Journalisation et détection'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M6'), 'SEC-6.3', 3, 'Responding to an incident', 'Répondre à un incident'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'SEC' AND m.code = 'M6'), 'SEC-6.4', 4, 'Policy, awareness and compliance', 'Politique, sensibilisation et conformité')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'SEC-6.1'), 'SEC-6.1.1', 1, 'Apply a basic hardening checklist to a fresh server', 'Appliquer une liste de durcissement de base à un serveur neuf'),
    ((SELECT id FROM lesson WHERE code = 'SEC-6.2'), 'SEC-6.2.1', 1, 'Find evidence of a failed login attack in a log file', 'Trouver la trace d''une attaque par tentatives de connexion dans un journal'),
    ((SELECT id FROM lesson WHERE code = 'SEC-6.3'), 'SEC-6.3.1', 1, 'Put the response steps in order and say why containment precedes cleanup', 'Ordonner les étapes de réponse et dire pourquoi le confinement précède le nettoyage'),
    ((SELECT id FROM lesson WHERE code = 'SEC-6.4'), 'SEC-6.4.1', 1, 'Explain what a security policy is for and who it binds', 'Expliquer à quoi sert une politique de sécurité et qui elle engage')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;


-- ---------------------------------------------------------------
-- AI — Artificial Intelligence / Intelligence artificielle
-- ---------------------------------------------------------------

INSERT INTO module (track_id, code, position, title_en, title_fr) VALUES
    ((SELECT id FROM track WHERE code = 'AI'), 'M1', 1, 'What AI is', 'Qu''est-ce que l''IA'),
    ((SELECT id FROM track WHERE code = 'AI'), 'M2', 2, 'Data foundations', 'Fondations des données'),
    ((SELECT id FROM track WHERE code = 'AI'), 'M3', 3, 'Machine learning basics', 'Bases de l''apprentissage automatique'),
    ((SELECT id FROM track WHERE code = 'AI'), 'M4', 4, 'Neural networks', 'Réseaux de neurones'),
    ((SELECT id FROM track WHERE code = 'AI'), 'M5', 5, 'Language models and generative AI', 'Modèles de langue et IA générative'),
    ((SELECT id FROM track WHERE code = 'AI'), 'M6', 6, 'Responsible and applied AI', 'IA responsable et appliquée')
ON CONFLICT (track_id, code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;

-- AI M1 · What AI is
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M1'), 'AI-1.1', 1, 'A short history of AI', 'Petite histoire de l''IA'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M1'), 'AI-1.2', 2, 'AI, machine learning and deep learning', 'IA, apprentissage automatique et apprentissage profond'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M1'), 'AI-1.3', 3, 'Where AI is used, and where it fails', 'Où l''IA sert, et où elle échoue')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-1.1'), 'AI-1.1.1', 1, 'Describe two earlier waves of AI and why each stalled', 'Décrire deux vagues antérieures de l''IA et pourquoi chacune s''est essoufflée'),
    ((SELECT id FROM lesson WHERE code = 'AI-1.2'), 'AI-1.2.1', 1, 'Place the three terms correctly inside one another', 'Emboîter correctement les trois notions les unes dans les autres'),
    ((SELECT id FROM lesson WHERE code = 'AI-1.3'), 'AI-1.3.1', 1, 'Judge whether a given task is a good fit for AI and justify it', 'Juger si une tâche donnée se prête à l''IA et justifier la réponse')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- AI M2 · Data foundations
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M2'), 'AI-2.1', 1, 'Datasets, features and labels', 'Jeux de données, variables et étiquettes'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M2'), 'AI-2.2', 2, 'Cleaning and preparing data', 'Nettoyer et préparer les données'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M2'), 'AI-2.3', 3, 'Bias in data and what follows from it', 'Les biais dans les données et leurs conséquences'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M2'), 'AI-2.4', 4, 'Splitting data for training and testing', 'Séparer les données d''entraînement et de test')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-2.1'), 'AI-2.1.1', 1, 'Identify the features and the label in a sample dataset', 'Identifier les variables et l''étiquette dans un jeu de données d''exemple'),
    ((SELECT id FROM lesson WHERE code = 'AI-2.2'), 'AI-2.2.1', 1, 'Handle missing and inconsistent values in a small dataset', 'Traiter les valeurs manquantes et incohérentes d''un petit jeu de données'),
    ((SELECT id FROM lesson WHERE code = 'AI-2.3'), 'AI-2.3.1', 1, 'Spot how a dataset under-represents a group and name the consequence', 'Repérer la sous-représentation d''un groupe dans un jeu de données et en nommer la conséquence'),
    ((SELECT id FROM lesson WHERE code = 'AI-2.4'), 'AI-2.4.1', 1, 'Explain why a model must not be judged on data it trained on', 'Expliquer pourquoi un modèle ne s''évalue pas sur ses données d''entraînement')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- AI M3 · Machine learning basics
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M3'), 'AI-3.1', 1, 'Supervised and unsupervised learning', 'Apprentissage supervisé et non supervisé'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M3'), 'AI-3.2', 2, 'Classification and regression', 'Classification et régression'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M3'), 'AI-3.3', 3, 'Training a first model', 'Entraîner un premier modèle'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M3'), 'AI-3.4', 4, 'Measuring whether a model is any good', 'Mesurer la qualité d''un modèle')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-3.1'), 'AI-3.1.1', 1, 'Sort several problems into the right category', 'Ranger plusieurs problèmes dans la bonne catégorie'),
    ((SELECT id FROM lesson WHERE code = 'AI-3.2'), 'AI-3.2.1', 1, 'Choose the right approach for a stated prediction problem', 'Choisir l''approche adaptée à un problème de prédiction donné'),
    ((SELECT id FROM lesson WHERE code = 'AI-3.3'), 'AI-3.3.1', 1, 'Train a model on a prepared dataset and get a prediction out of it', 'Entraîner un modèle sur un jeu de données préparé et en obtenir une prédiction'),
    ((SELECT id FROM lesson WHERE code = 'AI-3.4'), 'AI-3.4.1', 1, 'Read a confusion matrix and say where the model is failing', 'Lire une matrice de confusion et dire où le modèle échoue'),
    ((SELECT id FROM lesson WHERE code = 'AI-3.4'), 'AI-3.4.2', 2, 'Explain overfitting using a model''s own results', 'Expliquer le surapprentissage à partir des résultats d''un modèle')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- AI M4 · Neural networks
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M4'), 'AI-4.1', 1, 'From neurons to layers', 'Du neurone aux couches'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M4'), 'AI-4.2', 2, 'How a network learns', 'Comment un réseau apprend'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M4'), 'AI-4.3', 3, 'Networks for images and sequences', 'Réseaux pour images et séquences')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-4.1'), 'AI-4.1.1', 1, 'Describe what one layer does to its input', 'Décrire ce qu''une couche fait de son entrée'),
    ((SELECT id FROM lesson WHERE code = 'AI-4.2'), 'AI-4.2.1', 1, 'Explain the loop of prediction, error and adjustment', 'Expliquer la boucle prédiction, erreur, ajustement'),
    ((SELECT id FROM lesson WHERE code = 'AI-4.3'), 'AI-4.3.1', 1, 'Say why image and text data need different architectures', 'Dire pourquoi images et texte appellent des architectures différentes')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- AI M5 · Language models and generative AI
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M5'), 'AI-5.1', 1, 'How language models work', 'Le fonctionnement des modèles de langue'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M5'), 'AI-5.2', 2, 'Prompting effectively', 'Rédiger de bonnes instructions'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M5'), 'AI-5.3', 3, 'Embeddings and retrieval', 'Plongements et recherche documentaire'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M5'), 'AI-5.4', 4, 'Hallucination and verification', 'Hallucination et vérification')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-5.1'), 'AI-5.1.1', 1, 'Explain next-token prediction without jargon', 'Expliquer la prédiction du mot suivant sans jargon'),
    ((SELECT id FROM lesson WHERE code = 'AI-5.2'), 'AI-5.2.1', 1, 'Improve a weak prompt and explain what changed the output', 'Améliorer une instruction faible et expliquer ce qui a changé le résultat'),
    ((SELECT id FROM lesson WHERE code = 'AI-5.3'), 'AI-5.3.1', 1, 'Explain why a model needs retrieval to answer from private documents', 'Expliquer pourquoi un modèle a besoin de recherche pour répondre sur des documents privés'),
    ((SELECT id FROM lesson WHERE code = 'AI-5.4'), 'AI-5.4.1', 1, 'Catch a confident false answer and describe how to check it', 'Repérer une réponse fausse mais assurée et décrire comment la vérifier')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

-- AI M6 · Responsible and applied AI
INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M6'), 'AI-6.1', 1, 'Privacy, consent and data protection', 'Vie privée, consentement et protection des données'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M6'), 'AI-6.2', 2, 'Human oversight and accountability', 'Supervision humaine et responsabilité'),
    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id WHERE t.code = 'AI' AND m.code = 'M6'), 'AI-6.3', 3, 'Building a small AI project end to end', 'Réaliser un petit projet d''IA de bout en bout')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;
INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES
    ((SELECT id FROM lesson WHERE code = 'AI-6.1'), 'AI-6.1.1', 1, 'Identify what data may not be sent to a third-party model', 'Identifier les données qui ne peuvent pas être transmises à un modèle tiers'),
    ((SELECT id FROM lesson WHERE code = 'AI-6.2'), 'AI-6.2.1', 1, 'Decide where a human must stay in the loop for a given use', 'Décider où un humain doit rester dans la boucle pour un usage donné'),
    ((SELECT id FROM lesson WHERE code = 'AI-6.3'), 'AI-6.3.1', 1, 'Deliver a working project from dataset to result and present it', 'Livrer un projet fonctionnel du jeu de données au résultat, et le présenter')
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;

COMMIT;
