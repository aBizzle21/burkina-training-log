#!/usr/bin/env node
/*
 * Generates db/demo/demo-data.sql from the curriculum.
 *
 *   node tools/build-demo.js
 *
 * The demo data used to be hand-written against a fixed set of lesson
 * codes, which broke the moment the curriculum was restructured — and
 * broke quietly, by inserting the same objective twice under a remapped
 * code. Generating it from the curriculum means it cannot drift: each
 * cohort's sessions walk the first lessons of its own resolved pathway,
 * whatever those turn out to be.
 *
 * Dates are relative to load, so the demo always shows a programme that
 * is running rather than one that stopped on a fixed date in the past.
 *
 * The five cohorts are chosen to show the system working and failing:
 *   BF-01  healthy, with an instructor handover mid-module
 *   BF-02  struggling — lecture only, weak outcomes, entries filed late
 *   BF-03  the control: fast, broad method mix, nothing wrong
 *   BF-04  silent for nearly two weeks, and a mixed-level cohort
 *   BF-05  never started
 */

const fs = require('fs');
const path = require('path');
const { pathway } = require('../curriculum');

const repo = path.resolve(__dirname, '..');
const q = (s) => (s === null || s === undefined) ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;

const INSTRUCTORS = [
  { id: '11111111-1111-4111-8111-111111111111', name: 'Aminata Ouédraogo' },
  { id: '22222222-2222-4222-8222-222222222222', name: 'Issouf Sawadogo' },
  { id: '33333333-3333-4333-8333-333333333333', name: 'Clarisse Zongo' },
  { id: '44444444-4444-4444-8444-444444444444', name: 'Boureima Traoré' },
];

const COHORTS = [
  { id: 'aaaaaaaa-0001-4000-8000-000000000001', code: 'BF-01', site: 'Ouagadougou', branchName: 'Ouagadougou — Centre',
    course: 'DEV', entry: 'L0', pace: 'standard', mixed: null, enrolled: 14, startedDaysAgo: 8 },
  { id: 'aaaaaaaa-0002-4000-8000-000000000002', code: 'BF-02', site: 'Bobo-Dioulasso', branchName: 'Bobo-Dioulasso — Accart-Ville',
    course: 'SEC', entry: 'L1', pace: 'steady', mixed: null, enrolled: 11, startedDaysAgo: 7 },
  { id: 'aaaaaaaa-0003-4000-8000-000000000003', code: 'BF-03', site: 'Koudougou', branchName: 'Koudougou — Burkina',
    course: 'OPS', entry: 'L2', pace: 'fast', mixed: null, enrolled: 9, startedDaysAgo: 6 },
  { id: 'aaaaaaaa-0004-4000-8000-000000000004', code: 'BF-04', site: 'Ouagadougou', branchName: 'Ouagadougou — Centre',
    course: 'AI', entry: 'L1', pace: 'standard', mixed: 'L2', enrolled: 12, startedDaysAgo: 13 },
  { id: 'aaaaaaaa-0005-4000-8000-000000000005', code: 'BF-05', site: 'Banfora', branchName: 'Banfora — Centre',
    course: 'DEV', entry: 'L3', pace: 'standard', mixed: null, enrolled: 10, startedDaysAgo: -7 },
];

/* Each session: which instructor, how many days ago, how many days late it
   was filed, how many lessons it got through, what share of objectives the
   learners cleared, and how it was taught. */
