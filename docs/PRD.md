# Tabletop PRD

*AI Integration Environment Tabletop · Virtual Insights LLC · City of Hope HCD session*
*Version 1.4 · September 26, 2026*

> **The code is the source of truth.** Tabletop runs as two tracks, the web
> app and the paper kit, and each track's code is its own source of truth:
> `server/` and `client/` for the app, and `paper/` for the kit. The paper
> track is expected to drift from the app (§12). This document describes what
> `Angie-CapitolCommons/tabletop` does at `main` `47d33fc`, plus two open
> changes: the paper kit (PR #24) and the purpose-rubric fix (the PR that
> carries this document). Where this document and the code disagree, the code
> wins and this document gets fixed. Section 15 lists what earlier drafts
> promised that the code doesn't do. PR #23 (open) would make skipping cost
> what declining costs and mark skipped decisions on the 12-month report; this
> document describes `main` without it.
>
> Canonical live copy: https://claude.ai/artifact/JF66MvDzFKgVit8kg1e85k.
> This file is the repo mirror; update both together.

---

## 1. Summary

Tabletop is a facilitated exercise for four breakout rooms. Each room works
one fictional case through the AI governance lifecycle. At each decision the
room agrees on one answer, writes down who is on the hook, and says who made
the final call. Then the answer is challenged for what's missing: in the app
by an AI Council of advisors (the Elders), and on paper by the facilitator.
Each decision sets dated events in motion, and at the end the case runs twelve
months forward to show what held and what broke. The four rooms' answers are
compared side by side for the closing plenary.

**Why it exists.** City of Hope's obstacle isn't mechanics. Funding is
committed, a sponsor is agreed, and a peer governance framework is endorsed.
What's unsettled is who decides, who accepts risk, what counts as proof, and
what ends a thing. Discussing those questions in the abstract produces
principles. A case with consequences produces decisions.

**Forced collaboration.** There's no private voting and no participant device.
Each room has to agree on one answer, in role, and defend it.

**Definition of success.** Every room leaves with a decision path in which
each decision names a person or role plus a trigger, number, or date, or is
recorded as a gap the room couldn't close, visible at plenary.

**How the City of Hope session runs: on paper.** On September 26, 2026 the
organization decided, for security reasons, to run the session on paper
instead of the web app. The paper kit (§12) starts from the app's scenario
content, but the paper process is being refined on its own and will drift from
the app experience. The web app stays deployed; it won't be used in this
session.

---

## 2. Context

| | |
|---|---|
| Session | Full day at Duarte, 20–25 attendees, late September / early October 2026 |
| Breakouts | 4 rooms, about 90 minutes |
| Attendees | Senior clinical, ETG, business strategy, innovation, security, data |
| Facilitation | One facilitator per room, with no scribe. The lead facilitator (Angie) runs plenary. |
| Delivery | The paper kit (§12). The web app at `tabletop.virtual-insights.com` (Replit) is built but not used for this session. |
| Case assignment | Fixed on paper: Room 1 is S1, Room 2 is S2, Room 3 is S3, Room 4 is S4, in lifecycle order left to right across the plenary wall. (In the app, rooms choose; see §4.) |
| Content | Fictional composites. No City of Hope interview transcripts, survey responses, or attributable material in the content, the prompts, or the repo. Nothing is attributed to a person present unless they named it themselves in pre-work. |

---

## 3. Roles

Five roles per room. Every person plays a role and every role is played: two
people can share a role, or one person can play two. Full coverage is a
facilitation rule; the app doesn't enforce it.

| Role | The job |
|---|---|
| **The Executive Sponsor** | The senior leader who sponsors the tool in this case. Defined per case: the senior revenue cycle leader (S1), the head of pathology (S2), the operations executive running the rollout (S3), the leader of the oncology clinics (S4). |
| **The Security Guard** | Security and risk |
| **The Money Manager** | Budgets, contracts, and renewals |
| **The AI Guru** | What the tool actually does, versus what the slide said |
| **The Competitive Marketing Leader** | What gets said outside, and when |

The Executive Sponsor replaced the earlier draft's "Doctor" (PR #18).

