#!/usr/bin/env node
/*
 * Generates the seed SQL from data/curriculum.json.
 *
 *   node tools/build-seed.js
 *
 * Writes:
 *   db/seed/01-reference.sql    methods, disruption reasons, observation rubric
 *   db/seed/02-curriculum.sql   tracks, modules, lessons, objectives
 *
 * Both files are idempotent: they use ON CONFLICT so re-running them against
 * an existing database updates rather than duplicating. Re-running will NOT
 * rewrite a lesson or objective that has already been taught against — the
 * schema triggers refuse that, which is the intended behaviour. If a run
 * fails with "has already been taught and cannot be rewritten", the answer
 * is to add a replacement lesson, not to force the edit through.
 *
 * Never hand-edit the generated files.
 */

const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(repo, 'data/curriculum.json'), 'utf8'));

// Single-quote escaping for SQL literals.
const q = s => (s === null || s === undefined) ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;

const banner = name => `-- =====================================================================
-- ${name}
--
-- GENERATED FILE — do not edit by hand.
-- Source:    data/curriculum.json (version ${data.version})
-- Regenerate: node tools/build-seed.js
-- =====================================================================
`;

/* ---------------- 01 — reference vocabulary ---------------- */

let ref = banner('Reference vocabulary: methods, disruption reasons, observation rubric');
ref += '\nBEGIN;\n';

ref += '\n-- Teaching methods. A closed list on purpose: free text cannot be\n';
ref += '-- compared across instructors, and comparison is the whole point.\n';
ref += 'INSERT INTO teaching_method (code, position, name_en, name_fr, color) VALUES\n';
ref += data.teaching_methods.map(m =>
  `    (${q(m.code)}, ${m.position}, ${q(m.name.en)}, ${q(m.name.fr)}, ${q(m.color)})`
).join(',\n');
ref += `\nON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    name_en  = EXCLUDED.name_en,
    name_fr  = EXCLUDED.name_fr,
    color    = EXCLUDED.color;\n`;

ref += '\n-- Disruption reasons.\n';
ref += 'INSERT INTO disruption_reason (code, position, label_en, label_fr) VALUES\n';
ref += data.disruption_reasons.map(r =>
  `    (${q(r.code)}, ${r.position}, ${q(r.label.en)}, ${q(r.label.fr)})`
).join(',\n');
ref += `\nON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    label_en = EXCLUDED.label_en,
    label_fr = EXCLUDED.label_fr;\n`;

ref += '\n-- Observation scale.\n';
ref += 'INSERT INTO observation_scale (score, label_en, label_fr) VALUES\n';
ref += data.observation.scale.map(s =>
  `    (${s.score}, ${q(s.label.en)}, ${q(s.label.fr)})`
).join(',\n');
ref += `\nON CONFLICT (score) DO UPDATE SET
    label_en = EXCLUDED.label_en,
    label_fr = EXCLUDED.label_fr;\n`;

ref += '\n-- Observation criteria. Eight of them, scored 1-4 by whoever sat in.\n';
ref += '-- Keyed on position, so reordering them mid-programme would silently\n';
ref += '-- rewrite past scores. Add new criteria at the end instead.\n';
ref += 'INSERT INTO observation_criterion (position, text_en, text_fr) VALUES\n';
ref += data.observation.criteria.map(c =>
  `    (${c.position}, ${q(c.text.en)}, ${q(c.text.fr)})`
).join(',\n');
ref += `\nON CONFLICT DO NOTHING;\n`;

ref += '\nCOMMIT;\n';

/* ---------------- 02 — curriculum ---------------- */

let cur = banner('Curriculum: tracks, modules, lessons, objectives');
cur += `
-- ${data.tracks.length} tracks, `
    + `${data.tracks.reduce((n, t) => n + t.modules.length, 0)} modules, `
    + `${data.tracks.reduce((n, t) => n + t.modules.reduce((k, m) => k + m.lessons.length, 0), 0)} lessons, `
    + `${data.tracks.reduce((n, t) => n + t.modules.reduce((k, m) => k + m.lessons.reduce((j, l) => j + l.objectives.length, 0), 0), 0)} objectives.
--
-- Lesson and objective codes (CS-2.3, CS-2.3.1) are the stable identifiers.
-- They are what session rows point at and what a handover sheet prints, so
-- they must never be reused for different content.
`;
cur += '\nBEGIN;\n';

