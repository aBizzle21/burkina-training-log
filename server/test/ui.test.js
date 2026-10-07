/*
 * Browser tests.
 *
 *   DATABASE_URL=postgresql://... node test/ui.test.js
 *
 * These exist because a blank screen reached a deployed app and was only
 * caught by a person looking at it. Everything below drives a real
 * browser against a real server, so "the page renders" is checked rather
 * than assumed.
 *
 * The offline test is the one that matters most: it puts the browser into
 * offline mode mid-session and confirms an entry is still accepted, kept,
 * and sent once the connection returns.
 */

const assert = require('assert');
const { chromium } = require('playwright');
const { query } = require('../src/db');
const { sweep } = require('./sweep');

const BASE = `http://127.0.0.1:${process.env.PORT || 3061}`;
// Each run gets its own instructor and its own code.
//
// The server refuses a second original entry for the same cohort, day and
// instructor — correctly, since that is almost always a duplicate the
// device failed to spot. A shared instructor would therefore make the
// second run of this file fail, which looks like a product bug and is not
// one. A fresh instructor per run has no history to collide with.
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const NAME = `UI Test ${RUN}`;
const CODE = `UITEST-${RUN}`;
const DATE_ONLINE = '2026-11-02';
const DATE_OFFLINE = '2026-11-03';

/** Expand one of the form's collapsible sections. */
async function openSection(page, key) {
  const open = await page.$eval(`.pli[data-sec="${key}"]`, (d) => d.open).catch(() => true);
  if (!open) await page.click(`.pli[data-sec="${key}"] > summary`);
  await page.waitForTimeout(150);
}

/**
 * Wait for something asynchronous to become true.
 *
 * These assertions used to follow a fixed sleep — save, wait 2.5 seconds,
 * then check the database. That passes on an idle machine and fails when
 * the suite runs straight after the browser tests, which leave Postgres
 * busy: the work completes, just not inside the guess. It showed up as
 * three failures at once, roughly one run in twenty, and looked for all
 * the world like an intermittent fault in the product.
 *
 * Polling makes the ceiling generous without making the common case slow,
 * and a failure now means the thing genuinely did not happen rather than
 * did not happen quickly enough.
 */
async function waitFor(check, { timeout = 20000, every = 200 } = {}) {
  const until = Date.now() + timeout;
  let last;
  for (;;) {
    last = await check();
    if (last) return last;
    if (Date.now() > until) return last;
    await new Promise((r) => setTimeout(r, every));
  }
}

