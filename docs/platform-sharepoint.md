# Could this run on SharePoint and Power Apps instead?

Short answer: yes, most of it, and it deserves a real look rather than a
reflex no — the team already runs a SharePoint and Power Apps system, which
means existing licences, existing admin, existing support habits, and no new
hosting to justify to anyone.

But three things break or degrade, and one of them is the reason this system
exists at all. This page sets out what maps cleanly, what does not, and what
the realistic options are.

---

## What maps cleanly

| This design | SharePoint equivalent |
|---|---|
| Curriculum tables (track, module, lesson, objective) | Four SharePoint lists, loaded from `data/curriculum.json` |
| Teaching methods, disruption reasons | Choice columns, or small lookup lists |
| Instructors, cohorts, sites | Lists, with instructors linked to real M365 accounts |
| The daily form | A Power Apps canvas app |
| Sessions | A list, one item per session |
| Lessons covered, methods used, objective counts | Child lists linked to the session item |
| The oversight queue | Power Automate flow on a schedule, writing to a list |
| Pace-versus-outcomes chart, method mix | Power BI |
| CSV export for the India team | Native — SharePoint exports to Excel out of the box |

Volumes are not a problem. Five cohorts logging daily is roughly 1,300 session
items a year. SharePoint's list view threshold sits at 5,000 items per view,
which matters for how views are filtered and indexed but is a long way from a
hard limit at this scale.

Identity is actually *better* on SharePoint. Instructors sign in with a real
M365 account, so the "how do instructors identify themselves" question in
`open-decisions.md` answers itself — no personal codes, no SMS costs, no
credential handling to get wrong.

---

## What breaks

### 1. Offline. This is the serious one.

The entry has to save on the phone whether or not there is a connection, and
sync later. That is not a nice-to-have in Bobo-Dioulasso or Banfora — it is
the difference between a log that gets filled in daily and one that gets
reconstructed on Friday from memory.

Power Apps can do offline, but it is genuinely fiddly. Canvas apps handle it
through local collections saved to the device, with the developer writing the
sync and conflict logic by hand. The app has to have been opened online at
least once. Behaviour across handsets and OS versions is inconsistent enough
that it needs testing on the actual devices in the actual locations.

The prototype's approach — save locally first, queue, retry, and keep CSV
export as the backstop — is the same pattern that worked on the Branch Test Day
break-it tester. That pattern is well understood here and known to survive bad
connections. Rebuilding it inside Power Apps means rebuilding it in a framework
where it is harder.

**This is the question to test before committing**, not to reason about.
Build the form in Power Apps, take it to a site with bad connectivity, and
turn the connection off mid-entry. If the entry survives, offline is solved.

### 2. Append-only cannot be enforced

SharePoint list items can be edited. Version history records that an edit
happened, which is not nothing, but it is not the same as refusal.

In the Postgres design a database trigger physically refuses to update a
session row — tests 1 and 2 in `db/test-constraints.sql` prove it. On
SharePoint the nearest equivalents are:

- Permissions that allow add but not edit, which also blocks legitimate
  corrections and tends to get loosened the first time someone needs one.
- A Power Automate flow that watches for edits and flags or reverts them,
  which is a detection mechanism, not a prevention one.
- Convention, which is not a mechanism at all.

Whether this matters depends on what oversight is *for*. If the queue is a
supervisor's to-do list and everyone trusts everyone, version history is fine.
If entry lag and deviation history are ever going to be cited in a performance
conversation, they need to be unfalsifiable, and on SharePoint they are not.

### 3. Data residency

SharePoint data lives in the Microsoft 365 tenant's region. That is Infodat's
existing tenant, wherever it sits — almost certainly not Burkina Faso.

If the in-country data position taken on the Selltis work applies here, that is
a direct conflict, and it is not one that can be configured away without a
separate tenant or Multi-Geo. Worth settling before any build starts, because
it decides the platform rather than being decided by it.

Note that this cuts both ways. A Railway or other cloud Postgres also has to
sit in a specific region, and "we host it ourselves" is not automatically
compliant either. The difference is that a Postgres instance can be placed
wherever the answer turns out to be. A tenant cannot, easily.

---

## Smaller friction

**The relational shape is awkward.** A session covering three lessons and using
four methods is two many-to-many relationships. In SharePoint that is either
multi-select columns, which are painful to report on, or child lists, which
means the Power App writes four or five items per submitted session and has to
handle a partial failure halfway through. Doable, but it is real work and it is
exactly where offline sync gets fragile.

**Lookup column limits.** SharePoint caps lookup columns per view. The session
list needs several — cohort, instructor, resume lesson, dominant method,
disruption reason. It fits, but there is not much headroom.

**The oversight queue becomes a scheduled flow.** The rules currently run live
against the data. On SharePoint they would be a nightly Power Automate flow
writing results to an alerts list. That is fine, arguably better for
notifications, but a rule change means editing a flow rather than editing a
query, and flows are harder to review and version.

**Licensing.** Instructors need Power Apps access, either through their M365
licence if it covers the app type, or through a per-app or per-user plan. For a
handful of instructors this is minor. For a programme that grows to twenty
sites it is a line item worth pricing before, not after.

---

## The three realistic options

### A. Full Microsoft stack
SharePoint lists, Power Apps form, Power Automate for the queue, Power BI for
the charts.

*Strong when:* the programme stays small, connectivity turns out to be better
than feared, oversight stays developmental rather than evaluative, and the
tenant region is acceptable.

*Weak when:* offline matters as much as expected, or the oversight data needs
to be trustworthy under challenge.

### B. Full Postgres stack
What is in this repository. A small server, the schema as written, and the
existing offline-first form.

*Strong when:* offline reliability and tamper-resistance are the priorities,
and hosting region needs to be a choice rather than an inheritance.

*Weak when:* nobody on the team wants to own another server, or the licensing
and admin savings of staying inside M365 are decisive.

### C. Hybrid — SharePoint as the store, the existing form as the front end
Keep the SharePoint lists so the data sits in the tenant and Power BI works
natively. Keep the HTML form as an installable web app, writing to SharePoint
through the Graph API, with the local-first queue intact.

*Strong when:* you want the offline behaviour that is already proven here and
the Microsoft reporting stack at the same time.

*Weak when:* you want one vendor and one support path. This is two systems
joined at an API, and somebody has to own the join.

---

## A recommendation, held loosely

If the programme is going to be five cohorts and stay that way, and
connectivity turns out to be tolerable, **Option A is probably right** — not
because it is technically better, but because a system the team can already
administer is worth a great deal more than a marginally better one nobody owns.

If the programme is meant to scale, or if the oversight data is ever going to
be evidence rather than a prompt, **Option B** is the honest answer.

**Option C** is the one to consider if the offline testing in Option A goes
badly but the tenant and reporting arguments still hold.

Either way, `data/curriculum.json` and the schema in this repository are not
wasted work. The curriculum file loads into SharePoint lists as easily as into
Postgres, and the schema is a specification of what the lists need to contain
regardless of where they live.

---

## What to do next, if SharePoint is on the table

1. **Test offline first, before anything else is built.** Build just the daily
   form in Power Apps, put it on a real handset at a real site, and turn the
   connection off mid-entry. Everything else is negotiable; this is not.
2. **Settle the tenant region question** against whatever the in-country data
   position turns out to be.
3. **Decide whether oversight data needs to be tamper-resistant.** If it does,
   SharePoint cannot give you that, and the conversation is over.
4. Only then price the licensing.
