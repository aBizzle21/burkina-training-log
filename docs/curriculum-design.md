# How the curriculum is put together

Six entry levels, three paces, one shared foundation and four branches.
That is 6 × 3 × 4 = 72 combinations, and nobody is going to author or
maintain 72 curricula.

So none are authored. **Each track's lessons are written once. A pathway is
a filter over them, not a copy of them.** Change a lesson and every
pathway that includes it changes with it.

---

## The three things a cohort chooses

### Entry level — what they already know

| | Who |
|---|---|
| **L0** Beginner | Little or no computer experience. May not have used a keyboard much. |
| **L1** Computer literate | Uses a phone and basic office software. No programming. |
| **L2** Some technical background | Has written a little code or administered a machine. Self-taught or part-way through study. |
| **L3** Intermediate | Works in the field, or has studied it formally. Wants to go deeper, not start over. |
| **L4** Advanced | Experienced. Here for the specialised material at the top of a branch. |

**Mixed** is not an entry level — it is a property of a cohort. A mixed
cohort runs the pathway of its *lowest* entrant, with the lessons above
that level marked as places where the group will split. Those are the
sessions where the stronger learners need something else to do, and the
curriculum says so rather than leaving the instructor to improvise.

### Pace — how much of it they do

| | What it includes |
|---|---|
| **Steady** | Everything. Scaffolding, extra practice, the slower explanations. |
| **Standard** | Core plus the extensions that most people need. |
| **Fast track** | Core only. Assumes the learner will fill gaps themselves. |

### Track — where they go after the foundation

Software Development, DevOps, Cybersecurity, or Artificial Intelligence.

---

## How a lesson decides whether it is in a pathway

Every lesson carries two tags.

**`level`** — the level of learner this lesson is *for*.

A learner entering at level L needs every lesson tagged L or above.
Lessons below their level are things they already know.

- An L0 entrant gets everything.
- An L2 entrant skips the L0 and L1 lessons and starts at foundation
  material pitched at L2.
- An L4 entrant gets only the advanced material at the top of their
  branch.

**`tier`** — how essential it is.

| Tier | In at Fast | Standard | Steady |
|---|---|---|---|
| `scaffold` — extra support, worked examples, repetition | | | ✓ |
| `core` — cannot be skipped without breaking what follows | ✓ | ✓ | ✓ |
| `extension` — deepens; most learners benefit | | ✓ | ✓ |
| `advanced` — specialised, for L3 and L4 | ✓ at L3+ | ✓ at L3+ | ✓ at L3+ |

So `beginner + fast track` is a long path of core lessons only.
`intermediate + steady` is a short path with everything in it.

---

## Why a shared foundation

Four separate tracks would teach "what a file is", "how a network moves
data" and "how to use version control" four times over, in four slightly
different ways, and a learner who picked the wrong track at the start
would have to begin again.

The foundation runs L0 to L2 and ends at the point where the four branches
genuinely diverge. Someone entering at L2 passes through very little of
it. Someone entering at L0 spends most of their programme there, which is
correct — that is what learning to use a computer takes.

**Choosing a track is deliberately deferred.** A learner who has never
used a terminal cannot meaningfully choose between DevOps and AI. The
foundation's last module introduces all four so the choice is informed.

---

## What every objective has to satisfy

All four outcomes were asked for at once — employable skills, Infodat
capability, general digital literacy, and a certificate that means
something. The certificate is the binding constraint: it is the only one
that requires an outside examiner to agree.

So every objective is written to one bar:

> Something an instructor can watch a learner do, and a second instructor
> would mark the same way.

In practice that rules out most verbs. "Understand version control" is not
an objective. "Recover a file you deleted two commits ago" is. Where a
concept genuinely has to be explained rather than performed, the objective
says what a correct explanation must contain, so two markers agree.

The other three outcomes shape content rather than the bar:

- **Employable** — each branch ends with a project built to a written
  specification, which is the thing a portfolio needs.
- **Infodat capability** — where a choice of tool is arbitrary, the
  curriculum picks the one Infodat actually uses, so the skill transfers
  directly. It does not bend the syllabus toward Infodat's stack where
  that would narrow the learning.
- **Digital literacy** — the foundation covers this properly rather than
  rushing to get to programming.

---

## Hours, and why they are on every lesson

Each lesson carries an estimate in hours. That is what makes a pathway
answerable: a site lead picking `L0 + steady + DevOps` sees a total, and
can tell whether it fits the term before committing a cohort to it.

The estimates are first guesses. They should be corrected against what
sessions actually take — the daily log already records which lessons were
covered on which day, so after a term there is real data to replace them
with.

---

## What this does not do

**It does not adapt per learner.** A pathway is chosen for a cohort, not
generated per person. Individual adaptation needs assessment data the
programme will not have for months, and would make the instructor's job
harder rather than easier.

**It does not place people automatically.** Someone decides what level a
cohort is entering at. A placement check could inform that later; it is
not needed to start.

**It does not stop a cohort changing pace.** If `standard` turns out to be
too fast, the pathway can be switched and the extra lessons appear. The
daily log's resume point is a lesson code, and lesson codes do not change
when the pathway does.
