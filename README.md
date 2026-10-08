# Burkina Faso Training Log

A daily logging and oversight tracker for Infodat's instructor-led technical
training programme in Burkina Faso. Four tracks: Computer Science, DevOps,
Cybersecurity, Artificial Intelligence.

It answers three questions the programme needs answered every day:

1. **Where is each cohort?** Which lesson was last taught, and where does the
   next session start.
2. **What happens when an instructor leaves?** A replacement picks up from the
   exact stopping point, without needing a handover meeting or any cooperation
   from the person who left.
3. **How is the teaching going?** What instructors are actually doing in the
   room, whether learners are clearing the objectives, and which situations
   need a supervisor's attention this week.

---

## What is in this repository

| Path | What it holds |
|---|---|
| `prototype/tracker-en.html` | Working prototype, English. Open it in a browser — no server, no build step. |
| `prototype/tracker-fr.html` | The same prototype in French. This is the version that goes in front of in-country staff. |
| `prototype/archive/` | Earlier prototype versions, kept for reference. Not current. |
| `db/schema.sql` | The Postgres schema. Tables, constraints, and the views the dashboard reads. |
| `db/seed/` | Reference data: the curriculum, teaching methods, disruption reasons. |
| `db/demo/` | Sample cohorts and sessions so a fresh database has something to show. |
| `data/curriculum.json` | **The single source of truth for the curriculum**, in English and French together. |
| `tools/` | Scripts that generate the seed SQL from `curriculum.json`. |
| `docs/` | The data model reasoning, the API contract, and the open decisions. |

---

## Start here

- **To see what this is**, open `prototype/tracker-en.html` in a browser.
- **To understand why the database looks the way it does**, read
  [`docs/data-model.md`](docs/data-model.md). It explains four decisions that
  are painful to reverse later.
- **To build the backend**, read [`docs/api-contract.md`](docs/api-contract.md)
  and [`docs/build-order.md`](docs/build-order.md).
- **If SharePoint and Power Apps are on the table** — and they should be, the
  team already runs that stack — read
  [`docs/platform-sharepoint.md`](docs/platform-sharepoint.md) before anything
  else. It sets out what maps cleanly, what breaks, and what to test first.
- **To change the curriculum**, edit `data/curriculum.json` and regenerate —
  never edit the seed SQL or the prototypes by hand.

---

## The curriculum is generated, not hand-edited

The two prototypes and the database seed all draw from one file:
`data/curriculum.json`. It holds every track, module, lesson, and objective in
both English and French.

Earlier versions of this project kept the curriculum inside each HTML file. The
English and French copies drifted apart within a day. Now there is one copy.

To change a lesson or add a module:

```
# 1. Edit data/curriculum.json
# 2. Regenerate the seed SQL:
node tools/build-seed.js
# 3. Regenerate the prototype curriculum blocks:
node tools/build-prototype.js
```

Both scripts need Node 18 or newer and no installed packages.

There is one rule about editing the curriculum that matters more than the
others: **once a cohort has been taught against a lesson, do not change that
lesson's objectives.** Add a new lesson and retire the old one instead. The
reasoning is in `docs/data-model.md`.

---

## Setting up the database

Any Postgres 14 or newer will do. The data volumes here are small — five
cohorts logging daily comes to roughly 1,300 session rows a year.

```
createdb training_log
psql training_log -f db/schema.sql
psql training_log -f db/seed/01-reference.sql
psql training_log -f db/seed/02-curriculum.sql

# Optional — sample cohorts, instructors and sessions so the dashboard
# has something to display. Do not load this into production.
psql training_log -f db/demo/demo-data.sql
```

To confirm it worked:

```
psql training_log -c "SELECT * FROM v_cohort_position;"
```

On an empty database that returns nothing. With the demo data loaded it returns
one row per cohort showing where each one stopped.

---

## Current status

**Deployed and working** as of 28 September 2026. Running on Railway with
a Postgres instance holding the full curriculum, the instructor app at the
root and an admin page at `/admin`. 70 automated tests across four suites.

See [`docs/build-order.md`](docs/build-order.md) for what is built, what
is not, and the five things that must happen before a real instructor uses
it. The most important of those: this is a pilot until the data residency
question is answered, and it should hold no real learner data until then.

The prototypes are complete and working. The schema is written, loads cleanly,
and its constraints are covered by tests (`db/test-constraints.sql` — eight
checks, all passing). **Nothing has been built against it yet** — there is no
server, no API, and no deployment.

Three decisions need settling before anything is provisioned. All are in
[`docs/open-decisions.md`](docs/open-decisions.md):

1. **Postgres or SharePoint.** The team already runs a SharePoint and Power
   Apps system. Three things break on that route — offline reliability,
   append-only enforcement, and data residency — and the first one is testable
   in a day. This decides everything downstream.
2. **Where the data lives.** The in-country data position taken on the Selltis
   work may apply here too. It constrains the hosting region, and it decides
   the platform question above rather than being decided by it.
3. **How instructors identify themselves.** SMS verification costs money and
   delivers unreliably in-country. A personal code is the likely answer — and
   the question disappears entirely on the SharePoint route, since instructors
   would sign in with M365 accounts.

---

## The honest limitation

Every number this system collects, except an observation score, is entered by
the person whose work is being reviewed. An instructor who wants to look good
can tick more lessons and enter higher counts, and nothing here would contradict
them.

The oversight tab is built to point a supervisor at the situations worth a phone
call or a visit. It does not measure teaching quality, and it should not be
presented as though it does. `docs/oversight-design.md` sets out what each
signal can and cannot support, and which evidence sources would strengthen it.
