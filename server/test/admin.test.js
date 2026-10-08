/*
 * Admin endpoint tests.
 *
 *   DATABASE_URL=postgresql://... ADMIN_KEY=... node test/admin.test.js
 *
 * The admin key is a real credential — it can issue a sign-in code for
 * anyone. Most of what follows checks that it is actually being enforced,
 * because an admin page that quietly lets anyone in is worse than none.
 */

const assert = require('assert');
const { query } = require('../src/db');

// The server under test is started in this process and reads PORT, so
// set it here — otherwise it listens on 3000 and every request misses.
process.env.PORT = process.env.PORT || '3021';
const BASE = `http://127.0.0.1:${process.env.PORT}`;
const KEY = process.env.ADMIN_KEY;

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

const api = async (path, opts = {}, key = KEY) => {
  const res = await fetch(BASE + '/api/admin' + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(key === null ? {} : { 'X-Admin-Key': key }),
      ...(opts.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
};

(async () => {
  require('../src/index');
  await new Promise((r) => setTimeout(r, 900));

  console.log('\nAdmin endpoints\n');

  await test('no key at all is refused', async () => {
    const { status } = await api('/instructors', {}, null);
    assert.strictEqual(status, 401);
  });

  await test('a wrong key is refused', async () => {
    const { status } = await api('/instructors', {}, 'not-the-key');
    assert.strictEqual(status, 401);
  });

  await test('a key of a different length is refused without throwing', async () => {
    // timingSafeEqual throws on a length mismatch if the lengths are not
    // checked first, which would surface as a 500 rather than a refusal.
    const { status } = await api('/instructors', {}, 'x');
    assert.strictEqual(status, 401);
  });

  await test('the right key lists instructors', async () => {
    const { status, body } = await api('/instructors');
    assert.strictEqual(status, 200);
    assert.ok(body.instructors.length >= 4, 'demo instructors missing');
    const aminata = body.instructors.find((i) => i.full_name === 'Aminata Ouédraogo');
    assert.ok(aminata, 'Aminata not listed');
    assert.strictEqual(typeof aminata.has_code, 'boolean');
    assert.ok(aminata.session_count > 0, 'session count not reported');
  });

  let issued = null;
  let aminataId = null;

  await test('issuing a code returns it once', async () => {
    const list = await api('/instructors');
    aminataId = list.body.instructors.find((i) => i.full_name === 'Aminata Ouédraogo').id;
    const { status, body } = await api(`/instructors/${aminataId}/code`, { method: 'POST' });
    assert.strictEqual(status, 200);
    assert.ok(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(body.code), `odd code shape: ${body.code}`);
    issued = body.code;
  });

  await test('the issued code omits characters that get misread on paper', async () => {
    assert.ok(!/[O0I1S5]/.test(issued), `ambiguous character in ${issued}`);
  });

  await test('the issued code actually signs that instructor in', async () => {
    const res = await fetch(BASE + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: issued }),
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.instructor.name, 'Aminata Ouédraogo');
  });

  await test('reissuing replaces the old code immediately', async () => {
    const { body } = await api(`/instructors/${aminataId}/code`, { method: 'POST' });
    assert.notStrictEqual(body.code, issued);
    const res = await fetch(BASE + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: issued }),
    });
    assert.strictEqual(res.status, 401, 'the superseded code still works');
    issued = body.code;
  });

  let addedId = null;

  await test('adding an instructor creates them with a code', async () => {
    const { status, body } = await api('/instructors', {
      method: 'POST', body: JSON.stringify({ full_name: 'Fatimata Kaboré' }),
    });
    assert.strictEqual(status, 201);
    assert.ok(body.code);
    addedId = body.id;
    const res = await fetch(BASE + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: body.code }),
    });
    assert.strictEqual(res.status, 200);
  });

  await test('an accented name survives the round trip', async () => {
    const { body } = await api('/instructors');
    assert.ok(body.instructors.some((i) => i.full_name === 'Fatimata Kaboré'));
  });

  await test('an empty name is refused', async () => {
    const { status } = await api('/instructors', {
      method: 'POST', body: JSON.stringify({ full_name: ' ' }),
    });
    assert.strictEqual(status, 400);
  });

  await test('recording a departure stops the code working at once', async () => {
    const { status } = await api(`/instructors/${addedId}/departure`,
      { method: 'POST', body: '{}' });
    assert.strictEqual(status, 200);
    const { rows } = await query('SELECT login_code, ended_on FROM instructor WHERE id = $1',
      [addedId]);
    assert.strictEqual(rows[0].login_code, null, 'the code was left in place');
    assert.ok(rows[0].ended_on, 'no departure date recorded');
  });

  await test('a departure deletes nothing of what they logged', async () => {
    const { rows } = await query(
      'SELECT count(*)::int AS n FROM session WHERE instructor_id = $1', [aminataId]);
    await api(`/instructors/${aminataId}/departure`, { method: 'POST', body: '{}' });
    const after = await query(
      'SELECT count(*)::int AS n FROM session WHERE instructor_id = $1', [aminataId]);
    assert.strictEqual(after.rows[0].n, rows[0].n, 'sessions disappeared with the instructor');
  });

  await test("a departure leaves the cohort's resume point alone", async () => {
    // The whole continuity promise: a replacement picks up from the log
    // with no cooperation from the person who left.
    const { rows } = await query(
      `SELECT resume_lesson_code FROM v_cohort_position WHERE cohort_code = 'BF-01'`);
    assert.ok(rows[0].resume_lesson_code, 'BF-01 lost its resume point');
  });

  await test('someone who has left cannot be issued a code', async () => {
    const { status } = await api(`/instructors/${aminataId}/code`, { method: 'POST' });
    assert.strictEqual(status, 404);
  });

  await test('marking a return re-enables them, pending a new code', async () => {
    const { status } = await api(`/instructors/${aminataId}/return`,
      { method: 'POST', body: '{}' });
    assert.strictEqual(status, 200);
    const { rows } = await query('SELECT ended_on, login_code FROM instructor WHERE id = $1',
      [aminataId]);
    assert.strictEqual(rows[0].ended_on, null);
    assert.strictEqual(rows[0].login_code, null, 'an old code came back with them');
  });

  await test('the cohort view reports where each group stands', async () => {
    const { status, body } = await api('/cohorts');
    assert.strictEqual(status, 200);
    const bf01 = body.cohorts.find((c) => c.cohort_code === 'BF-01');
    assert.ok(bf01.resume_lesson_code, 'no resume point for BF-01');

    // A group that has never been taught still has to say where to begin,
    // and where that is depends on the pathway: a cohort entering at L3
    // starts inside its branch, not at the first lesson of the foundation.
    // The expectation is read from the pathway so this stays true when the
    // curriculum changes.
    const bf05 = body.cohorts.find((c) => c.cohort_code === 'BF-05');
    const { rows } = await query(
      `SELECT lesson_code FROM v_cohort_pathway
        WHERE cohort_code = 'BF-05' ORDER BY teaching_order LIMIT 1`);
    assert.ok(rows.length, 'BF-05 has no pathway at all');
    assert.strictEqual(bf05.resume_lesson_code, rows[0].lesson_code,
      'a cohort with no sessions lost its starting point');
  });

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('\nTest run crashed:', err);
  process.exit(1);
});