**There's no decider card.** Who decides is the unsettled question at City of
Hope; a card that pre-assigned it would answer it for them. Instead every
answer records who made the final call (§5), and whether a decider emerges,
rotates, or never lands is a finding.

**Role cards** are printed, one set per case. Each card has a three-line
mandate (your job, what you won't go along with, what you're judged on) and two
facts only that role knows, each with a cue for when to bring it up. The room
screen never shows role cards. First names are recorded against roles on the
briefing screen and in The Decisionmakers drawer.

---

## 4. The four cases

| | Case | Enters at | Decisions, in order (Elders) |
|---|---|---|---|
| S1 | Three Worthy Requests, Capacity for One | Intake | purpose (Cartographer) · tier (Steward) · decide (Adoption Realist) · proof (Decoupler, Recruiter) · funding (Ledger) · represent (Beacon) |
| S2 | Approved in Principle, Stuck in Evaluation | Evaluation | purpose (Adoption Realist) · proof (Decoupler) · risk_accept (Steward) · retier (Caretaker) · decide (Cartographer, Ledger) · represent (Beacon) |
| S3 | Worked at One Site, Now Being Scaled | Deployment | tier (Steward) · risk_accept (Adoption Realist) · decide (Cartographer) · stop (Caretaker) · represent (Beacon) · funding (Ledger, Recruiter) |
| S4 | Live a Year, Drifted, Spread Beyond Approval | Monitoring | risk_accept (Steward) · stop (Caretaker) · tier (Steward) · decide (Cartographer) · proof (Decoupler, Recruiter) · retier (Caretaker) · funding (Ledger) |

That's 6, 6, 6, and 7 decisions, and all nine decision types appear across the
set. Each case is built to carry four things, or a room will skip the matching
question: an unstated purpose, a tool that was never given a risk level (or
was given the wrong one), a split between budget and authority, and evidence
with no defined ending. Each case file's header comment says how it carries
them.

**What a case contains** (the shape is documented at the top of
`server/content/common.js`; `s4.js` is the reference):

- **Opening:** the moment something went wrong, as narration plus dated
  messages (secure chat, email). No backstory summary.
- **Model brief:** plain facts the Elders need. Never shown to the room.
- **Evidence:** four or five in-fiction documents, plus the shared "Who's who".
- **Decisions:** title, question, the prompt for the written answer, one or two
  Elders, options A–C plus the room's own plan and "We can't answer this
  today", and for each option its meter moves and a dated event. Each decision
  also has an owner beat and a 12-month entry, each with a named and a
  not-named version, and optionally a "Meanwhile" memo that depends on an
  earlier answer.
- **Villagers:** four or five first-person lines from people who live with a
  decision, keyed to specific decisions. The room sees the speaker (for
  example, "A GI oncology nurse manager").
- **Role cards:** see §3.

**Who's who.** One fictional org chart shared by every case, so rooms route
decisions to the same named groups and cross-room collisions are visible: AI
Governance Workgroup, Clinical Practice Council, AI Integration Environment, AI
Leader, Information Security, Digital Health (IT), Quality & Patient Safety,
Finance (including the Innovation Fund), Communications, and the IRB.

**Choosing a case.** In the app, the room picks at the start, and a case can
be held by one room only (enforced by the database). For the paper session,
the lead facilitator assigns cases in advance.

**Content version.** `CONTENT_VERSION` in `common.js` is bumped when saved room
state would no longer make sense. Rooms saved under an older version start
fresh at startup.

---

## 5. The decision loop (app)

The room screen is a fixed 1280×800 stage for the projector. For each
decision:

1. **Start discussion.** A prompt covers the screen until the facilitator
   starts the discussion, which also starts transcription (§11).
2. **Pose.** Any "Meanwhile" memo, then the question and the options.
3. **Record.** The facilitator selects the option and writes the room's
   answer, then picks who made the final call: a "Role · Name" chip, "The
   group", or "Other". The written answer and the final call are both
   required.
4. **AI Council round.** Starts automatically and streams. If any Elder fails,
   the round fails and the screen offers **Retry Elders** or **Hold the answer
   instead**.
5. **Hold, revise, or ask again.** Revise reopens the answer prefilled and
   runs a new round on the change. **Ask the AI Council again** runs another
   round from a different angle, and earlier rounds stay visible. The first
   and the latest answers are kept.