/** Has this instructor's entry for one date reached the database? */
async function arrived(date, name) {
  const { rows } = await query(
    `SELECT count(*)::int AS n FROM v_session_current s
       JOIN cohort c ON c.id = s.cohort_id
       JOIN instructor i ON i.id = s.instructor_id
      WHERE c.code = 'BF-01' AND s.session_date = $1 AND i.full_name = $2`,
    [date, name]);
  return rows[0].n;
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

(async () => {
  // Clear anything a previous run left behind. A run that was
  // interrupted never reached its teardown, and its leftovers make
  // this one fail somewhere unrelated.
  await sweep(['UI Test '], [], []);

  require('../src/index');
  await new Promise((r) => setTimeout(r, 900));
  await query(
    `INSERT INTO instructor (full_name, login_code, started_on)
     VALUES ($1, $2, CURRENT_DATE)`, [NAME, CODE]);

  // Put them on BF-01 and approve them for everything. The app now shows
  // an instructor only the groups they are assigned to, which is the
  // point of the change — but it means a test instructor with no
  // assignment sees an empty form, and every assertion below would fail
  // for a reason that has nothing to do with what it is testing.
  await query(
    `INSERT INTO cohort_instructor (cohort_id, instructor_id, assigned_from)
     SELECT c.id, i.id, CURRENT_DATE FROM cohort c, instructor i
      WHERE c.code = 'BF-01' AND i.full_name = $1`, [NAME]);
  await query(
    `INSERT INTO instructor_module (instructor_id, module_id)
     SELECT i.id, m.id FROM instructor i, module m
      WHERE i.full_name = $1 ON CONFLICT DO NOTHING`, [NAME]);

  // Use whatever Chromium this machine already has rather than downloading
  // one. CHROMIUM_PATH lets CI point somewhere else.
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ locale: 'fr-FR' });
  const page = await ctx.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  console.log('\nInstructor app in a browser\n');

  await test('the sign-in screen renders, in French', async () => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForSelector('#loginBtn', { timeout: 5000 });
    const intro = await page.textContent('#login p');
    assert.ok(/code personnel/i.test(intro), `unexpected intro: ${intro}`);
  });

  await test('both languages are offered by name, not as a switch', async () => {
    const labels = await page.$$eval('[data-lang]', (els) => els.map((e) => e.textContent.trim()));
    assert.deepStrictEqual(labels, ['Français', 'English']);
    const pressed = await page.$$eval('[data-lang]', (els) =>
      els.map((e) => e.getAttribute('aria-pressed')));
    assert.deepStrictEqual(pressed, ['true', 'false'], 'French should be the default');
  });

  await test('one click puts the sign-in screen into English', async () => {
    await page.click('[data-lang="en"]');
    await page.waitForTimeout(200);
    const intro = await page.textContent('#login p');
    assert.ok(/personal code/i.test(intro), `still not English: ${intro}`);
    assert.strictEqual(await page.getAttribute('html', 'lang'), 'en');
  });

  await test('one click puts it back to French', async () => {
    await page.click('[data-lang="fr"]');
    await page.waitForTimeout(200);
    const intro = await page.textContent('#login p');
    assert.ok(/code personnel/i.test(intro));
  });

  await test('a wrong code is refused with a readable message', async () => {
    await page.fill('#code', 'NOPE-NOPE');
    await page.click('#loginBtn');
    await page.waitForTimeout(600);
    const err = await page.textContent('#loginErr');
    assert.ok(err.trim().length > 0, 'no message shown');
  });

  await test('a good code signs in and the form actually renders', async () => {
    await page.fill('#code', CODE);
    await page.click('#loginBtn');
    await page.waitForSelector('#btnSave', { timeout: 10000 });
    // The failure this catches: header present, form empty.
    const cards = await page.$$('.position');
    assert.strictEqual(cards.length, 1, 'the resume stamp did not render');
    const who = await page.textContent('#who');
    assert.ok(who.includes(NAME), `instructor name missing: "${who}"`);
  });

  await test('the resume stamp shows where BF-01 actually stopped', async () => {
    // Read the expectation from the database rather than hardcoding it.
    // This test saves sessions further down, so a fixed lesson code would
    // pass on a clean database and fail on every run after that — which
    // is a test problem masquerading as a product one.
    const { rows } = await query(
      `SELECT resume_lesson_code FROM v_cohort_position WHERE cohort_code = 'BF-01'`);
    const expected = rows[0].resume_lesson_code;
    const lesson = await page.textContent('.position .lecon');
    assert.ok(lesson.includes(expected), `expected ${expected}, got: ${lesson}`);
    assert.strictEqual(await page.getAttribute('.position', 'data-stamp'), 'REPRISE');
  });

  await test('switching language inside the app translates the whole form', async () => {
    assert.ok(/Séance du jour/.test(await page.textContent('#heading')));
    await page.click('.langfoot [data-lang="en"]');
    await page.waitForTimeout(300);
    assert.ok(/Today's session/.test(await page.textContent('#heading')));
    assert.strictEqual(await page.getAttribute('.position', 'data-stamp'), 'RESUME');
    const label = await page.textContent('label[for="fPresents"]');
    assert.ok(/Learners present/.test(label), `form label not translated: ${label}`);
  });

  await test('lesson titles come from the database in the chosen language', async () => {
    const { rows } = await query(
      `SELECT l.title_en, l.title_fr
         FROM v_cohort_position p JOIN lesson l ON l.code = p.resume_lesson_code
        WHERE p.cohort_code = 'BF-01'`);
    const { title_en, title_fr } = rows[0];

    const en = await page.textContent('.position .lecon');
    assert.ok(en.includes(title_en), `expected "${title_en}", got: ${en}`);

    await page.click('.langfoot [data-lang="fr"]');
    await page.waitForTimeout(300);
    const fr = await page.textContent('.position .lecon');
    assert.ok(fr.includes(title_fr), `expected "${title_fr}", got: ${fr}`);
    assert.notStrictEqual(title_en, title_fr, 'the two languages are identical here');
  });

  await test('the language choice survives a reload', async () => {
    await page.click('.langfoot [data-lang="en"]');
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#btnSave', { timeout: 10000 });
    assert.ok(/Today's session/.test(await page.textContent('#heading')),
      'the app forgot the chosen language');
    await page.click('.langfoot [data-lang="fr"]');
    await page.waitForTimeout(300);
  });

  await test('an entry saves and reaches the database', async () => {
    await page.fill('#fDate', DATE_ONLINE);
    await page.fill('#fPresents', '11');
    await page.click('.lecons .ligne.prevue');       // tick the planned lesson
    await page.waitForTimeout(250);
    // Methods live in a section that starts collapsed, as they do for a
    // real instructor.
    await openSection(page, 'methodes');
    await page.click('.puce[data-methode="guidee"]');
    await page.waitForTimeout(250);
    await page.click('#btnSave');

    const n = await waitFor(() => arrived(DATE_ONLINE, NAME).then((x) => x === 1 && x));
    assert.strictEqual(n, 1, 'the entry never reached the database');
  });

  await test('an entry made offline is still accepted and kept', async () => {
    await ctx.setOffline(true);
    await page.waitForTimeout(400);

    await page.fill('#fDate', DATE_OFFLINE);
    await page.fill('#fPresents', '9');
    await page.click('.lecons .ligne.prevue');
    await page.waitForTimeout(250);
    await openSection(page, 'methodes');
    await page.click('.puce[data-methode="labo"]');
    await page.waitForTimeout(250);
    await page.click('#btnSave');
    await waitFor(async () =>
      /BF-01/.test(await page.textContent('#queue').catch(() => '')));

    // It must say saved, and it must be visible in the queue.
    const queue = await page.textContent('#queue');
    assert.ok(/BF-01/.test(queue), 'the offline entry is not in the queue');
    const bar = await page.textContent('#barText');
    assert.ok(/attente|waiting|Hors ligne|Offline/i.test(bar),
      `the bar does not report the backlog: "${bar}"`);
  });

  await test('the offline entry is sent once the connection returns', async () => {
    await ctx.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    const n = await waitFor(() => arrived(DATE_OFFLINE, NAME).then((x) => x === 1 && x));
    assert.strictEqual(n, 1, 'the queued entry never arrived');
  });

  await test('the queue empties itself after sending', async () => {
    await waitFor(async () => {
      const h = await page.$eval('#queue', (el) => el.classList.contains('hidden'));
      if (h) return true;
      return !/BF-01/.test(await page.textContent('#queue'));
    });
    const hidden = await page.$eval('#queue', (el) => el.classList.contains('hidden'));
    const text = hidden ? '' : await page.textContent('#queue');
    // When this fails, the useful question is why the server refused the
    // entry — "still listed as waiting" says nothing a person can act on,
    // and the answer is sitting in the queue item's own rejection reason.
    const why = hidden ? '' : await page.evaluate(() =>
      [...document.querySelectorAll('#queue .why')].map((e) => e.textContent.trim()).join(' | '));
    assert.ok(hidden || !/BF-01/.test(text),
      `the sent entry is still listed as waiting${why ? ' — the server said: ' + why : ''}`);
  });

  await test('no uncaught errors anywhere in that run', async () => {
    const real = errors.filter((e) =>
      // The 401 is the deliberate wrong-code test above.
      !/\b401\b|Unauthorized/i.test(e) &&
      // Google Fonts is unreachable from this container. The stylesheet
      // already declares system fallbacks and loads with display=swap, so
      // a blocked font does not stop the page rendering — which is worth
      // knowing, since it will also be slow or blocked in the field.
      !/fonts\.(googleapis|gstatic)|ERR_TUNNEL_CONNECTION_FAILED/i.test(e) &&
      !/favicon|manifest|\b404\b/i.test(e)
    );
    assert.strictEqual(real.length, 0, `console errors: ${real.slice(0, 3).join(' | ')}`);
  });

  await test('an entry the server refused can be cleared off the screen', async () => {
    // A rejected entry is never retried, so if it cannot be dismissed it
    // sits on the instructor's screen for the rest of the programme. The
    // entry is planted directly rather than provoked, because what is
    // being tested is the way out, not the way in.
    await page.evaluate(async () => {
      const { Store } = await import('/store.js');
      await Store.queueAdd({
        id: 'ffffffff-ffff-4fff-bfff-ffffffffffff',
        status: 'rejected',
        problems: ['A pretend reason, for the test.'],
        payload: {
          cohort_code: 'BF-01', session_date: '2026-11-09',
          lessons_covered: ['F-1.1'], present_count: 1,
        },
      });
      window.dispatchEvent(new Event('queue-changed'));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#queue [data-drop]', { timeout: 6000 });

    const before = await page.textContent('#queue');
    assert.ok(/2026-11-09/.test(before), 'the rejected entry is not shown at all');
    assert.ok(/pretend reason/i.test(before),
      'a refused entry does not say why, so nobody can act on it');

    await page.click('#queue [data-drop]');
    await page.waitForTimeout(600);
    const hidden = await page.$eval('#queue', (el) => el.classList.contains('hidden'));
    const after = hidden ? '' : await page.textContent('#queue');
    assert.ok(!/2026-11-09/.test(after), 'the entry could not be cleared');
  });

  await browser.close();

  // Remove this run's instructor and their sessions, so a test database
  // does not fill up with them. Sessions are append-only for instructors,
  // but a direct delete here is fine: this is test scaffolding, not an
  // instructor correcting their own entry.
  await query(`DELETE FROM session_objective WHERE session_id IN
                 (SELECT s.id FROM session s JOIN instructor i ON i.id = s.instructor_id
                   WHERE i.full_name = $1)`, [NAME]);
  await query(`DELETE FROM session_method WHERE session_id IN
                 (SELECT s.id FROM session s JOIN instructor i ON i.id = s.instructor_id
                   WHERE i.full_name = $1)`, [NAME]);
  await query(`DELETE FROM session_lesson WHERE session_id IN
                 (SELECT s.id FROM session s JOIN instructor i ON i.id = s.instructor_id
                   WHERE i.full_name = $1)`, [NAME]);
  await query(`ALTER TABLE session DISABLE TRIGGER session_append_only`);
  await query(`DELETE FROM session WHERE instructor_id IN
                 (SELECT id FROM instructor WHERE full_name = $1)`, [NAME]);
  await query(`ALTER TABLE session ENABLE TRIGGER session_append_only`);
  await query(`DELETE FROM cohort_instructor WHERE instructor_id IN
                 (SELECT id FROM instructor WHERE full_name = $1)`, [NAME]);
  await query(`DELETE FROM instructor_module WHERE instructor_id IN
                 (SELECT id FROM instructor WHERE full_name = $1)`, [NAME]);
  await query(`DELETE FROM instructor WHERE full_name = $1`, [NAME]);

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('\nTest run crashed:', err);
  process.exit(1);
});
