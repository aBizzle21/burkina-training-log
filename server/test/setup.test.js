/*
 * Setting up a cohort, through the API the admin page uses.
 *
 *   DATABASE_URL=... ADMIN_KEY=... node test/setup.test.js
 *
 * The point of these endpoints is that nobody writes SQL to start a real
 * group. So what is tested here is mostly refusal: the combinations that
 * would produce a cohort with nothing to teach, a mixed group defined
 * backwards, a duplicate code. Getting those wrong does not throw an
 * error at the person setting it up — it throws one at an instructor
 * standing in front of eighteen learners, weeks later, at a site with no
 * connection.
 *
 * Everything is created under a per-run suffix and cleaned up, so the
 * suite can be run repeatedly against one database.
 */

const assert = require('assert');
const { query } = require('../src/db');
const { sweep } = require('./sweep');

const BASE = `http://127.0.0.1:${process.env.PORT || 3701}`;
const KEY = process.env.ADMIN_KEY;

const RUN = Date.now().toString(36).toUpperCase().slice(-5);
const COHORT = `S${RUN}`;
const SITE = `Site ${RUN}`;
const TEACHER = `Setup Tester ${RUN}`;
// A second person, because the competence tests run after the one that
// records a departure and a departed instructor cannot be approved.
const COACH = `Setup Coach ${RUN}`;

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