const SCRIPT = {
  'BF-01': [
    { by: 0, ago: 8, late: 0, take: 2, rate: 0.90, methods: ['expose', 'demo'], dom: 'expose' },
    { by: 0, ago: 7, late: 0, take: 2, rate: 0.88, methods: ['demo', 'guidee', 'labo'], dom: 'guidee' },
    { by: 0, ago: 6, late: 0, take: 1, rate: 0.75, methods: ['guidee', 'autonome'], dom: 'guidee',
      disruption: 'power_cut',
      flag: { en: 'Two hours without power in the afternoon. Did not reach the next lesson.',
              fr: "Deux heures sans électricité l'après-midi. La leçon suivante n'a pas été atteinte." } },
    // the handover: a different instructor picks up from the log alone
    { by: 2, ago: 5, late: 0, take: 1, rate: 0.85, methods: ['demo', 'guidee', 'eval'], dom: 'guidee',
      flag: { en: 'Aminata away on assignment this week. Picked up from the log without trouble.',
              fr: 'Aminata en mission cette semaine. Reprise à partir du registre, sans difficulté.' } },
    { by: 2, ago: 4, late: 1, take: 2, rate: 0.86, methods: ['expose', 'guidee', 'labo'], dom: 'guidee' },
    { by: 0, ago: 1, late: 0, take: 1, rate: 0.77, methods: ['guidee', 'labo'], dom: 'labo',
      disruption: 'power_cut',
      flag: { en: 'Power out again for most of the morning. Third time this month.',
              fr: 'Courant coupé la majeure partie de la matinée. Troisième fois ce mois-ci.' } },
  ],
  // lecture only, weak outcomes, filed days late — three oversight flags on one person
  'BF-02': [
    { by: 1, ago: 7, late: 3, take: 1, rate: 0.60, methods: ['expose'], dom: 'expose',
      disruption: 'slow_pace',
      flag: { en: 'Group has very little computer experience. Plan a catch-up session.',
              fr: "Groupe très peu à l'aise avec l'ordinateur. Prévoir une séance de rattrapage." } },
    { by: 1, ago: 6, late: 2, take: 1, rate: 0.58, methods: ['expose', 'demo'], dom: 'expose' },
    { by: 1, ago: 5, late: 4, take: 1, rate: 0.62, methods: ['expose', 'demo'], dom: 'expose',
      disruption: 'heavy_absence' },
    { by: 1, ago: 4, late: 3, take: 1, rate: 0.55, methods: ['expose'], dom: 'expose',
      disruption: 'heavy_absence' },
    { by: 1, ago: 1, late: 0, take: 1, rate: 0.57, methods: ['expose', 'demo'], dom: 'expose' },
  ],
  // the control case: nothing here should raise a flag
  'BF-03': [
    { by: 3, ago: 6, late: 0, take: 3, rate: 0.92, methods: ['expose', 'discussion', 'labo'], dom: 'discussion' },
    { by: 3, ago: 5, late: 0, take: 2, rate: 0.89, methods: ['demo', 'labo', 'autonome'], dom: 'labo' },
    { by: 3, ago: 4, late: 0, take: 1, rate: 0.87, methods: ['labo', 'autonome', 'eval'], dom: 'labo' },
    { by: 3, ago: 1, late: 0, take: 2, rate: 0.90, methods: ['demo', 'labo', 'autonome'], dom: 'labo' },
  ],
  // silent since day 12
  'BF-04': [
    { by: 2, ago: 13, late: 0, take: 1, rate: 0.83, methods: ['expose', 'discussion'], dom: 'expose' },
    { by: 2, ago: 12, late: 0, take: 1, rate: 0.80, methods: ['expose', 'demo', 'discussion'], dom: 'expose',
      disruption: 'missing_equipment',
      flag: { en: 'Only four workstations available for twelve learners.',
              fr: 'Seulement quatre postes disponibles pour douze apprenants.' } },
  ],
  'BF-05': [],
};

let sql = `-- =====================================================================
-- Demo data — NOT FOR PRODUCTION
--
--   psql training_log -f db/demo/demo-data.sql
--
-- GENERATED FILE — do not edit by hand.
-- Regenerate: node tools/build-demo.js
--
-- Sessions walk the first lessons of each cohort's own resolved pathway,
-- so this cannot drift when the curriculum changes. Dates are relative to
-- load, so the demo always shows a programme that is running.
--
-- The five cohorts show the system working and failing:
--   BF-01  healthy, with an instructor handover mid-module
--   BF-02  struggling — lecture only, weak outcomes, entries filed late
--   BF-03  the control: nothing here should raise a flag
--   BF-04  silent for twelve days, and a mixed-level cohort
--   BF-05  never started
-- =====================================================================

BEGIN;

-- Country, city, branch. The demo gives each city a single named branch
-- so the three levels are visible on screen rather than implied.
INSERT INTO country (code, name_en, name_fr, position) VALUES
    ('BF', 'Burkina Faso', 'Burkina Faso', 1)
ON CONFLICT (code) DO NOTHING;

INSERT INTO site (country_code, city, name, region) VALUES
    ('BF', 'Ouagadougou',    'Ouagadougou — Centre',  'Centre'),
    ('BF', 'Bobo-Dioulasso', 'Bobo-Dioulasso — Accart-Ville', 'Hauts-Bassins'),
    ('BF', 'Koudougou',      'Koudougou — Burkina',   'Centre-Ouest'),
    ('BF', 'Banfora',        'Banfora — Centre',      'Cascades')
ON CONFLICT (country_code, city, name) DO NOTHING;

INSERT INTO instructor (id, full_name, role, started_on) VALUES
${INSTRUCTORS.map((i) => `    (${q(i.id)}, ${q(i.name)}, 'instructor', CURRENT_DATE - 30)`).join(',\n')}
ON CONFLICT (id) DO NOTHING;

-- Cohorts follow a pathway: a course, an entry level and a pace. The
-- spread is deliberate, so the demo shows what the filter actually does.
INSERT INTO cohort (id, code, site_id, track_id, course_id, entry_level, pace,
                    mixed_upper_level, enrolled_count, started_on, status) VALUES
${COHORTS.map((c) => `    (${q(c.id)}, ${q(c.code)},
     -- By city AND branch name. A database upgraded from the old schema
     -- already has a branch carrying the bare city name, so matching on
     -- the city alone finds two rows and the load stops.
     (SELECT id FROM site WHERE city = ${q(c.site)} AND name = ${q(c.branchName)}),
     (SELECT id FROM track WHERE code = ${q(c.course)}),
     (SELECT id FROM track WHERE code = ${q(c.course)}),
     ${q(c.entry)}, ${q(c.pace)}, ${q(c.mixed)}, ${c.enrolled},
     CURRENT_DATE - ${c.startedDaysAgo}, ${q(c.startedDaysAgo < 0 ? 'planned' : 'active')})`).join(',\n')}
ON CONFLICT (id) DO NOTHING;

`;

