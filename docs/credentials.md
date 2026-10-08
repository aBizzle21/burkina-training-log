# A credential that someone will actually accept

The goal is a certificate a learner can carry to another employer and have
it mean something. Worth separating what can be built from what has to be
earned, because they are different problems and only one of them is
software.

---

## The uncomfortable part first

Coursera certificates carry weight for three reasons, none of which can be
built: Coursera is at enormous scale, the certificates are co-branded with
Google, IBM and universities whose names already mean something, and
employers have seen thousands of them. Recognition is a network effect.

**An Infodat certificate will mean nothing to a stranger on day one.** Any
plan that assumes otherwise fails quietly — the learner finds out at an
interview, long after anyone can fix it.

So the question is not "how do we make a recognised certificate". It is
"what can we give a learner that a sceptical employer will find useful
even though they have never heard of us".

There is a good answer, and the programme is unusually well placed to
deliver it.

---

## What a sceptical employer actually wants

Not a PDF saying a course was completed. A technical hiring manager wants
to know:

1. **What can this person do?** Specifically, not in categories.
2. **Who says so, and did they watch?**
3. **Can I check it without phoning anyone?**
4. **Can I see the work?**

Most certificates answer none of these. They assert completion and ask to
be trusted.

**The training log already collects the answer to all four.** Every
objective is written to be watched and marked. Every session records which
objectives were demonstrated, on what date, by which instructor. That is
an evidence trail most bootcamps do not have, and it exists as a
by-product of the thing instructors already do daily.

A credential built on it can say:

> Fatimata Kaboré completed the DevOps pathway from L1, 2 March to 14
> August 2026, 170 teaching hours. She demonstrated 61 of 64 objectives.
> The three not demonstrated are listed. Assessed by two named
> instructors. Final project and its specification attached. Verify at
> [url] with code XXXX-XXXX.

That is a stronger document than a Coursera certificate, and it is true.
Whether anyone is impressed is a separate question — but the person
reading it can check it in thirty seconds and see exactly what was done.

---

## What has to be built that does not exist

**The system tracks counts, not people.** A session records "11 of 14
demonstrated CS-3.3.1" — not which eleven. That was a deliberate choice:
per-learner marking would roughly double the time the daily form takes,
and a form that takes fifteen minutes gets filled in on Friday from
memory, which destroys the continuity data as well as the assessment data.

Individual credentials need a learner layer. Concretely:

- **learner** — a person, enrolled in a cohort
- **assessment** — a scheduled check at the end of each module, where an
  instructor marks named learners against named objectives. Lower
  frequency than the daily log, so it can afford the time
- **artefact** — a link to the actual work: the code, the firewall rule,
  the confusion matrix. This is what a technical employer will look at and
  what no other certificate offers
- **credential** — issued when a pathway is complete, referencing all of
  the above, with a verification code

**This is a real piece of work**, not a feature toggle. It also carries a
privacy obligation the current system does not: named individuals with
performance records, in a database whose hosting region is still an open
question. That has to be settled first, not after.

---

## Four routes to recognition, in order of how realistic they are

### 1. Named local employers who say they accept it

Worth more in Ouagadougou than a global brand nobody checks. Ten
Burkinabè and regional employers who have agreed in writing to interview
holders, listed on the certificate and the verification page.

This is achievable, and it is almost entirely relationship work rather
than engineering. It is also the route most likely to actually get
somebody a job.

### 2. Feed the employer's own ATI dossier

The search turned this up and it is the most useful finding.

Burkina Faso operates an **Agrément Technique en matière Informatique
(ATI)** — a state approval, run by the Ministry of Digital Transition
through the DGTIC, which an IT company must hold to bid on public
contracts. It has been required since 2016 and moved fully online in
April 2026 at ati.gov.bf.

It is **not** an individual credential and will not certify learners. But
one of its evaluation criteria is the **qualified human resources of the
company**.

That is a direct, concrete, local argument for the credential: a
Burkinabè IT firm that hires a graduate gets documented, verifiable
evidence of a qualified person for its own ATI file. Not "this
certificate is prestigious" but "this certificate helps you win public
contracts".

Two things follow. Someone should confirm what the ATI criteria accept as
evidence of qualification, because that should shape what the certificate
states. And separately — **Infodat may need an ATI itself** to operate or
contract in-country. Worth checking regardless of the credential.

### 3. Prepare learners for a certification that is already recognised

The curriculum can be aligned so that finishing a branch leaves someone
ready to sit an exam that already carries weight, without the programme
claiming any affiliation:

- **DevOps** — Linux Foundation LFCS, AWS Cloud Practitioner
- **Cybersecurity** — CompTIA Security+
- **Software development** — no single dominant one; the portfolio does
  more work here
- **Networking generally** — Cisco Networking Academy, which has a long
  established presence across Africa

The learner then holds two things: the Infodat credential describing what
they actually did, and an industry certificate a stranger recognises. The
second borrows recognition the first does not have.

This costs a mapping exercise per branch. It does not require permission
from anybody.

### 4. An institutional partner

A university, a technical institute, or the national employment agency
co-signing the credential. Highest value, slowest, and entirely outside
engineering. Worth starting early precisely because it is slow.

---

## Things not to do

**Do not use the words "accredited" or "certified by" unless it is true.**
It is both dishonest and, where a state scheme like the ATI exists,
potentially a legal problem. "Issued by Infodat International" is
accurate and sufficient.

**Do not make the certificate the product.** The evidence behind it is the
product. A certificate with a dead verification link is worse than no
certificate, because it invites a check that fails.

**Do not issue on attendance.** The moment a credential can be obtained by
turning up, it stops meaning anything and everyone finds out. The
objectives exist precisely so that it can be issued on demonstrated
capability instead.

**Do not let it expire quietly.** If the verification URL stops resolving
in three years, every credential ever issued becomes worthless
retroactively. Whoever owns the domain owns the credibility, and that
outlives this project.

---

## What I would do first

1. **Settle the data residency question.** Named learners with
   performance records raise the stakes on where the database lives. This
   already blocks other things.
2. **Find out what the ATI accepts as evidence of qualified staff.** One
   conversation, and it shapes what the certificate should say.
3. **Build the learner and assessment layer.** Roughly a week, and the
   end-of-module check is useful on its own even if no certificate is ever
   issued — it is the second evidence source the oversight design has been
   asking for since the beginning.
4. **Then the credential and its verification page**, which is small once
   the layer beneath it exists.

Steps 1 and 2 are not engineering and are the ones that decide whether
step 3 is worth doing.

---

## Sources

- [Burkina Faso Advances Digital Transformation with Online IT Certification System — TechAfrica News](https://techafricanews.com/2026/03/19/burkina-faso-advances-digital-transformation-with-online-it-certification-system/)
- [Lancement de la plateforme de demande d'agrément technique en matière informatique — Burkina24](https://burkina24.com/2024/04/02/tic-au-burkina-faso-lancement-de-la-plateforme-de-demande-dagrement-technique-en-matiere-informatique/)
- [Agrément Technique Informatique — ati.gov.bf](https://ati.gov.bf/)
- [Agréments Techniques (ATI) — DGTIC](https://dgtic.mdenp.gov.bf/agrements-techniques/)
