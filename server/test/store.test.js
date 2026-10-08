/*
 * Device storage tests.
 *
 *   node test/store.test.js
 *
 * These exist because of a bug that reached a deployed app and was only
 * caught by looking at a screenshot of a blank page.
 *
 * IndexedDB returns `undefined` for a key that is not there. The wrapper
 * fell through and returned the IDBRequest object instead, which is
 * truthy. So "is this device signed in?" answered yes on a device that
 * had never signed in, the app skipped its login screen, and then threw
 * while rendering — leaving a header, a status bar, and nothing else.
 *
 * The first test below is that exact case. The rest cover the behaviour
 * the offline design depends on: an entry survives being written, and
 * leaves the queue only when it is explicitly removed.
 */

require('fake-indexeddb/auto');

const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

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

(async () => {
  const mod = await import(
    pathToFileURL(path.join(__dirname, '..', 'public', 'store.js')).href
  );
  const { Store, newId } = mod;

  console.log('\nDevice storage\n');

  /* ---- the bug that shipped ---- */

  await test('a key that was never written reads as null, not an object', async () => {
    const auth = await Store.getAuth();
    assert.strictEqual(auth, null,
      `expected null on a fresh device, got ${typeof auth} — this is the bug ` +
      `that made the app think it was signed in`);
  });

  await test('a missing key is falsy, so "if (!auth)" behaves', async () => {
    const auth = await Store.getAuth();
    assert.ok(!auth, 'a missing value was truthy — the login screen would be skipped');
  });

  await test('a missing cached curriculum also reads as null', async () => {
    assert.strictEqual(await Store.getBootstrap(), null);
  });

  await test('a missing draft reads as null', async () => {
    assert.strictEqual(await Store.getDraft(), null);
  });

  /* ---- round trips ---- */

  await test('a sign-in survives being written and read back', async () => {
    const auth = { token: 'abc.def', instructor: { id: 'i1', name: 'Aminata Ouédraogo' } };
    await Store.setAuth(auth);
    const back = await Store.getAuth();
    assert.strictEqual(back.instructor.name, 'Aminata Ouédraogo');
    assert.strictEqual(back.token, 'abc.def');
  });

  await test('signing out clears the token and it reads as null again', async () => {
    await Store.clearAuth();
    assert.strictEqual(await Store.getAuth(), null);
  });

  await test('a draft survives, including accented French', async () => {
    await Store.setDraft({ flag_note: 'Coupure de courant · déjà signalée' });
    const d = await Store.getDraft();
    assert.strictEqual(d.flag_note, 'Coupure de courant · déjà signalée');
    await Store.clearDraft();
    assert.strictEqual(await Store.getDraft(), null);
  });

  /* ---- the queue, which must never lose anything ---- */

  await test('the queue starts empty', async () => {
    assert.strictEqual(await Store.queueCount(), 0);
    assert.deepStrictEqual(await Store.queueAll(), []);
  });

  const idA = newId();
  const idB = newId();

  await test('a queued entry is there after writing', async () => {
    await Store.queueAdd({ id: idA, payload: { cohort_code: 'BF-01' }, status: 'pending' });
    assert.strictEqual(await Store.queueCount(), 1);
  });

  await test('two entries queue independently', async () => {
    await Store.queueAdd({ id: idB, payload: { cohort_code: 'BF-02' }, status: 'pending' });
    assert.strictEqual(await Store.queueCount(), 2);
  });

  await test('writing the same id twice replaces rather than duplicating', async () => {
    await Store.queueAdd({ id: idA, payload: { cohort_code: 'BF-01' }, status: 'rejected' });
    const all = await Store.queueAll();
    assert.strictEqual(all.filter((e) => e.id === idA).length, 1);
  });

  await test('a rejected entry stays stored but stops counting as pending', async () => {
    // It must remain visible: an entry that vanishes silently gets the
    // instructor blamed for not logging, with no way to trace why.
    const all = await Store.queueAll();
    assert.strictEqual(all.length, 2, 'the rejected entry was dropped');
    assert.strictEqual(await Store.queueCount(), 1, 'a rejected entry still counts as pending');
  });

  await test('an entry leaves the queue only when removed', async () => {
    await Store.queueRemove(idB);
    const all = await Store.queueAll();
    assert.strictEqual(all.length, 1);
    assert.strictEqual(all[0].id, idA);
  });

  /* ---- the resume point, offline ---- */

  await test('a locally saved position is what the next morning reads', async () => {
    await Store.setPosition('BF-01', 'CS-3.4', '2026-09-28');
    const p = await Store.getPositions();
    assert.strictEqual(p['BF-01'].resume_lesson_code, 'CS-3.4');
  });

  await test('the server does not overwrite a newer local position', async () => {
    // A phone offline for a week holds entries the server has not seen.
    // Its own resume point is ahead and must win.
    await Store.mergePositions({
      'BF-01': { resume_lesson_code: 'CS-3.3', last_session_date: '2026-09-20' },
    });
    const p = await Store.getPositions();
    assert.strictEqual(p['BF-01'].resume_lesson_code, 'CS-3.4',
      'the server rolled the device backwards');
  });

  await test('the server does replace an older local position', async () => {
    await Store.mergePositions({
      'BF-01': { resume_lesson_code: 'CS-4.1', last_session_date: '2026-09-30' },
    });
    const p = await Store.getPositions();
    assert.strictEqual(p['BF-01'].resume_lesson_code, 'CS-4.1');
  });

  await test('a cohort the device has never seen is taken from the server', async () => {
    await Store.mergePositions({
      'BF-03': { resume_lesson_code: 'OPS-3.3', last_session_date: '2026-09-25' },
    });
    const p = await Store.getPositions();
    assert.strictEqual(p['BF-03'].resume_lesson_code, 'OPS-3.3');
  });

  /* ---- ids ---- */

  await test('generated ids are unique and correctly shaped', async () => {
    const ids = new Set();
    for (let i = 0; i < 500; i++) ids.add(newId());
    assert.strictEqual(ids.size, 500, 'collision in generated ids');
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    assert.ok(re.test([...ids][0]), 'not a v4 UUID — the server would reject it');
  });

  console.log(`\n  ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('\nTest run crashed:', err);
  process.exit(1);
});
