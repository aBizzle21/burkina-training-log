#!/usr/bin/env node
/*
 * Generates the seed SQL from the curriculum.
 *
 *   node tools/build-seed.js
 *
 * Writes:
 *   db/seed/01-reference.sql    methods, disruption reasons, rubric,
 *                               levels, paces, tiers
 *   db/seed/02-curriculum.sql   tracks, modules, lessons, objectives
 *
 * Content is authored in curriculum/*.js — that is the source of truth.
 * The generated files are never hand-edited.
 *
 * Both are idempotent: re-running updates rather than duplicating. A
 * re-run will NOT rewrite a lesson or objective already taught against —
 * the schema triggers refuse that, which is intended. The answer is a
 * replacement lesson, not forcing the edit through.
 */

const fs = require('fs');
const path = require('path');
const { LEVELS, PACES, TIERS, TRACKS } = require('../curriculum');

const repo = path.resolve(__dirname, '..');

const q = (s) => (s === null || s === undefined) ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;
const n = (v) => (v === null || v === undefined) ? 'NULL' : String(v);

const banner = (name) => `-- =====================================================================
-- ${name}
--
-- GENERATED FILE — do not edit by hand.
-- Source:     curriculum/*.js
-- Regenerate: node tools/build-seed.js
-- =====================================================================
`;

/* ---------------- 01 — reference vocabulary ---------------- */

let ref = banner('Reference vocabulary');
ref += '\nBEGIN;\n';

ref += `
-- Entry levels. rank is what the pathway filter compares.
INSERT INTO learner_level (code, rank, name_en, name_fr, desc_en, desc_fr) VALUES
${LEVELS.map((l) =>
  `    (${q(l.code)}, ${l.rank}, ${q(l.name.en)}, ${q(l.name.fr)}, ${q(l.desc.en)}, ${q(l.desc.fr)})`
).join(',\n')}
ON CONFLICT (code) DO UPDATE SET
    rank = EXCLUDED.rank, name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr,
    desc_en = EXCLUDED.desc_en, desc_fr = EXCLUDED.desc_fr;
`;

ref += `
-- How essential a lesson is. The pace decides which tiers are included.
INSERT INTO lesson_tier (code, position, name_en, name_fr) VALUES
${TIERS.map((t, i) =>
  `    (${q(t.code)}, ${i + 1}, ${q(t.name.en)}, ${q(t.name.fr)})`
).join(',\n')}
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr;
`;

ref += `
-- Paces, and the tiers each includes.
INSERT INTO pace (code, position, name_en, name_fr, desc_en, desc_fr, tiers) VALUES
${PACES.map((p, i) =>
  `    (${q(p.code)}, ${i + 1}, ${q(p.name.en)}, ${q(p.name.fr)}, ${q(p.desc.en)}, ${q(p.desc.fr)}, ` +
  `ARRAY[${p.tiers.map(q).join(', ')}]::text[])`
).join(',\n')}
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr,
    desc_en = EXCLUDED.desc_en, desc_fr = EXCLUDED.desc_fr, tiers = EXCLUDED.tiers;
`;

/* teaching methods, disruption reasons and the observation rubric are
   unchanged from the first version of the curriculum and are carried over
   verbatim, because sessions already reference them */
const METHODS = [
  ['expose', 1, 'Lecture', 'Exposé', '#16233A'],
  ['demo', 2, 'Demonstration', 'Démonstration', '#2E5E4E'],
  ['guidee', 3, 'Guided practice', 'Pratique guidée', '#A83A2C'],
  ['autonome', 4, 'Independent work', 'Travail autonome', '#8A7B4F'],
  ['labo', 5, 'Lab exercise', 'Travaux pratiques', '#5C7A8A'],
  ['eval', 6, 'Assessment', 'Évaluation', '#4A5B78'],
  ['discussion', 7, 'Discussion', 'Discussion', '#7B8B6F'],
];
const REASONS = [
  ['heavy_absence', 1, 'Heavy absence', 'Absences nombreuses'],
  ['power_cut', 2, 'Power cut', 'Coupure de courant'],
  ['no_connectivity', 3, 'No connectivity', 'Connexion indisponible'],
  ['slow_pace', 4, 'Slower pace than planned', 'Rythme plus lent que prévu'],
  ['missing_equipment', 5, 'Missing equipment or workstations', 'Matériel ou postes manquants'],
  ['cut_short', 6, 'Session cut short', 'Séance écourtée'],
  ['other', 7, 'Other', 'Autre'],
];
const SCALE = [
  [1, 'Not evident', 'Absent'], [2, 'Developing', 'En développement'],
  [3, 'Secure', 'Acquis'], [4, 'Strong', 'Maîtrisé'],
];
const CRITERIA = [
  ["The lesson's objective was stated to learners at the start",
   "L'objectif de la leçon a été annoncé aux apprenants en début de séance"],
  ['Explanations were accurate and pitched at the right level',
   'Les explications étaient justes et adaptées au niveau du groupe'],
  ['Learners spent real time practising, not only listening',
   'Les apprenants ont réellement pratiqué, pas seulement écouté'],
  ['Understanding was checked during the session, not only at the end',
   'La compréhension a été vérifiée pendant la séance, pas uniquement à la fin'],
  ['Questions and mistakes were handled well',
   'Les questions et les erreurs ont été bien traitées'],
  ['Equipment and materials were ready before the session',
   'Le matériel et les équipements étaient prêts avant la séance'],
  ['Quieter learners were drawn in, not just the confident ones',
   'Les apprenants les plus discrets ont été sollicités, pas seulement les plus à l\'aise'],
  ['The session closed with a check and a clear next step',
   "La séance s'est close par une vérification et une consigne claire pour la suite"],
];

