/*
 * CYBERSECURITY
 *
 * Entered after the foundation. Runs L2 to L4.
 *
 * Two deliberate constraints on this branch.
 *
 * Everything offensive is taught on systems the learner owns or has been
 * given written permission to test, and the lesson says so. A course that
 * teaches attack without that habit produces people who get arrested.
 *
 * The bias is toward defending small organisations with no budget and no
 * security team, because that is what these learners will actually be
 * asked to do. Enterprise tooling they will never have access to is
 * mentioned, not taught.
 */

module.exports = {
  code: 'SEC',
  kind: 'course',
  requires: 'F',
  name: { en: 'Cybersecurity', fr: 'Cybersécurité' },
  color: '#A83A2C',
  blurb: {
    en: 'Defending systems that do not have a security team.',
    fr: "Défendre des systèmes qui n'ont pas d'équipe sécurité.",
  },
  modules: [
    {
      code: 'M1',
      title: { en: 'How to think about security', fr: 'Raisonner sécurité' },
      lessons: [
        {
          code: 'SEC-1.1', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'What you are protecting, and from whom', fr: 'Ce que l\'on protège, et contre qui' },
          objectives: [
            { code: 'SEC-1.1.1', text: {
              en: 'For a described organisation, name what would hurt most if lost, changed, or made public',
              fr: "Pour une organisation décrite, nommer ce dont la perte, l'altération ou la divulgation ferait le plus de mal" } },
          ],
        },
        {
          code: 'SEC-1.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Threat, vulnerability, risk', fr: 'Menace, vulnérabilité, risque' },
          objectives: [
            { code: 'SEC-1.2.1', text: {
              en: 'Given an incident, separate the three and say which one the organisation could actually have changed',
              fr: "Face à un incident, distinguer les trois et dire lequel l'organisation pouvait réellement changer" } },
          ],
        },
        {
          code: 'SEC-1.3', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Spending effort where it pays', fr: "Investir l'effort là où il rapporte" },
          objectives: [
            { code: 'SEC-1.3.1', text: {
              en: 'Rank five possible defences for a small organisation by what they prevent per hour spent',
              fr: "Classer cinq défenses possibles pour une petite structure selon ce qu'elles évitent par heure investie" } },
          ],
        },
        {
          code: 'SEC-1.4', level: 'L2', tier: 'core', hours: 1,
          title: { en: 'The law, and permission', fr: 'La loi, et l\'autorisation' },
          note: {
            en: 'Taught before anything offensive, not after. Everything in this branch that touches a system is done on systems the learner owns or has written permission to test.',
            fr: "Enseigné avant toute pratique offensive, pas après. Tout dans cette filière se fait sur des systèmes possédés ou testés avec autorisation écrite.",
          },
          objectives: [
            { code: 'SEC-1.4.1', text: {
              en: 'State what written permission to test must contain, and why testing without it is a crime regardless of intent',
              fr: "Énoncer ce que doit contenir une autorisation écrite de test, et pourquoi tester sans elle est un délit quelle que soit l'intention" } },
          ],
        },
      ],
    },
    {
      code: 'M2',
      title: { en: 'Networks, from a defender\'s side', fr: 'Les réseaux, côté défense' },
      lessons: [
        {
          code: 'SEC-2.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'What is listening on this machine', fr: 'Ce qui écoute sur cette machine' },
          objectives: [
            { code: 'SEC-2.1.1', text: {
              en: 'List every open port on a machine they own and account for each one',
              fr: "Lister chaque port ouvert sur une machine leur appartenant et justifier chacun" } },
          ],
        },
        {
          code: 'SEC-2.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Firewalls', fr: 'Pare-feux' },
          objectives: [
            { code: 'SEC-2.2.1', text: {
              en: 'Write rules that permit exactly one service and block everything else, then prove both halves',
              fr: 'Écrire des règles autorisant exactement un service et bloquant le reste, puis prouver les deux' } },
          ],
        },
        {
          code: 'SEC-2.3', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Watching traffic', fr: 'Observer le trafic' },
          objectives: [
            { code: 'SEC-2.3.1', text: {
              en: 'Capture their own traffic and find a credential sent without encryption',
              fr: 'Capturer leur propre trafic et y trouver un identifiant transmis sans chiffrement' } },
          ],
        },
        {
          code: 'SEC-2.4', level: 'L3', tier: 'extension', hours: 3,
          title: { en: 'Keeping things apart', fr: 'Cloisonner' },
          objectives: [
            { code: 'SEC-2.4.1', text: {
              en: 'Design a network where compromising the guest wifi does not reach the accounting machine',
              fr: "Concevoir un réseau où compromettre le wifi invité n'atteint pas la machine comptable" } },
          ],
        },
      ],
    },
    {
      code: 'M3',
      title: { en: 'Identity', fr: 'Identité' },
      lessons: [
        {
          code: 'SEC-3.1', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Proving who you are, and what you may do', fr: 'Prouver qui on est, et ce qu\'on peut faire' },
          objectives: [
            { code: 'SEC-3.1.1', text: {
              en: 'Give an example of each failing separately, and say which is worse and why',
              fr: 'Donner un exemple de chaque défaillance séparément, et dire laquelle est pire, et pourquoi' } },
          ],
        },
        {
          code: 'SEC-3.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Passwords, and why they keep failing', fr: 'Les mots de passe, et pourquoi ils échouent' },
          objectives: [
            { code: 'SEC-3.2.1', text: {
              en: 'Explain why a stolen password database is survivable if hashed properly and catastrophic if not',
              fr: "Expliquer pourquoi une base de mots de passe volée est surmontable si bien hachée, catastrophique sinon" } },
          ],
        },
        {
          code: 'SEC-3.3', level: 'L3', tier: 'core', hours: 2,
          title: { en: 'Second factors', fr: 'Second facteur' },
          objectives: [
            { code: 'SEC-3.3.1', text: {
              en: 'Explain what a second factor stops and what it does not, naming one attack it fails against',
              fr: "Expliquer ce qu'un second facteur arrête et ce qu'il n'arrête pas, en nommant une attaque qui le contourne" } },
          ],
        },
        {
          code: 'SEC-3.4', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Account recovery: the way in everyone forgets', fr: 'La récupération de compte : la porte qu\'on oublie' },
          objectives: [
            { code: 'SEC-3.4.1', text: {
              en: 'Find the weakest step in a described recovery flow and propose a fix that does not lock users out',
              fr: "Trouver l'étape la plus faible d'une procédure de récupération et proposer un correctif qui n'enferme pas les utilisateurs dehors" } },
          ],
        },
        {
          code: 'SEC-3.5', level: 'L3', tier: 'extension', hours: 3,
          title: { en: 'Least privilege, in practice', fr: 'Moindre privilège, en pratique' },
          objectives: [
            { code: 'SEC-3.5.1', text: {
              en: 'Cut an over-permissioned account down to its job and show the job still works',
              fr: 'Réduire un compte surprivilégié à sa fonction et montrer que la fonction marche toujours' } },
          ],
        },
      ],
    },
    {
      code: 'M4',
      title: { en: 'How attacks actually happen', fr: 'Comment les attaques arrivent vraiment' },
      lessons: [
        {
          code: 'SEC-4.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Phishing', fr: 'Hameçonnage' },
          note: {
            en: 'First because it is how most compromises start, and because defending against it is organisational rather than technical.',
            fr: "En premier parce que c'est ainsi que commencent la plupart des compromissions, et que la défense y est organisationnelle.",
          },
          objectives: [
            { code: 'SEC-4.1.1', text: {
              en: 'Identify the warning signs in a phishing message, and name one that would have fooled them',
              fr: "Repérer les signaux d'alerte d'un message d'hameçonnage, et en nommer un qui les aurait trompés" } },
          ],
        },
        {
          code: 'SEC-4.2', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Ransomware', fr: 'Rançongiciels' },
          objectives: [
            { code: 'SEC-4.2.1', text: {
              en: 'Trace how ransomware reaches an organisation and spreads, and name the two controls that stop it',
              fr: "Retracer comment un rançongiciel entre et se propage, et nommer les deux contrôles qui l'arrêtent" } },
          ],
        },
        {
          code: 'SEC-4.3', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Injection', fr: 'Injection' },
          objectives: [
            { code: 'SEC-4.3.1', text: {
              en: 'Exploit an injection flaw in a deliberately vulnerable application they have been given, then fix it',
              fr: "Exploiter une faille d'injection dans une application volontairement vulnérable qu'on leur a fournie, puis la corriger" } },
          ],
        },
        {
          code: 'SEC-4.4', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Attacks that come through the browser', fr: 'Les attaques qui passent par le navigateur' },
          objectives: [
            { code: 'SEC-4.4.1', text: {
              en: 'Demonstrate a cross-site scripting flaw on a provided target and explain what the fix protects',
              fr: "Démontrer une faille de script inter-site sur une cible fournie et expliquer ce que le correctif protège" } },
          ],
        },
        {
          code: 'SEC-4.5', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'Supply chain', fr: "Chaîne d'approvisionnement" },
          objectives: [
            { code: 'SEC-4.5.1', text: {
              en: 'List everything a given application trusts that its authors did not write, and rank the risk',
              fr: "Lister tout ce qu'une application donnée fait confiance sans l'avoir écrit, et classer le risque" } },
          ],
        },
      ],
    },
    {
      code: 'M5',
      title: { en: 'Cryptography, enough to use it correctly', fr: 'Cryptographie, ce qu\'il faut pour bien s\'en servir' },
      note: {
        en: 'Enough to choose and use the right thing. Not enough to build one, deliberately — nobody in this programme should be writing cryptography.',
        fr: "De quoi choisir et utiliser correctement. Pas de quoi en concevoir, volontairement : personne ici ne devrait écrire de cryptographie.",
      },
      lessons: [
        {
          code: 'SEC-5.1', level: 'L2', tier: 'core', hours: 2,
          title: { en: 'Hashing is not encryption', fr: 'Hacher n\'est pas chiffrer' },
          objectives: [
            { code: 'SEC-5.1.1', text: {
              en: 'Say which to use for stored passwords and why the other is wrong',
              fr: "Dire lequel utiliser pour stocker des mots de passe et pourquoi l'autre est faux" } },
          ],
        },
        {
          code: 'SEC-5.2', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Agreeing a secret with a stranger', fr: 'Convenir d\'un secret avec un inconnu' },
          objectives: [
            { code: 'SEC-5.2.1', text: {
              en: 'Explain how two machines that have never met agree a key over a network anyone can read',
              fr: "Expliquer comment deux machines qui ne se connaissent pas conviennent d'une clé sur un réseau lisible par tous" } },
          ],
        },
        {
          code: 'SEC-5.3', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Certificates, and what the padlock means', fr: 'Certificats, et ce que signifie le cadenas' },
          objectives: [
            { code: 'SEC-5.3.1', text: {
              en: 'Say what a valid certificate proves and what it does not — specifically, that it says nothing about honesty',
              fr: "Dire ce qu'un certificat valide prouve et ne prouve pas — notamment qu'il ne dit rien sur l'honnêteté du site" } },
          ],
        },
        {
          code: 'SEC-5.4', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'Getting it wrong in ways that look right', fr: 'Se tromper d\'une manière qui paraît juste' },
          objectives: [
            { code: 'SEC-5.4.1', text: {
              en: 'Find the flaw in an encryption scheme that appears to work and passes its own tests',
              fr: "Trouver la faille d'un schéma de chiffrement qui semble marcher et passe ses propres tests" } },
          ],
        },
      ],
    },
    {
      code: 'M6',
      title: { en: 'Defending something real', fr: 'Défendre quelque chose de réel' },
      lessons: [
        {
          code: 'SEC-6.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Hardening a machine', fr: 'Durcir une machine' },
          objectives: [
            { code: 'SEC-6.1.1', text: {
              en: 'Take a default install and close everything not needed, without breaking what is',
              fr: 'Partir d\'une installation par défaut et fermer tout le superflu, sans casser le nécessaire' } },
          ],
        },
        {
          code: 'SEC-6.2', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Noticing', fr: 'Détecter' },
          objectives: [
            { code: 'SEC-6.2.1', text: {
              en: 'Find evidence of a brute-force attempt in a log, and set up something that would have told them sooner',
              fr: "Trouver la trace d'une attaque par force brute dans un journal, et mettre en place ce qui aurait alerté plus tôt" } },
          ],
        },
        {
          code: 'SEC-6.3', level: 'L3', tier: 'core', hours: 3,
          title: { en: 'Responding', fr: 'Réagir' },
          objectives: [
            { code: 'SEC-6.3.1', text: {
              en: 'Order the response steps for a live compromise and say why containment comes before cleanup',
              fr: "Ordonner les étapes de réponse à une compromission en cours et dire pourquoi le confinement précède le nettoyage" } },
          ],
        },
        {
          code: 'SEC-6.4', level: 'L3', tier: 'extension', hours: 2,
          title: { en: 'Telling people', fr: 'Informer' },
          note: {
            en: 'Usually left out of technical courses and usually the part that goes worst. Whom to tell and how fast is often a legal question, not a technical one.',
            fr: "Souvent absent des cours techniques et souvent la partie la plus mal gérée. Qui prévenir et à quelle vitesse est une question juridique.",
          },
          objectives: [
            { code: 'SEC-6.4.1', text: {
              en: 'Draft the notification for a breach, saying what is known, what is not, and what people should do',
              fr: "Rédiger la notification d'une violation : ce qui est connu, ce qui ne l'est pas, et ce que les gens doivent faire" } },
          ],
        },
        {
          code: 'SEC-6.5', level: 'L4', tier: 'advanced', hours: 3,
          title: { en: 'Policy that people follow', fr: 'Une politique que les gens suivent' },
          objectives: [
            { code: 'SEC-6.5.1', text: {
              en: 'Rewrite a security policy people ignore into one they will follow, and explain each change',
              fr: "Réécrire une politique ignorée en une politique appliquée, et justifier chaque changement" } },
          ],
        },
      ],
    },
    {
      code: 'M7',
      title: { en: 'The assessment', fr: "L'évaluation" },
      lessons: [
        {
          code: 'SEC-7.1', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'Scoping a review', fr: 'Cadrer un audit' },
          objectives: [
            { code: 'SEC-7.1.1', text: {
              en: 'Write a scope stating what will be tested, what will not, and what happens if something breaks',
              fr: "Rédiger un périmètre indiquant ce qui sera testé, ce qui ne le sera pas, et la conduite à tenir en cas de casse" } },
          ],
        },
        {
          code: 'SEC-7.2', level: 'L2', tier: 'core', hours: 12,
          title: { en: 'Reviewing a system end to end', fr: 'Auditer un système de bout en bout' },
          objectives: [
            { code: 'SEC-7.2.1', text: {
              en: 'Assess a system provided for the purpose and produce findings ranked by what they would actually cost',
              fr: "Évaluer un système fourni à cet effet et produire des constats classés par coût réel" } },
          ],
        },
        {
          code: 'SEC-7.3', level: 'L2', tier: 'core', hours: 3,
          title: { en: 'A report someone will act on', fr: 'Un rapport sur lequel on agira' },
          objectives: [
            { code: 'SEC-7.3.1', text: {
              en: 'Present findings to someone non-technical who leaves knowing what to fix first',
              fr: 'Présenter des constats à un non-technicien qui repart en sachant quoi corriger en premier' } },
          ],
        },
      ],
    },
  ],
};