6. **Score.** The facilitator taps Specific, Generic, or Absent (§9), or
   chooses "Edit the answer".
7. **Consequence.** The option's dated event, then the owner beat: the named
   version if the score was Specific, the not-named version otherwise. The
   screen shows what moved on the meter and why, the Villager if this
   decision has one, and the decision path. **Undo this score** reverses the
   lock.

**Skip** (two clicks) is available before the consequence and is recorded as
skipped, which is different from declined. **We can't answer this today** has
its own authored hint and event and always adds time. **None of these — we'll
write our own** records the room's plan word for word. The Elders and the
answer check read it, but the event is a generic "the room's plan goes out
exactly as written."

The facilitator bar offers Evidence, the AI Council (the eight Elders and what
they watch for), The Decisionmakers (the roster), and transcription in every
phase. A finished decision can be reopened read-only from the step rail.

---

## 6. The AI Council (Elders)

Eight Elders, one or two per decision, and every decision has at least one.

| Elder | Seat | Watches for |
|---|---|---|
| The Steward | Security and risk | A safety check called red tape; "safe to try" has no definition; nobody will sign for the risk |
| The Caretaker | Operations and sustainment | Go-live treated as the finish line; nobody watching after launch; no plan for updates; running costs with no owner |
| The Cartographer | Governance | A decision with no name on it; "it went to committee"; two groups claiming the same call |
| The Ledger | Finance | No price stated; "it's free"; nobody paying at renewal |
| The Decoupler | Quality and measurement | A goal with no owner; no number to hit; no evidence |
| The Adoption Realist | Clinical informatics | An approval with no clinical owner; assuming clinicians will use it |
| The Recruiter | Workforce | New work added to a job with nothing taken off it; "someone will pick it up" |
| The Beacon | Peer and external | Saying more outside than we can back up; "our peers are already doing it" |

**How they talk** (the shared rules in `common.js`): one to three short
sentences, under 50 words; polite and supportive; start with what's solid in
the answer; ask for the one thing missing (a named person or role, a trigger,
a number, a date); back a good answer rather than inventing objections; say
plainly what happens when the room declines; plain hospital words, no jargon
or acronyms; use the Who's who names. Each Elder remembers what it said
earlier in the room and mentions it gently if the room didn't take it up.

The personas are **placeholders** until they're derived from
`CoH_Council_Actor_Encoding.md`.

There is no AI Council on paper. The facilitator challenges the answer
instead (§12).

---

## 7. Consequences and the 12-month report

Consequences are authored, not generated. The model plays the Elders; it
doesn't decide what happens.

- **"Meanwhile" memos** depend on the room's answer at one earlier decision.
- **Events:** one dated event per option.
- **Owner beat:** one dated beat per decision, in a named version (plays when
  the score is Specific) and a not-named version.
- **12-month report:** one dated entry per decision, sorted by month, again
  named or not named by score. A skipped decision plays as not named.

At the end of a case the app also offers:

- **Ask how we got here:** a chat about the room's own record (§11).
- **Talk it through:** a debrief that shows, for each decision, what the room
  wrote, what a Specific answer needed, the month's outcome, the version the
  other score would have produced, and what the Elders said.

---

## 8. The cost meter

Four measures: clinician goodwill, risk exposure, dollars committed, and time
to first value. There's no winning score. The meter exists to make trade-offs
visible and to stop "let's do both."

**In the app:** the meter starts at goodwill 10, risk 4, dollars 3, and time 5.
At lock, the chosen option's authored moves apply, then the answer check
adjusts for what the room wrote: time +1 (or +2) for added meetings, votes,
sign-offs, reviews, or handoffs beyond the option itself, and goodwill −1 (or
−2) for work put on clinicians with nothing taken off their plate. Undo
reverses both. Values have no bounds.

**On paper:** the room judges each decision's effect itself. After each
answer it decides whether each measure went up or down and marks the meter
board with a + to the right of the center line or a − to the left. No
authored amounts and no answer check.

---

## 9. Measurement

### Class A: decision content

Each decision is scored **Specific**, **Generic**, or **Absent** at lock.
Specific is the only score that counts as an answer. The score decides the
owner beat and the 12-month entry; it doesn't move the meter. A declined
decision isn't scored automatically.

