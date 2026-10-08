/*
 * THE SHARED FOUNDATION
 *
 * Everyone passes through this before choosing a branch. It runs from
 * "has not used a computer" to "ready to specialise", and a learner
 * entering part-way up simply starts further along.
 *
 * Each lesson carries:
 *   level  L0-L4 — the level of learner this lesson is FOR. A learner
 *                  entering at level L takes every lesson tagged L or
 *                  above; anything below is what they already know.
 *   tier   scaffold | core | extension | advanced
 *   hours  a first guess, to be corrected against what sessions take
 *
 * Objectives are written to one bar: something an instructor can watch a
 * learner do, that a second instructor would mark the same way. Where a
 * concept has to be explained rather than performed, the objective says
 * what a correct explanation must contain.
 */

module.exports = {
  code: 'F',
  kind: 'foundation',
  name: { en: 'Foundation', fr: 'Tronc commun' },
  color: '#16233A',
  blurb: {
    en: 'Shared by every track. Ends where the four specialisms genuinely diverge.',
    fr: 'Commun à toutes les filières. Se termine là où les quatre spécialités divergent réellement.',
  },
  modules: [

    /* ============================================================
     * M1 — Using a computer at all.
     * L0 only. An L1 entrant skips this module entirely.
     * ============================================================ */
    {
      code: 'M1',
      title: { en: 'Using a computer', fr: "Se servir d'un ordinateur" },
      note: {
        en: 'For learners who have not used a computer before. Skipped from L1 up.',
        fr: "Pour les apprenants n'ayant jamais utilisé d'ordinateur. Ignoré à partir de N1.",
      },
      lessons: [
        {
          code: 'F-1.1', level: 'L0', tier: 'core', hours: 2,
          title: { en: 'Switching on, logging in, shutting down', fr: 'Allumer, se connecter, éteindre' },
          objectives: [
            { code: 'F-1.1.1', text: {
              en: 'Start the machine, log in, and shut it down properly without help',
              fr: "Démarrer la machine, se connecter et l'éteindre correctement, sans aide" } },
          ],
        },
        {
          code: 'F-1.2', level: 'L0', tier: 'core', hours: 3,
          title: { en: 'Keyboard and mouse', fr: 'Clavier et souris' },
          objectives: [
            { code: 'F-1.2.1', text: {
              en: 'Type a short paragraph including accented characters and punctuation',
              fr: 'Saisir un court paragraphe avec accents et ponctuation' } },
            { code: 'F-1.2.2', text: {
              en: 'Select, copy, cut and paste text between two windows',
              fr: 'Sélectionner, copier, couper et coller du texte entre deux fenêtres' } },
          ],
        },
        {
          code: 'F-1.3', level: 'L0', tier: 'scaffold', hours: 2,
          title: { en: 'Practice: typing with confidence', fr: 'Pratique : gagner en aisance au clavier' },
          objectives: [
            { code: 'F-1.3.1', text: {
              en: 'Type continuously for five minutes without looking at the keyboard',
              fr: 'Taper cinq minutes sans regarder le clavier' } },
          ],
        },
        {
          code: 'F-1.4', level: 'L0', tier: 'core', hours: 2,
          title: { en: 'Windows, menus and moving between programs', fr: 'Fenêtres, menus et navigation entre programmes' },
          objectives: [
            { code: 'F-1.4.1', text: {
              en: 'Open two programs, move between them, and resize both windows',
              fr: 'Ouvrir deux programmes, passer de l\'un à l\'autre et redimensionner les deux fenêtres' } },
          ],
        },
        {
          code: 'F-1.5', level: 'L0', tier: 'core', hours: 2,
          title: { en: 'Staying safe: passwords and what not to click', fr: 'Sécurité de base : mots de passe et pièges à éviter' },
          objectives: [
            { code: 'F-1.5.1', text: {
              en: 'Choose a password that meets a stated policy and explain why length beats complexity',
              fr: "Choisir un mot de passe conforme à une règle donnée et expliquer pourquoi la longueur prime sur la complexité" } },
            { code: 'F-1.5.2', text: {
              en: 'Identify three warning signs in a suspicious message shown to them',
              fr: 'Repérer trois signaux d\'alerte dans un message suspect qu\'on leur présente' } },
          ],
        },
      ],
    },

    /* ============================================================
     * M2 — Files. Where L1 entrants start.
     * ============================================================ */
    {
      code: 'M2',
      title: { en: 'Files and where things live', fr: 'Fichiers et emplacements' },
      lessons: [
        {
          code: 'F-2.1', level: 'L0', tier: 'core', hours: 2,
          title: { en: 'What a file is, and what a folder is', fr: "Qu'est-ce qu'un fichier, qu'est-ce qu'un dossier" },
          objectives: [
            { code: 'F-2.1.1', text: {
              en: 'Create a folder, save a file into it, close everything, and find that file again',
              fr: 'Créer un dossier, y enregistrer un fichier, tout fermer, puis retrouver ce fichier' } },
          ],
        },
        {
          code: 'F-2.2', level: 'L1', tier: 'core', hours: 2,
          title: { en: 'File types, extensions and what opens what', fr: 'Types de fichiers, extensions et applications associées' },
          objectives: [
            { code: 'F-2.2.1', text: {
              en: 'Predict which program opens a given file from its extension, and open it with a different one deliberately',
              fr: "Prédire quel programme ouvre un fichier d'après son extension, puis l'ouvrir volontairement avec un autre" } },
          ],
        },
        {
          code: 'F-2.3', level: 'L1', tier: 'core', hours: 3,
          title: { en: 'The command line, and why it exists', fr: "La ligne de commande, et sa raison d'être" },
          objectives: [
            { code: 'F-2.3.1', text: {
              en: 'Move around the filesystem, list a directory, and create, copy and delete a file from a terminal',
              fr: "Se déplacer dans l'arborescence, lister un répertoire, créer, copier et supprimer un fichier depuis un terminal" } },
            { code: 'F-2.3.2', text: {
              en: 'Name one task that is faster from the terminal than from a file browser, and do it',
              fr: 'Nommer une tâche plus rapide au terminal qu\'à la souris, et la réaliser' } },
          ],
        },
        {
          code: 'F-2.4', level: 'L1', tier: 'scaffold', hours: 2,
          title: { en: 'Practice: a filing system that survives', fr: "Pratique : un classement qui tient dans le temps" },
          objectives: [
            { code: 'F-2.4.1', text: {
              en: 'Organise twenty loose files into a structure they can explain to someone else',
              fr: 'Ranger vingt fichiers épars dans une structure qu\'ils peuvent expliquer à un tiers' } },
          ],
        },
        {
          code: 'F-2.5', level: 'L2', tier: 'extension', hours: 2,
          title: { en: 'Permissions: who can read, write and run', fr: 'Permissions : lire, écrire, exécuter' },
          objectives: [
            { code: 'F-2.5.1', text: {
              en: 'Read a permissions string and change a file so only its owner can modify it',
              fr: "Lire une chaîne de permissions et modifier un fichier pour que seul son propriétaire puisse l'éditer" } },
          ],
        },
      ],
    },

    /* ============================================================
     * M3 — How the machine represents things.
     * ============================================================ */
    {
      code: 'M3',
      title: { en: 'How a computer represents things', fr: "Comment l'ordinateur représente les choses" },
      lessons: [
        {
          code: 'F-3.1', level: 'L1', tier: 'core', hours: 2,
          title: { en: 'Everything is numbers underneath', fr: 'Tout est nombre en dessous' },
          objectives: [
            { code: 'F-3.1.1', text: {
              en: 'Convert a number under 256 between binary and decimal, both directions',
              fr: 'Convertir un nombre inférieur à 256 entre binaire et décimal, dans les deux sens' } },
            { code: 'F-3.1.2', text: {
              en: 'Explain how text becomes numbers, naming the role of a character encoding',
              fr: "Expliquer comment le texte devient des nombres, en nommant le rôle d'un encodage de caractères" } },
          ],
        },
        {
          code: 'F-3.2', level: 'L1', tier: 'extension', hours: 2,
          title: { en: 'Why accented characters break', fr: 'Pourquoi les caractères accentués posent problème' },
          note: {
            en: 'Deliberately included. Every learner here will hit mangled French text.',
            fr: 'Volontairement inclus. Chaque apprenant rencontrera du texte français mal encodé.',
          },
          objectives: [
            { code: 'F-3.2.1', text: {
              en: 'Take a file whose accents display as nonsense and correct its encoding',
              fr: "Corriger l'encodage d'un fichier dont les accents s'affichent en charabia" } },
          ],
        },
        {
          code: 'F-3.3', level: 'L1', tier: 'core', hours: 2,
          title: { en: 'What the parts of a computer do', fr: 'Le rôle des composants' },
          objectives: [
            { code: 'F-3.3.1', text: {
              en: 'Say what processor, memory and storage each do, and what is lost when power is cut',
              fr: "Dire ce que font processeur, mémoire et stockage, et ce qui est perdu en cas de coupure" } },
          ],
        },
        {
          code: 'F-3.4', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'What an operating system is for', fr: "À quoi sert un système d'exploitation" },
          objectives: [
            { code: 'F-3.4.1', text: {
              en: 'Explain what sits between a program and the hardware, and name two things it stops programs doing',
              fr: "Expliquer ce qui se place entre un programme et le matériel, et nommer deux choses qu'il empêche" } },
          ],
        },
      ],
    },

    /* ============================================================
     * M4 — Thinking in steps. The module that decides whether
     * someone can learn to program.
     * ============================================================ */
    {
      code: 'M4',
      title: { en: 'Thinking in steps', fr: 'Raisonner par étapes' },
      lessons: [
        {
          code: 'F-4.1', level: 'L1', tier: 'core', hours: 2,
          title: { en: 'Breaking a task into unambiguous steps', fr: 'Décomposer une tâche en étapes non ambiguës' },
          objectives: [
            { code: 'F-4.1.1', text: {
              en: 'Write instructions for an everyday task that a stranger can follow with no guessing',
              fr: 'Rédiger les instructions d\'une tâche courante qu\'un inconnu peut suivre sans deviner' } },
          ],
        },
        {
          code: 'F-4.2', level: 'L1', tier: 'scaffold', hours: 2,
          title: { en: 'Practice: instructions that go wrong', fr: 'Pratique : quand les instructions dérapent' },
          objectives: [
            { code: 'F-4.2.1', text: {
              en: 'Follow a classmate\'s instructions literally and identify every ambiguity that caused a wrong result',
              fr: "Suivre littéralement les instructions d'un camarade et relever chaque ambiguïté ayant produit une erreur" } },
          ],
        },
        {
          code: 'F-4.3', level: 'L1', tier: 'core', hours: 3,
          title: { en: 'Decisions and repetition', fr: 'Décisions et répétitions' },
          objectives: [
            { code: 'F-4.3.1', text: {
              en: 'Write pseudocode for a problem that needs both a decision and a repetition',
              fr: 'Écrire le pseudocode d\'un problème nécessitant une décision et une répétition' } },
          ],
        },
        {
          code: 'F-4.4', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Tracing: predicting what code will do', fr: 'Dérouler : prédire le comportement du code' },
          objectives: [
            { code: 'F-4.4.1', text: {
              en: 'Trace a short algorithm by hand and state its output before running it — correctly',
              fr: 'Dérouler un algorithme court à la main et annoncer sa sortie avant exécution — correctement' } },
          ],
        },
        {
          code: 'F-4.5', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Finding the faulty step', fr: "Trouver l'étape fautive" },
          objectives: [
            { code: 'F-4.5.1', text: {
              en: 'Given an algorithm that produces the wrong answer, locate the faulty step and correct it',
              fr: "Face à un algorithme qui donne un mauvais résultat, localiser l'étape fautive et la corriger" } },
          ],
        },
      ],
    },

    /* ============================================================
     * M5 — Programming. The largest module, and the one where a
     * fast-track beginner will struggle most.
     * ============================================================ */
    {
      code: 'M5',
      title: { en: 'Writing programs', fr: 'Écrire des programmes' },
      lessons: [
        {
          code: 'F-5.1', level: 'L1', tier: 'core', hours: 3,
          title: { en: 'Your first program: input, store, output', fr: 'Premier programme : lire, stocker, afficher' },
          objectives: [
            { code: 'F-5.1.1', text: {
              en: 'Write and run a program that reads something typed in, stores it, and prints a result derived from it',
              fr: 'Écrire et exécuter un programme qui lit une saisie, la stocke et affiche un résultat qui en dérive' } },
          ],
        },
        {
          code: 'F-5.2', level: 'L1', tier: 'core', hours: 3,
          title: { en: 'Types, and what happens when they are wrong', fr: 'Types, et ce qui arrive quand ils sont faux' },
          objectives: [
            { code: 'F-5.2.1', text: {
              en: 'Predict and then demonstrate what happens when a number is treated as text and vice versa',
              fr: "Prédire puis démontrer ce qui se passe quand un nombre est traité comme du texte, et l'inverse" } },
          ],
        },
        {
          code: 'F-5.3', level: 'L1', tier: 'scaffold', hours: 3,
          title: { en: 'Practice: small programs, many of them', fr: 'Pratique : beaucoup de petits programmes' },
          objectives: [
            { code: 'F-5.3.1', text: {
              en: 'Complete six short exercises with no more than one prompt each from the instructor',
              fr: "Réaliser six exercices courts avec au plus une aide de l'instructeur chacun" } },
          ],
        },
        {
          code: 'F-5.4', level: 'L1', tier: 'core', hours: 3,
          title: { en: 'Conditions in real code', fr: 'Les conditions en vrai code' },
          objectives: [
            { code: 'F-5.4.1', text: {
              en: 'Write a working program that behaves differently for at least three distinct inputs',
              fr: 'Écrire un programme fonctionnel qui se comporte différemment selon au moins trois entrées distinctes' } },
          ],
        },
        {
          code: 'F-5.5', level: 'L1', tier: 'core', hours: 3,
          title: { en: 'Loops', fr: 'Les boucles' },
          objectives: [
            { code: 'F-5.5.1', text: {
              en: 'Write a loop that processes a list, and a loop that stops when a condition is met',
              fr: "Écrire une boucle qui parcourt une liste, et une boucle qui s'arrête à une condition" } },
            { code: 'F-5.5.2', text: {
              en: 'Cause a loop that never ends, explain why, and fix it',
              fr: 'Provoquer une boucle infinie, expliquer pourquoi, puis la corriger' } },
          ],
        },
        {
          code: 'F-5.6', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Functions: naming a piece of work', fr: 'Fonctions : nommer un traitement' },
          objectives: [
            { code: 'F-5.6.1', text: {
              en: 'Take a program with repeated code and rewrite it as a function with parameters and a return value',
              fr: 'Transformer du code répété en une fonction avec paramètres et valeur de retour' } },
          ],
        },
        {
          code: 'F-5.7', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Reading errors', fr: 'Lire les erreurs' },
          note: {
            en: 'The single highest-leverage lesson in the foundation. A learner who can read a stack trace can teach themselves; one who cannot stays dependent.',
            fr: "La leçon la plus rentable du tronc commun. Qui sait lire une trace d'erreur peut apprendre seul ; sinon il reste dépendant.",
          },
          objectives: [
            { code: 'F-5.7.1', text: {
              en: 'Given an unfamiliar error, name the file, the line and the cause without help',
              fr: "Face à une erreur inconnue, nommer le fichier, la ligne et la cause, sans aide" } },
            { code: 'F-5.7.2', text: {
              en: 'Find the answer to an error message using a search engine and say which result was reliable and why',
              fr: "Trouver la réponse à un message d'erreur via un moteur de recherche et dire quel résultat était fiable, et pourquoi" } },
          ],
        },
        {
          code: 'F-5.8', level: 'L2', tier: 'extension', hours: 3,
          title: { en: 'Debugging deliberately', fr: 'Déboguer avec méthode' },
          objectives: [
            { code: 'F-5.8.1', text: {
              en: 'Find a bug by narrowing down where it is, rather than by reading the whole program',
              fr: "Localiser un bogue en réduisant la zone de recherche, plutôt qu'en relisant tout le programme" } },
          ],
        },
        {
          code: 'F-5.9', level: 'L2', tier: 'core', hours: 4,
          title: { en: 'A program of your own', fr: 'Un programme à soi' },
          objectives: [
            { code: 'F-5.9.1', text: {
              en: 'Deliver a working program that meets a one-page written specification',
              fr: "Livrer un programme fonctionnel conforme à un cahier des charges d'une page" } },
          ],
        },
      ],
    },

    /* ============================================================
     * M6 — Data.
     * ============================================================ */
    {
      code: 'M6',
      title: { en: 'Holding data', fr: 'Structurer les données' },
      lessons: [
        {
          code: 'F-6.1', level: 'L1', tier: 'core', hours: 3,
          title: { en: 'Lists', fr: 'Les listes' },
          objectives: [
            { code: 'F-6.1.1', text: {
              en: 'Store a collection in a list and process every item in it',
              fr: 'Stocker une collection dans une liste et en traiter chaque élément' } },
          ],
        },
        {
          code: 'F-6.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Key and value', fr: 'Clé et valeur' },
          objectives: [
            { code: 'F-6.2.1', text: {
              en: 'Look a value up by key, and explain why that beats searching a list when the list is long',
              fr: 'Récupérer une valeur par sa clé et expliquer pourquoi cela bat un parcours de liste quand elle est longue' } },
          ],
        },
        {
          code: 'F-6.3', level: 'L2', tier: 'extension', hours: 2,
          title: { en: 'Choosing how to hold something', fr: 'Choisir une structure' },
          objectives: [
            { code: 'F-6.3.1', text: {
              en: 'Pick a suitable structure for a stated problem and defend the choice against one alternative',
              fr: 'Choisir une structure adaptée à un problème donné et défendre ce choix face à une alternative' } },
          ],
        },
        {
          code: 'F-6.4', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Data that outlives the program: tables and rows', fr: 'Des données qui survivent au programme : tables et lignes' },
          objectives: [
            { code: 'F-6.4.1', text: {
              en: 'Design a table for a described situation, with a primary key they can justify',
              fr: 'Concevoir une table pour une situation décrite, avec une clé primaire justifiable' } },
          ],
        },
        {
          code: 'F-6.5', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Asking a database a question', fr: 'Interroger une base de données' },
          objectives: [
            { code: 'F-6.5.1', text: {
              en: 'Write a query with a filter and a sort that answers a question posed in words',
              fr: 'Écrire une requête avec filtre et tri répondant à une question posée en français' } },
          ],
        },
        {
          code: 'F-6.6', level: 'L2', tier: 'extension', hours: 3,
          title: { en: 'Joining two tables', fr: 'Joindre deux tables' },
          objectives: [
            { code: 'F-6.6.1', text: {
              en: 'Join two related tables and say in words what each row of the result represents',
              fr: 'Joindre deux tables liées et dire en mots ce que représente chaque ligne du résultat' } },
          ],
        },
      ],
    },

    /* ============================================================
     * M7 — Networks. Needed by all four branches.
     * ============================================================ */
    {
      code: 'M7',
      title: { en: 'How machines talk to each other', fr: 'Comment les machines communiquent' },
      lessons: [
        {
          code: 'F-7.1', level: 'L1', tier: 'core', hours: 2,
          title: { en: 'What happens when you open a web page', fr: "Ce qui se passe quand on ouvre une page web" },
          objectives: [
            { code: 'F-7.1.1', text: {
              en: 'Describe the path a request takes from a device to a server and back, naming four stages',
              fr: "Décrire le trajet d'une requête d'un appareil au serveur et retour, en nommant quatre étapes" } },
          ],
        },
        {
          code: 'F-7.2', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Addresses, names and ports', fr: 'Adresses, noms et ports' },
          objectives: [
            { code: 'F-7.2.1', text: {
              en: 'Explain how a domain name becomes a machine address, and what a port adds',
              fr: "Expliquer comment un nom de domaine devient une adresse machine, et ce qu'ajoute un port" } },
          ],
        },
        {
          code: 'F-7.3', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Requests and responses in detail', fr: 'Requêtes et réponses en détail' },
          objectives: [
            { code: 'F-7.3.1', text: {
              en: 'Read a request and its response and say what was asked for and what came back',
              fr: 'Lire une requête et sa réponse et dire ce qui a été demandé et ce qui est revenu' } },
          ],
        },
        {
          code: 'F-7.4', level: 'L2', tier: 'extension', hours: 2,
          title: { en: 'When the network is the problem', fr: 'Quand le problème vient du réseau' },
          note: {
            en: 'Written for where this runs. Connectivity here is intermittent, and knowing whether a failure is yours or the network\'s is a daily skill, not an advanced one.',
            fr: "Écrit pour le contexte local. La connectivité y est intermittente : savoir si une panne vient de soi ou du réseau est une compétence quotidienne.",
          },
          objectives: [
            { code: 'F-7.4.1', text: {
              en: 'Given something that will not load, determine whether the fault is local, the network, or the far end',
              fr: 'Face à quelque chose qui ne charge pas, déterminer si la panne est locale, réseau, ou à distance' } },
          ],
        },
      ],
    },

    /* ============================================================
     * M8 — Working with other people. Where L3 entrants may start.
     * ============================================================ */
    {
      code: 'M8',
      title: { en: 'Working with other people', fr: 'Travailler avec les autres' },
      lessons: [
        {
          code: 'F-8.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Version control: never losing work again', fr: 'Gestion de versions : ne plus jamais perdre son travail' },
          objectives: [
            { code: 'F-8.1.1', text: {
              en: 'Commit work, then recover a file as it was three commits ago',
              fr: 'Valider son travail, puis récupérer un fichier tel qu\'il était trois commits plus tôt' } },
          ],
        },
        {
          code: 'F-8.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Branches, and merging them back', fr: 'Branches et fusions' },
          objectives: [
            { code: 'F-8.2.1', text: {
              en: 'Work on a branch, merge it back, and resolve a conflict deliberately created for them',
              fr: 'Travailler sur une branche, la fusionner, et résoudre un conflit créé exprès pour eux' } },
          ],
        },
        {
          code: 'F-8.3', level: 'L2', tier: 'extension', hours: 2,
          title: { en: 'Reading code you did not write', fr: "Lire du code qu'on n'a pas écrit" },
          objectives: [
            { code: 'F-8.3.1', text: {
              en: 'Summarise in three sentences what an unfamiliar program does, without running it',
              fr: 'Résumer en trois phrases ce que fait un programme inconnu, sans le lancer' } },
          ],
        },
        {
          code: 'F-8.4', level: 'L2', tier: 'extension', hours: 2,
          title: { en: 'Asking a question that gets answered', fr: 'Poser une question qui obtient une réponse' },
          note: {
            en: 'Sounds soft; is not. A learner who cannot describe a problem precisely stays blocked, and the habit transfers directly to the workplace.',
            fr: "Paraît accessoire ; ne l'est pas. Qui ne sait pas décrire un problème reste bloqué, et l'habitude se transpose au travail.",
          },
          objectives: [
            { code: 'F-8.4.1', text: {
              en: 'Write a problem report containing what was expected, what happened, and what has already been tried',
              fr: "Rédiger un rapport de problème indiquant l'attendu, l'observé et ce qui a déjà été tenté" } },
          ],
        },
      ],
    },

    /* ============================================================
     * M9 — Choosing a branch. Deliberately last.
     * ============================================================ */
    {
      code: 'M9',
      title: { en: 'Choosing a direction', fr: 'Choisir une direction' },
      note: {
        en: 'Last on purpose. Someone who has never used a terminal cannot meaningfully choose between DevOps and AI, so the choice is deferred until they can.',
        fr: "Volontairement en dernier. Qui n'a jamais utilisé de terminal ne peut pas choisir entre DevOps et IA en connaissance de cause.",
      },
      lessons: [
        {
          code: 'F-9.1', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'What each of the four does all day', fr: 'Le quotidien de chacune des quatre filières' },
          objectives: [
            { code: 'F-9.1.1', text: {
              en: 'Describe the daily work of each of the four tracks and name one thing they would find hard about each',
              fr: 'Décrire le travail quotidien des quatre filières et nommer une difficulté propre à chacune' } },
          ],
        },
        {
          code: 'F-9.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'A taste of each', fr: 'Un aperçu de chacune' },
          objectives: [
            { code: 'F-9.2.1', text: {
              en: 'Complete one short exercise from each of the four tracks',
              fr: 'Réaliser un court exercice issu de chacune des quatre filières' } },
          ],
        },
        {
          code: 'F-9.3', level: 'L2', tier: 'core', hours: 1,
          title: { en: 'Choosing, and what the choice commits you to', fr: 'Choisir, et ce que le choix engage' },
          objectives: [
            { code: 'F-9.3.1', text: {
              en: 'State a track choice with a reason that refers to the work rather than to the job title',
              fr: "Énoncer un choix de filière avec un motif portant sur le travail plutôt que sur l'intitulé du poste" } },
          ],
        },
      ],
    },
  ],
};
