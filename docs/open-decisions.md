# Open decisions

Things that are not settled, with what each one blocks. Roughly in the order
they need answering.

---

## 1. Platform: Postgres or SharePoint

**Status:** open, raised 24 Sep 2026.

The team already runs a SharePoint and Power Apps system, which means existing
licences, existing admin, and no new hosting to justify. That is a real
argument and it deserves testing rather than dismissing.

Three things break on SharePoint: offline reliability, append-only enforcement,
and data residency. The full assessment, including three realistic options and
what to test first, is in [`platform-sharepoint.md`](platform-sharepoint.md).

**Blocks:** everything downstream. Nothing should be built until this is
answered.

**How to answer it:** build just the daily form in Power Apps, take it to a
site with poor connectivity, and turn the connection off mid-entry. If the
entry survives and syncs, SharePoint is viable. This is a question to test, not
to reason about.

---

## 2. Where the data lives

**Status:** open. Needs Sunil.

The in-country data position taken on the Selltis work — infrastructure handled
off-site and strictly in Burkina Faso or other countries where the product is
deployed, for liability reasons — may or may not extend to this programme.

If it does, it constrains the hosting region directly, and it decides the
platform question above rather than being decided by it: a Postgres instance
can be placed wherever the answer turns out to be, a Microsoft 365 tenant
cannot, easily.

**Blocks:** provisioning anything.

**Why it cannot wait:** moving a database later is annoying but survivable.
Discovering that a commitment was made in a BRD that the hosting does not match
is considerably worse.

---

## 3. How instructors identify themselves

**Status:** leaning toward personal codes, not agreed.

SMS verification costs money per message and delivers unreliably in-country. A
personal code issued by the site lead is the likely answer — no credential
recovery flow, no telco dependency, and the code can be reissued in person.

This question disappears entirely if the programme runs on M365 accounts, which
is one of the genuine advantages of the SharePoint route.

**Blocks:** the auth layer, and any pilot that attributes work to named people.

---

## 4. Curriculum stability

**Status:** needs a judgement call before the pilot starts.

The schema currently takes the cheap approach: lessons and objectives can be
added and retired freely, but never edited once taught against. Triggers
enforce it.

Full curriculum versioning — every session recording which version it was
taught against — solves the problem completely and costs real effort.

**The question:** is the curriculum broadly settled, or will it churn heavily
in the first term? If it will churn, versioning may be worth doing up front.
Retrofitting it onto a running programme is painful.

**Blocks:** nothing immediately. But it gets expensive to change after the
first cohort has been taught.

---

## 5. Are the four tracks parallel or sequential?

**Status:** the model assumes parallel. Not confirmed.

Right now each cohort is enrolled against exactly one track and works through
it independently. The alternative is a shared trunk — everyone does CS
foundations first, then branches into DevOps, Security or AI.

If it is actually a shared trunk, CS modules M1 to M3 should be pulled out as a
common prerequisite block and the other three tracks should start after it.
That changes the lesson codes and the progress arithmetic.

**Blocks:** the curriculum structure, and therefore the seed data.

---

## 6. Objective wording

**Status:** known weakness, not yet addressed.

The objectives were written to be verifiable by a second instructor, which
pulled a number of them toward "explain X" rather than "build X". That is
honest for foundational material and weak as evidence of learning.

**Rough rule:** anything still using an explain-verb past module 2 probably
needs rewriting into something the instructor watches the learner do.

This matters more than it looks. The objectives are what the demonstration rate
measures, so a weak objective produces a confident number about nothing.

**Blocks:** nothing technically. Undermines the oversight data if left.

---

## 7. French technical vocabulary

**Status:** needs in-country review before anything goes in front of a class.

The French build uses the official terms: `plongements` for embeddings,
`rançongiciel` for ransomware, `hameçonnage` for phishing, `demande de fusion`
for pull request.

Working developers in Ouagadougou may simply say "embeddings", "ransomware" and
"pull request". The instructors will know which register their learners
actually use.

Getting this wrong makes the material feel translated rather than written for
them, which is a slow and expensive kind of damage.

Also worth settling: whether the logs stay French-only if delivery happens in
Mooré or Dioula anywhere.

**Blocks:** nothing technically. Affects whether the programme lands.

---

## 8. Observation capacity

**Status:** deliberately deferred.

The observation tables and the eight-criterion rubric are built and dormant.
Until someone can actually travel to Bobo-Dioulasso and Koudougou to sit in on
sessions, the queue treats "never observed" as a low-priority flag rather than
a failure.

**When this changes**, observation becomes the only evidence in the system that
does not come from the person being reviewed, and its weight in the queue
should go up accordingly.

---

## Answered

Nothing yet.