const api = async (path, opts = {}) => {
  const res = await fetch(BASE + '/api/admin' + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': KEY, ...(opts.headers || {}) },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

const post = (path, body) =>
  api(path, { method: 'POST', body: JSON.stringify(body) });

(async () => {
  // Clear anything a previous run left behind. A run that was
  // interrupted never reached its teardown, and its leftovers make
  // this one fail somewhere unrelated.
  await sweep(['Setup Tester ', 'Setup Coach '], ['S'], ['Site ']);

  require('../src/index');
  await new Promise((r) => setTimeout(r, 900));

  console.log('\nSetting up a cohort\n');

  let siteId;
  let teacherId;

  await test('the form has everything it needs to render', async () => {
    const { status, body } = await api('/reference');
    assert.strictEqual(status, 200);
    assert.ok(body.levels.length >= 5, 'entry levels missing');
    assert.ok(body.paces.length >= 3, 'paces missing');
    assert.ok(body.courses.length >= 4, 'courses missing');
    // Every level and pace carries its description, because the person
    // choosing has not read the curriculum design.
    assert.ok(body.levels.every((l) => l.desc_en && l.desc_fr),
      'a level has no description to show');
    assert.ok(body.paces.every((p) => p.desc_en && p.desc_fr),
      'a pace has no description to show');
    // The foundation is not a choice — it is what everyone does.
    assert.ok(!body.courses.some((b) => b.code === 'F'),
      'the shared foundation is offered as a course');
  });

  await test('a branch can be added under a country and city, and not twice', async () => {
    const made = await post('/branches',
      { country_code: 'BF', city: 'Testville', name: SITE, region: 'Test' });
    assert.strictEqual(made.status, 201, JSON.stringify(made.body));
    siteId = made.body.id;
    const again = await post('/branches',
      { country_code: 'BF', city: 'Testville', name: SITE });
    assert.strictEqual(again.status, 409, 'a duplicate branch was accepted');
    // The same branch name in a different city is not a clash.
    const other = await post('/branches',
      { country_code: 'BF', city: 'Othertown', name: SITE });
    assert.strictEqual(other.status, 201, 'the same name in another city was refused');
  });

  await test('a branch needs all three of country, city and name', async () => {
    for (const [body, expected] of [
      [{ city: 'Kaya', name: 'Kaya — Centre' }, /country/i],
      [{ country_code: 'BF', name: 'Kaya — Centre' }, /city/i],
      [{ country_code: 'BF', city: 'Kaya' }, /branch name/i],
    ]) {
      const r = await post('/branches', body);
      assert.strictEqual(r.status, 400, `accepted ${JSON.stringify(body)}`);
      assert.ok(expected.test(r.body.error), r.body.error);
    }
  });

  await test('the preview says what a combination actually means', async () => {
    const { status, body } = await api(
      '/pathway-preview?course=OPS&entry_level=L2&pace=fast');
    assert.strictEqual(status, 200);
    assert.ok(body.total_lessons > 0 && body.total_lessons < 152,
      `expected a filtered pathway, got ${body.total_lessons}`);
    assert.ok(body.total_hours > 0, 'no hours');
    assert.ok(body.first_lesson_code, 'no starting lesson');
    assert.strictEqual(body.foundation_lessons + body.course_lessons, body.total_lessons);
  });

  await test('the preview matches what the cohort is actually taught', async () => {
    // If these two ever disagree, the screen is lying at the moment the
    // decision is made, which is the worst possible moment.
    const { body: p } = await api(
      '/pathway-preview?course=DEV&entry_level=L1&pace=standard');
    const made = await post('/cohorts', {
      code: COHORT, site_id: siteId, course: 'DEV', entry_level: 'L1',
      pace: 'standard', enrolled_count: 12,
    });
    assert.strictEqual(made.status, 201, JSON.stringify(made.body));
    const { rows } = await query(
      `SELECT count(*)::int AS n,
              (SELECT lesson_code FROM v_cohort_pathway
                WHERE cohort_code = $1 ORDER BY teaching_order LIMIT 1) AS first
         FROM v_cohort_pathway WHERE cohort_code = $1`, [COHORT]);
    assert.strictEqual(rows[0].n, p.total_lessons,
      `preview said ${p.total_lessons}, the cohort has ${rows[0].n}`);
    assert.strictEqual(rows[0].first, p.first_lesson_code,
      'preview named a different starting lesson');
  });

  await test('a starting point above the curriculum is warned about, not hidden', async () => {
    const { body } = await api('/pathway-preview?course=SEC&entry_level=L4&pace=fast');
    assert.ok(body.warnings.length, 'a three-lesson pathway raised no warning');
    assert.ok(body.warnings.some((w) => /entry level/i.test(w)),
      `the warning does not point at the cause: ${JSON.stringify(body.warnings)}`);
  });

  await test('a mixed group is told how often it will have to split', async () => {
    const { body } = await api(
      '/pathway-preview?course=AI&entry_level=L1&pace=standard&mixed_upper_level=L2');
    assert.ok(body.split_points > 0, 'no split points for a mixed group');
    assert.ok(body.warnings.some((w) => /split/i.test(w)),
      'the split is counted but not explained');
  });

  await test('a duplicate cohort code is refused', async () => {
    const { status } = await post('/cohorts', {
      code: COHORT, site_id: siteId, course: 'DEV', entry_level: 'L1',
      pace: 'standard', enrolled_count: 12,
    });
    assert.strictEqual(status, 409);
  });

  await test('a cohort with no lessons to teach cannot be created', async () => {
    // Nothing in the database stops this row existing; the check is here
    // because the failure it prevents surfaces weeks later and silently.
    const { rows } = await query(
      `SELECT code FROM learner_level ORDER BY rank DESC LIMIT 1`);
    const top = rows[0].code;
    const { body: p } = await api(
      `/pathway-preview?course=DEV&entry_level=${top}&pace=fast`);
    if (p.total_lessons > 0) return;   // curriculum has grown; nothing to assert
    const { status, body } = await post('/cohorts', {
      code: COHORT + 'X', site_id: siteId, course: 'DEV',
      entry_level: top, pace: 'fast', enrolled_count: 10,
    });
    assert.strictEqual(status, 400, 'an empty cohort was created');
    assert.ok(/no lessons/i.test(body.error), body.error);
  });

  await test('a mixed group defined backwards is refused', async () => {
    const { status, body } = await post('/cohorts', {
      code: COHORT + 'B', site_id: siteId, course: 'AI', entry_level: 'L2',
      pace: 'standard', mixed_upper_level: 'L1', enrolled_count: 10,
    });
    assert.strictEqual(status, 400);
    assert.ok(/lowest entrant/i.test(body.error), body.error);
  });

  await test('the obvious mistakes are caught before anything is saved', async () => {
    const bad = [
      [{ site_id: 1, course: 'DEV', entry_level: 'L1', pace: 'standard', enrolled_count: 5 }, /code/i],
      [{ code: 'A B!', site_id: 1, course: 'DEV', entry_level: 'L1', pace: 'standard', enrolled_count: 5 }, /code/i],
      [{ code: COHORT + 'C', site_id: 1, course: 'DEV', entry_level: 'L1', pace: 'standard' }, /enrolled/i],
      [{ code: COHORT + 'D', course: 'DEV', entry_level: 'L1', pace: 'standard', enrolled_count: 5 }, /site/i],
      [{ code: COHORT + 'E', site_id: 1, entry_level: 'L1', pace: 'standard', enrolled_count: 5 }, /course/i],
    ];
    for (const [body, expected] of bad) {
      const r = await post('/cohorts', body);
      assert.strictEqual(r.status, 400, `accepted ${JSON.stringify(body)}`);
      assert.ok(expected.test(r.body.error),
        `unhelpful message for ${JSON.stringify(body)}: ${r.body.error}`);
    }
  });

  await test('an instructor can be put in front of a group', async () => {
    const made = await post('/instructors', { full_name: TEACHER });
    teacherId = made.body.id;
    const a = await post(`/cohorts/${COHORT}/instructors`, { instructor_id: teacherId });
    assert.strictEqual(a.status, 201);
    const { body } = await api(`/cohorts/${COHORT}/instructors`);
    assert.strictEqual(body.assignments.length, 1);
    assert.strictEqual(body.assignments[0].assigned_to, null, 'created already ended');
  });

  await test('the same person is not assigned to the same group twice', async () => {
    const { status } = await post(`/cohorts/${COHORT}/instructors`,
      { instructor_id: teacherId });
    assert.strictEqual(status, 409);
  });

  await test('a handover ends one assignment and keeps the record', async () => {
    const { body: before } = await api(`/cohorts/${COHORT}/instructors`);
    const id = before.assignments[0].id;
    const ended = await post(`/assignments/${id}/end`, {});
    assert.strictEqual(ended.status, 200);

    const again = await post(`/assignments/${id}/end`, {});
    assert.strictEqual(again.status, 404, 'an assignment was ended twice');

    const { body: after } = await api(`/cohorts/${COHORT}/instructors`);
    assert.strictEqual(after.assignments.length, 1, 'the record was deleted');
    assert.ok(after.assignments[0].assigned_to, 'the end date was not kept');
  });

  await test('someone who has left cannot be assigned', async () => {
    await post(`/instructors/${teacherId}/departure`, {});
    const { status } = await post(`/cohorts/${COHORT}/instructors`,
      { instructor_id: teacherId });
    assert.strictEqual(status, 409);
  });

  await test('a new cohort appears in the handover view with its own pathway', async () => {
    const { body } = await api('/cohorts');
    const mine = body.cohorts.find((c) => c.cohort_code === COHORT);
    assert.ok(mine, 'the cohort just created is not in the cohort view');
    assert.strictEqual(mine.entry_level, 'L1');
    assert.strictEqual(mine.pace, 'standard');
    assert.ok(mine.resume_lesson_code, 'it has no starting point');
    assert.ok(mine.total_lessons > 0 && mine.total_lessons < 152,
      `expected its own pathway, got ${mine.total_lessons} of 152`);
  });

  let coachId;

  await test('an instructor is approved per module, not per course', async () => {
    const made = await post('/instructors', { full_name: COACH });
    coachId = made.body.id;
    const ref = await api('/reference');
    const foundation = ref.body.modules.filter((m) => m.course_code === 'F');
    assert.ok(foundation.length >= 5, 'the foundation should have several modules');
    const firstThree = foundation.slice(0, 3).map((m) => m.id);

    const set = await api(`/instructors/${coachId}/modules`,
      { method: 'PUT', body: JSON.stringify({ module_ids: firstThree }) });
    assert.strictEqual(set.status, 200, JSON.stringify(set.body));

    const { body } = await api(`/instructors/${coachId}/modules`);
    assert.deepStrictEqual([...body.module_ids].sort(), [...firstThree].sort());
    const f = body.courses.find((c) => c.course_code === 'F');
    assert.strictEqual(Number(f.modules_approved), 3);
    assert.strictEqual(f.teaches_whole_course, false,
      'three of nine modules should not read as the whole course');
  });

  await test('the list sent replaces what was there, rather than adding to it', async () => {
    // Sending the whole set each time is what keeps the screen and the
    // record from disagreeing. If this ever became additive, removing an
    // approval would silently do nothing.
    const ref = await api('/reference');
    const one = ref.body.modules.filter((m) => m.course_code === 'F').slice(3, 4).map((m) => m.id);
    await api(`/instructors/${coachId}/modules`,
      { method: 'PUT', body: JSON.stringify({ module_ids: one }) });
    const { body } = await api(`/instructors/${coachId}/modules`);
    assert.deepStrictEqual(body.module_ids, one, 'the earlier approvals were not cleared');
  });

  await test('clearing every approval is allowed and means nothing', async () => {
    await api(`/instructors/${coachId}/modules`,
      { method: 'PUT', body: JSON.stringify({ module_ids: [] }) });
    const { body } = await api(`/instructors/${coachId}/modules`);
    assert.strictEqual(body.module_ids.length, 0);
  });

  await test('coverage says where a group runs out of people to teach it', async () => {
    // Put this run's instructor back on the cohort, approved only for the
    // first module of its pathway, and check the gap is reported at the
    // second — with a distance, not just a yes or no.
    await post(`/cohorts/${COHORT}/instructors`, { instructor_id: coachId });
    const { rows: mods } = await query(
      `SELECT DISTINCT m.id, m.code, min(p.teaching_order) AS first_at
         FROM v_cohort_pathway p
         JOIN lesson l ON l.id = p.lesson_id
         JOIN module m ON m.id = l.module_id
        WHERE p.cohort_code = $1
        GROUP BY m.id, m.code ORDER BY first_at`, [COHORT]);
    assert.ok(mods.length >= 2, 'the test cohort needs at least two modules');

    await api(`/instructors/${coachId}/modules`,
      { method: 'PUT', body: JSON.stringify({ module_ids: [mods[0].id] }) });

    const { body } = await api('/coverage');
    const mine = body.cohorts.find((c) => c.cohort_code === COHORT);
    assert.ok(mine, 'the cohort is missing from coverage');
    assert.strictEqual(mine.covered_to_the_end, false);
    assert.strictEqual(mine.first_uncovered_module, mods[1].code,
      'the gap should be at the first module they are not approved for');
    assert.ok(mine.lessons_until_gap >= 0, 'no distance to the gap');
  });

  await test('approving the rest closes the gap', async () => {
    const { rows: all } = await query(
      `SELECT DISTINCT l.module_id FROM v_cohort_pathway p
         JOIN lesson l ON l.id = p.lesson_id WHERE p.cohort_code = $1`, [COHORT]);
    await api(`/instructors/${coachId}/modules`,
      { method: 'PUT', body: JSON.stringify({ module_ids: all.map((r) => r.module_id) }) });
    const { body } = await api('/coverage');
    const mine = body.cohorts.find((c) => c.cohort_code === COHORT);
    assert.strictEqual(mine.covered_to_the_end, true,
      'approved for every module of its pathway, so it should read as covered');
  });

  await test('a group with nobody on it is reported as such', async () => {
    const { body } = await api('/coverage');
    const empty = body.cohorts.filter((c) => c.instructors_assigned === 0);
    for (const c of empty) {
      assert.strictEqual(c.covered_to_the_end, false,
        `${c.cohort_code} has nobody but reads as covered`);
    }
  });

  // ---- clean up, so the suite can run again against this database ----
  await query(`DELETE FROM instructor_module WHERE instructor_id IN
                 (SELECT id FROM instructor WHERE full_name = ANY($1))`, [[TEACHER, COACH]]);
  await query(`DELETE FROM cohort_instructor WHERE cohort_id IN
                 (SELECT id FROM cohort WHERE code LIKE $1)`, [COHORT + '%']);
  await query(`DELETE FROM cohort WHERE code LIKE $1`, [COHORT + '%']);
  await query(`DELETE FROM instructor WHERE full_name = ANY($1)`, [[TEACHER, COACH]]);
  await query(`DELETE FROM site WHERE name = $1`, [SITE]);   // both cities

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('\nTest run crashed:', err);
  process.exit(1);
});
