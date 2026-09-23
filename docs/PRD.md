# PRD — AI Integration Environment Tabletop

*Virtual Insights LLC · City of Hope HCD session · Draft v0.8, September 23, 2026*

> Canonical live copy: https://claude.ai/artifact/JF66MvDzFKgVit8kg1e85k — this file is the repo mirror; update both together.

---

## 1. Summary

A facilitated tabletop exercise, run in four parallel breakout rooms during the City of Hope HCD session. Each room works a fictional scenario through the AI governance lifecycle, answering the same set of decision questions **as one group** — collective answers, argued out loud, entered on a single shared room screen. AI-played non-player characters challenge those answers in character. Each room's output is a decision flowchart. The four flowcharts are consolidated live on the lead facilitator's admin dashboard into a map of alignment, friction, collisions, and orphans, which drives the closing plenary.

**Why it exists.** The sensing work says City of Hope's obstacle is not mechanics. Funding is committed, a sponsor is agreed, and a peer governance framework has been endorsed. What is unsettled is who decides, who accepts risk, what counts as proof, and what ends a thing. A discussion of those questions in the abstract produces principles. A scenario with consequences produces decisions.

**Forced collaboration is the design.** There is no private voting and no per-participant device. The room cannot hide behind a spread of individual answers; it must converge, in role, on one answer it owns — and then defend it to an NPC. A facilitator who needs a quick temperature check calls a show of hands, off-app.

**Definition of success.** Every room leaves with a completed decision path in which each node names a specific role or person, a trigger, or a threshold — or is explicitly recorded as unanswerable, with that gap visible in the consolidation.

**Guiding constraint on build.** Keep it simple. One web app, five logins in the world (four room codes, one admin code), one screen per room, a live model behind it, and a printed worksheet in the bag if the technology fails. The exercise design carries the session; the application supports it.

---

## 2. Context and constraints

