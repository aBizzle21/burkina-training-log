# API contract

What the server needs to accept and return. Written for whoever builds it —
the endpoints are few and the shapes are small.

If the programme goes the SharePoint route instead, this document still
describes what has to happen; the transport changes but the rules do not. See
`platform-sharepoint.md`.

---

## Authentication

Two kinds of caller.

**Instructors** submit sessions from a phone. They authenticate with a personal
code, exchanged once for a long-lived token stored on the device. See
`open-decisions.md` — this is not finally settled, and if the programme runs on
M365 accounts instead, it goes away entirely.

**Supervisors and admin** read the oversight views and record observations.
Ordinary session login.

The break-it server used a single shared ingest token because testers were
anonymous. That does not carry over. Here, performance is attributed to named
people, so each instructor needs their own identity, and a shared token would
make attribution meaningless.

---

## `POST /sessions`

The one endpoint that matters. Accepts a completed daily entry.

**The request body:**

```json
{
  "id": "0193e4c2-7a1b-4f3e-9c22-8f1d6b4e9a07",
  "cohort_code": "BF-01",
  "session_date": "2026-09-01",
  "device_created_at": "2026-09-01T16:42:11+00:00",
  "present_count": 13,
  "lessons_covered": ["CS-3.2"],
  "resume_lesson": "CS-3.3",
  "methods": ["guidee", "labo"],
  "dominant_method": "labo",
  "objectives": [
    { "code": "CS-3.2.1", "demonstrated": 10 }
  ],
  "disruption": "power_cut",
  "flag_note": "Power out again for most of the morning.",
  "device_id": "sm-a032-ouaga-03",
  "app_version": "1.0.2"
}
```

**Rules the server enforces:**

- `id` comes from the device and is used as given. If a session with that ID
  already exists, return `200` with the stored record and change nothing. This
  is what makes retries safe on a bad connection, and it is not optional — a
  failed retry that creates a second session is worse than a lost entry,
  because nobody can tell it happened.
- `instructor_id` comes from the auth token, never from the body. An instructor
  cannot file on someone else's behalf.
- `submitted_at` is set by the server. The body must not contain it, and if it
  does, ignore it.
- `resume_lesson` must belong to the cohort's track and must not be retired.
- Each `demonstrated` count must be at most `present_count`.
- Each objective code must belong to one of the lessons in `lessons_covered`.
- `flag_note` is capped at 240 characters.

**Responses:**

| Code | Meaning |
|---|---|
| `201` | Stored. |
| `200` | Already had this ID. Nothing changed. Body is the stored record. |
| `400` | Validation failed. Body lists which fields and why. |
| `401` | Bad or missing token. |
| `409` | Rejected — see below. |

A `409` is for the one case worth blocking: an instructor submitting a second
original entry for the same cohort on the same date. That is almost always a
duplicate the device failed to recognise. The response should say so and name
the existing session's ID, so the app can offer to submit it as a correction
instead.

---

## `POST /sessions/{id}/corrections`

Corrections are new sessions, not edits. This endpoint takes the same body as
`POST /sessions`, with a fresh device-generated `id`, and sets `supersedes_id`
to the session in the path.

The server refuses to correct a session that has already been superseded —
correct the newest one in the chain instead. It also refuses to correct another
instructor's entry.

There is no `PUT /sessions/{id}` and no `DELETE`. The database will refuse them
anyway; the API should not pretend otherwise.

---

## `GET /cohorts/{code}/position`

The handover sheet, as data. This is what a replacement instructor's app calls
when it opens.

```json
{
  "cohort_code": "BF-01",
  "site": "Ouagadougou",
  "track": { "code": "CS", "name_fr": "Informatique" },
  "enrolled_count": 14,
  "resume_lesson": {
    "code": "CS-3.3",
    "title_fr": "Fonctions et réutilisation",
    "module": { "code": "M3", "title_fr": "Bases de la programmation" }
  },
  "last_session_date": "2026-08-31",
  "last_instructor": "Aminata Ouédraogo",
  "days_since_last_session": 1,
  "lessons_covered": 9,
  "total_lessons": 24,
  "recent_flags": [
    "Power out again for most of the morning. Third time this month."
  ]
}
```

A cohort with no sessions yet returns the first lesson of its track, not an
error. Day one is a normal state.

---

## `GET /curriculum?track=CS&lang=fr`

The lesson ladder for a track, so the app can render the form and cache it for
offline use. Include an `ETag` — this changes rarely and there is no reason to
re-download it daily over a metered connection.

---

## `GET /oversight/queue`

The ranked exception list. Supervisors only.

```json
{
  "generated_at": "2026-09-01T09:00:00Z",
  "items": [
    {
      "severity": "high",
      "rule": "objectives_below_threshold",
      "subject": { "cohort": "BF-02", "instructor": "Issouf Sawadogo" },
      "what": "Only 59% of objective checks passed over the last 3 sessions.",
      "next_step": "This is the signal that most warrants an observation visit. Do not treat it as a pace problem."
    }
  ]
}
```

The rules and their thresholds are in `oversight-design.md`. Keep the
thresholds in configuration, not in code — they are guesses until the programme
has run for a few weeks, and they will need tuning.

---

## `GET /export.csv`

Everything, flat, for the India team. One row per session with the lesson
codes, method codes, and objective counts collapsed into columns. The prototype
already produces this exact shape — match it.

Write a UTF-8 byte order mark at the start of the file. Without it, Excel
mangles every accented character in the French data, and the whole export
arrives looking broken.

---

## `POST /observations`

Dormant. Built so that turning observation on later is a feature rather than a
migration.

Takes a cohort, an instructor, a date, the observer's name and role, eight
criterion scores from 1 to 4, and an optional note. The observer is free text
rather than a user ID, because it may be a site lead, a school principal, or a
peer instructor, and some of those will never have an account.

---

## Things to get right that are easy to get wrong

**Return French strings, not just codes.** The app is used in French. Sending
`"guidee"` and making the client hold a translation table means the two drift
the first time a method is added. Send both the code and the label.

**Accept a batch of sessions, not just one.** A phone that has been offline for
three days has three entries queued. One request that takes an array and
returns per-item results is far kinder than three requests where the second
fails halfway.

**Do not require a connection to read the curriculum.** The app caches it. The
server's job is to tell the app when the cache is stale, not to be reachable
every morning.

**Log rejected submissions.** An entry that fails validation on the server is
an entry the instructor believes they filed. If it silently vanishes, the
instructor is blamed for not logging and the data is wrong in a way nobody can
trace. Store the rejection with the payload and surface it in the queue.