cur += '\n-- Tracks\n';
cur += 'INSERT INTO track (code, position, name_en, name_fr, color) VALUES\n';
cur += data.tracks.map(t =>
  `    (${q(t.code)}, ${t.position}, ${q(t.name.en)}, ${q(t.name.fr)}, ${q(t.color)})`
).join(',\n');
cur += `\nON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    name_en  = EXCLUDED.name_en,
    name_fr  = EXCLUDED.name_fr,
    color    = EXCLUDED.color;\n`;

for (const track of data.tracks) {
  cur += `\n\n-- ---------------------------------------------------------------\n`;
  cur += `-- ${track.code} — ${track.name.en} / ${track.name.fr}\n`;
  cur += `-- ---------------------------------------------------------------\n`;

  cur += '\nINSERT INTO module (track_id, code, position, title_en, title_fr) VALUES\n';
  cur += track.modules.map(m =>
    `    ((SELECT id FROM track WHERE code = ${q(track.code)}), ${q(m.code)}, ${m.position}, ${q(m.title.en)}, ${q(m.title.fr)})`
  ).join(',\n');
  cur += `\nON CONFLICT (track_id, code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;\n`;

  for (const mod of track.modules) {
    cur += `\n-- ${track.code} ${mod.code} · ${mod.title.en}\n`;
    cur += 'INSERT INTO lesson (module_id, code, position, title_en, title_fr) VALUES\n';
    cur += mod.lessons.map(l =>
      `    ((SELECT m.id FROM module m JOIN track t ON t.id = m.track_id`
      + ` WHERE t.code = ${q(track.code)} AND m.code = ${q(mod.code)}),`
      + ` ${q(l.code)}, ${l.position}, ${q(l.title.en)}, ${q(l.title.fr)})`
    ).join(',\n');
    cur += `\nON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    title_en = EXCLUDED.title_en,
    title_fr = EXCLUDED.title_fr;\n`;

    const objs = mod.lessons.flatMap(l =>
      l.objectives.map(o => ({ lesson: l.code, ...o })));
    if (objs.length) {
      cur += 'INSERT INTO objective (lesson_id, code, position, text_en, text_fr) VALUES\n';
      cur += objs.map(o =>
        `    ((SELECT id FROM lesson WHERE code = ${q(o.lesson)}),`
        + ` ${q(o.code)}, ${o.position}, ${q(o.text.en)}, ${q(o.text.fr)})`
      ).join(',\n');
      cur += `\nON CONFLICT (code) DO UPDATE SET
    position = EXCLUDED.position,
    text_en  = EXCLUDED.text_en,
    text_fr  = EXCLUDED.text_fr;\n`;
    }
  }
}

cur += '\nCOMMIT;\n';

fs.mkdirSync(path.join(repo, 'db/seed'), { recursive: true });
fs.writeFileSync(path.join(repo, 'db/seed/01-reference.sql'), ref);
fs.writeFileSync(path.join(repo, 'db/seed/02-curriculum.sql'), cur);

console.log('Wrote db/seed/01-reference.sql');
console.log('Wrote db/seed/02-curriculum.sql');
console.log(`  ${data.tracks.length} tracks`);
console.log(`  ${data.tracks.reduce((n, t) => n + t.modules.length, 0)} modules`);
console.log(`  ${data.tracks.reduce((n, t) => n + t.modules.reduce((k, m) => k + m.lessons.length, 0), 0)} lessons`);
console.log(`  ${data.tracks.reduce((n, t) => n + t.modules.reduce((k, m) => k + m.lessons.reduce((j, l) => j + l.objectives.length, 0), 0), 0)} objectives`);
