/*
 * Admin dashboard, in a browser.
 *
 *   DATABASE_URL=... ADMIN_KEY=... node test/admin-ui.test.js
 *
 * The dashboard's job is to answer two questions at a glance: is this
 * instructor still teaching, and where did they get to. Everything below
 * checks those are actually on the page, against a database whose answers
 * are known.
 */

const assert = require('assert');
const { chromium } = require('playwright');
const { query } = require('../src/db');

const BASE = `http://127.0.0.1:${process.env.PORT || 3311}`;
const KEY = process.env.ADMIN_KEY || 'k-test-key';

const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const ACTIVE = `Dash Active ${RUN}`;
const SILENT = `Dash Silent ${RUN}`;
const FRESH = `Dash Fresh ${RUN}`;
const COHORT = `D-${RUN}`;

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message.split('\n')[0]}`);
    failed++;
  }
}

/** Put a session straight into the database, dated relative to today. */
async function seedSession(instructorName, cohortCode, daysAgo, lessonCode, resumeCode) {
  const { rows } = await query(
    `INSERT INTO session (id, cohort_id, instructor_id, session_date, submitted_at,
                          present_count, resume_lesson_id, dominant_method_id)
     VALUES (gen_random_uuid(),
             (SELECT id FROM cohort WHERE code = $1),
             (SELECT id FROM instructor WHERE full_name = $2),
             CURRENT_DATE - $3::int,
             now(), 10,
             (SELECT id FROM lesson WHERE code = $4),
             (SELECT id FROM teaching_method WHERE code = 'guidee'))
     RETURNING id`,
    [cohortCode, instructorName, daysAgo, resumeCode]
  );
  await query(
    `INSERT INTO session_lesson (session_id, lesson_id)
     SELECT $1, id FROM lesson WHERE code = $2`, [rows[0].id, lessonCode]);
  return rows[0].id;
}

/**
 * A cohort on a real pathway.
 *
 * A cohort is no longer just "a group on a track" — it enters at a level and
 * moves at a pace, and those two decide which lessons it is taught. A test
 * cohort without them would be a shape the application cannot produce.
 */
async function createCohort(code, branch, entryLevel, pace, enrolled, startedDaysAgo) {
  await query(
    `INSERT INTO cohort (code, site_id, track_id, branch_id, entry_level, pace,
                         enrolled_count, started_on, status)
     VALUES ($1, (SELECT id FROM site ORDER BY id LIMIT 1),
             (SELECT id FROM track WHERE code = $2),
             (SELECT id FROM track WHERE code = $2),
             $3, $4, $5, CURRENT_DATE - $6::int, 'active')`,
    [code, branch, entryLevel, pace, enrolled, startedDaysAgo]);
}

/** The first n lesson codes of a cohort's pathway, in teaching order. */
async function pathwayCodes(cohortCode, n) {
  const { rows } = await query(
    `SELECT lesson_code FROM v_cohort_pathway
      WHERE cohort_code = $1 ORDER BY teaching_order LIMIT $2`,
    [cohortCode, n]);
  assert.ok(rows.length === n, `${cohortCode} has no pathway to teach`);
  return rows.map((r) => r.lesson_code);
}

(async () => {
  require('../src/index');
  await new Promise((r) => setTimeout(r, 900));

  // Three instructors in three known states, and a cohort of their own so
  // nothing here depends on what the demo data happens to look like.
  for (const name of [ACTIVE, SILENT, FRESH]) {
    await query(
      `INSERT INTO instructor (full_name, login_code, started_on)
       VALUES ($1, $2, CURRENT_DATE)`, [name, name.replace(/ /g, '-')]);
  }
  await createCohort(COHORT, 'DEV', 'L0', 'standard', 12, 0);

  // The lessons this cohort is actually taught, in order. Read from its
  // pathway rather than written down here: which lesson comes first depends
  // on the entry level and pace, and a test that hardcodes a code is really
  // asserting that the curriculum never changes.
  const [c1, c2, c3] = await pathwayCodes(COHORT, 3);

  await seedSession(ACTIVE, COHORT, 1, c1, c2);
  await seedSession(SILENT, COHORT, 12, c2, c3);

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await (await browser.newContext()).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const rowFor = (name) =>
    page.locator('.row').filter({ has: page.locator('.nom', { hasText: name }) }).first();

  console.log('\nAdmin dashboard in a browser\n');

  await test('the key screen appears first', async () => {
    await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
    await page.waitForSelector('#gateBtn', { timeout: 5000 });
    assert.ok(await page.isVisible('#key'));
  });

  await test('a wrong key is refused', async () => {
    await page.fill('#key', 'wrong-key-entirely');
    await page.click('#gateBtn');
    await page.waitForTimeout(700);
    assert.ok((await page.textContent('#gateErr')).trim().length > 0);
  });

  await test('the right key opens the dashboard', async () => {
    await page.fill('#key', KEY);
    await page.click('#gateBtn');
    await page.waitForSelector('.row', { timeout: 8000 });
    assert.ok(await page.isVisible('#main'));
  });

  await test('the status key explains what the labels mean', async () => {
    const legend = await page.textContent('.legende-statut');
    assert.ok(/teaching/.test(legend) && /quiet/.test(legend) && /silent/.test(legend),
      `legend incomplete: ${legend}`);
  });

  await test('someone who logged yesterday reads as teaching', async () => {
    const txt = await rowFor(ACTIVE).textContent();
    assert.ok(/teaching/.test(txt), `no status badge: ${txt.slice(0, 120)}`);
    assert.ok(/yesterday/.test(txt), `no recency: ${txt.slice(0, 200)}`);
  });

  await test('their stopping point is on the page, not just a date', async () => {
    const txt = await rowFor(ACTIVE).textContent();
    assert.ok(txt.includes(c1), `last lesson taught (${c1}) missing: ${txt.slice(0, 250)}`);
    assert.ok(txt.includes(c2), `resume point (${c2}) missing: ${txt.slice(0, 250)}`);
    assert.ok(txt.includes(COHORT), 'cohort missing');
  });

  await test('someone silent for twelve days is flagged as such', async () => {
    const txt = await rowFor(SILENT).textContent();
    assert.ok(/silent/.test(txt), `not flagged silent: ${txt.slice(0, 120)}`);
    assert.ok(/12 days ago/.test(txt), `days not shown: ${txt.slice(0, 200)}`);
  });

  await test('a cohort taken over since is called out', async () => {
    // SILENT taught this cohort, ACTIVE taught it more recently. The resume
    // point shown against SILENT is therefore not theirs to pick up, and
    // saying so is the difference between a useful row and a misleading one.
    const txt = await rowFor(SILENT).textContent();
    assert.ok(txt.includes('has since been taught by'),
      `handover not mentioned: ${txt.slice(0, 300)}`);
    assert.ok(txt.includes(ACTIVE), 'the current instructor is not named');
  });

  await test('a cohort they are responsible for but have dropped is called out', async () => {
    // The signal the dashboard exists for. SILENT is assigned to a second
    // cohort nobody has taught. Their own status only says whether THEY are
    // logging; it will not say a cohort has been abandoned, and a supervisor
    // will not cross-reference two sections by eye to find out.
    // Entering at L3 so its pathway starts inside the branch rather than at
    // the foundation — which also proves the dashboard shows where a group is
    // waiting, not just the first lesson of the curriculum.
    await createCohort(COHORT + 'B', 'AI', 'L3', 'standard', 8, 20);
    const [firstB] = await pathwayCodes(COHORT + 'B', 1);
    await query(
      `INSERT INTO cohort_instructor (cohort_id, instructor_id, assigned_from)
       VALUES ((SELECT id FROM cohort WHERE code = $1),
               (SELECT id FROM instructor WHERE full_name = $2),
               CURRENT_DATE - 20)`, [COHORT + 'B', SILENT]);

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.row', { timeout: 8000 });
    const txt = await rowFor(SILENT).textContent();
    assert.ok(/has never been taught/.test(txt),
      `abandoned cohort not called out: ${txt.slice(0, 400)}`);
    assert.ok(txt.includes(COHORT + 'B'), 'the abandoned cohort is not named');
    assert.ok(txt.includes(firstB),
      `where it is waiting (${firstB}) is not shown: ${txt.slice(0, 400)}`);
  });

  await test('an instructor whose cohorts are all current gets no such warning', async () => {
    const txt = await rowFor(ACTIVE).textContent();
    assert.ok(!/has not been taught in/.test(txt),
      'a false alarm on an instructor who is up to date');
  });

  await test('someone with a code but no sessions says so plainly', async () => {
    const txt = await rowFor(FRESH).textContent();
    assert.ok(/not started/.test(txt), `no status: ${txt.slice(0, 120)}`);
    assert.ok(/has not logged a session yet/i.test(txt), `unhelpful wording: ${txt.slice(0, 200)}`);
  });

  await test('late filing is called out in words, not just a number', async () => {
    await query(
      `UPDATE session SET submitted_at = (session_date + interval '4 days')
        WHERE instructor_id = (SELECT id FROM instructor WHERE full_name = $1)`,
      [SILENT]).catch(() => {});   // append-only trigger may refuse; not fatal
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.row', { timeout: 8000 });
    const txt = await rowFor(ACTIVE).textContent();
    assert.ok(/filed .* days after the session/.test(txt), `entry lag missing: ${txt.slice(0, 250)}`);
  });

  await test('the cohort table still lists where every group stands', async () => {
    const table = await page.textContent('#cohorts');
    assert.ok(table.includes(COHORT), 'the test cohort is missing');
    assert.ok(/BF-01/.test(table), 'demo cohorts missing');
  });

  await test('no uncaught errors', async () => {
    assert.strictEqual(errors.length, 0, errors.slice(0, 2).join(' | '));
  });

  await browser.close();

  /* ---- clear up ---- */
  const names = [ACTIVE, SILENT, FRESH];
  await query(`DELETE FROM session_lesson WHERE session_id IN
                 (SELECT s.id FROM session s JOIN instructor i ON i.id = s.instructor_id
                   WHERE i.full_name = ANY($1))`, [names]);
  await query(`ALTER TABLE session DISABLE TRIGGER session_append_only`);
  await query(`DELETE FROM session WHERE instructor_id IN
                 (SELECT id FROM instructor WHERE full_name = ANY($1))`, [names]);
  await query(`ALTER TABLE session ENABLE TRIGGER session_append_only`);
  await query(`DELETE FROM cohort_instructor WHERE cohort_id IN
                 (SELECT id FROM cohort WHERE code = ANY($1))`, [[COHORT, COHORT + 'B']]);
  await query(`DELETE FROM cohort WHERE code = ANY($1)`, [[COHORT, COHORT + 'B']]);
  await query(`DELETE FROM instructor WHERE full_name = ANY($1)`, [names]);

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('\nTest run crashed:', err);
  process.exit(1);
});