| Code | Measure | Specific means |
|---|---|---|
| A1 | Purpose boundary | one purpose in a sentence, what it leaves out, and who signs off on that choice |
| A2 | Tier assignment | who sets the risk level, and whether it covers the tool everywhere or each use |
| A3 | Re-tier trigger | the events that send it back for review, and who watches for them |
| A4 | Decision rights | one person or role who decides, who they check with, and a date |
| A5 | Risk acceptance | a person or role who signs for the risk, and what would make them revisit it |
| A6 | Burden of proof | a number to hit, who measures it, and by when |
| A7 | Stop condition | who can turn it off, and what would make them do it |
| A8 | Funding carry | whose budget pays, and for what: the build, running it, the renewal |
| A9 | External representation | who approves what's said outside, and what has to be true first |

Generic is a committee or department instead of a person or role, or no
trigger. Absent is no one named. (Source: `client/src/measures.js`. The A1
wording was changed on September 26 to fit S2, whose purpose decision is
which question the evaluation answers.) The A-codes appear only on the admin
dashboard and the paper plenary wall, not on the room screen.

### Class B: decision behavior

**Recorded:** when each decision was posed, first answered, and locked; who
made each final call; the first and latest answers; the discussion
transcripts; the answer-check results.

**Not computed by the app:** time to the first named decider, deferral moves,
claim and disclaim, reversal after a memo, language tracking, and aggregated
role-assignment reporting. These are synthesis work for the lead facilitator,
from the export (or from the worksheets, on paper).

### Class C: across rooms

The admin dashboard flags, from scores only:

- **Aligned:** at least three rooms (or all the rooms that were asked the
  decision, if fewer) scored it Specific.
- **Friction:** the settled rooms' scores differ.
- **Orphan:** at least that many rooms skipped it, declined it, or scored it
  Absent.

**Collision** (the same authority given to different people, or sent to
different groups) and **drop-off** (where specificity collapses along the
lifecycle) aren't computed. The lead facilitator reads them from the matrix,
or from the wall on paper.

---

## 10. Admin dashboard (app)

At `/admin`, behind the admin code. Refreshes every 2.5 seconds.

- **Room cards:** room number and code, case, phase and current decision,
  progress dots, meters, roster with first names, debrief transcript, and
  "Reset this room".
- **Matrix:** the nine decision types (A1–A9 with definitions) by room. Each
  cell shows the score, the short answer, and who made the final call; hover
  for the written answer; link to the transcript with a word count. Flags per
  §9.
- **Decider emergence:** a tally of the final-call entries per room.
- **Themes:** an AI read across finished rooms (overview, themes, open
  questions), optionally including transcripts, downloadable as .md and
  .json.
- **Transcript viewer:** per decision and per debrief, downloadable as .txt.
- **Export all rooms** (JSON), and **full reset** (type RESET; an export is
  offered first). Per-room reset works the same way.
- A link to the printables (`/api/print`).

On paper, the plenary wall replaces the dashboard (§12).

---

## 11. Model calls, transcripts, and privacy (app)

All Anthropic calls are server-side. The key lives only in the server
environment. Model: `MODEL`, default `claude-opus-5`. The stable parts of each
prompt are cached.

| Call | When | Receives | Settings |
|---|---|---|---|
| Elder turn | Each Council round | Persona, Who's who, model brief, the path so far, the answer, the Elder's own earlier turns | Streamed; low effort; 8-second first-token timeout |
| Answer check | After the round | The option, its hint, the written answer, the Elders' comments | 10-second timeout, one retry; rates clinician burden and added process |
| Ask how we got here | 12-month report | The room's full record, including transcripts | Question up to 1,000 characters; the last 8 exchanges kept |
| Themes | Admin, on request | The finished rooms; transcripts only if the admin opts in | High effort, JSON output |