/* assignments */
const assigns = [];
for (const c of COHORTS) {
  const script = SCRIPT[c.code];
  if (!script.length) continue;
  const seen = [];
  for (const s of script) {
    const last = seen[seen.length - 1];
    if (!last || last.by !== s.by) seen.push({ by: s.by, from: s.ago, to: s.ago });
    else last.to = s.ago;
  }
  seen.forEach((a, i) => assigns.push(
    `    (${q(c.id)}, ${q(INSTRUCTORS[a.by].id)}, CURRENT_DATE - ${a.from}, ` +
    `${i === seen.length - 1 ? 'NULL' : `CURRENT_DATE - ${a.to}`}, true)`));
}
sql += `INSERT INTO cohort_instructor (cohort_id, instructor_id, assigned_from, assigned_to, is_primary) VALUES
${assigns.join(',\n')}
ON CONFLICT DO NOTHING;

`;

/* ---- what each instructor is approved to teach ----
 *
 * Deliberately uneven, because the even version demonstrates nothing.
 * The case worth showing on screen is Aminata: she can teach the first
 * three modules of the foundation and no further, so BF-01 is going to
 * need somebody else in a few lessons' time — and the dashboard can say
 * so now rather than on the morning it happens.
 */
const COMPETENCE = [
  // Aminata: the start of the foundation only. Her cohort will outrun her.
  { by: 0, course: 'F',   modules: ['M1', 'M2', 'M3'] },
  // Issouf: the whole foundation and all of Cybersecurity. Can finish BF-02.
  { by: 1, course: 'F',   modules: '*' },
  { by: 1, course: 'SEC', modules: '*' },
  // Clarisse: the foundation, and the first half of AI.
  { by: 2, course: 'F',   modules: '*' },
  { by: 2, course: 'AI',  modules: ['M1', 'M2', 'M3'] },
  // Boureima: DevOps specialist, and the later foundation modules only —
  // he is no use at the very beginning, which is its own kind of gap.
  { by: 3, course: 'F',   modules: ['M4', 'M5', 'M6', 'M7', 'M8', 'M9'] },
  { by: 3, course: 'OPS', modules: '*' },
];

const compRows = COMPETENCE.map((c) => {
  const where = c.modules === '*'
    ? ''
    : ` AND m.code IN (${c.modules.map(q).join(', ')})`;
  return `INSERT INTO instructor_module (instructor_id, module_id)
SELECT ${q(INSTRUCTORS[c.by].id)}, m.id
  FROM module m JOIN track t ON t.id = m.track_id
 WHERE t.code = ${q(c.course)}${where}
ON CONFLICT DO NOTHING;`;
});

sql += compRows.join('\n') + '\n\n';

