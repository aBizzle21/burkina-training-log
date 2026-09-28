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

  /* ---- set up an instructor with a known code ---- */
  await query(
    `UPDATE instructor SET login_code = 'TEST-AMINATA'
      WHERE full_name = 'Aminata Ouédraogo'`
  );

  let token = null;

  await test('health check reports the curriculum is loaded', async () => {
    const { status, body } = await call('/health');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.lessons, 83, `expected 83 lessons, got ${body.lessons}`);
  });

  await test('a bad personal code is refused', async () => {
    const { status } = await call('/api/login', {
      method: 'POST', body: JSON.stringify({ code: 'NOT-A-CODE' }),
    });
    assert.strictEqual(status, 401);
  });

  await test('a good personal code returns a token', async () => {
    const { status, body } = await call('/api/login', {
      method: 'POST', body: JSON.stringify({ code: 'TEST-AMINATA' }),
    });
    assert.strictEqual(status, 200);
    assert.ok(body.token, 'no token returned');
    assert.strictEqual(body.instructor.name, 'Aminata Ouédraogo');
    token = body.token;
  });

  await test('the API refuses anyone without a token', async () => {
    const { status } = await call('/api/bootstrap');
    assert.strictEqual(status, 401);
  });

  await test('bootstrap returns the whole curriculum in French', async () => {
    const { status, body } = await call('/api/bootstrap?lang=fr', {}, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.tracks.length, 4);
    const total = body.tracks.reduce((n, t) => n + t.lessons.length, 0);
    assert.strictEqual(total, 83, `expected 83 lessons, got ${total}`);
    const cs = body.tracks.find((t) => t.code === 'CS');
    assert.strictEqual(cs.name, 'Informatique', 'track name not in French');
    assert.ok(cs.lessons[0].objectives.length > 0, 'objectives missing');
  });

  await test('bootstrap returns 304 when nothing has changed', async () => {
    const first = await call('/api/bootstrap?lang=fr', {}, token);
    const etag = first.headers.get('etag');
    assert.ok(etag, 'no ETag header');
    const second = await call('/api/bootstrap?lang=fr',
      { headers: { 'If-None-Match': etag } }, token);
    assert.strictEqual(second.status, 304);
  });

  await test('the handover sheet reads correctly for BF-01', async () => {
    const { status, body } = await call('/api/cohorts/BF-01/position', {}, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.resume_lesson.code, 'CS-3.3',
      `expected CS-3.3, got ${body.resume_lesson.code}`);
    assert.strictEqual(body.track.code, 'CS');
  });

  await test('a cohort with no sessions still returns a starting point', async () => {
    const { status, body } = await call('/api/cohorts/BF-05/position', {}, token);
    assert.strictEqual(status, 200);
    assert.strictEqual(body.resume_lesson.code, 'CS-1.1');
    assert.strictEqual(body.last_session_date, null);
  });

  /* ---- the ingest path ---- */
  const entryId = uuid();
  const entry = {
    id: entryId,
    cohort_code: 'BF-01',
    session_date: '2026-09-02',
    present_count: 12,
    lessons_covered: ['CS-3.3'],
    resume_lesson: 'CS-3.4',
    methods: ['guidee', 'labo'],
    dominant_method: 'labo',
    objectives: [{ code: 'CS-3.3.1', demonstrated: 10 }],
    flag_note: 'Test entry from the smoke test.',
  };

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
    const { body } = await call('/api/cohorts/BF-01/position', {}, token);
    assert.strictEqual(body.resume_lesson.code, 'CS-3.4');
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

  await test('a lesson from the wrong track is rejected with a readable reason', async () => {
    const { status, body } = await call('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ ...entry, id: uuid(), session_date: '2026-09-03',
        lessons_covered: ['SEC-1.1'] }),
    }, token);
    assert.strictEqual(status, 400);
    const why = body.results[0].problems.join(' ');
    assert.ok(/not on the CS track/.test(why), `unhelpful message: ${why}`);
  });

  await test('more demonstrations than learners present is rejected', async () => {
    const { status, body } = await call('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ ...entry, id: uuid(), session_date: '2026-09-04',
        present_count: 5, objectives: [{ code: 'CS-3.3.1', demonstrated: 9 }] }),
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
      lessons_covered: [['CS-3.4'], ['CS-4.1'], ['CS-4.2']][i],
      resume_lesson: ['CS-4.1', 'CS-4.2', 'CS-4.3'][i],
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
    await query(`UPDATE instructor SET ended_on = CURRENT_DATE
                  WHERE full_name = 'Aminata Ouédraogo'`);
    const { status } = await call('/api/bootstrap', {}, token);
    assert.strictEqual(status, 401);
    await query(`UPDATE instructor SET ended_on = NULL
                  WHERE full_name = 'Aminata Ouédraogo'`);
  });

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('\nTest run crashed:', err);
  process.exit(1);
});