ref += `
INSERT INTO teaching_method (code, position, name_en, name_fr, color) VALUES
${METHODS.map((m) => `    (${q(m[0])}, ${m[1]}, ${q(m[2])}, ${q(m[3])}, ${q(m[4])})`).join(',\n')}
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, name_en = EXCLUDED.name_en,
    name_fr = EXCLUDED.name_fr, color = EXCLUDED.color;

INSERT INTO disruption_reason (code, position, label_en, label_fr) VALUES
${REASONS.map((r) => `    (${q(r[0])}, ${r[1]}, ${q(r[2])}, ${q(r[3])})`).join(',\n')}
ON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, label_en = EXCLUDED.label_en, label_fr = EXCLUDED.label_fr;

INSERT INTO observation_scale (score, label_en, label_fr) VALUES
${SCALE.map((s) => `    (${s[0]}, ${q(s[1])}, ${q(s[2])})`).join(',\n')}
ON CONFLICT (score) DO UPDATE SET
    label_en = EXCLUDED.label_en, label_fr = EXCLUDED.label_fr;

INSERT INTO observation_criterion (position, text_en, text_fr) VALUES
${CRITERIA.map((c, i) => `    (${i + 1}, ${q(c[0])}, ${q(c[1])})`).join(',\n')}
ON CONFLICT DO NOTHING;
`;

ref += '\nCOMMIT;\n';

/* ---------------- 02 — curriculum ---------------- */

const counts = TRACKS.map((t) => ({
  code: t.code,
  modules: t.modules.length,
  lessons: t.modules.reduce((k, m) => k + m.lessons.length, 0),
  objectives: t.modules.reduce((k, m) =>
    k + m.lessons.reduce((j, l) => j + l.objectives.length, 0), 0),
  hours: t.modules.reduce((k, m) => k + m.lessons.reduce((j, l) => j + l.hours, 0), 0),
}));

let cur = banner('Curriculum: tracks, modules, lessons, objectives');
cur += `
-- ${counts.reduce((a, c) => a + c.lessons, 0)} lessons, `
    + `${counts.reduce((a, c) => a + c.objectives, 0)} objectives, `
    + `${counts.reduce((a, c) => a + c.hours, 0)} hours, written once.
--
${counts.map((c) => `--   ${c.code.padEnd(4)} ${String(c.modules).padStart(2)} modules  ${String(c.lessons).padStart(3)} lessons  ${String(c.objectives).padStart(3)} objectives  ${String(c.hours).padStart(3)}h`).join('\n')}
--
-- A cohort is taught a PATHWAY through this, not the whole thing: see
-- v_cohort_pathway. Lesson codes are the stable identifiers that session
-- rows point at and handover sheets print, so they are never reused for
-- different content.
`;
cur += '\nBEGIN;\n';

cur += '\n-- Tracks\n';
cur += 'INSERT INTO track (code, position, kind, name_en, name_fr, color, blurb_en, blurb_fr) VALUES\n';
cur += TRACKS.map((t, i) =>
  `    (${q(t.code)}, ${i + 1}, ${q(t.kind)}, ${q(t.name.en)}, ${q(t.name.fr)}, ${q(t.color)}, ` +
  `${q(t.blurb && t.blurb.en)}, ${q(t.blurb && t.blurb.fr)})`
).join(',\n');
cur += `\nON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, kind = EXCLUDED.kind,
    name_en = EXCLUDED.name_en, name_fr = EXCLUDED.name_fr,
    color = EXCLUDED.color, blurb_en = EXCLUDED.blurb_en, blurb_fr = EXCLUDED.blurb_fr;\n`;

