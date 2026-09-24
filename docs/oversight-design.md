# Oversight: what the signals can and cannot support

The oversight queue exists to point a supervisor at the handful of situations
worth a phone call or a visit this week. It does not measure teaching quality,
and presenting it as though it does would be both wrong and corrosive.

This page sets out each rule, what it is actually detecting, and where it fails.

---

## The problem the queue is solving

A dashboard where everything is visible is a dashboard nobody reads. Five
cohorts is already too much to scan daily; twenty would be hopeless.

So the queue shows exceptions, ranked, with a suggested next step. Cohorts
running well do not appear at all. The demo data includes BF-03 specifically as
a control case: it moves fast, scores well, and raises nothing. If a change to
the rules ever makes BF-03 appear, the rules have drifted.

---

## The rules

Thresholds below are starting guesses. They need three or four weeks of real
data before they mean anything, and they belong in configuration rather than
code.

### Logging has stopped
**Fires when** no entry for 3 days (medium) or 7 days (high).
**Detecting:** an instructor who has left, is ill, or has quietly given up on
the log.
**Fails when** the programme has scheduled breaks, holidays, or cohorts that
meet twice a week by design. Feed the timetable in before trusting this, or it
will cry wolf every weekend.

### Learners are not clearing the objectives
**Fires when** the demonstration rate over the last 3 sessions falls below 65%.
**Detecting:** the one thing that genuinely matters — ground being covered
without being learned.
**This is the flag most worth an observation visit.** It is also the flag most
worth *not* treating as a pace problem, which is the instinctive reaction and
the wrong one.
**Fails when** a cohort is genuinely harder, when a lesson is badly written, or
when an instructor marks honestly while a colleague marks generously. Low
scores can mean good assessment. Check the objective across cohorts before
concluding anything about the instructor.

### Same lesson three sessions running
**Fires when** the covered-lesson set is identical three sessions in a row.
**Detecting:** either a cohort genuinely stuck, or an entry being copied
forward without thought. Both warrant a call, for different reasons.
**Fails when** a lesson legitimately spans several sessions, which happens with
the heavier lab lessons. Worth a per-lesson expected-duration field eventually.

### Recurring disruption
**Fires when** the same disruption reason appears twice in six sessions.
**Detecting:** a facilities or logistics problem.
**The routing is the point.** Three power cuts in a month is not a teaching
problem and must not land in a teaching conversation. The queue says so
explicitly in the next-step text.

### Very narrow method mix
**Fires when** one method accounts for more than 55% of logged method use.
**Detecting:** an instructor teaching the only way they know how — usually
lecture, usually because that is how they were taught.
**Next step is pairing, not escalation.** This is a development signal.
**Fails when** the subject genuinely calls for it, and when instructors log
methods loosely. It is the softest rule here.

### Entries filed late
**Fires when** average entry lag reaches 2 days.
**Detecting:** entries written from memory, which are not reliable.
**Read this one first.** If an instructor's lag is high, every other number in
their row was reconstructed days later and should be discounted accordingly.
Fix the habit before interpreting anything else.

### The log has no friction in it
**Fires when** three or more sessions show every objective at full marks, no
disruptions, and no notes.
**Detecting:** a log that is being filled in rather than kept.
**Real teaching is messier than this.** This rule is deliberately uncomfortable
and will occasionally fire on someone genuinely excellent. It says "verify
against learner work", not "this person is lying".

### Never observed / not observed recently
**Fires when** there is no observation, or the last one is over 30 days old.
**Low priority by design.** Until in-country observation capacity exists, this
must not drown out the signals that can actually act. It is a placeholder that
becomes meaningful later.

---

## Pace against outcomes

The one chart worth having. Lessons per session on one axis, demonstration rate
on the other.

- **Top right** — fast and landing. BF-03 sits here.
- **Top left** — thorough but behind. A scheduling conversation.
- **Bottom right** — the quadrant to worry about. Ground is being covered and
  learners are not clearing it. BF-02 sits here.
- **Bottom left** — help needed on both counts.

Neither number alone tells you which of these you are looking at, which is why
the chart exists rather than two separate metrics.

---

## The honest limitation

**Every signal above except an observation score was entered by the person
being reviewed.**

An instructor who wants to look good can tick more lessons and enter higher
counts. Nothing here would contradict them. The append-only design makes
retroactive tidying hard, and the "no friction" rule makes a too-perfect log
conspicuous, but neither is proof of anything.

This needs saying out loud when the system is presented, and it is written into
the footer of the oversight tab in both prototypes so it cannot quietly drop
out of the conversation.

What the queue does is make visits targeted instead of random, and give
something to talk about between them. That is genuinely useful. It is not
assessment.

---

## What would strengthen it, in order of value per unit of effort

**1. Learner-submitted checks.** Today the instructor reports "11 of 14
demonstrated". If the 14 learners submit the check themselves — even on paper,
photographed — the count stops being an opinion. Highest value, lowest cost,
and it is the single change most worth making.

**2. Learner work products.** This is what the subject matter hands you for
free, and most training programmes cannot do it. CS, DevOps, Security and AI
all produce inspectable output: code, a Dockerfile, a firewall rule, a
confusion matrix. Someone in Houston or Hyderabad can look at what BF-03
actually built in the OPS-4.2 lab and know within minutes whether it was
taught. No travel and no trust required. For a technical programme this is
stronger and cheaper than observation.

**3. Learner feedback.** Three anonymous questions, weekly. Soft, but it is the
only channel through which a learner can say the sessions are unusable.

**4. Observation.** Highest quality, highest cost, does not scale. The system's
job is to say which sessions are worth the trip.

Note that log compliance and pace-against-plan measure management discipline,
not teaching quality. Keep them visually separate in any report, or you will
reward the instructor who files paperwork well.

---

## Setting the thresholds

Start loose. A queue that fires on everything gets ignored within a week, and
an ignored queue is worse than no queue because it creates the appearance of
oversight.

Run for a month, look at what fired, and ask of each item: did this turn out to
be worth someone's attention? Tighten the rules that produced noise. Loosen the
ones that stayed silent through a problem someone found out about another way.

The rules themselves are more durable than the numbers in them. Expect to
change the numbers several times and the rules rarely.
