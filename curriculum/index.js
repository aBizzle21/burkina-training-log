/*
 * The curriculum, assembled.
 *
 *   node curriculum/index.js          print a summary
 *   node tools/build-curriculum.js    regenerate data/curriculum.json
 *
 * Content lives in foundation.js and the four course files. This file
 * holds the level and pace definitions, and the one function that decides
 * whether a lesson is in a given pathway.
 *
 * See docs/curriculum-design.md for why it is built this way.
 */

const foundation = require('./foundation');
const dev = require('./course-dev');
const ops = require('./course-ops');
const sec = require('./course-sec');
const ai = require('./course-ai');

/* ---------------- levels ---------------- */

const LEVELS = [
  { code: 'L0', rank: 0,
    name: { en: 'Beginner', fr: 'Débutant' },
    desc: {
      en: 'Little or no computer experience. May not have used a keyboard much.',
      fr: "Peu ou pas d'expérience de l'ordinateur. A peu utilisé un clavier." } },
  { code: 'L1', rank: 1,
    name: { en: 'Computer literate', fr: "À l'aise avec l'outil informatique" },
    desc: {
      en: 'Uses a phone and basic office software. No programming.',
      fr: 'Utilise un téléphone et des logiciels bureautiques. Pas de programmation.' } },
  { code: 'L2', rank: 2,
    name: { en: 'Some technical background', fr: 'Quelques bases techniques' },
    desc: {
      en: 'Has written a little code or administered a machine. Self-taught or part-way through study.',
      fr: 'A écrit un peu de code ou administré une machine. Autodidacte ou en cours d\'études.' } },
  { code: 'L3', rank: 3,
    name: { en: 'Intermediate', fr: 'Intermédiaire' },
    desc: {
      en: 'Works in the field or has studied it formally. Wants depth, not a restart.',
      fr: 'Travaille dans le domaine ou l\'a étudié. Cherche de la profondeur, pas un recommencement.' } },
  { code: 'L4', rank: 4,
    name: { en: 'Advanced', fr: 'Avancé' },
    desc: {
      en: 'Experienced. Here for the specialised material at the top of a course.',
      fr: 'Expérimenté. Vient pour le contenu spécialisé en haut de filière.' } },
];

const rankOf = (code) => (LEVELS.find((l) => l.code === code) || LEVELS[0]).rank;

/* ---------------- paces ---------------- */

const PACES = [
  { code: 'steady', tiers: ['scaffold', 'core', 'extension', 'advanced'],
    name: { en: 'Steady', fr: 'Progressif' },
    desc: {
      en: 'Everything. Scaffolding, extra practice, the slower explanations.',
      fr: 'Tout. Étayage, pratique supplémentaire, explications détaillées.' } },
  { code: 'standard', tiers: ['core', 'extension', 'advanced'],
    name: { en: 'Standard', fr: 'Standard' },
    desc: {
      en: 'Core plus the extensions most people need.',
      fr: "L'essentiel plus les approfondissements utiles à la plupart." } },
  { code: 'fast', tiers: ['core', 'advanced'],
    name: { en: 'Fast track', fr: 'Accéléré' },
    desc: {
      en: 'Core only. Assumes the learner fills gaps themselves.',
      fr: "L'essentiel seul. Suppose que l'apprenant comble les lacunes lui-même." } },
];

const TIERS = [
  { code: 'scaffold',  name: { en: 'Extra support', fr: 'Étayage' } },
  { code: 'core',      name: { en: 'Core',          fr: 'Essentiel' } },
  { code: 'extension', name: { en: 'Extension',     fr: 'Approfondissement' } },
  { code: 'advanced',  name: { en: 'Advanced',      fr: 'Avancé' } },
];

const TRACKS = [foundation, dev, ops, sec, ai];

/* ---------------- the one rule that matters ---------------- */

/**
 * Is this lesson in the pathway for a learner entering at `entryLevel`
 * going at `pace`?
 *
 * Two independent tests:
 *
 *   Level — a lesson tagged L is for a learner at level L. Someone
 *   entering at L2 already knows the L0 and L1 material, so those lessons
 *   drop out. Someone entering at L0 gets everything.
 *
 *   Tier — the pace decides how much optional material is included.
 *   `advanced` is the exception: it is in at every pace, but only reaches
 *   a learner who gets that far up the levels anyway.
 */
