#!/usr/bin/env node
/*
 * One-time extraction: pulls the PROGRAMME object out of both prototypes and
 * merges them into a single bilingual data/curriculum.json.
 *
 * This ran once to create curriculum.json. It is kept in the repo so the
 * extraction is auditable, but curriculum.json is the source of truth now —
 * do not run this again, it would overwrite hand edits.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repo = path.resolve(__dirname, '..');

// Pull a top-level `const NAME = {...};` or `[...]` literal out of an HTML file
// by brace matching, then evaluate it in an isolated context.
function extractLiteral(html, name) {
  const marker = `const ${name} = `;
  const start = html.indexOf(marker);
  if (start === -1) throw new Error(`could not find "${name}"`);

  const openIdx = start + marker.length;
  const open = html[openIdx];
  const close = open === '{' ? '}' : ']';
  if (open !== '{' && open !== '[') {
    throw new Error(`"${name}" is not an object or array literal`);
  }

  let depth = 0;
  let inStr = null;
  let end = -1;

  for (let i = openIdx; i < html.length; i++) {
    const c = html[i];
    const prev = html[i - 1];

    if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }

  if (end === -1) throw new Error(`unbalanced literal for "${name}"`);
  const src = html.slice(openIdx, end);
  return vm.runInNewContext(`(${src})`);
}

const enHtml = fs.readFileSync(path.join(repo, 'prototype/tracker-en.html'), 'utf8');
const frHtml = fs.readFileSync(path.join(repo, 'prototype/tracker-fr.html'), 'utf8');

const en = {
  tracks: extractLiteral(enHtml, 'PISTES'),
  programme: extractLiteral(enHtml, 'PROGRAMME'),
  methods: extractLiteral(enHtml, 'METHODES'),
  reasons: extractLiteral(enHtml, 'MOTIFS'),
  criteria: extractLiteral(enHtml, 'CRITERES'),
  scale: extractLiteral(enHtml, 'ECHELLE'),
};

const fr = {
  tracks: extractLiteral(frHtml, 'PISTES'),
  programme: extractLiteral(frHtml, 'PROGRAMME'),
  methods: extractLiteral(frHtml, 'METHODES'),
  reasons: extractLiteral(frHtml, 'MOTIFS'),
  criteria: extractLiteral(frHtml, 'CRITERES'),
  scale: extractLiteral(frHtml, 'ECHELLE'),
};

/* ---- structural checks before merging ---- */

const problems = [];

const trackCodes = Object.keys(en.tracks);
if (trackCodes.join(',') !== Object.keys(fr.tracks).join(',')) {
  problems.push('track codes differ between EN and FR');
}

for (const code of trackCodes) {
  const mEn = en.programme[code];
  const mFr = fr.programme[code];
  if (!mFr) { problems.push(`${code}: missing from FR`); continue; }
  if (mEn.length !== mFr.length) {
    problems.push(`${code}: ${mEn.length} modules in EN vs ${mFr.length} in FR`);
    continue;
  }
  mEn.forEach((mod, i) => {
    const modFr = mFr[i];
    if (mod.id !== modFr.id) problems.push(`${code}: module ${i} id ${mod.id} vs ${modFr.id}`);
    if (mod.lecons.length !== modFr.lecons.length) {
      problems.push(`${code}/${mod.id}: ${mod.lecons.length} lessons in EN vs ${modFr.lecons.length} in FR`);
      return;
    }
    mod.lecons.forEach((les, j) => {
      const lesFr = modFr.lecons[j];
      if (les.id !== lesFr.id) problems.push(`${code}/${mod.id}: lesson ${les.id} vs ${lesFr.id}`);
      if (les.obj.length !== lesFr.obj.length) {
        problems.push(`${les.id}: ${les.obj.length} objectives in EN vs ${lesFr.obj.length} in FR`);
        return;
      }
      les.obj.forEach((o, k) => {
        if (o.id !== lesFr.obj[k].id) problems.push(`${les.id}: objective ${o.id} vs ${lesFr.obj[k].id}`);
      });
    });
  });
}

if (en.methods.map(m => m.id).join(',') !== fr.methods.map(m => m.id).join(',')) {
  problems.push('method ids differ between EN and FR');
}
if (en.reasons.length !== fr.reasons.length) problems.push('disruption reason count differs');
if (en.criteria.length !== fr.criteria.length) problems.push('observation criteria count differs');
if (en.scale.length !== fr.scale.length) problems.push('observation scale length differs');

if (problems.length) {
  console.error('Structural mismatches between the two prototypes:');
  problems.forEach(p => console.error('  - ' + p));
  process.exit(1);
}

/* ---- merge ---- */

// Disruption reasons and criteria are positional arrays in the prototypes.
// Give them stable codes now so the database never depends on array order.
const REASON_CODES = [
  'heavy_absence', 'power_cut', 'no_connectivity', 'slow_pace',
  'missing_equipment', 'cut_short', 'other',
];

const out = {
  $comment: 'Single source of truth for the training curriculum. Generated once from the '
    + 'prototypes, hand-edited since. Regenerate seed SQL and prototype blocks with '
    + 'tools/build-seed.js and tools/build-prototype.js after editing.',
  version: '1.0.0',
  languages: ['en', 'fr'],

  tracks: trackCodes.map((code, i) => ({
    code,
    position: i + 1,
    color: en.tracks[code].couleur,
    name: { en: en.tracks[code].nom, fr: fr.tracks[code].nom },
    modules: en.programme[code].map((mod, mi) => ({
      code: mod.id,
      position: mi + 1,
      title: { en: mod.titre, fr: fr.programme[code][mi].titre },
      lessons: mod.lecons.map((les, li) => ({
        code: les.id,
        position: li + 1,
        title: { en: les.titre, fr: fr.programme[code][mi].lecons[li].titre },
        objectives: les.obj.map((o, oi) => ({
          code: o.id,
          position: oi + 1,
          text: { en: o.t, fr: fr.programme[code][mi].lecons[li].obj[oi].t },
        })),
      })),
    })),
  })),

  teaching_methods: en.methods.map((m, i) => ({
    code: m.id,
    position: i + 1,
    color: m.couleur,
    name: { en: m.nom, fr: fr.methods[i].nom },
  })),

  disruption_reasons: en.reasons.map((r, i) => ({
    code: REASON_CODES[i],
    position: i + 1,
    label: { en: r, fr: fr.reasons[i] },
  })),

  observation: {
    scale: en.scale.map((s, i) => ({
      score: i + 1,
      label: { en: s, fr: fr.scale[i] },
    })),
    criteria: en.criteria.map((c, i) => ({
      position: i + 1,
      text: { en: c, fr: fr.criteria[i] },
    })),
  },
};

fs.mkdirSync(path.join(repo, 'data'), { recursive: true });
fs.writeFileSync(
  path.join(repo, 'data/curriculum.json'),
  JSON.stringify(out, null, 2) + '\n'
);

const counts = out.tracks.map(t => {
  const lessons = t.modules.reduce((n, m) => n + m.lessons.length, 0);
  const objectives = t.modules.reduce(
    (n, m) => n + m.lessons.reduce((k, l) => k + l.objectives.length, 0), 0);
  return `  ${t.code.padEnd(4)} ${String(t.modules.length).padStart(2)} modules  ${String(lessons).padStart(2)} lessons  ${String(objectives).padStart(2)} objectives`;
});

console.log('Wrote data/curriculum.json');
console.log(counts.join('\n'));
console.log(`  ---- total: ${out.tracks.reduce((n, t) => n + t.modules.reduce((k, m) => k + m.lessons.length, 0), 0)} lessons`);
