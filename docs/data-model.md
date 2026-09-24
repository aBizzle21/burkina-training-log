# The data model, and why it looks like this

This explains the database in plain terms. You do not need to read SQL to
follow it. The schema itself is `db/schema.sql`, and the comments there repeat
the short version of everything below.

Four decisions are worth arguing about before anything gets built. They are
cheap now and expensive later. They are marked **DECISION** below and they
carry the reasoning, not just the rule, because whoever inherits this will
otherwise engineer them away in good faith.

---

## The shape of it

Roughly a dozen tables in three groups.

**The curriculum** barely ever changes: track, module, lesson, objective.
Four tracks, twenty-five modules, eighty-three lessons, ninety-two objectives.
Reference data, loaded once from `data/curriculum.json`.

**The people**: instructor, site, cohort, and the record of who is assigned to
which cohort over what period.

**The activity**, where everything actually happens: session, plus three
child tables recording the lessons a session covered, the methods it used, and
how many learners cleared each objective. Observation and observation_score sit
alongside them, built but not yet in use.

Every user-visible string in the curriculum is stored twice, in English and
French. The programme is delivered in French and reviewed in English, and
keeping one language as the "real" one and translating on the fly would put the
French — the version learners actually see — permanently downstream of the
English.

---

## DECISION 1 — Sessions are append-only

**The rule.** A session row is never edited once written. When an instructor
corrects an entry, the system writes a *new* row that points back at the one it
replaces. Reports read the newest row in each chain.

**Why.** Three of the oversight signals depend on knowing what was originally
claimed, and when:

- **Entry lag** — how long after teaching the entry was filed.
- **Deviation history** — how often the plan and reality came apart.
- **The "no friction" check** — a log with no disruptions and perfect scores
  throughout, which is not what real teaching looks like.

If yesterday's entry can be quietly edited, all three become unfalsifiable. An
instructor who files a week late can backdate. One with a bad week can tidy it
up. Nothing in the data would show it.

**How it is enforced.** A database trigger refuses `UPDATE` and `DELETE` on the
session table outright. The only column an update may touch is the link to the
superseding row. Tests 1 through 4 in `db/test-constraints.sql` confirm this.

**What this costs you.** Every read of sessions has to go through the
`v_session_current` view rather than the table. Read the table directly and
corrected entries get counted twice. This is the one thing a new developer will
get wrong, so it is worth saying in code review more than once.

---

## DECISION 2 — The device generates the session ID, not the server

**The rule.** When an instructor starts filling in the form, the phone
generates a UUID for that session immediately. The server accepts it as given.

**Why two reasons.** First, the entry is saved on the device before any
connection exists — that is the whole point of offline-first — so it needs an
identity from the moment it is created, not from whenever it eventually syncs.

Second, and less obvious: it makes the ingest endpoint idempotent for free. A
bad connection in Bobo-Dioulasso will send the same entry twice. With a
device-generated ID the server recognises the duplicate and ignores it. With a
server-generated ID it stores two sessions, and now a cohort appears to have
been taught twice on a Tuesday. Offline applications that get this wrong end up
with phantom records nobody can explain or safely delete.

**What not to do.** Do not "clean this up" by switching to a serial primary key
because UUIDs look untidy in a table. The untidiness is the feature.

---

## DECISION 3 — The server stamps arrival time; the device supplies the date

**The rule.** `session_date` is what the instructor typed: the day they taught.
`submitted_at` is stamped by the server when the entry arrives. The difference
between them is the entry-lag metric.

**Why.** If the device supplied both, changing the phone's clock would erase
the lag. Keeping the two clocks separate means the lag measures something real
— how long the entry sat on a phone before it was filed — and cannot be edited
from the instructor's side at all.

There is a third timestamp, `device_created_at`, recorded from the phone's
clock for support purposes. It is advisory and nothing is calculated from it.

**What not to do.** The application must never set `submitted_at`. The database
default handles it. The demo data sets it explicitly only because it is
backdated sample data.

---

## DECISION 4 — Lessons are retired, never rewritten

**The rule.** Once a cohort has been taught against a lesson, that lesson's
text and objectives are frozen. To change it, mark it retired and add a
replacement.

**Why.** Suppose in March someone improves the objectives on CS-2.3. Every
session logged in February now references objectives that did not exist when
those sessions happened. The February demonstration rates become meaningless,
and worse, they still *look* fine. Nothing breaks visibly.

**The cheap version versus the proper version.** Full curriculum versioning —
every session recording which version of the curriculum it was taught against —
solves this completely and costs real effort. What is implemented here is the
cheap version that gets you most of the way: add and retire freely, never edit
in place. It is enforced by triggers on both `lesson` and `objective`.

**Decide this before the pilot starts.** Retrofitting versioning onto a running
programme is painful. If the curriculum is likely to churn heavily in the first
term, it may be worth doing properly up front. If it is broadly settled,
add-and-retire is enough.

---

## Some smaller choices, briefly

**Objectives are counted, not tracked per learner.** A session records "11 of
14 demonstrated CS-2.3.1", not which eleven. Per-learner mastery roughly
doubles the time the form takes, and a form that takes fifteen minutes gets
filled in on Friday from memory — which destroys the continuity data too, not
just the assessment data. Individual learner records belong on a separate
end-of-module check, which is lower frequency and can afford the time.

**Counts are out of who was present, not who is enrolled.** Absent learners
cannot demonstrate anything and must not be counted as failures. A trigger
refuses any count above the session's present count.

**Method is a tag, not free text.** A closed list of seven methods is what
makes "their approach" comparable across instructors. Free text would be richer
and completely unanalysable. There is a separate free-text field for anything
that needs saying in words.

**Disruption reasons are a closed list too**, for the same reason, and because
a repeating reason routes differently: three power cuts in a month is a
facilities problem, not a teaching one, and the oversight queue says so.

**Cohort assignment and who actually taught are separate records.**
`cohort_instructor` says who is supposed to be teaching. The session rows say
who was actually in the room. When those disagree, that is information —
usually that someone covered without it being recorded anywhere.

**Nothing is ever deleted.** Instructors get an `ended_on` date, cohorts get a
status, lessons get `retired_on`. Departure in-country is expected to be
abrupt and unannounced, so the system must never depend on the departing
person doing anything — including being available to have their record tidied.

---

## Size

Five cohorts logging daily comes to roughly 1,300 session rows a year. Twenty
cohorts over five years is still under 30,000 rows. Any Postgres instance
handles this without noticing.

Compute the dashboard metrics with plain queries. Do not add caching,
materialized views, or a read replica until something is actually slow. It will
not be.

---

## Reading the data correctly

Three views do the work. Use them rather than querying tables directly.

**`v_session_current`** — sessions with superseded rows excluded, plus the
entry-lag calculation. Everything that reads sessions should start here.

**`v_cohort_position`** — one row per cohort: where it stopped, who taught
last, how many days stale, how far through the track it is. This view *is* the
handover sheet. A replacement instructor needs this row and nothing else.
Cohorts with no sessions yet fall back to the first lesson of their track, so
a brand-new cohort still returns a sensible starting point.

**`v_instructor_summary`** — per instructor: session count, demonstration rate,
dominant method and its share, average entry lag, last observation date.

One caution on that last view, worth repeating wherever it gets displayed:
every column except `last_observed_on` was entered by the instructor it
describes. It points at conversations worth having. It is not a rating.
