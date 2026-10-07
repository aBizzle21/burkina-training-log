/*
 * SOFTWARE DEVELOPMENT
 *
 * Entered after the foundation. Runs L2 (just finished the trunk) to L4
 * (experienced, here for depth).
 *
 * Where a choice of tool is arbitrary this picks what Infodat actually
 * uses, so the skill transfers to real work: JavaScript and Node on the
 * server, Postgres for data, REST over HTTP. It does not bend the syllabus
 * toward that stack where doing so would narrow the learning.
 */

module.exports = {
  code: 'DEV',
  kind: 'course',
  requires: 'F',
  name: { en: 'Software Development', fr: 'Développement logiciel' },
  color: '#16233A',
  blurb: {
    en: 'Building and shipping software other people rely on.',
    fr: "Construire et livrer des logiciels dont d'autres dépendent.",
  },
  modules: [
    {
      code: 'M1',
      title: { en: 'Writing code that lasts', fr: 'Écrire du code qui dure' },
      lessons: [
        {
          code: 'DEV-1.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Naming things', fr: 'Nommer les choses' },
          objectives: [
            { code: 'DEV-1.1.1', text: {
              en: 'Rename every identifier in a deliberately badly named program so a stranger can follow it',
              fr: "Renommer chaque identifiant d'un programme mal nommé pour qu'un inconnu puisse le suivre" } },
          ],
        },
        {
          code: 'DEV-1.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Splitting a program into pieces', fr: 'Découper un programme' },
          objectives: [
            { code: 'DEV-1.2.1', text: {
              en: 'Break a single long file into modules and explain the boundary chosen for each',
              fr: 'Découper un long fichier en modules et justifier chaque frontière choisie' } },
          ],
        },
        {
          code: 'DEV-1.3', level: 'L2', tier: 'extension', hours: 3,
          title: { en: 'Comments that earn their place', fr: 'Des commentaires qui méritent leur place' },
          objectives: [
            { code: 'DEV-1.3.1', text: {
              en: 'Remove every comment that restates the code, and add one that explains a decision',
              fr: 'Supprimer tout commentaire qui paraphrase le code, et en ajouter un qui explique une décision' } },
          ],
        },
        {
          code: 'DEV-1.4', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Handling what goes wrong', fr: "Gérer ce qui tourne mal" },
          objectives: [
            { code: 'DEV-1.4.1', text: {
              en: 'Make a program fail usefully — naming what went wrong and what the user should do',
              fr: "Faire échouer un programme utilement : dire ce qui a échoué et ce que l'utilisateur doit faire" } },
            { code: 'DEV-1.4.2', text: {
              en: 'Identify three inputs that would break a given program, and defend against them',
              fr: 'Identifier trois entrées qui casseraient un programme donné, et se prémunir' } },
          ],
        },
      ],
    },
    {
      code: 'M2',
      title: { en: 'Testing', fr: 'Les tests' },
      lessons: [
        {
          code: 'DEV-2.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Your first automated test', fr: 'Premier test automatisé' },
          objectives: [
            { code: 'DEV-2.1.1', text: {
              en: 'Write a test that fails, fix the code, and watch it pass',
              fr: 'Écrire un test qui échoue, corriger le code, et le voir passer' } },
          ],
        },
        {
          code: 'DEV-2.2', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'What is worth testing', fr: "Ce qui vaut la peine d'être testé" },
          objectives: [
            { code: 'DEV-2.2.1', text: {
              en: 'Given a program, name the three tests that would catch the most likely failures, and justify the choice',
              fr: 'Pour un programme donné, nommer les trois tests attrapant les pannes les plus probables, et justifier' } },
          ],
        },
        {
          code: 'DEV-2.3', level: 'L3', tier: 'extension', hours: 3,
          title: { en: 'Tests that lie', fr: 'Les tests qui mentent' },
          note: {
            en: 'From this project: a test read the CSV as text, where the decoder strips the very byte-order mark it was checking for. It reported a working protection as missing. Tests fail in both directions.',
            fr: "Tiré de ce projet : un test lisait le CSV en texte, où le décodeur supprime justement la marque qu'il vérifiait. Il signalait comme absente une protection fonctionnelle.",
          },
          objectives: [
            { code: 'DEV-2.3.1', text: {
              en: 'Show that a given test passes even when the behaviour it claims to check is broken',
              fr: "Montrer qu'un test donné passe alors même que le comportement vérifié est cassé" } },
          ],
        },
        {
          code: 'DEV-2.4', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'Tests that only pass once', fr: 'Les tests qui ne passent qu\'une fois' },
          note: {
            en: 'Also from this project. Two suites shared a fixture and fixed dates, so they passed on a clean database and failed on every run after — which reads as a product bug and is not one.',
            fr: 'Également tiré de ce projet. Deux suites partageaient des données et des dates fixes : elles passaient sur base neuve puis échouaient ensuite.',
          },
          objectives: [
            { code: 'DEV-2.4.1', text: {
              en: 'Take a test suite that passes once and make it repeatable, without simply resetting the database',
              fr: 'Rendre répétable une suite qui ne passe qu\'une fois, sans se contenter de réinitialiser la base' } },
          ],
        },
      ],
    },
    {
      code: 'M3',
      title: { en: 'Building for other programs', fr: "Construire pour d'autres programmes" },
      lessons: [
        {
          code: 'DEV-3.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'What an API is', fr: "Qu'est-ce qu'une API" },
          objectives: [
            { code: 'DEV-3.1.1', text: {
              en: 'Call an existing API and use what comes back in a program of their own',
              fr: 'Appeler une API existante et exploiter la réponse dans leur propre programme' } },
          ],
        },
        {
          code: 'DEV-3.2', level: 'L3', tier: 'core', hours: 4,
          title: { en: 'Building one', fr: 'En construire une' },
          objectives: [
            { code: 'DEV-3.2.1', text: {
              en: 'Build an endpoint that accepts data, validates it, stores it, and returns a useful error when the data is wrong',
              fr: "Construire un point d'entrée qui accepte, valide et stocke des données, et renvoie une erreur utile si elles sont mauvaises" } },
          ],
        },
        {
          code: 'DEV-3.3', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Doing the same thing twice safely', fr: 'Faire deux fois la même chose sans dégât' },
          note: {
            en: 'Directly from the training log this course is logged in. A phone on a bad connection sends the same entry twice; a second stored session nobody can explain is worse than a lost one.',
            fr: "Directement tiré du journal de formation utilisé par ce cours. Un téléphone renvoie deux fois la même saisie ; une séance dupliquée inexplicable est pire qu'une perdue.",
          },
          objectives: [
            { code: 'DEV-3.3.1', text: {
              en: 'Make an endpoint safe to call twice with the same data, and demonstrate it',
              fr: "Rendre un point d'entrée sûr à appeler deux fois avec les mêmes données, et le démontrer" } },
          ],
        },
        {
          code: 'DEV-3.4', level: 'L3', tier: 'extension', hours: 3,
          title: { en: 'Who is allowed to do what', fr: 'Qui a le droit de faire quoi' },
          objectives: [
            { code: 'DEV-3.4.1', text: {
              en: 'Add sign-in to an API so one user cannot act on another user\'s behalf, and show the attempt failing',
              fr: "Ajouter une authentification pour qu'un utilisateur ne puisse agir au nom d'un autre, et montrer l'échec de la tentative" } },
          ],
        },
      ],
    },
    {
      code: 'M4',
      title: { en: 'Interfaces people use', fr: 'Des interfaces utilisables' },
      lessons: [
        {
          code: 'DEV-4.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Structure and style on a page', fr: 'Structure et style d\'une page' },
          objectives: [
            { code: 'DEV-4.1.1', text: {
              en: 'Build a page that is readable on a phone as well as a laptop',
              fr: 'Construire une page lisible sur téléphone comme sur ordinateur portable' } },
          ],
        },
        {
          code: 'DEV-4.2', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Making a page do something', fr: 'Rendre une page interactive' },
          objectives: [
            { code: 'DEV-4.2.1', text: {
              en: 'Take input from a form, send it to an API, and show the result without reloading',
              fr: "Récupérer une saisie, l'envoyer à une API et afficher le résultat sans recharger" } },
          ],
        },
        {
          code: 'DEV-4.3', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'When there is no connection', fr: 'Quand il n\'y a pas de connexion' },
          note: {
            en: 'Not an advanced topic here. It is the normal case, and an application that assumes a connection is an application that does not work in Banfora.',
            fr: "Pas un sujet avancé ici. C'est le cas normal : une application qui suppose une connexion ne fonctionne pas à Banfora.",
          },
          objectives: [
            { code: 'DEV-4.3.1', text: {
              en: 'Make a form that saves on the device first and sends later, and demonstrate it with the network switched off',
              fr: "Réaliser un formulaire qui enregistre d'abord sur l'appareil puis envoie plus tard, et le démontrer réseau coupé" } },
          ],
        },
        {
          code: 'DEV-4.4', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'Interfaces that do not exclude people', fr: 'Des interfaces qui n\'excluent personne' },
          objectives: [
            { code: 'DEV-4.4.1', text: {
              en: 'Operate their own interface using only a keyboard, and fix what cannot be reached',
              fr: 'Utiliser leur propre interface au clavier seul, et corriger ce qui est inaccessible' } },
          ],
        },
      ],
    },
    {
      code: 'M5',
      title: { en: 'Working on a real codebase', fr: 'Travailler sur un vrai dépôt' },
      lessons: [
        {
          code: 'DEV-5.1', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Arriving at code someone else wrote', fr: "Arriver sur du code écrit par d'autres" },
          objectives: [
            { code: 'DEV-5.1.1', text: {
              en: 'Make a small correct change to an unfamiliar codebase without breaking anything else',
              fr: 'Apporter une petite modification correcte à un dépôt inconnu sans rien casser' } },
          ],
        },
        {
          code: 'DEV-5.2', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Review, given and received', fr: 'La revue, donnée et reçue' },
          objectives: [
            { code: 'DEV-5.2.1', text: {
              en: 'Review a classmate\'s change with at least one comment about correctness rather than style',
              fr: "Relire la modification d'un camarade avec au moins un commentaire sur la justesse, pas le style" } },
            { code: 'DEV-5.2.2', text: {
              en: 'Respond to review of their own work, changing what should change and defending what should not',
              fr: 'Répondre à une revue de son propre travail, en modifiant ce qui doit l\'être et en défendant le reste' } },
          ],
        },
        {
          code: 'DEV-5.3', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'Changing something without breaking it', fr: 'Modifier sans casser' },
          objectives: [
            { code: 'DEV-5.3.1', text: {
              en: 'Restructure working code so its behaviour is provably unchanged, using tests as the proof',
              fr: 'Restructurer du code fonctionnel en prouvant par les tests que son comportement est inchangé' } },
          ],
        },
        {
          code: 'DEV-5.4', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'Deciding what not to build', fr: 'Décider de ne pas construire' },
          objectives: [
            { code: 'DEV-5.4.1', text: {
              en: 'Given a feature request, argue for a smaller version and say what is given up',
              fr: "Face à une demande de fonctionnalité, plaider pour une version réduite et dire ce qu'on abandonne" } },
          ],
        },
      ],
    },
    {
      code: 'M6',
      title: { en: 'The project', fr: 'Le projet' },
      note: {
        en: 'The portfolio piece. Assessed against the written specification, not against how impressive it looks.',
        fr: 'La pièce de portfolio. Évaluée sur le cahier des charges, non sur son apparence.',
      },
      lessons: [
        {
          code: 'DEV-6.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Writing the specification', fr: 'Rédiger le cahier des charges' },
          objectives: [
            { code: 'DEV-6.1.1', text: {
              en: 'Write a specification a second person could build from without asking questions',
              fr: 'Rédiger un cahier des charges qu\'un tiers pourrait suivre sans poser de questions' } },
          ],
        },
        {
          code: 'DEV-6.2', level: 'L2', tier: 'core', hours: 12,
          title: { en: 'Building it', fr: 'Le construire' },
          objectives: [
            { code: 'DEV-6.2.1', text: {
              en: 'Deliver software that meets their own specification, with tests and a README',
              fr: 'Livrer un logiciel conforme à leur cahier des charges, avec tests et README' } },
          ],
        },
        {
          code: 'DEV-6.3', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Showing it to people', fr: 'Le présenter' },
          objectives: [
            { code: 'DEV-6.3.1', text: {
              en: 'Demonstrate the project in ten minutes, including one thing that does not work and why',
              fr: 'Présenter le projet en dix minutes, en incluant une chose qui ne marche pas, et pourquoi' } },
          ],
        },
      ],
    },
  ],
};
