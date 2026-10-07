/*
 * Clear out what a previous run of a suite left behind.
 *
 * Every suite here cleans up after itself at the end. That is not enough:
 * a run that is interrupted — a timeout, a killed terminal, a crash in
 * the middle — never reaches its teardown, and leaves an instructor still
 * assigned to a demo cohort.
 *
 * The next run then fails somewhere that has nothing to do with what it
 * was testing. A leftover instructor approved for every module makes a
 * cohort read as fully covered; a leftover session moves a resume point.
 * It looks exactly like an intermittent product fault, which is how a day
 * disappears: the suite passes on its own, fails in a batch, and the
 * difference is invisible because the evidence is in a database nobody
 * thought to look at.
 *
 * So each suite sweeps its own fixtures by name prefix before it starts,
 * and a run is then independent of how the last one ended.
 *
 * Only ever matches the test naming patterns. Demo data and anything real
 * are untouched, which is why this takes explicit prefixes rather than
 * anything resembling "delete the recent rows".
 */

const { query } = require('../src/db');

/**
 * @param {string[]} instructorPrefixes e.g. ['UI Test ', 'Dash ']
 * @param {string[]} cohortPrefixes     e.g. ['D-', 'DS-']
 * @param {string[]} sitePrefixes       e.g. ['Site ']
 */
async function sweep(instructorPrefixes = [], cohortPrefixes = [], sitePrefixes = []) {
  const likeI = instructorPrefixes.map((p) => p + '%');
  const likeC = cohortPrefixes.map((p) => p + '%');
  const likeS = sitePrefixes.map((p) => p + '%');

  if (likeI.length) {
    // Sessions are append-only for instructors; a direct delete is fine
    // here because this is test scaffolding, not a correction.
    await query(
      `DELETE FROM session_objective WHERE session_id IN
         (SELECT s.id FROM session s JOIN instructor i ON i.id = s.instructor_id
           WHERE i.full_name LIKE ANY($1))`, [likeI]);
    await query(
      `DELETE FROM session_method WHERE session_id IN
         (SELECT s.id FROM session s JOIN instructor i ON i.id = s.instructor_id
           WHERE i.full_name LIKE ANY($1))`, [likeI]);
    await query(
      `DELETE FROM session_lesson WHERE session_id IN
         (SELECT s.id FROM session s JOIN instructor i ON i.id = s.instructor_id
           WHERE i.full_name LIKE ANY($1))`, [likeI]);
    await query(`ALTER TABLE session DISABLE TRIGGER session_append_only`);
    await query(
      `DELETE FROM session WHERE instructor_id IN
         (SELECT id FROM instructor WHERE full_name LIKE ANY($1))`, [likeI]);
    await query(`ALTER TABLE session ENABLE TRIGGER session_append_only`);
    await query(
      `DELETE FROM cohort_instructor WHERE instructor_id IN
         (SELECT id FROM instructor WHERE full_name LIKE ANY($1))`, [likeI]);
    await query(
      `DELETE FROM instructor_module WHERE instructor_id IN
         (SELECT id FROM instructor WHERE full_name LIKE ANY($1))`, [likeI]);
    await query(`DELETE FROM instructor WHERE full_name LIKE ANY($1)`, [likeI]);
  }

  if (likeC.length) {
    await query(
      `DELETE FROM cohort_instructor WHERE cohort_id IN
         (SELECT id FROM cohort WHERE code LIKE ANY($1))`, [likeC]);
    await query(`ALTER TABLE session DISABLE TRIGGER session_append_only`);
    await query(
      `DELETE FROM session_objective WHERE session_id IN
         (SELECT s.id FROM session s JOIN cohort c ON c.id = s.cohort_id
           WHERE c.code LIKE ANY($1))`, [likeC]);
    await query(
      `DELETE FROM session_method WHERE session_id IN
         (SELECT s.id FROM session s JOIN cohort c ON c.id = s.cohort_id
           WHERE c.code LIKE ANY($1))`, [likeC]);
    await query(
      `DELETE FROM session_lesson WHERE session_id IN
         (SELECT s.id FROM session s JOIN cohort c ON c.id = s.cohort_id
           WHERE c.code LIKE ANY($1))`, [likeC]);
    await query(
      `DELETE FROM session WHERE cohort_id IN
         (SELECT id FROM cohort WHERE code LIKE ANY($1))`, [likeC]);
    await query(`ALTER TABLE session ENABLE TRIGGER session_append_only`);
    await query(`DELETE FROM cohort WHERE code LIKE ANY($1)`, [likeC]);
  }

  if (likeS.length) {
    await query(`DELETE FROM site WHERE name LIKE ANY($1)
                   AND id NOT IN (SELECT site_id FROM cohort)`, [likeS]);
  }
}

module.exports = { sweep };
