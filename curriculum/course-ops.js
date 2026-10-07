/*
 * DEVOPS AND INFRASTRUCTURE
 *
 * Entered after the foundation. Runs L2 to L4.
 *
 * The bias throughout is toward running things in places where power and
 * connectivity are not guaranteed, because that is where these learners
 * will work. A curriculum that assumes a datacentre teaches half the job.
 */

module.exports = {
  code: 'OPS',
  kind: 'course',
  requires: 'F',
  name: { en: 'DevOps and Infrastructure', fr: 'DevOps et infrastructure' },
  color: '#2E5E4E',
  blurb: {
    en: 'Getting software running, keeping it running, and knowing when it is not.',
    fr: "Faire tourner les logiciels, les maintenir, et savoir quand ils ne tournent plus.",
  },
  modules: [
    {
      code: 'M1',
      title: { en: 'Living on the command line', fr: 'Vivre en ligne de commande' },
      lessons: [
        {
          code: 'OPS-1.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Finding things', fr: 'Trouver' },
          objectives: [
            { code: 'OPS-1.1.1', text: {
              en: 'Find every file changed in the last day, and every file containing a given word',
              fr: 'Trouver tous les fichiers modifiés depuis un jour, et tous ceux contenant un mot donné' } },
          ],
        },
        {
          code: 'OPS-1.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Joining commands together', fr: 'Enchaîner des commandes' },
          objectives: [
            { code: 'OPS-1.2.1', text: {
              en: 'Answer a question about a large log file using a single chain of commands',
              fr: "Répondre à une question sur un gros fichier de journal avec un seul enchaînement de commandes" } },
          ],
        },
        {
          code: 'OPS-1.3', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Users, permissions and processes', fr: 'Utilisateurs, permissions et processus' },
          objectives: [
            { code: 'OPS-1.3.1', text: {
              en: 'Diagnose and fix a permission problem stopping a program from running',
              fr: "Diagnostiquer et corriger un problème de droits empêchant un programme de tourner" } },
            { code: 'OPS-1.3.2', text: {
              en: 'Find a process using too much memory and stop it without taking down anything else',
              fr: "Repérer un processus consommant trop de mémoire et l'arrêter sans affecter le reste" } },
          ],
        },
        {
          code: 'OPS-1.4', level: 'L2', tier: 'scaffold', hours: 3,
          title: { en: 'Practice: a day without a mouse', fr: 'Pratique : une journée sans souris' },
          objectives: [
            { code: 'OPS-1.4.1', text: {
              en: 'Complete a set of everyday tasks using only the terminal',
              fr: 'Réaliser un ensemble de tâches courantes au terminal seul' } },
          ],
        },
        {
          code: 'OPS-1.5', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Scripting what you do twice', fr: 'Scripter ce qu\'on fait deux fois' },
          objectives: [
            { code: 'OPS-1.5.1', text: {
              en: 'Turn a repeated manual task into a script that stops safely when a step fails',
              fr: "Transformer une tâche manuelle répétée en script qui s'arrête proprement si une étape échoue" } },
          ],
        },
      ],
    },
    {
      code: 'M2',
      title: { en: 'Servers', fr: 'Les serveurs' },
      lessons: [
        {
          code: 'OPS-2.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Getting onto a machine that is not yours', fr: "Accéder à une machine distante" },
          objectives: [
            { code: 'OPS-2.1.1', text: {
              en: 'Connect to a remote machine with a key rather than a password, and explain why that is better',
              fr: 'Se connecter à une machine distante par clé plutôt que mot de passe, et expliquer pourquoi c\'est mieux' } },
          ],
        },
        {
          code: 'OPS-2.2', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Running something that stays running', fr: 'Faire tourner quelque chose en continu' },
          objectives: [
            { code: 'OPS-2.2.1', text: {
              en: 'Set a program to start on boot and restart if it crashes, then prove both by causing them',
              fr: 'Configurer un programme pour démarrer au boot et redémarrer après un plantage, puis prouver les deux' } },
          ],
        },
        {
          code: 'OPS-2.3', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Power cuts and what survives them', fr: 'Coupures de courant et ce qui y survit' },
          note: {
            en: 'Written for where this runs. A service that needs a clean shutdown is not deployable in a place with an unreliable grid.',
            fr: "Écrit pour le contexte local. Un service exigeant un arrêt propre n'est pas déployable là où le réseau électrique est instable.",
          },
          objectives: [
            { code: 'OPS-2.3.1', text: {
              en: 'Cut power to a running service mid-write and show that the data survived',
              fr: "Couper l'alimentation d'un service en pleine écriture et montrer que les données ont survécu" } },
          ],
        },
        {
          code: 'OPS-2.4', level: 'L3', tier: 'extension', hours: 3,
          title: { en: 'Backups, and restoring from them', fr: 'Sauvegardes, et restauration' },
          note: {
            en: 'The objective is restoring, not backing up. An untested backup is a rumour.',
            fr: "L'objectif porte sur la restauration, pas la sauvegarde. Une sauvegarde non testée est une rumeur.",
          },
          objectives: [
            { code: 'OPS-2.4.1', text: {
              en: 'Destroy a database and restore it from a backup they took themselves',
              fr: "Détruire une base de données et la restaurer depuis une sauvegarde qu'ils ont eux-mêmes prise" } },
          ],
        },
      ],
    },
    {
      code: 'M3',
      title: { en: 'Containers', fr: 'Les conteneurs' },
      lessons: [
        {
          code: 'OPS-3.1', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Why it works on your machine and not theirs', fr: 'Pourquoi ça marche chez vous et pas chez eux' },
          objectives: [
            { code: 'OPS-3.1.1', text: {
              en: 'Reproduce a works-on-my-machine failure and name the difference that caused it',
              fr: "Reproduire une panne « ça marche chez moi » et nommer la différence qui l'a causée" } },
          ],
        },
        {
          code: 'OPS-3.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Packaging an application', fr: 'Empaqueter une application' },
          objectives: [
            { code: 'OPS-3.2.1', text: {
              en: 'Write a Dockerfile for an application they did not write, and run it',
              fr: "Écrire un Dockerfile pour une application qu'ils n'ont pas écrite, et la lancer" } },
          ],
        },
        {
          code: 'OPS-3.3', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Several things that need each other', fr: 'Plusieurs services interdépendants' },
          objectives: [
            { code: 'OPS-3.3.1', text: {
              en: 'Run an application and its database together, and make the application wait for the database',
              fr: "Lancer une application et sa base ensemble, et faire attendre l'application que la base soit prête" } },
          ],
        },
        {
          code: 'OPS-3.4', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'Images that are not enormous', fr: 'Des images qui ne pèsent pas des tonnes' },
          note: {
            en: 'Matters more here than in a datacentre. A 2GB image over an intermittent link is a deploy that never finishes.',
            fr: "Compte plus ici qu'en datacentre. Une image de 2 Go sur un lien instable, c'est un déploiement qui n'aboutit jamais.",
          },
          objectives: [
            { code: 'OPS-3.4.1', text: {
              en: 'Cut an image to under a quarter of its size without changing what it does',
              fr: 'Réduire une image au quart de sa taille sans changer son comportement' } },
          ],
        },
      ],
    },
    {
      code: 'M4',
      title: { en: 'Shipping changes', fr: 'Livrer des changements' },
      lessons: [
        {
          code: 'OPS-4.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Automating the build', fr: 'Automatiser la construction' },
          objectives: [
            { code: 'OPS-4.1.1', text: {
              en: 'Set up a pipeline that builds and tests on every change, and show it blocking a broken one',
              fr: 'Mettre en place un pipeline qui construit et teste à chaque modification, et le montrer bloquant une régression' } },
          ],
        },
        {
          code: 'OPS-4.2', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Deploying', fr: 'Déployer' },
          objectives: [
            { code: 'OPS-4.2.1', text: {
              en: 'Deploy a change to a running service without taking it offline',
              fr: 'Déployer une modification sur un service en fonctionnement sans interruption' } },
          ],
        },
        {
          code: 'OPS-4.3', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Going back', fr: 'Revenir en arrière' },
          note: {
            en: 'The one that matters at 2am. Rolling back has to be faster and less frightening than fixing forward.',
            fr: "Ce qui compte à 2 h du matin. Un retour arrière doit être plus rapide et moins effrayant qu'un correctif en urgence.",
          },
          objectives: [
            { code: 'OPS-4.3.1', text: {
              en: 'Roll back a bad deploy in under five minutes, from noticing to resolved',
              fr: 'Annuler un mauvais déploiement en moins de cinq minutes, du constat à la résolution' } },
          ],
        },
        {
          code: 'OPS-4.4', level: 'L3', tier: 'extension', hours: 3,
          title: { en: 'Configuration and secrets', fr: 'Configuration et secrets' },
          objectives: [
            { code: 'OPS-4.4.1', text: {
              en: 'Move a hardcoded password out of a codebase and explain what to do about the one in its history',
              fr: "Sortir un mot de passe codé en dur, et dire quoi faire de celui qui reste dans l'historique" } },
          ],
        },
        {
          code: 'OPS-4.5', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'Infrastructure written down', fr: 'Une infrastructure décrite en fichiers' },
          objectives: [
            { code: 'OPS-4.5.1', text: {
              en: 'Destroy their own environment and rebuild it from files alone',
              fr: 'Détruire leur environnement et le reconstruire à partir des seuls fichiers' } },
          ],
        },
      ],
    },
    {
      code: 'M5',
      title: { en: 'Knowing what is happening', fr: 'Savoir ce qui se passe' },
      lessons: [
        {
          code: 'OPS-5.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Logs worth reading', fr: 'Des journaux qui servent' },
          objectives: [
            { code: 'OPS-5.1.1', text: {
              en: 'Find the cause of a failure in a log file they have never seen before',
              fr: "Trouver la cause d'une panne dans un journal qu'ils découvrent" } },
          ],
        },
        {
          code: 'OPS-5.2', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Measuring things', fr: 'Mesurer' },
          objectives: [
            { code: 'OPS-5.2.1', text: {
              en: 'Add a measurement to a service and show it changing under load',
              fr: 'Ajouter une mesure à un service et la montrer varier sous charge' } },
          ],
        },
        {
          code: 'OPS-5.3', level: 'L3', tier: 'core', hours: 2,
          title: { en: 'Alerts people do not ignore', fr: 'Des alertes qu\'on n\'ignore pas' },
          objectives: [
            { code: 'OPS-5.3.1', text: {
              en: 'Say what makes an alert worth waking someone for, and delete three that are not',
              fr: "Dire ce qui justifie de réveiller quelqu'un, et supprimer trois alertes qui ne le justifient pas" } },
          ],
        },
        {
          code: 'OPS-5.4', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'After it breaks', fr: 'Après la panne' },
          objectives: [
            { code: 'OPS-5.4.1', text: {
              en: 'Write up an incident naming what happened and what will change, without naming who to blame',
              fr: "Rédiger un compte rendu d'incident : ce qui s'est passé et ce qui va changer, sans désigner de coupable" } },
          ],
        },
      ],
    },
    {
      code: 'M6',
      title: { en: 'The project', fr: 'Le projet' },
      lessons: [
        {
          code: 'OPS-6.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Planning a deployment', fr: 'Planifier un déploiement' },
          objectives: [
            { code: 'OPS-6.1.1', text: {
              en: 'Write a plan covering what is deployed, how it is rolled back, and how you know it worked',
              fr: 'Écrire un plan couvrant ce qui est déployé, comment revenir en arrière, et comment savoir que ça a marché' } },
          ],
        },
        {
          code: 'OPS-6.2', level: 'L2', tier: 'core', hours: 12,
          title: { en: 'Taking an application to production', fr: 'Mettre une application en production' },
          objectives: [
            { code: 'OPS-6.2.1', text: {
              en: 'Deploy an application they did not write, with monitoring, backups and a tested rollback',
              fr: "Déployer une application qu'ils n'ont pas écrite, avec supervision, sauvegardes et retour arrière testé" } },
          ],
        },
        {
          code: 'OPS-6.3', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Breaking someone else\'s', fr: "Casser celui d'un autre" },
          note: {
            en: 'Borrowed from Branch Test Day, where the prize for finding the most bugs produced more useful results than the scripted testing did.',
            fr: "Emprunté au Branch Test Day, où la prime au plus grand nombre de bogues a produit plus de résultats que les tests scriptés.",
          },
          objectives: [
            { code: 'OPS-6.3.1', text: {
              en: 'Take down a classmate\'s deployment, then help them make it survive the same attack',
              fr: "Faire tomber le déploiement d'un camarade, puis l'aider à y résister" } },
          ],
        },
      ],
    },
  ],
};
