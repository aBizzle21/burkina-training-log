/*
 * End-to-end test.
 *
 *   DATABASE_URL=postgresql://... node test/smoke.js
 *
 * Starts the server against a real database and walks the path an
 * instructor's phone actually takes. The tests that matter most are the
 * retry ones — a phone on a bad connection sends the same entry twice,
 * and if that creates two sessions the whole record is wrong in a way
 * nobody can untangle later.
 *
 * Exits non-zero on any failure.
 */

const assert = require('assert');
const { query } = require('../src/db');

const BASE = `http://127.0.0.1:${process.env.PORT || 3011}`;

// Each run gets its own instructor.
//
// The server refuses a second original entry for the same cohort, day and
// instructor — correctly, since that is nearly always a duplicate. Sharing
// the demo instructor meant this file passed once and then failed against
// its own leftovers, which reads as a product bug and is not one.
const RUN = Date.now().toString(36).toUpperCase().slice(-6);
const NAME = `API Test ${RUN}`;
const CODE = `APITEST-${RUN}`;
// Its own cohort too. Writing into a demo cohort moves that cohort's
// resume point, so any later assertion about where BF-01 stands depends on
// how many times this file has been run. A cohort of its own makes the
// resume-point assertions mean something.
const COHORT = `T-${RUN}`;
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
    failed++;
  }
}

const call = async (path, opts = {}, token = null) => {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, headers: res.headers };
};

const uuid = () => require('crypto').randomUUID();

