# Verifying a fresh install

Confirms the schema, seed and demo data load, and that the four design
decisions are actually enforced rather than just documented.

```
createdb training_log
psql training_log -v ON_ERROR_STOP=1 -f db/schema.sql
psql training_log -v ON_ERROR_STOP=1 -f db/seed/01-reference.sql
psql training_log -v ON_ERROR_STOP=1 -f db/seed/02-curriculum.sql
psql training_log -v ON_ERROR_STOP=1 -f db/demo/demo-data.sql
psql training_log -f db/test-constraints.sql
```

The last command should print eight lines, all starting `PASS`, then confirm
everything rolled back. Nothing it does changes the database.

## What you should see afterwards

Curriculum loaded:

```
psql training_log -c "
SELECT t.code, count(DISTINCT m.id) modules, count(DISTINCT l.id) lessons, count(o.id) objectives
FROM track t
LEFT JOIN module m ON m.track_id = t.id
LEFT JOIN lesson l ON l.module_id = m.id
LEFT JOIN objective o ON o.lesson_id = l.id
GROUP BY t.code, t.position ORDER BY t.position;"
```

```
 code | modules | lessons | objectives
------+---------+---------+------------
 CS   |       7 |      24 |         26
 OPS  |       6 |      18 |         22
 SEC  |       6 |      20 |         22
 AI   |       6 |      21 |         22
```

Cohort positions — this is the handover sheet as data:

```
psql training_log -c "SELECT cohort_code, track_code, resume_lesson_code,
  last_session_date, last_instructor, lessons_covered||'/'||total_lessons AS progress
  FROM v_cohort_position ORDER BY cohort_code;"
```

BF-01 should resume at CS-3.3. BF-05 has no sessions and should still return a
starting point (CS-1.1) rather than a null — day one is a normal state.

Instructor picture — the oversight signals:

```
psql training_log -c "SELECT full_name, session_count,
  round(demonstration_rate*100,1) AS pct, top_method,
  round(top_method_share*100,0) AS share_pct, avg_entry_lag_days
  FROM v_instructor_summary ORDER BY full_name;"
```

Issouf Sawadogo should show roughly 59% demonstration, 63% lecture share, and
2.4 days average entry lag — three separate flags on one person, which is the
point of that demo cohort. Boureima Traoré should show high-80s demonstration,
a broad method mix and zero lag: the control case that raises nothing.

## Re-running the seed

The seed files are idempotent and can be re-run after editing
`data/curriculum.json` and regenerating. Row counts should not change unless
the curriculum did.

A re-run will fail if it would rewrite a lesson or objective that has already
been taught against. That is the intended behaviour, not a bug — add a
replacement lesson and retire the old one. See `data-model.md`, decision 4.
