# Build order

What to build, in what order, and what to leave out. Assumes the platform
question in `open-decisions.md` has been answered and the answer is Postgres.
If it is SharePoint, the phases still hold but the components change — see
`platform-sharepoint.md`.

---

## Reuse, do not rebuild

The break-it server from Branch Test Day is the right starting point. It was
NestJS and Postgres on Railway, with a token-guarded ingest endpoint, a live
dashboard, and CSV and JSON export for the India team. Its tester front end
already did local-first writes with an offline retry queue and an
add-to-home-screen guide.

That architecture is exactly what instructors logging from a phone in Burkina
Faso need. The payload shape changes and entries now carry named people, but
the skeleton is proven and familiar to the team.

---

## Phase 1 — The daily log

**Goal:** an instructor can file an entry from a phone with no connection, and
a replacement can pick up a cohort from the log alone.

- Schema loaded, curriculum seeded from `data/curriculum.json`.
- `POST /sessions`, with device-generated IDs and idempotent retry.
- `GET /curriculum` with an ETag, cached on the device.
- `GET /cohorts/{code}/position` — the handover sheet.
- The daily form as an installable web page, local-first with a retry queue.
- CSV export.

**This phase is most of the value.** The handover capability falls out of it
for free — it is one column, filled in daily.

**Done when** someone who has never taught a cohort can open the app, read the
resume point, and teach the right lesson without asking anyone.

---

## Phase 2 — Oversight

**Do not start this until Phase 1 has been running for three or four weeks.**
The thresholds are guesses until there is real data, and a queue tuned against
demo data will be wrong in both directions.

- The exception rules, thresholds in configuration.
- `GET /oversight/queue`.
- Pace-against-outcomes chart.
- Per-instructor summary.
- A weekly email to each instructor showing only their own pace and outcomes.

**On that last point:** make the first cycle explicitly developmental. If
instructors conclude the daily log feeds a performance review before they trust
it, the logs turn into fiction — and then the continuity capability from
Phase 1 is lost too, not just the quality signal. That is the single biggest
risk in the whole project and it is a management risk, not a technical one.

---

## Phase 3 — Observation

Whenever in-country capacity exists. The tables and rubric are already built,
so this is a form and a report, not a migration.

When it lands, raise its weight in the queue. It is the only evidence in the
system that does not come from the person being reviewed.

---

## Deliberately not in scope

Each of these is real work, and none of them changes whether the pilot
succeeds:

- A user management screen. Add instructors with SQL until it hurts.
- Roles beyond instructor, supervisor and admin.
- Editing the curriculum in the app. It lives in `curriculum.json` and is
  regenerated; that is fine for years.
- Push notifications. Email is enough.
- A native mobile app. An installable web page covers it and avoids two app
  store review cycles.
- Caching, materialized views, read replicas. At 1,300 rows a year, nothing
  will be slow.
- Per-learner mastery tracking. Belongs on a separate end-of-module check —
  see `data-model.md`.

---

## Sequencing risks

**The curriculum has to be stable enough to seed.** This is the hardest part of
Phase 1 and it is not a software problem. If the lesson list is still moving,
building against it produces a system that looks finished and describes
something that no longer exists.

**Offline has to be tested on real handsets at real sites**, not in an office
with good wifi and airplane mode. The Branch Test Day pattern worked, but it
was tested in Houston.

**The thresholds will be wrong the first time.** Plan to tune them after a
month. Set them loose initially — a queue that fires on everything is ignored
within a week, and an ignored queue is worse than no queue because it creates
the appearance of oversight.

---

## Status: Phase 1 built (28 September 2026)

Built and tested, not yet deployed:

- `POST /api/sessions` — accepts one entry or a batch. Device-generated
  ids, idempotent retry, per-entry results.
- `GET /api/bootstrap` — the whole curriculum, cohorts, methods and
  current resume points in one call, with an ETag.
- `GET /api/cohorts/:code/position` — the handover sheet as data.
- `GET /api/export.csv` — matches the prototype's column shape, with the
  byte order mark Excel needs for the French text.
- `POST /api/login` — personal code exchanged for a device token.
- The instructor app, offline-first: writes to IndexedDB before any
  network call, queues, retries, and advances the resume point locally so
  a phone offline for a week still opens on the right lesson each morning.

19 end-to-end tests pass against a real Postgres (`server/test/smoke.js`).

Two bugs the tests caught, recorded because they are the kind that
survive a code review:

1. The bootstrap payload carried a `generated_at` timestamp, so its ETag
   changed on every call. Caching appeared to work and in fact every phone
   re-downloaded the full curriculum each morning over a metered
   connection. Timestamp removed.
2. The CSV byte order mark was present but the test read the response as
   text, and fetch's UTF-8 decoder strips a leading BOM. The test was
   wrong, not the server — but a test that reports a real protection as
   missing is worth fixing rather than deleting.

### Still not built

Phase 2 (the oversight queue and its thresholds) and Phase 3
(observation) are unchanged and unstarted. Deliberately out of scope:
user management screens, curriculum editing in the app, notifications,
and a native mobile app.

### Before this reaches an instructor

- **Offline must be tested on real handsets at real sites.** The queue
  and retry logic are tested, but only in a datacentre. The Branch Test
  Day pattern worked and was also only ever tested in Houston.
- **`SESSION_SECRET` must be set** on the Railway service. The server
  refuses to start in production without it.
- **Personal codes must be issued.** No instructor has one; the
  `login_code` column is empty for everyone.
- The auth layer is pilot-grade: tokens do not expire and codes are
  compared in plain text. Fine for a pilot, not for real records.