for (const track of TRACKS) {
  cur += `\n\n-- ---------------------------------------------------------------\n`;
  cur += `-- ${track.code} — ${track.name.en}\n`;
  cur += `-- ---------------------------------------------------------------\n`;

  cur += '\nINSERT INTO module (track_id, code, position, title_en, title_fr, note_en, note_fr) VALUES\n';
  cur += track.modules.map((m, i) =>
    `    ((SELECT id FROM track WHERE code = ${q(track.code)}), ${q(m.code)}, ${i + 1}, ` +
    `${q(m.title.en)}, ${q(m.title.fr)}, ${q(m.note && m.note.en)}, ${q(m.note && m.note.fr)})`
  ).join(',\n');
  cur += `\nON CONFLICT (track_id, code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;\n`;

  for (const mod of track.modules) {
    cur += `\n-- ${track.code} ${mod.code} · ${mod.title.en}\n`;
    cur += 'INSERT INTO lesson (module_id, code, position, title_en, title_fr, level, tier, hours, note_en, note_fr) VALUES\n';
    cur += mod.lessons.map((l, i) =>
      `    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id` +
      ` WHERE t.code = ${q(track.code)} AND m.code = ${q(mod.code)}),` +
      ` ${q(l.code)}, ${i + 1}, ${q(l.title.en)}, ${q(l.title.fr)},` +
      ` ${q(l.level)}, ${q(l.tier)}, ${n(l.hours)}, ${q(l.note && l.note.en)}, ${q(l.note && l.note.fr)})`
    ).join(',\n');
    cur += `\nON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, title_en = EXCLUDED.title_en, title_fr = EXCLUDED.title_fr,
    level = EXCLUDED.level, tier = EXCLUDED.tier, hours = EXCLUDED.hours,
    note_en = EXCLUDED.note_en, note_fr = EXCLUDED.note_fr;\n`;

    const objs = mod.lessons.flatMap((l) =>
      l.objectives.map((o, i) => ({ lesson: l.code, pos: i + 1, ...o })));
    if (objs.length) {
      cur += 'INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES\n';
      cur += objs.map((o) =>
        `    ((SELECT id FROM lesson WHERE code = ${q(o.lesson)}),` +
        ` ${q(o.code)}, ${o.pos}, ${q(o.text.en)}, ${q(o.text.fr)})`
      ).join(',\n');
      cur += `\nON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position, text_en = EXCLUDED.text_en, text_fr = EXCLUDED.text_fr;\n`;
    }
  }
}

cur += `

-- Retire anything from the previous curriculum that is no longer authored.
-- Retired rather than deleted: sessions taught against those lessons stay
-- valid and readable, and a handover sheet from last term still resolves.
UPDATE lesson SET retired_on = CURRENT_DATE
 WHERE retired_on IS NULL
   AND code NOT IN (${TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.map((l) => q(l.code)))).join(', ')});

UPDATE objective SET retired_on = CURRENT_DATE
 WHERE retired_on IS NULL
   AND code NOT IN (${TRACKS.flatMap((t) => t.modules.flatMap((m) => m.lessons.flatMap((l) => l.objectives.map((o) => q(o.code))))).join(', ')});

UPDATE track SET retired_on = CURRENT_DATE
 WHERE retired_on IS NULL
   AND code NOT IN (${TRACKS.map((t) => q(t.code)).join(', ')});
`;

cur += '\nCOMMIT;\n';

fs.mkdirSync(path.join(repo, 'db/seed'), { recursive: true });
fs.writeFileSync(path.join(repo, 'db/seed/01-reference.sql'), ref);
fs.writeFileSync(path.join(repo, 'db/seed/02-curriculum.sql'), cur);

console.log('Wrote db/seed/01-reference.sql');
console.log('Wrote db/seed/02-curriculum.sql');
for (const c of counts) {
  console.log(`  ${c.code.padEnd(4)} ${String(c.modules).padStart(2)} modules  ${String(c.lessons).padStart(3)} lessons  ${String(c.objectives).padStart(3)} objectives  ${String(c.hours).padStart(3)}h`);
}
console.log(`  ---- ${counts.reduce((a, c) => a + c.lessons, 0)} lessons, ${counts.reduce((a, c) => a + c.objectives, 0)} objectives`);