function inPathway(lesson, entryLevel, pace) {
  const paceDef = PACES.find((p) => p.code === pace) || PACES[1];
  if (rankOf(lesson.level) < rankOf(entryLevel)) return false;
  return paceDef.tiers.includes(lesson.tier);
}

/**
 * Resolve a whole pathway: the foundation, then one course.
 * Returns the lessons in teaching order with their module context.
 */
function pathway({ entryLevel = 'L0', pace = 'standard', course = 'DEV' } = {}) {
  const chosen = TRACKS.filter((t) => t.kind === 'foundation' || t.code === course);
  const lessons = [];

  for (const track of chosen) {
    for (const mod of track.modules) {
      for (const lesson of mod.lessons) {
        if (!inPathway(lesson, entryLevel, pace)) continue;
        lessons.push({
          ...lesson,
          track: track.code,
          track_name: track.name,
          module: mod.code,
          module_title: mod.title,
          module_note: mod.note || null,
        });
      }
    }
  }

  const hours = lessons.reduce((n, l) => n + (l.hours || 0), 0);
  const objectives = lessons.reduce((n, l) => n + l.objectives.length, 0);

  return {
    entryLevel, pace, course,
    lessons, hours, objectives,
    lesson_count: lessons.length,
    // At four hours of teaching a day, which is what a full-time cohort
    // realistically sustains once breaks and setup are counted.
    days_full_time: Math.ceil(hours / 4),
    // Two evenings a week, three hours each.
    weeks_part_time: Math.ceil(hours / 6),
  };
}

/**
 * Lessons a mixed-level cohort will need to differentiate at: those the
 * lower entrants take and the higher ones do not. The curriculum names
 * them rather than leaving the instructor to notice mid-session.
 */
function splitPoints({ lowLevel, highLevel, pace = 'standard', course = 'DEV' }) {
  const low = pathway({ entryLevel: lowLevel, pace, course }).lessons.map((l) => l.code);
  const high = new Set(pathway({ entryLevel: highLevel, pace, course }).lessons.map((l) => l.code));
  return low.filter((code) => !high.has(code));
}

module.exports = { LEVELS, PACES, TIERS, TRACKS, inPathway, pathway, splitPoints, rankOf };

/* ---------------- summary, when run directly ---------------- */

if (require.main === module) {
  const all = TRACKS.reduce((n, t) =>
    n + t.modules.reduce((k, m) => k + m.lessons.length, 0), 0);
  const allObj = TRACKS.reduce((n, t) =>
    n + t.modules.reduce((k, m) =>
      k + m.lessons.reduce((j, l) => j + l.objectives.length, 0), 0), 0);

  console.log(`\nAuthored once: ${all} lessons, ${allObj} objectives\n`);
  for (const t of TRACKS) {
    const n = t.modules.reduce((k, m) => k + m.lessons.length, 0);
    const h = t.modules.reduce((k, m) => k + m.lessons.reduce((j, l) => j + l.hours, 0), 0);
    console.log(`  ${t.code.padEnd(4)} ${String(t.modules.length).padStart(2)} modules  ${String(n).padStart(3)} lessons  ${String(h).padStart(3)}h  ${t.name.en}`);
  }

  console.log('\nResolved pathways — lessons / hours / days at 4h a day\n');
  console.log('              ' + PACES.map((p) => p.name.en.padEnd(20)).join(''));
  for (const course of ['DEV', 'OPS', 'SEC', 'AI']) {
    console.log(`\n  ${course}`);
    for (const lvl of LEVELS) {
      const cells = PACES.map((p) => {
        const r = pathway({ entryLevel: lvl.code, pace: p.code, course });
        return `${r.lesson_count} / ${r.hours}h / ${r.days_full_time}d`.padEnd(20);
      });
      console.log(`    ${lvl.code} ${lvl.name.en.padEnd(26).slice(0, 26)} ${cells.join('')}`);
    }
  }
  console.log();
}