**Names.** Before any prompt is built, `privacy.js` replaces roster first names
with roles. No first name reaches the model. First names do appear in the
roster, on the admin room cards, in the final-call entries on the matrix and
tally, and in exports. (The briefing screen says names never reach the
reports; that's inaccurate. See §15.)

**Transcripts.** Browser speech recognition, text only. No audio is stored and
no voice is identified. Transcription starts from the decision gate (and on
revise, edit, and in the debrief) and stops when the answer is submitted, at
the consequence, and when the decision changes. Transcripts go to the record,
the export, the admin viewer, the "how we got here" chat (always, with names
removed), and the themes run (only if the admin opts in). They never go into
Elder turns or the answer check.

There's no per-room spend cap and no global circuit breaker.

---

## 12. The paper kit

`npm run paper-kit` builds 12 editable Word documents (`paper/build-kit.mjs`;
PR #24). The paper process is refined on its own and is expected to drift from
the app; it isn't a printout of the app.

| Document | Who it's for |
|---|---|
| Print Order | The print shop: every file by exact name, with copies, paper, sides, and finishing, and how to cut and bundle the kits. No other document has printing instructions. |
| Facilitator Guide | Every facilitator: run of show, the steps at each decision, scoring, the meter |
| Meter Board | One per room |
| Lead Facilitator: Assignments and Plenary Wall | The lead facilitator: the room assignments, how to read the wall, which case asks which measure, the decider tally, and the A1–A9 matrix, with each room's case in its column header, the cells that should get an answer outlined, and unasked measures shaded |
| Per room (color-coded) | Facilitator Booklet, and one Room Packet in four sections with a section break between each: 1 Scenario (opening and evidence), 2 Role Cards, 3 Decision Cards, 4 Worksheet |

### Where paper differs from the app

As of September 26, for one facilitator per room with no scribe. Keep this
list current as the paper process moves further from the app.

- **Assigned cases** instead of choosing.
- **"Meanwhile" memos** as lookup tables: find what the room chose earlier,
  read that row.
- **No AI Council.** The facilitator challenges the answer in their own
  voice, from one set of questions per decision (`paper/challenges.js`) with
  four branches: nobody named, named but missing a trigger or number or date,
  specific, and declined. They press on the answer, never on a person; when
  the answer is already specific, they say so and the follow-up is optional.
  The worksheet records "After the challenge: Held / Revised".
- **The meter** judged by the room (§8).
- **No 12-month report.** The debrief works from the worksheet and the meter
  board. The owner beat read at each decision still depends on the score.
- **The dashboard** as a wall of colored sticky notes on the A1–A9 matrix.
- **Transcripts** replaced by the facilitator's notes on each decision: words,
  never names.
- No "ask again", no undo, no "how we got here" chat, and no themes run. The
  lead facilitator covers those in synthesis.

### Where each piece lives

| What | Source | Shared with the app? |
|---|---|---|
| Cases: opening, evidence, decisions, options, events, owner beats, 12-month entries, Villagers, role cards | `server/content/` | Yes, read by the kit at build time |
| Scoring rubric | `client/src/measures.js` | Yes, read by the kit at build time |
| Challenge questions | `paper/challenges.js` | No, paper only |
| Facilitator steps, meter board, worksheet, plenary wall, and all kit wording | `paper/build-kit.mjs` | No, paper only |

**Rules for drift.**

- A paper-only change goes under `paper/`. It never edits `server/content/`
  or `client/` to get a different printout, because that changes the live
  app too.
- When paper needs a shared item (a case, an option, the rubric) to read
  differently from the app, move that item's paper version under `paper/` and
  have the kit read it from there. From then on, that item belongs to paper.
- A change to `server/content/` or `measures.js` still flows into the kit
  until paper has taken that item over. Regenerate the kit and check the
  affected pages after any such change.
- Editing the generated Word files is fine for a one-off printing fix, but
  those edits are lost on the next build. Anything that should last goes in
  `paper/`.

---

## 13. Architecture and operations (app)

- **Client:** React and Vite. The room screen and the admin dashboard.
- **Server:** Node and Express.
- **Data:** Postgres is the source of truth. One row per room holding its whole
  state as JSON (`tabletop_rooms`), plus `tabletop_meta` for the themes run.
  Every change locks that room's row; a unique index keeps each case to one
  room. `DATABASE_URL` is required.
- **Deployment:** Replit Autoscale, custom domain
  `tabletop.virtual-insights.com` (Squarespace DNS). Any number of instances
  can serve rooms. Don't redeploy during a session. The deployment stays up
  after the City of Hope session moves to paper (decided September 26).
- **Access:** four distinct room codes (`ROOM_CODES`) and one admin code
  (`ADMIN_CODE`) are required; there are no defaults. Codes are compared in
  constant time. Ten wrong tries per IP per minute returns 429. Participants
  have no accounts and no devices.
- **Health:** `GET /api/health` (no auth) reports the running commit, the
  model, whether the Anthropic key is present, and the storage mode.
- **Rehearsal:** `npm run rehearse` plays all four cases in all four rooms
  against a running site through the real API, with real model calls and
  race tests.
- **Printables:** `/api/print` (no auth) serves simpler worksheets and role
  cards. The paper kit supersedes them for this session.

---

## 14. Out of scope

- Real City of Hope cases, transcripts, or survey responses in any content
- Patient data of any kind
- Scoring or ranking rooms against each other
- Deciding *how* anything gets built; the room owns what, who, when, and who
  pays
- Replacing the human facilitator
- Participant devices, private voting, or individual answers

---

## 15. Known gaps

Things earlier drafts promised, and places where the code contradicts itself.
The app stays deployed, so these matter even though this session runs on
paper; the spend cap and the unauthenticated endpoints matter most.

- **No delete-on-request or post-session shutdown.** Reset overwrites state,
  and the legacy `data` column is kept as a backup. There's no delete endpoint
  and no switch to disable the app.
- **No per-room spend cap or global circuit breaker** on model calls.
- **First names reach admin views and exports**, while the briefing screen
  says names never reach the reports.
- **Stale comments** in `server/index.js` (around lines 196 and 867) say
  transcripts never reach the model. They do, in the "how we got here" chat
  and in opted-in themes.
- **One Elder failing drops the whole Council round.** The client also
  handles an `elder-unavailable` event the server never sends.
- **`/api/print` and `/api/elders` need no auth.** Both return fictional
  content only.
- **Not built:** collision and drop-off detection, presenter mode, flowchart
  export, and the Class B metrics.
- **Write-ins** get a generic event, not a consequence that follows the room's
  own text.
- **The README** still calls the Postgres store optional.
- **Elder personas** are placeholders (§6).

---

## 16. Open questions

1. Derive the Elder personas (app only) from `CoH_Council_Actor_Encoding.md`.
2. Check scenario detail against the internal scout dispatch findings.
3. Whether the four planning-team topics (North Star, Categorization,
   Operating Model, Success Metrics) stay as agenda labels over this
   structure (recommended) or are restated.
4. An infusion nurse as a Villager in S4. Not added; S4 already has five
   Villagers.

---

## 17. History

| Date | Change |
|---|---|
| Sep 23, 2026 | PRD drafts v0.1–v0.8. Phases 0–3 built: the vertical slice, S4 end to end, all four cases, four rooms and the admin dashboard (PRs #1–#5). Transcription (#6) and The Decisionmakers roster (#7). |
| Sep 24 | Health check (#8), stability fixes (#9, #10), and Replit configuration (#11). |
| Sep 25 | Cases rewritten as moments instead of summaries, with transcripts, debrief, facilitator controls, clinician goodwill, and admin themes (#12–#14). |
| Sep 26 | Time to first value rises with added process, and the Villager disclosure line is dropped (#15). "AI Lab" renamed the AI Integration Environment (#16). Review drawer (#17). The Executive Sponsor replaces The Doctor (#18). Ask the Council again, "how we got here", four rooms at once (#19). Rehearsal script and Postgres as the source of truth on Autoscale (#20–#22). |
| Sep 26 | The session moves to paper. Paper kit (#24) with assigned cases and a room-judged meter. A1 rubric reworded to fit S2. This document rewritten to describe the code (v1.0). v1.1: the Replit deployment stays up; paper is its own track and is expected to drift from the app (§12). v1.2: the AI Council is removed from paper; the facilitator challenges the answer instead. v1.3: a Print Order document holds all printing instructions; rooms are fixed to cases (Room N = SN) and the plenary matrix prints with them. v1.4: one Room Packet per room (Scenario, Role Cards, Decision Cards, Worksheet); the 12-month report is dropped from paper. |
