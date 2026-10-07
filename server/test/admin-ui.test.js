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
const SETUP_COHORT = `DS-${RUN}`;

/** Expand one of the dashboard's collapsible panels. */
async function openPanel(page, key) {
  const open = await page.$eval(`details.panneau[data-pan="${key}"]`, (d) => d.open).catch(() => true);
  if (!open) await page.click(`details.panneau[data-pan="${key}"] > summary`);
  await page.waitForTimeout(150);
}

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
    `INSERT INTO cohort (code, site_id, track_id, course_id, entry_level, pace,
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
    await openPanel(page, 'wherethecohort');
    const table = await page.textContent('#cohorts');
    assert.ok(table.includes(COHORT), 'the test cohort is missing');
    assert.ok(/BF-01/.test(table), 'demo cohorts missing');
  });

  /* ---- setting up a cohort, on the page ---- */

  await test('the two consequential choices explain themselves', async () => {
    await openPanel(page, 'setupacohort');
    // Entry level and pace decide what a group is taught, and whoever
    // fills this in has not read the curriculum design. If the options
    // are bare labels, the page is asking for a guess.
    const levels = await page.textContent('#cLevels');
    assert.ok(/Beginner/.test(levels), 'levels not listed');
    assert.ok(/Little or no computer experience/.test(levels),
      `levels offered with no explanation: ${levels.replace(/\s+/g, ' ').slice(0, 160)}`);
    const paces = await page.textContent('#cPaces');
    assert.ok(/Fast track/.test(paces), 'paces not listed');
    assert.ok(/Core only/.test(paces), 'paces offered with no explanation');
  });

  await test('choosing a level and pace shows what it comes to', async () => {
    await openPanel(page, 'setupacohort');
    await page.selectOption('#cBranch', 'OPS');
    await page.click('#cLevels label:nth-child(3)');   // some technical background
    await page.click('#cPaces label:nth-child(3)');    // fast
    await page.waitForFunction(
      () => /lessons/.test(document.getElementById('apercu').textContent),
      null, { timeout: 5000 });
    const txt = (await page.textContent('#apercu')).replace(/\s+/g, ' ');
    assert.ok(/\d+ ?lessons/.test(txt), `no lesson count: ${txt.slice(0, 200)}`);
    assert.ok(/hours of teaching/.test(txt), 'no hours');
    assert.ok(/Starts at/.test(txt), `does not say where they begin: ${txt.slice(0, 200)}`);
  });

  await test('a pathway that is almost empty says so before it is saved', async () => {
    await openPanel(page, 'setupacohort');
    await page.selectOption('#cBranch', 'SEC');
    await page.click('#cLevels label:nth-child(5)');   // advanced
    await page.waitForFunction(
      () => /short course|no lessons/i.test(document.getElementById('apercu').textContent),
      null, { timeout: 5000 });
    const txt = await page.textContent('#apercu');
    assert.ok(/entry level/i.test(txt), `warning does not name the cause: ${txt.slice(0, 200)}`);
  });

  await test('a cohort can be created without touching the database', async () => {
    await openPanel(page, 'setupacohort');
    await page.fill('#cCode', SETUP_COHORT);
    await page.fill('#cEnrolled', '18');
    await page.selectOption('#cBranch', 'DEV');
    await page.click('#cLevels label:nth-child(2)');   // computer literate
    await page.click('#cPaces label:nth-child(2)');    // standard
    await page.waitForTimeout(500);
    await page.click('#cBtn');
    await page.waitForFunction(
      (c) => document.getElementById('cErr').textContent.includes(c),
      SETUP_COHORT, { timeout: 6000 });

    const { rows } = await query(
      `SELECT entry_level, pace,
              (SELECT count(*)::int FROM v_cohort_pathway WHERE cohort_code = $1) AS lessons
         FROM cohort WHERE code = $1`, [SETUP_COHORT]);
    assert.strictEqual(rows.length, 1, 'the cohort was not created');
    assert.strictEqual(rows[0].entry_level, 'L1');
    assert.strictEqual(rows[0].pace, 'standard');
    assert.ok(rows[0].lessons > 0 && rows[0].lessons < 152,
      `it was not given its own pathway: ${rows[0].lessons}`);
  });

  await test('a group with nobody teaching it is called out', async () => {
    await openPanel(page, 'whoisteachingw');
    await page.waitForSelector('.affect', { timeout: 6000 });
    const row = page.locator('.affect').filter({ hasText: SETUP_COHORT }).first();
    assert.ok(/Nobody is assigned/.test(await row.textContent()),
      'a cohort with no instructor looks the same as a covered one');
  });

  await test('assigning someone through the page puts them in front of the group', async () => {
    await openPanel(page, 'whoisteachingw');
    const row = page.locator('.affect').filter({ hasText: SETUP_COHORT }).first();
    await row.locator('select').selectOption({ label: ACTIVE });
    await row.locator('[data-assign]').click();
    await page.waitForFunction(
      (c) => {
        const el = [...document.querySelectorAll('.affect')].find((d) => d.textContent.includes(c));
        return el && !/Nobody is assigned/.test(el.textContent);
      }, SETUP_COHORT, { timeout: 6000 });
    const after = await page.locator('.affect').filter({ hasText: SETUP_COHORT }).first().textContent();
    assert.ok(after.includes(ACTIVE), `the assignment is not shown: ${after.slice(0, 200)}`);
  });

  await test('the tiles answer "is anything wrong" before any scrolling', async () => {
    // The point of the tiles: a supervisor opening this on a phone should
    // not have to scroll past two screens of names to find out that a
    // group has nobody on it.
    await page.waitForSelector('.tuile-k', { timeout: 8000 });
    const tiles = await page.$$eval('.tuile-k', (ns) =>
      ns.map((n) => ({ n: n.querySelector('.n').textContent.trim(),
                       l: n.querySelector('.l').textContent.trim(),
                       alert: n.classList.contains('alerte') })));
    assert.strictEqual(tiles.length, 4, 'expected four tiles');
    assert.ok(tiles.every((t) => /^\d+$/.test(t.n)), 'a tile is not showing a number');
    // "1 groups have nobody" reads as a bug in the page.
    for (const t of tiles) {
      if (t.n === '1') {
        assert.ok(!/\bgroups\b|\binstructors\b|\bhave\b/.test(t.l),
          `tile reads as a plural for one thing: "${t.n} ${t.l}"`);
      }
    }
    assert.ok(tiles.some((t) => t.alert), 'the demo data has problems; no tile says so');
  });

  await test('a tile opens the panel it is about', async () => {
    const cover = page.locator('details.panneau[data-pan="cover"]');
    await page.evaluate(() => {
      const d = document.querySelector('details.panneau[data-pan="cover"]');
      if (d) d.open = false;
    });
    await page.locator('.tuile-k', { hasText: 'cannot finish' }).first().click();
    await page.waitForTimeout(400);
    assert.strictEqual(await cover.evaluate((d) => d.open), true,
      'the tile did not open the panel it points at');
  });

  await test('coverage says where each group runs out of people', async () => {
    await openPanel(page, 'cover');
    await page.waitForSelector('.couv', { timeout: 8000 });
    const txt = (await page.textContent('#couverture')).replace(/\s+/g, ' ');
    assert.ok(/Nobody is assigned/.test(txt),
      `a group with no instructor is not called out: ${txt.slice(0, 200)}`);
    assert.ok(/lessons? of teaching left before/.test(txt),
      `no group reports a distance to its gap: ${txt.slice(0, 250)}`);
    assert.ok(/can take this group to the end/.test(txt),
      'no group reports being fully covered');
  });

  await test('approving a module through the page closes a gap', async () => {
    await openPanel(page, 'approvals');
    await page.waitForSelector('.habil .mod-b', { timeout: 8000 });

    // BF-01's instructor is approved for the first three foundation
    // modules only. Approving the whole foundation should take the group
    // off the "cannot finish" list.
    const before = await page.textContent('#couverture');
    assert.ok(/BF-01/.test(before));

    const row = page.locator('.habil').filter({ hasText: 'Aminata' }).first();
    await row.locator('.tout').first().click();   // "all" on the foundation
    await page.waitForSelector('.couv', { timeout: 8000 });
    await page.waitForTimeout(1200);

    const { rows } = await query(
      `SELECT covered_to_the_end, first_uncovered_module
         FROM v_cohort_coverage WHERE cohort_code = 'BF-01'`);
    assert.ok(rows.length, 'BF-01 vanished from coverage');
    assert.notStrictEqual(rows[0].first_uncovered_module, 'M4',
      'approving the whole foundation left the gap at the same foundation module');
  });

  await test('no uncaught errors', async () => {
    assert.strictEqual(errors.length, 0, errors.slice(0, 2).join(' | '));
  });

  await browser.close();

  /* ---- clear up ---- */

  // Put the demo instructor's approvals back to what the demo data sets.
  // The approval test above deliberately changes them, and leaving them
  // changed would make the next run of this file start from different
  // data — which is how a suite passes once and then fails.
  await query(`DELETE FROM instructor_module WHERE instructor_id IN
                 (SELECT id FROM instructor WHERE full_name = 'Aminata Ouédraogo')`);
  await query(`INSERT INTO instructor_module (instructor_id, module_id)
               SELECT i.id, m.id FROM instructor i, module m
                 JOIN track t ON t.id = m.track_id
                WHERE i.full_name = 'Aminata Ouédraogo'
                  AND t.code = 'F' AND m.code IN ('M1','M2','M3')
               ON CONFLICT DO NOTHING`);

  const names = [ACTIVE, SILENT, FRESH];
  await query(`DELETE FROM session_lesson WHERE session_id IN
                 (SELECT s.id FROM session s JOIN instructor i ON i.id = s.instructor_id
                   WHERE i.full_name = ANY($1))`, [names]);
  await query(`ALTER TABLE session DISABLE TRIGGER session_append_only`);
  await query(`DELETE FROM session WHERE instructor_id IN
                 (SELECT id FROM instructor WHERE full_name = ANY($1))`, [names]);
  await query(`ALTER TABLE session ENABLE TRIGGER session_append_only`);
  await query(`DELETE FROM cohort_instructor WHERE cohort_id IN
                 (SELECT id FROM cohort WHERE code = ANY($1))`, [[COHORT, COHORT + 'B', SETUP_COHORT]]);
  await query(`DELETE FROM cohort WHERE code = ANY($1)`, [[COHORT, COHORT + 'B', SETUP_COHORT]]);
  await query(`DELETE FROM instructor WHERE full_name = ANY($1)`, [names]);

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('\nTest run crashed:', err);
  process.exit(1);
});
