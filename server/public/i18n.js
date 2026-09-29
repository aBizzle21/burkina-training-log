/*
 * Interface language.
 *
 * French is the default because that is how the programme is delivered.
 * English exists for supervisors and for the Houston and Hyderabad teams
 * looking at the same screens.
 *
 * The choice is made once, remembered on the device, and applies
 * immediately — the curriculum arrives in both languages, so switching
 * needs no connection. Someone who discovers they are in the wrong
 * language is often exactly the person with no signal.
 *
 * Only interface text lives here. Lesson titles, objectives, method names
 * and cohort sites come from the database in both languages and are
 * picked with `pick()`.
 */

export const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
];

const STRINGS = {
  fr: {
    app_title: 'Journal de formation',

    // sign in
    login_intro: 'Entrez le code personnel que votre responsable de site vous a remis.',
    login_placeholder: 'CODE',
    login_aria: 'Code personnel',
    login_button: 'Continuer',
    login_bad_code: "Ce code n'a pas été reconnu.",
    login_offline: 'Connexion indisponible. Réessayez lorsque le réseau revient.',
    login_first_run:
      "Première utilisation : une connexion est nécessaire une seule fois pour " +
      'télécharger le programme. Réessayez près d\'un réseau.',

    // status bar
    bar_all_saved: 'Toutes les séances sont enregistrées',
    bar_offline_empty: 'Hors ligne · vos saisies seront envoyées au retour du réseau',
    bar_offline_pending: (n) =>
      `Hors ligne · ${n} séance${n > 1 ? 's' : ''} en attente`,
    bar_sending: (n) => `${n} séance${n > 1 ? 's' : ''} en cours d'envoi`,
    bar_signed_out: "Reconnexion nécessaire · rien n'est perdu",

    // the resume stamp
    stamp: 'REPRISE',
    resume_fresh: 'Aucune séance enregistrée. Cette filière démarre à :',
    resume_stopped: (c) => `La cohorte ${c} s'est arrêtée à :`,
    resume_first_entry: 'La première saisie fixera le point de départ.',
    resume_last: (d) => `Dernière séance le ${d}`,

    // the form
    heading: 'Séance du jour',
    cohort: 'Cohorte',
    date: 'Date',
    present: 'Apprenants présents',
    present_hint: (n) => `sur ${n} inscrits`,
    lessons_label: 'Leçons réellement traitées',
    lessons_hint: 'Cochez ce qui a été fait, pas ce qui était prévu.',
    planned: 'prévue',
    resume_label: "Point d'arrêt — où reprendre",
    resume_hint: 'Ce champ permet à un remplaçant de reprendre exactement ici.',
    methods_label: 'Méthodes employées',
    dominant_label: 'Méthode dominante',
    objectives_label: 'Objectifs démontrés',
    objectives_hint: "Nombre d'apprenants ayant réussi le contrôle.",
    objectives_empty: 'Cochez une leçon pour faire apparaître ses objectifs.',
    objectives_of: (n) => `sur ${n || '—'}`,
    objectives_aria: (code) => `Apprenants ayant démontré ${code}`,
    disruption_label: 'Ce qui a perturbé la séance',
    disruption_none: 'Rien à signaler',
    note_label: 'Difficulté ou point à signaler',
    note_placeholder: 'Facultatif.',
    save: 'Enregistrer la séance',
    timer: (m, s) => `Saisie en cours : ${m} min ${String(s).padStart(2, '0')} s`,

    // saving
    need_lesson: 'Cochez au moins une leçon traitée.',
    need_present: 'Indiquez le nombre de présents.',
    need_method: 'Sélectionnez au moins une méthode.',
    saved: (m, s) => `Séance enregistrée sur l'appareil en ${m} min ${s} s.`,

    // queue
    queue_heading: "En attente d'envoi",
    queue_waiting: 'en attente',
    queue_rejected: 'refusée',
    queue_dismiss: 'Retirer de la liste',

    // failure
    fatal_heading: "L'application n'a pas pu démarrer",
    fatal_generic: 'Une erreur est survenue au démarrage.',
    fatal_safe: 'Vos séances enregistrées ne sont pas perdues.',
    retry: 'Réessayer',
    sign_in_again: 'Se reconnecter',

    no_cohorts: 'Aucune cohorte disponible.',
    language_label: 'Langue',
  },

  en: {
    app_title: 'Training Log',

    login_intro: 'Enter the personal code your site lead gave you.',
    login_placeholder: 'CODE',
    login_aria: 'Personal code',
    login_button: 'Continue',
    login_bad_code: 'That code was not recognised.',
    login_offline: 'No connection. Try again when the network is back.',
    login_first_run:
      'First use: a connection is needed once to download the curriculum. ' +
      'Try again near a network.',

    bar_all_saved: 'All sessions saved',
    bar_offline_empty: 'Offline · entries will be sent when the network returns',
    bar_offline_pending: (n) => `Offline · ${n} session${n > 1 ? 's' : ''} waiting`,
    bar_sending: (n) => `Sending ${n} session${n > 1 ? 's' : ''}`,
    bar_signed_out: 'Sign in again · nothing is lost',

    stamp: 'RESUME',
    resume_fresh: 'No sessions recorded. This track starts at:',
    resume_stopped: (c) => `Cohort ${c} stopped at:`,
    resume_first_entry: 'The first entry will set the starting point.',
    resume_last: (d) => `Last session on ${d}`,

    heading: "Today's session",
    cohort: 'Cohort',
    date: 'Date',
    present: 'Learners present',
    present_hint: (n) => `of ${n} enrolled`,
    lessons_label: 'Lessons actually covered',
    lessons_hint: 'Tick what was done, not what was planned.',
    planned: 'planned',
    resume_label: 'Stopping point — where to resume',
    resume_hint: 'This is what lets a stand-in pick up exactly here.',
    methods_label: 'Methods used',
    dominant_label: 'Dominant method',
    objectives_label: 'Objectives demonstrated',
    objectives_hint: 'How many learners passed the check.',
    objectives_empty: 'Tick a lesson to bring up its objectives.',
    objectives_of: (n) => `of ${n || '—'}`,
    objectives_aria: (code) => `Learners who demonstrated ${code}`,
    disruption_label: 'Anything that disrupted the session',
    disruption_none: 'Nothing to report',
    note_label: 'Problem or note to flag',
    note_placeholder: 'Optional.',
    save: 'Save session',
    timer: (m, s) => `Time on this entry: ${m}m ${String(s).padStart(2, '0')}s`,

    need_lesson: 'Tick at least one lesson covered.',
    need_present: 'Enter how many learners were present.',
    need_method: 'Select at least one method.',
    saved: (m, s) => `Saved on this device in ${m}m ${s}s.`,

    queue_heading: 'Waiting to send',
    queue_waiting: 'waiting',
    queue_rejected: 'rejected',
    queue_dismiss: 'Remove from the list',

    fatal_heading: 'The app could not start',
    fatal_generic: 'Something went wrong while starting up.',
    fatal_safe: 'Your saved sessions are not lost.',
    retry: 'Try again',
    sign_in_again: 'Sign in again',

    no_cohorts: 'No cohorts available.',
    language_label: 'Language',
  },
};

let current = 'fr';

export function setLang(code) {
  current = STRINGS[code] ? code : 'fr';
  document.documentElement.lang = current;
  return current;
}

export const getLang = () => current;

/** Interface text. Values that vary by count or name are functions. */
export function t(key, ...args) {
  const entry = (STRINGS[current] || STRINGS.fr)[key];
  if (entry === undefined) return key;
  return typeof entry === 'function' ? entry(...args) : entry;
}

/**
 * Content from the database, which arrives as { en, fr }.
 * Falls back to the other language rather than showing nothing, because a
 * lesson title in the wrong language is still more use than a blank.
 */
export function pick(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return value[current] ?? value.fr ?? value.en ?? '';
}