| | |
|---|---|
| Session | Full day at Duarte, 20–25 attendees, late September / early October 2026 |
| Breakouts | 4 rooms, mixed jurisdictions, ~90 minutes |
| Attendees | Senior clinical, ETG, business strategy, innovation, security, data |
| Facilitator | One human per room; the application supports, it does not replace |
| Delivery | Hosted web app at `tabletop.virtual-insights.com`, deployed on Replit. Claude artifacts are not permitted at CoH. |
| Room hardware | One laptop per room (the facilitator's), projected or on a large display. Nothing else. |
| Network | InfoSec approval does not include whitelisting — `tabletop.virtual-insights.com` is an ordinary external site to the CoH network. Test reachability several ways: CoH network on the room laptops, the guest network, and personal devices. If nothing reaches the app, the exercise runs on printed worksheets — the app is the preferred vehicle, not a dependency. |
| Clearance | **Approved.** InfoSec has signed off on live model calls in session: server-side API calls, no PHI, no PII, no CoH source material. The build must keep those conditions true. |

**Hard constraint on content.** No City of Hope interview transcripts, survey responses, or attributable material is sent to the model or embedded in the application. Scenarios are fictional composites. The absolute attribution rule from the Council encoding applies: no finding is attributed to a person present unless they named it themselves in pre-work.

---

## 3. Users

- **Participant.** A City of Hope leader at the table. Holds a role card, argues from its mandate, and answers as part of the room. Touches no device; sees the shared room screen.
- **Room facilitator.** Logs in at `tabletop.virtual-insights.com` with a pre-defined room code; their laptop is the room screen. Selects the scenario with the group, records role assignments (first names against the five roles), drives pacing, enters the room's collective answers, marks nodes unanswerable or skipped, assigns the specificity score at lock.
- **Lead facilitator (Angie).** Logs in with a pre-defined admin code to a separate **admin dashboard**: all four rooms' outputs consolidating live during breakouts, presenter mode for plenary, exports.

---

## 4. Architecture

A single hosted web application, one mode. Five clients at peak: four room screens and the admin dashboard. No City of Hope accounts, no participant devices, no claude.ai dependency in the room.

### Stack

- **Front end:** React
- **Server:** Node, serving the API and the real-time channel
- **Data:** Postgres (rooms, nodes, answers, events)
- **Real time:** SSE from server to the admin dashboard (and for streaming NPC turns to room screens). Each room screen is the single writer for its room, so no bidirectional channel is needed.
- **Deployment:** Replit, always-on (no scale-to-zero), at `tabletop.virtual-insights.com`
- **DNS:** record added in Squarespace DNS for virtual-insights.com, per Replit's linking instructions (A + TXT verification). Existing site records untouched.
- **TLS:** platform-issued certificate on the custom domain

### Model calls

All Anthropic API calls are **server-side**. The key lives in the server environment and is never exposed to a browser. Streaming responses so NPC turns appear progressively on the room screen. Prompt caching on the Council encoding and scenario state, which repeat on every turn in a room. Per-room spend cap and a global circuit breaker.

### Access model

- Room facilitators: four pre-defined room codes, issued before the session
- Lead facilitator: one pre-defined admin code
- Participants: no accounts, no codes, no devices
- **First names only** — recorded by the facilitator against role assignments, nowhere else. No last names, no email, no titles, no PII. First names never appear in Class B/C reporting or in anything sent to the model.
- Access is deliberately this simple. The app exists for one session, holds fictional content only, and is **disabled promptly after the session** — that lifecycle, not authentication, is the security model. Session data deleted after synthesis is delivered; retention window stated to CoH security in advance.

### Failure handling

- **If a live NPC call fails or stalls,** the app tells the room plainly ("The Steward is unavailable — continue") and the facilitator moves the node to lock. No canned-response engine, no offline build.
- **If the app itself is unreachable,** the room switches to the printed worksheet: one per scenario, mirroring the node questions and answer options, filled in by hand and consolidated by the lead facilitator manually. The worksheets are a deliverable, not an afterthought — they are also the answer if InfoSec clearance for live calls does not land in time.

---

## 5. Scenario model

### 5.1 Structure

Four scenarios. When a room facilitator logs in, the group decides which scenario to take on; once chosen it is unavailable to the other rooms (the admin dashboard shows who has claimed what). Each scenario **enters the governance lifecycle at a different point** and works forward through injects and backward to "what should have happened earlier."

| # | Scenario | Enters at |
|---|---|---|
| 1 | Three worthy requests, capacity for one | Intake |
| 2 | Approved in principle, stuck in evaluation | Evaluation |
| 3 | Worked at one site, now being scaled | Deployment |
| 4 | Live a year, drifted, spread beyond approval | Monitoring |

Every scenario must carry four properties by construction, or a room will skip the matching question: an unstated purpose; a mis-tiered or never-tiered object; a split between entity and system or between budget and authority; an ambiguous evidence base with no defined ending.

### 5.2 Node schema

Every scenario is a path through typed nodes. Node types are identical across scenarios — this is what makes the four flowcharts merge.

| Node | Question |
|---|---|
| `purpose` | Is this in scope for the environment? What is it not for? |
| `tier` | What tier, who sets it, does it cover the tool or the use? |
| `risk_accept` | Who accepts a residual risk when disclosure is incomplete? |
| `decide` | Who decides, who is consulted, which body? |
| `proof` | What threshold advances it? |
| `funding` | Whose budget at build, at scale, at renewal? |
| `retier` | What forces a re-review? |
| `stop` | What ends it, and who can turn it off? |
| `represent` | What may be said about this outside CoH, at what readiness? |

Six to eight nodes per scenario. Not every scenario uses every node; coverage is guaranteed across the set, not within one room.

**Evidence folder.** Each scenario ships with a small set of in-fiction documents — a memo, a dashboard screenshot, an old approval email — that the room can open on the shared screen at any time. Backstory lives there, not in the facilitator's mouth. (Pattern proven in the Pod Quest training game.)

### 5.3 Node interaction loop

1. **Pose.** The node question appears on the room screen, in scenario context.
2. **Discuss.** The room works it out loud, role mandates in tension, until it converges on one answer it owns. This is the exercise; the facilitator holds the room to it.
3. **Answer.** The facilitator enters the room's answer: multiple choice, plus a required free-text field naming the specific person, role, trigger, or threshold, plus a second required field — **who made that final decision?** A role, a first name, or “the group,” recorded verbatim. The room's own decision process is data (§8). Two standing options exist on every node: “We cannot answer this today” (recorded as an explicit gap, not a failure) and a **write-in** — “we choose a different path” — where the room's answer is the free text itself, honored verbatim: the consequence engine and the Elders hold the room to exactly what it wrote.
4. **NPC challenge.** One or two NPCs respond in character to what was actually written. If the call fails, the beat is skipped and the room continues.
5. **Revise or hold.** Both the first and revised answers are recorded.
6. **Lock.** The facilitator scores the node (see §8), the flowchart grows, the cost meter moves.
7. **Consequence.** The scenario advances based on what they decided.

The facilitator can compress or skip a node under time pressure; a skipped node is recorded as *skipped*, distinct from *declined*.

**Discussion capture (per decision, facilitator-controlled).** Each node has a Start/End discussion control. While on, the room’s spoken discussion is *live-transcribed as text* and attached to that decision’s record, tagged by beat (before the answer vs. after the Elder challenge) — because the lived tensions in the argument are where the problems are, not only in the verdict. Three hard properties: **no audio is ever stored** by the application; **no voices are attributed** — the transcription engine has no speaker identification at all; and the transcript **never reaches the model** — it goes to the record and the export only. A standing indicator is visible on the room screen whenever transcription is on, and it stops automatically when the decision locks. Transcription uses the browser’s built-in speech engine (Chrome), which processes audio transiently through the browser vendor’s service; noted to InfoSec as a one-line addendum. Transcripts of group discussion will be fragmentary — that is acceptable; they are mined for tension language, not minutes.

### 5.4 Consequence engine

Injects are not on a timer. They are caused. A vague `tier` answer produces, three months on, a tool doing something nobody approved. A deferred `risk_accept` produces a stalled vendor and continued unapproved use. A specific named owner at `decide` means someone is there to catch drift at `stop`. Declining a node has consequences too — a decline is never free.

At the end, the scenario runs twelve months forward and reports in narrative what held and what broke. Not a score.

**Implementation shape.** Pod Quest–style determinism: each scenario's later node briefs, injects, and the twelve-month epilogue are simple functions of earlier locked answers — a small authored branch table per scenario, not a generative engine. The live model plays the NPCs; the consequences are authored.

### 5.5 Cost meter

Four currencies, visible and moving: clinician goodwill, risk exposure, dollars committed, time to first value. Decisions move them in tension — the fast path spends goodwill, the safe path spends time, the thorough path spends money. **No win threshold and no scoring against the meter.** It exists to make trade-offs concrete and to kill the "let's do both" answer.

---

## 6. Roles

**Five roles per room, and full coverage is mandatory:** every person plays a role, and every role is played. More people than roles — a role is shared by two or three. More roles than people — someone plays two. No observers, no orphaned roles.

The role names are a little humorous on purpose and completely unambiguous about the job (names are draft; final wording lands with the scenario content in Phase 2):

| Role | The job |
|---|---|
| **The Doctor** | Clinical impact — what this does to care, and whether clinicians will actually use it. |
| **The Security Guard** | Security and risk. Cannot agree to anything without a named risk-acceptor. |
| **The Money Manager** | Whose budget — at build, at scale, at renewal. Nothing is free. |
| **The AI Guru** | Technology and integration. Knows what the tool actually does, versus what the slide said. |
| **The Competitive Marketing Leader** | What may be said outside, peer pressure, reputation. Wants to announce; must not overclaim. |

Frontline workflow reality is deliberately not a seated role — that voice belongs to the NPCs (the Adoption Realist, the Recruiter) and the Villagers, who cannot be argued with.

**There is deliberately no decider card.** Who decides is the unsettled question at CoH — a role card that pre-assigns it would answer it for them. Instead the exercise measures it: every locked answer records *who made that final decision* (§5.3), and whether a decider emerges in a room, rotates node to node, or never lands is a primary finding, not a facilitation failure.

Cards are physical, dealt at setup; participants volunteer for them. The facilitator records the assignment in the app — **first names only** — including who shares and who doubles.

Each card carries a mandate, not a personality: what you are responsible for, what you cannot agree to, what you are measured on. Each card also carries **asymmetric information** — facts only that role knows, without which the scenario cannot be solved. Asymmetric information forces the collective answer to route through every seat: the room cannot converge correctly without hearing from each card.

---

## 7. NPCs

Two populations, visually and structurally distinct.

### 7.1 Elders — they negotiate and can say no

Drawn from `CoH_Council_Actor_Encoding.md`. Each becomes a person with a title, a caseload, and something to lose.

| Elder | Seat at the table | Fires on |
|---|---|---|
| Steward | Security and risk | A control called an obstacle; "safe to try" undefined; no named risk-acceptor |
| Ledger | Finance | No stated cost; a decision described as free; no renewal answer |
| Cartographer | Governance | Passive voice about a decision; "it went to committee"; two bodies claimed |
| Decoupler | Quality and measurement | An aspiration with no owner; no threshold; no evidence |
| Adoption Realist | Clinical informatics | An approval with no named approver; risk aversion offered as explanation |
| Recruiter | Workforce | Work added to a role with nothing added to it; capacity assumed |
| Beacon | Peer and external | An internal decision with an unnamed external consequence; peer comparison invoked |
| Caretaker | Operations and sustainment | Launch treated as the finish line; no monitoring owner; no update or retraining path; run cost and on-call unassigned; "we'll revisit later" with no trigger |

**The Caretaker exists because rooms consistently under-think the long term** — how a thing is watched, kept in line, updated, and paid for after everyone claps at go-live. It is the natural challenger on the `proof`, `retier`, and `stop` nodes and the anchor Elder for scenario 4. If `CoH_Council_Actor_Encoding.md` has no operations actor, author the Caretaker in the encoding's own format so it carries the same weight as the others.

**Rules.** NPCs must be movable — a specific, well-reasoned answer earns cooperation (a conditional path, a sponsorship) rather than endless challenge. They persist across the scenario and remember: ignored at one node, less accommodating at the next. Maximum two NPC appearances per node; some nodes have none. They challenge the position, never the person playing it.

### 7.2 Villagers — they live with the outcome

They do not negotiate and cannot block. One short first-person line after a decision locks; four to five across the session.

The One Who Stopped Asking · The Last to Be Asked · The Third Pilot This Year · The One Who Signs · The One Who Makes It Work Anyway · The Person in the Chair.

**The Person in the Chair is consequence-only** and never at the table. When any Villager speaks, the screen shows the standing line: constructs built from published and public sources, never cited as testimony from staff or patients; no patient data is used.

### 7.3 Implementation

One server-side Messages API call per NPC turn. The prompt carries: the NPC's encoded profile, the scenario state, the room's answer at this node including free text, and what this NPC has already said in this room. It does **not** carry CoH source material, transcripts, survey responses, or participant identities. Response streams in character, capped at 2–4 sentences — a long NPC turn kills room energy. If the call fails or stalls, the room sees a plain in-character absence message and moves on.

---

## 8. Measurement

### Class A — decision content

The nine node types, each scored **Specific** (names a role or person, plus a trigger or threshold), **Generic** (names a function), or **Absent/declined**. Specific is the only score that counts as an answer. The score is assigned by the room facilitator at lock — a one-tap choice on the facilitator view, against this rubric.

### Class B — decision behavior

Recorded by the application, reported in aggregate with no room or person identified:

- Time to first specific naming of a decider
- Deferral moves: resolving by creating a body, commissioning analysis, or escalating without naming to whom
- Claim and disclaim: which measures attract authority, which repel it
- Reversal under inject: where an answer changes once a cost appears
- Role assignment: who volunteered for what (shared, doubled) — as recorded by the facilitator; reported without names
- **Decider emergence:** who made each final call — a named role, a person, or "the group" — and whether authority settles on one seat, rotates node to node, or never lands. This is the exercise's mirror of the org's own open question.
- Language: unprompted appearance of terms like unwind, stalemate, roulette, chasing, it depends — in typed free text, and in the per-decision discussion transcript when the facilitator turns transcription on (text only, no audio stored, no voices attributed; see §5.3)

### Class C — cross-room, at consolidation

Computed where computable (choices, scores, timings); judged by the lead facilitator where the substance lives in free text, with the dashboard presenting answers side by side to make that judgment fast:

- **Alignment:** same node, same substantive answer, three or more rooms
- **Friction:** divergent answers on the same node
- **Collision:** same authority assigned to different holders, or routed to different bodies
- **Orphan:** node Absent in three or more of the rooms whose scenario presented it (a node a scenario never presented does not count)
- **Drop-off:** which lifecycle step the rooms answer well and where specificity collapses
- **Decider emergence across rooms:** which seat ended up making the calls in each room — four rooms, same five roles, do the same seats take (or dodge) authority?

**Disclosure.** Class B is disclosed at the start: we are tracking how decisions get made, not only what gets decided, and it is reported without identifying rooms or individuals. When discussion transcription is on, the room screen says so the entire time — text only, no audio stored, no voices attributed.

---

## 9. Admin dashboard (lead facilitator)

A separate view behind the admin code, subscribed to all rooms, updating live as they work.

- Four flowcharts side by side, aligned on node type
- Alignment, friction, collision, orphan, and drop-off panels — computed where possible, markable by the lead facilitator where judgment is needed
- Scenario claims: which room took which scenario
- Presenter mode for plenary
- Export: JSON (all four rooms, all nodes, first and revised answers, scores, timings) and a rendered flowchart per room
- **Full game reset:** admin-only, wipes all rooms, answers, NPC memory, scenario claims, and meters back to pristine while keeping scenario content — behind a type-to-confirm. Exists so the day-before rehearsal can run the real thing and leave no trace in the session data. Reset offers an export first.

---

## 10. Out of scope

- Any use of real CoH cases, transcripts, or survey responses in scenario content
- Scoring or ranking rooms against each other
- Patient data of any kind
- Deciding *how* anything gets built — the room owns what, who, when, and who pays
- Replacing the human facilitator
- Per-participant devices, private voting, or individual answer entry — collective answers only, by design
- An offline or canned-response mode — the printed worksheet is the fallback
- Authentication beyond the pre-defined codes — the app's short life is its security model

---

## 11. Build phases

| Phase | Deliverable | Gate |
|---|---|---|
| 0 | Single-node vertical slice: pose, discuss, answer with free text, live Steward challenge, revise, lock, consequence | Does the beat feel engaging? Angie plays it. |
| 1 | Scenario 4 (monitoring) end to end, single room | Full 90-minute run-through |
| 2 | Remaining three scenarios; role cards with asymmetric information; Villager beats; printed worksheets per scenario | Content review against the internal dispatch findings |
| 3 | Facilitator codes, admin dashboard with consolidation, exports, and full game reset | Four-room dry run |

**Facilitator rehearsal is the day before the session**, with the chosen facilitators, on the real app. That makes the rehearsal a dress rehearsal, not a gate — everything, including all four scenarios and the admin dashboard, must be finished before it. After rehearsal: export, then full game reset.

**Deploy a reachable skeleton before Phase 0 finishes** — a page at the real subdomain that a CoH device can be pointed at. The connectivity answer has the longest lead time of anything in this build, and finding out early decides how much weight the printed worksheets need to carry.

Scenario detail, injects, and node emphasis are derived from the internal scout dispatch (survey plus five interviews), which runs once Zahra's interview lands.

---

## 12. Open questions

1. **Connectivity test.** The site is not whitelisted, so reachability must be established empirically, several ways: the room laptops on the CoH network, the guest network, and personal devices. The test is three steps — page loads, facilitator code logs in, one NPC turn streams. Run as soon as a skeleton is deployed; the winning path becomes the session-day plan, the worksheets remain the backup. Best case is the CoH network on the room laptops; guest network on the facilitators' own laptops is the likely fallback.
2. Whether the four planning-team topics (North Star, Categorization, Operating Model, Success Metrics) stay as agenda labels over this structure — recommended — or are restated.
3. Infusion nurse as a seated sixth Villager, decided against scenario 4.
4. Whose laptops run the room screens — facilitators' own or CoH machines — and what the projector inputs are. (Interacts with the connectivity answer: personal laptops can use the guest network.)

*Resolved:* InfoSec has approved live model calls (see §2). Facilitators are chosen and rehearse the day before the session (see §11). Five roles per room with mandatory full coverage regardless of room size (see §6).

---

## 13. Acceptance criteria

- A room can complete a scenario in 90 minutes including setup and extraction
- Every locked node records: choice, free text, **who made the final decision**, first and revised answer, specificity score, timing
- NPC responses are in character and respond to the room's actual free text; the prompt provably contains no CoH source material
- A room can decline any node and have that recorded as a gap without penalty; a facilitator can skip a node and have that recorded as skipped; a room can write in its own answer at any node and have it recorded, challenged, and carried forward verbatim
- A failed or stalled NPC call surfaces a plain message and never blocks the room from advancing
- Discussion transcription is per-decision and facilitator-controlled; while on, an indicator is visible on the room screen; no audio is stored; no voices are attributed; the transcript appears in the record and export and never in a model prompt
- The admin dashboard reflects all four rooms within seconds of a node locking
- Printed worksheets exist for all four scenarios, mirroring the node questions and answer options
- The room screen is legible when projected — large type, high contrast, no interaction required to read the current state
- The API key is never present in any client bundle or network response
- No patient data, no PII, no attributable CoH material, anywhere in the system — the only personal data is first names against role assignments, which never reach the model or the reports
- The admin can fully reset the game to pristine (all rooms, answers, NPC memory, claims, meters) behind a type-to-confirm, with an export offered first — verified as part of the rehearsal-day runbook
- Session data is exportable as JSON and deletable on request; the app is disabled promptly after the session