/* sessions — walking each cohort's own pathway */
let sessionSeq = 0;
for (const c of COHORTS) {
  const script = SCRIPT[c.code];
  if (!script.length) {
    sql += `\n-- ===== ${c.code} · ${c.course} · no sessions. Intentionally empty. =====\n`;
    continue;
  }

  const p = pathway({ entryLevel: c.entry, pace: c.pace, course: c.course });
  sql += `\n-- ===== ${c.code} · ${c.course} · entering at ${c.entry}, ${c.pace} pace\n`;
  sql += `--       pathway is ${p.lesson_count} lessons / ${p.hours}h; these sessions walk the first few\n`;

  let cursor = 0;
  for (const s of script) {
    const taught = p.lessons.slice(cursor, cursor + s.take);
    if (!taught.length) break;
    cursor += s.take;
    const resume = p.lessons[cursor] || taught[taught.length - 1];
    const present = Math.max(1, Math.round(c.enrolled * (0.8 + Math.random() * 0.2)));
    sessionSeq++;
    const sid = `b${String(sessionSeq).padStart(7, '0')}-0000-4000-8000-${String(sessionSeq).padStart(12, '0')}`;

    const objs = taught.flatMap((l) => l.objectives.map((o) => ({
      code: o.code, count: Math.max(0, Math.round(present * s.rate)),
    })));

    sql += `
INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                     present_count, resume_lesson_id, dominant_method_id, disruption_id,
                     flag_note, device_id, app_version)
VALUES (${q(sid)}, ${q(c.id)}, ${q(INSTRUCTORS[s.by].id)},
        CURRENT_DATE - ${s.ago},
        (CURRENT_DATE - ${s.ago - s.late})::timestamptz + time '17:30',
        ${present},
        (SELECT id FROM lesson WHERE code = ${q(resume.code)}),
        (SELECT id FROM teaching_method WHERE code = ${q(s.dom)}),
        ${s.disruption ? `(SELECT id FROM disruption_reason WHERE code = ${q(s.disruption)})` : 'NULL'},
        ${s.flag ? q(s.flag.fr) : 'NULL'}, 'demo-device', 'demo')
ON CONFLICT (id) DO NOTHING;
INSERT INTO session_lesson (session_id, lesson_id)
  SELECT ${q(sid)}, id FROM lesson WHERE code IN (${taught.map((l) => q(l.code)).join(', ')})
ON CONFLICT DO NOTHING;
INSERT INTO session_method (session_id, method_id)
  SELECT ${q(sid)}, id FROM teaching_method WHERE code IN (${s.methods.map(q).join(', ')})
ON CONFLICT DO NOTHING;
${objs.map((o) => `INSERT INTO session_objective (session_id, objective_id, demonstrated_count)
  SELECT ${q(sid)}, id, ${o.count} FROM objective WHERE code = ${q(o.code)}
ON CONFLICT DO NOTHING;`).join('\n')}
`;
  }
}

sql += `

-- One observation, so the dormant tables have something in them.
INSERT INTO observation (id, cohort_id, instructor_id, observed_on, lesson_id,
                         observer_name, observer_role, summary_note) VALUES
    ('c0000001-0000-4000-8000-000000000001',
     ${q(COHORTS[0].id)}, ${q(INSTRUCTORS[0].id)}, CURRENT_DATE - 7,
     (SELECT id FROM lesson WHERE code = ${q(pathway({ entryLevel: COHORTS[0].entry, pace: COHORTS[0].pace, course: COHORTS[0].course }).lessons[2].code)}),
     'Site lead — Ouagadougou', 'Site lead',
     'Strong subject knowledge. Practice time was cut short by the setup taking too long.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO observation_score (observation_id, criterion_id, score)
SELECT 'c0000001-0000-4000-8000-000000000001', oc.id, s.score
  FROM observation_criterion oc
  JOIN (VALUES (1,3),(2,3),(3,2),(4,3),(5,3),(6,2),(7,2),(8,3)) AS s(pos, score)
    ON s.pos = oc.position
ON CONFLICT DO NOTHING;

COMMIT;
`;

fs.mkdirSync(path.join(repo, 'db/demo'), { recursive: true });
fs.writeFileSync(path.join(repo, 'db/demo/demo-data.sql'), sql);
console.log('Wrote db/demo/demo-data.sql');
for (const c of COHORTS) {
  const p = pathway({ entryLevel: c.entry, pace: c.pace, course: c.course });
  console.log(`  ${c.code}  ${c.course.padEnd(4)} ${c.entry} ${c.pace.padEnd(9)} pathway ${String(p.lesson_count).padStart(3)} lessons / ${p.hours}h · ${SCRIPT[c.code].length} sessions`);
}
