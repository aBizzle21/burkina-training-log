/*
 * ARTIFICIAL INTELLIGENCE
 *
 * Entered after the foundation. Runs L2 to L4.
 *
 * The bias is toward using models well and judging their output, rather
 * than training them from scratch. Training a large model needs hardware
 * these learners will not have; using one well is a skill they can sell
 * next month. The theory is here, but it serves the judgement rather than
 * the other way round.
 *
 * The verification material is core, not an ethics afterthought bolted on
 * at the end. Someone who cannot tell when a model is confidently wrong is
 * more dangerous with it than without it.
 */

module.exports = {
  code: 'AI',
  kind: 'course',
  requires: 'F',
  name: { en: 'Artificial Intelligence', fr: 'Intelligence artificielle' },
  color: '#4A5B78',
  blurb: {
    en: 'Using models well, and knowing when not to trust them.',
    fr: "Bien utiliser les modèles, et savoir quand s'en méfier.",
  },
  modules: [
    {
      code: 'M1',
      title: { en: 'What these systems are', fr: 'Ce que sont ces systèmes' },
      lessons: [
        {
          code: 'AI-1.1', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Learning from examples instead of rules', fr: "Apprendre d'exemples plutôt que de règles" },
          objectives: [
            { code: 'AI-1.1.1', text: {
              en: 'Given two problems, say which suits rules and which suits learning, and why',
              fr: 'Face à deux problèmes, dire lequel relève de règles et lequel de l\'apprentissage, et pourquoi' } },
          ],
        },
        {
          code: 'AI-1.2', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'AI, machine learning, deep learning', fr: 'IA, apprentissage automatique, apprentissage profond' },
          objectives: [
            { code: 'AI-1.2.1', text: {
              en: 'Place the three terms correctly inside one another and give an example of each',
              fr: "Emboîter correctement les trois termes et donner un exemple de chacun" } },
          ],
        },
        {
          code: 'AI-1.3', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Where it fails', fr: 'Où cela échoue' },
          note: {
            en: 'Third lesson, not last. Knowing the limits early stops a learner spending a term building something that could never have worked.',
            fr: "En troisième, pas en dernier. Connaître les limites tôt évite de passer un trimestre sur un projet condamné.",
          },
          objectives: [
            { code: 'AI-1.3.1', text: {
              en: 'Given a proposed use, judge whether it is a good fit and name the specific reason',
              fr: 'Face à un usage proposé, juger sa pertinence et nommer la raison précise' } },
          ],
        },
      ],
    },
    {
      code: 'M2',
      title: { en: 'Data', fr: 'Les données' },
      note: {
        en: 'The largest module, because this is where most of the work is and where most projects fail.',
        fr: "Le plus gros module, parce que c'est là qu'est le travail et là que la plupart des projets échouent.",
      },
      lessons: [
        {
          code: 'AI-2.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Features and labels', fr: 'Variables et étiquettes' },
          objectives: [
            { code: 'AI-2.1.1', text: {
              en: 'Identify the features and the label in a dataset they have not seen before',
              fr: "Identifier variables et étiquette dans un jeu de données qu'ils découvrent" } },
          ],
        },
        {
          code: 'AI-2.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Cleaning', fr: 'Nettoyer' },
          objectives: [
            { code: 'AI-2.2.1', text: {
              en: 'Handle missing and inconsistent values, and justify each choice rather than deleting rows by default',
              fr: 'Traiter valeurs manquantes et incohérentes, en justifiant chaque choix plutôt que de supprimer par défaut' } },
          ],
        },
        {
          code: 'AI-2.3', level: 'L2', tier: 'scaffold', hours: 3,
          title: { en: 'Practice: data that is genuinely messy', fr: 'Pratique : des données vraiment sales' },
          objectives: [
            { code: 'AI-2.3.1', text: {
              en: 'Take a real, unhelpful spreadsheet and get it into a usable shape',
              fr: 'Prendre un vrai tableur inexploitable et le mettre en forme utilisable' } },
          ],
        },
        {
          code: 'AI-2.4', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Bias, and who gets left out', fr: 'Biais, et qui se retrouve exclu' },
          note: {
            en: 'Concrete rather than abstract. A model trained on data from one region, one language or one gender fails on everyone else, and the learners here are usually the everyone else.',
            fr: "Concret plutôt qu'abstrait. Un modèle entraîné sur une seule région, langue ou population échoue sur les autres — et les apprenants ici sont souvent ces autres.",
          },
          objectives: [
            { code: 'AI-2.4.1', text: {
              en: 'Find who is under-represented in a dataset and predict how the model will fail them specifically',
              fr: 'Trouver qui est sous-représenté dans un jeu de données et prédire comment le modèle leur nuira précisément' } },
          ],
        },
        {
          code: 'AI-2.5', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Training and testing must be separate', fr: "Entraînement et test doivent rester séparés" },
          objectives: [
            { code: 'AI-2.5.1', text: {
              en: 'Show what happens to a score when test data leaks into training, and explain the number',
              fr: "Montrer ce qui arrive au score quand les données de test fuitent dans l'entraînement, et expliquer le chiffre" } },
          ],
        },
      ],
    },
    {
      code: 'M3',
      title: { en: 'Making predictions', fr: 'Faire des prédictions' },
      lessons: [
        {
          code: 'AI-3.1', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Supervised and unsupervised', fr: 'Supervisé et non supervisé' },
          objectives: [
            { code: 'AI-3.1.1', text: {
              en: 'Sort five described problems into the right category',
              fr: 'Ranger cinq problèmes décrits dans la bonne catégorie' } },
          ],
        },
        {
          code: 'AI-3.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'A first model, end to end', fr: 'Un premier modèle, de bout en bout' },
          objectives: [
            { code: 'AI-3.2.1', text: {
              en: 'Train a model on a prepared dataset and get a prediction out of it',
              fr: 'Entraîner un modèle sur un jeu préparé et en obtenir une prédiction' } },
          ],
        },
        {
          code: 'AI-3.3', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Why accuracy is usually the wrong number', fr: "Pourquoi l'exactitude est souvent le mauvais chiffre" },
          note: {
            en: 'A model that always says "no" is 99% accurate on a problem where yes happens 1% of the time, and is useless. This is the most common way a beginner fools themselves.',
            fr: "Un modèle qui dit toujours « non » est exact à 99 % quand « oui » arrive 1 % du temps — et il est inutile. C'est l'auto-illusion la plus courante.",
          },
          objectives: [
            { code: 'AI-3.3.1', text: {
              en: 'Build a useless model with a high accuracy score and explain exactly why the number lies',
              fr: 'Construire un modèle inutile au score élevé et expliquer précisément pourquoi le chiffre ment' } },
            { code: 'AI-3.3.2', text: {
              en: 'Read a confusion matrix and say which kind of mistake would matter more in a stated situation',
              fr: "Lire une matrice de confusion et dire quelle erreur compte le plus dans une situation donnée" } },
          ],
        },
        {
          code: 'AI-3.4', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Overfitting', fr: 'Surapprentissage' },
          objectives: [
            { code: 'AI-3.4.1', text: {
              en: 'Cause overfitting deliberately, show it in the numbers, and then reduce it',
              fr: 'Provoquer volontairement un surapprentissage, le montrer dans les chiffres, puis le réduire' } },
          ],
        },
        {
          code: 'AI-3.5', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'When the world changes underneath', fr: 'Quand le monde change sous le modèle' },
          objectives: [
            { code: 'AI-3.5.1', text: {
              en: 'Explain how a model that worked last year silently stops working, and what would detect it',
              fr: "Expliquer comment un modèle efficace l'an dernier cesse silencieusement de l'être, et ce qui le détecterait" } },
          ],
        },
      ],
    },
    {
      code: 'M4',
      title: { en: 'Neural networks', fr: 'Réseaux de neurones' },
      lessons: [
        {
          code: 'AI-4.1', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'What a layer does', fr: "Ce que fait une couche" },
          objectives: [
            { code: 'AI-4.1.1', text: {
              en: 'Describe what one layer does to its input, without using the word "neuron"',
              fr: 'Décrire ce qu\'une couche fait de son entrée, sans employer le mot « neurone »' } },
          ],
        },
        {
          code: 'AI-4.2', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'How it learns', fr: 'Comment il apprend' },
          objectives: [
            { code: 'AI-4.2.1', text: {
              en: 'Explain the loop of predict, measure the error, adjust — and what makes it stop',
              fr: "Expliquer la boucle prédire, mesurer l'erreur, ajuster — et ce qui l'arrête" } },
          ],
        },
        {
          code: 'AI-4.3', level: 'L3', tier: 'extension', hours: 3,
          title: { en: 'Different shapes for different data', fr: 'Des architectures selon les données' },
          objectives: [
            { code: 'AI-4.3.1', text: {
              en: 'Say why images and text need different architectures, referring to what each preserves',
              fr: 'Dire pourquoi images et texte appellent des architectures différentes, selon ce que chacune préserve' } },
          ],
        },
        {
          code: 'AI-4.4', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'Using someone else\'s trained model', fr: "Réutiliser un modèle déjà entraîné" },
          note: {
            en: 'The practical path. Training from scratch needs hardware these learners will not have; adapting an existing model needs a laptop.',
            fr: "La voie réaliste. Entraîner de zéro demande du matériel indisponible ici ; adapter un modèle existant demande un portable.",
          },
          objectives: [
            { code: 'AI-4.4.1', text: {
              en: 'Adapt a pre-trained model to a new task with a small dataset, and report honestly how well it did',
              fr: 'Adapter un modèle pré-entraîné à une nouvelle tâche avec peu de données, et rapporter honnêtement le résultat' } },
          ],
        },
      ],
    },
    {
      code: 'M5',
      title: { en: 'Language models', fr: 'Modèles de langue' },
      lessons: [
        {
          code: 'AI-5.1', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Predicting the next word, and why that is enough', fr: 'Prédire le mot suivant, et pourquoi cela suffit' },
          objectives: [
            { code: 'AI-5.1.1', text: {
              en: 'Explain next-token prediction without jargon, to someone who has not studied this',
              fr: "Expliquer la prédiction du mot suivant sans jargon, à quelqu'un qui n'a pas étudié le sujet" } },
          ],
        },
        {
          code: 'AI-5.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Asking well', fr: 'Bien demander' },
          objectives: [
            { code: 'AI-5.2.1', text: {
              en: 'Improve a weak prompt and say which specific change made the difference',
              fr: 'Améliorer une instruction faible et dire quel changement précis a fait la différence' } },
          ],
        },
        {
          code: 'AI-5.3', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Answering from your own documents', fr: 'Répondre à partir de ses propres documents' },
          objectives: [
            { code: 'AI-5.3.1', text: {
              en: 'Build something that answers questions from a document collection, and show it refusing when the answer is not there',
              fr: "Construire un outil qui répond à partir d'un corpus, et le montrer refuser quand la réponse n'y est pas" } },
          ],
        },
        {
          code: 'AI-5.4', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Confidently wrong', fr: 'Sûr de soi et faux' },
          note: {
            en: 'Core, not an ethics footnote. Someone who cannot catch a fluent false answer is more dangerous with these tools than without them.',
            fr: "Central, pas une note d'éthique. Qui ne sait pas repérer une réponse fausse mais fluide est plus dangereux avec ces outils que sans.",
          },
          objectives: [
            { code: 'AI-5.4.1', text: {
              en: 'Catch a fluent false answer in their own subject area and describe how they verified it',
              fr: "Repérer une réponse fausse mais fluide dans leur domaine et décrire comment ils l'ont vérifiée" } },
            { code: 'AI-5.4.2', text: {
              en: 'Name two kinds of question where these models should not be trusted at all',
              fr: 'Nommer deux types de questions où ces modèles ne doivent pas être crus du tout' } },
          ],
        },
        {
          code: 'AI-5.5', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'Judging whether it is actually working', fr: 'Juger si cela marche vraiment' },
          objectives: [
            { code: 'AI-5.5.1', text: {
              en: 'Design a test set for a language application and use it to compare two approaches',
              fr: "Concevoir un jeu de test pour une application de langue et comparer deux approches avec" } },
          ],
        },
      ],
    },
    {
      code: 'M6',
      title: { en: 'Putting it in front of people', fr: 'Le mettre entre les mains des gens' },
      lessons: [
        {
          code: 'AI-6.1', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'What may not leave the building', fr: 'Ce qui ne doit pas sortir' },
          objectives: [
            { code: 'AI-6.1.1', text: {
              en: 'Given a dataset, identify what must not be sent to a third-party model and explain the reasoning',
              fr: "Pour un jeu de données, identifier ce qui ne doit pas être envoyé à un modèle tiers, et pourquoi" } },
          ],
        },
        {
          code: 'AI-6.2', level: 'L3', tier: 'core', hours: 2,
          title: { en: 'Where a person has to stay in the loop', fr: 'Où un humain doit rester dans la boucle' },
          objectives: [
            { code: 'AI-6.2.1', text: {
              en: 'For three described uses, decide where human approval is required and justify each',
              fr: "Pour trois usages décrits, décider où l'approbation humaine est requise et justifier" } },
          ],
        },
        {
          code: 'AI-6.3', level: 'L3', tier: 'extension', hours: 2,
          title: { en: 'Telling people what it is', fr: 'Dire aux gens ce que c\'est' },
          objectives: [
            { code: 'AI-6.3.1', text: {
              en: 'Write what a user should be told about an AI feature so they can judge its output',
              fr: "Rédiger ce qu'un utilisateur doit savoir d'une fonction d'IA pour en juger le résultat" } },
          ],
        },
        {
          code: 'AI-6.4', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'What it costs to run', fr: 'Ce que cela coûte à faire tourner' },
          objectives: [
            { code: 'AI-6.4.1', text: {
              en: 'Estimate the cost of running a described application for a year, and find the cheaper approach',
              fr: "Estimer le coût annuel d'une application décrite, et trouver l'approche moins chère" } },
          ],
        },
      ],
    },
    {
      code: 'M7',
      title: { en: 'The project', fr: 'Le projet' },
      lessons: [
        {
          code: 'AI-7.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Choosing a problem worth solving', fr: 'Choisir un problème qui vaut la peine' },
          objectives: [
            { code: 'AI-7.1.1', text: {
              en: 'Propose a project, state how success will be measured, and say what result would mean abandoning it',
              fr: "Proposer un projet, dire comment le succès sera mesuré, et quel résultat justifierait de l'abandonner" } },
          ],
        },
        {
          code: 'AI-7.2', level: 'L2', tier: 'core', hours: 12,
          title: { en: 'Building it', fr: 'Le construire' },
          objectives: [
            { code: 'AI-7.2.1', text: {
              en: 'Deliver a working project from raw data to result, with its evaluation',
              fr: 'Livrer un projet fonctionnel des données brutes au résultat, avec son évaluation' } },
          ],
        },
        {
          code: 'AI-7.3', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Presenting it honestly', fr: 'Le présenter honnêtement' },
          note: {
            en: 'The honesty is assessed. A presentation that hides where the model fails is marked down, however good the model is.',
            fr: "L'honnêteté est évaluée. Une présentation qui cache les échecs du modèle est pénalisée, aussi bon soit le modèle.",
          },
          objectives: [
            { code: 'AI-7.3.1', text: {
              en: 'Present the project including where it fails and who it would fail for',
              fr: 'Présenter le projet en incluant ses échecs et pour qui il échouerait' } },
          ],
        },
      ],
    },
  ],
};