(async () => {
  require('../src/index');
  await new Promise((r) => setTimeout(r, 900));

  console.log('\nTraining log — end to end\n');

  /* ---- an instructor for this run alone ---- */
  await query(
    `INSERT INTO instructor (full_name, login_code, started_on)
     VALUES ($1, $2, CURRENT_DATE)`, [NAME, CODE]);
  await query(
    `INSERT INTO cohort (code, site_id, track_id, enrolled_count, started_on, status)
     VALUES ($1,
             (SELECT id FROM site ORDER BY id LIMIT 1),
             (SELECT id FROM track WHERE code = 'DEV'),
             20, CURRENT_DATE, 'active')`, [COHORT]);
  // the test cohort needs a pathway, like any real one
  await query(
    `UPDATE cohort SET branch_id = (SELECT id FROM track WHERE code = 'DEV'),
                       entry_level = 'L0', pace = 'standard'
      WHERE code = $1`, [COHORT]);

  let token = null;

  await test('health check reports the curriculum is loaded', async () => {
    const { status, body } = await call('/health');
    assert.strictEqual(status, 200);
    const expected = (await query(
      `SELECT count(*)::int AS n FROM lesson WHERE retired_on IS NULL`)).rows[0].n;
    assert.strictEqual(body.lessons, expected,
      `health reports ${body.lessons} lessons, database has ${expected}`);
  });

  await test('a bad personal code is refused', async () => {
    const { status } = await call('/api/login', {
      method: 'POST', body: JSON.stringify({ code: 'NOT-A-CODE' }),
    });
    assert.strictEqual(status, 401);
  });

  await test('a good personal code returns a token', async () => {
    const { status, body } = await call('/api/login', {
      method: 'POST', body: JSON.stringify({ code: CODE }),
    });
    assert.strictEqual(status, 200);
    assert.ok(body.token, 'no token returned');
    assert.strictEqual(body.instructor.name, NAME);
    token = body.token;
  });

  await test('the API refuses anyone without a token', async () => {
    const { status } = await call('/api/bootstrap');
    assert.strictEqual(status, 401);
  });

  await test('bootstrap returns each cohort its own pathway, not the whole curriculum', async () => {
    const { status, body } = await call('/api/bootstrap', {}, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.tracks.length, 5, 'foundation plus four branches');

    const mine = body.cohorts.find((c) => c.code === COHORT);
    assert.ok(mine, 'the test cohort is missing');
    const whole = await query(`SELECT count(*)::int AS n FROM lesson WHERE retired_on IS NULL`);
    assert.ok(mine.lessons.length > 0, 'the cohort has no lessons');
    assert.ok(mine.lessons.length < whole.rows[0].n,
      'the cohort was given the entire curriculum instead of its pathway');
    assert.ok(body.cohorts.length > 0, 'no cohorts returned');
    const c0 = body.cohorts.find((c) => c.lessons.length);
    assert.ok(c0, 'no cohort carries a lesson ladder');
    assert.ok(c0.lessons[0].objectives.length > 0, 'objectives missing');
  });

  await test('every string arrives in both languages', async () => {
    // Both, not one — so a phone can switch language with no connection.
    // The moment someone finds they are in the wrong language is exactly
    // the moment they are least likely to have a signal.
    const { body } = await call('/api/bootstrap', {}, token);
    const c0 = body.cohorts.find((c) => c.lessons.length);
    const lesson = c0.lessons[0];
    assert.ok(lesson.title.fr && lesson.title.en, 'lesson title missing a language');
    assert.notStrictEqual(lesson.title.fr, lesson.title.en, 'both languages identical');
    assert.ok(lesson.module.title.fr && lesson.module.title.en);
    assert.ok(lesson.objectives[0].text.fr && lesson.objectives[0].text.en);

    const guided = body.methods.find((m) => m.code === 'guidee');
    assert.strictEqual(guided.name.fr, 'Pratique guidée');
    assert.strictEqual(guided.name.en, 'Guided practice');

    assert.ok(body.disruptions[0].label.fr && body.disruptions[0].label.en);
  });

  await test('bootstrap returns 304 when nothing has changed', async () => {
    const first = await call('/api/bootstrap', {}, token);
    const etag = first.headers.get('etag');
    assert.ok(etag, 'no ETag header');
    const second = await call('/api/bootstrap',
      { headers: { 'If-None-Match': etag } }, token);
    assert.strictEqual(second.status, 304);
  });

  await test('the handover sheet matches what the database says', async () => {
    const { rows } = await query(
      `SELECT resume_lesson_code FROM v_cohort_position WHERE cohort_code = 'BF-01'`);
    const { status, body } = await call('/api/cohorts/BF-01/position', {}, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.resume_lesson.code, rows[0].resume_lesson_code);
    assert.ok(body.track.code, 'no track reported');
  });

  /* ---- the ingest path ---- */
  // Read the lesson codes out of the cohort's own pathway rather than
  // hardcoding them. Hardcoded codes break silently every time the
  // curriculum is restructured, and report it as a product failure.
  const pw = await query(
    `SELECT lesson_code, teaching_order FROM v_cohort_pathway
      WHERE cohort_code = $1 ORDER BY teaching_order LIMIT 8`, [COHORT]);
  const L = pw.rows.map((r) => r.lesson_code);
  const firstObj = await query(
    `SELECT o.code FROM objective o JOIN lesson l ON l.id = o.lesson_id
      WHERE l.code = $1 ORDER BY o.position LIMIT 1`, [L[0]]);

  const entryId = uuid();
  const entry = {
    id: entryId,
    cohort_code: COHORT,
    session_date: '2026-09-02',
    present_count: 12,
    lessons_covered: [L[0]],
    resume_lesson: L[1],
    methods: ['guidee', 'labo'],
    dominant_method: 'labo',
    objectives: [{ code: firstObj.rows[0].code, demonstrated: 10 }],
    flag_note: 'Test entry from the smoke test.',
  };

  await test('a cohort with no sessions starts at the first lesson of its own pathway', async () => {
    const { status, body } = await call(`/api/cohorts/${COHORT}/position`, {}, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.resume_lesson.code, L[0]);
    assert.strictEqual(body.last_session_date, null);
  });

  await test('a well-formed session is stored', async () => {
    const { status, body } = await call('/api/sessions',
      { method: 'POST', body: JSON.stringify(entry) }, token);
    assert.strictEqual(status, 201);
    assert.strictEqual(body.results[0].status, 'stored');
  });

  await test('sending the same entry again is recognised, not duplicated', async () => {
    const { status, body } = await call('/api/sessions',
      { method: 'POST', body: JSON.stringify(entry) }, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.results[0].status, 'already_received');

    const { rows } = await query('SELECT count(*)::int AS n FROM session WHERE id = $1', [entryId]);
    assert.strictEqual(rows[0].n, 1, 'the retry created a second row');
  });

  await test('the resume point moved after the session landed', async () => {
    const { body } = await call(`/api/cohorts/${COHORT}/position`, {}, token);
    assert.strictEqual(body.resume_lesson.code, L[1]);
  });

  await test('a second original entry for the same cohort-day is blocked', async () => {
    const { status, body } = await call('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ ...entry, id: uuid() }),
    }, token);
    assert.strictEqual(status, 400);
    assert.strictEqual(body.results[0].status, 'duplicate_day');
    assert.ok(body.results[0].existing_session_id, 'the existing session was not named');
  });

  await test('a lesson outside the pathway is rejected with a readable reason', async () => {
    const { status, body } = await call('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ ...entry, id: uuid(), session_date: '2026-09-03',
        lessons_covered: ['SEC-1.1'] }),
    }, token);
    assert.strictEqual(status, 400);
    const why = body.results[0].problems.join(' ');
    assert.ok(/not in .* pathway/.test(why), `unhelpful message: ${why}`);
    assert.ok(/entered at L0/.test(why), 'the message does not say why it is excluded');
  });

  await test('more demonstrations than learners present is rejected', async () => {
    const { status, body } = await call('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ ...entry, id: uuid(), session_date: '2026-09-04',
        present_count: 5, objectives: [{ code: firstObj.rows[0].code, demonstrated: 9 }] }),
    }, token);
    assert.strictEqual(status, 400);
    assert.ok(/only 5 were present/.test(body.results[0].problems.join(' ')));
  });

  await test('a client-supplied submitted_at is refused', async () => {
    const { status, body } = await call('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ ...entry, id: uuid(), session_date: '2026-09-05',
        submitted_at: '2020-01-01T00:00:00Z' }),
    }, token);
    assert.strictEqual(status, 400);
    assert.ok(/set by the server/.test(body.results[0].problems.join(' ')));
  });

  await test('a batch of three days sends in one request', async () => {
    const batch = ['2026-09-08', '2026-09-09', '2026-09-10'].map((d, i) => ({
      ...entry, id: uuid(), session_date: d,
      lessons_covered: [L[1 + i]],
      resume_lesson: L[2 + i],
      objectives: [],
    }));
    const { status, body } = await call('/api/sessions',
      { method: 'POST', body: JSON.stringify(batch) }, token);
    assert.strictEqual(status, 201);
    assert.strictEqual(body.stored, 3, `stored ${body.stored} of 3`);
  });

  await test('a correction supersedes rather than overwriting', async () => {
    const correction = {
      ...entry, id: uuid(), present_count: 13, supersedes_id: entryId,
    };
    const { status, body } = await call('/api/sessions',
      { method: 'POST', body: JSON.stringify(correction) }, token);
    assert.strictEqual(status, 201);
    assert.strictEqual(body.results[0].status, 'stored');

    const { rows } = await query(
      'SELECT superseded_by_id FROM session WHERE id = $1', [entryId]);
    assert.strictEqual(rows[0].superseded_by_id, correction.id);

    const live = await query(
      'SELECT count(*)::int AS n FROM v_session_current WHERE id = $1', [entryId]);
    assert.strictEqual(live.rows[0].n, 0, 'the superseded row is still live');
  });

  await test('the CSV export carries a byte order mark for Excel', async () => {
    const res = await fetch(BASE + '/api/export.csv', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res.status, 200);

    // Read raw bytes, not text(): fetch's UTF-8 decoder strips a leading
    // BOM, so reading as text would report it missing when it is present.
    const bytes = new Uint8Array(await res.clone().arrayBuffer());
    assert.ok(
      bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf,
      'no BOM — Excel will mangle the accents'
    );
    const text = await res.text();
    assert.ok(text.includes('entry_lag_days'), 'entry lag column missing');
    assert.ok(/Ouédraogo/.test(text), 'accented name missing from export');
  });

  await test('an instructor who has left can no longer file', async () => {
    await query(`UPDATE instructor SET ended_on = CURRENT_DATE WHERE full_name = $1`, [NAME]);
    const { status } = await call('/api/bootstrap', {}, token);
    assert.strictEqual(status, 401);
    await query(`UPDATE instructor SET ended_on = NULL WHERE full_name = $1`, [NAME]);
  });

  /* ---- clear up after this run ---- */
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
  await query(`UPDATE session SET superseded_by_id = NULL WHERE instructor_id IN
                 (SELECT id FROM instructor WHERE full_name = $1)`, [NAME]);
  await query(`DELETE FROM session WHERE instructor_id IN
                 (SELECT id FROM instructor WHERE full_name = $1)`, [NAME]);
  await query(`ALTER TABLE session ENABLE TRIGGER session_append_only`);
  await query(`DELETE FROM cohort_instructor WHERE cohort_id IN
                 (SELECT id FROM cohort WHERE code = $1)`, [COHORT]);
  await query(`DELETE FROM cohort WHERE code = $1`, [COHORT]);
  await query(`DELETE FROM instructor WHERE full_name = $1`, [NAME]);

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('\nTest run crashed:', err);
  process.exit(1);
});
