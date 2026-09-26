# Tabletop

AI Integration Environment Tabletop — a facilitated governance exercise for the
City of Hope HCD session. Virtual Insights LLC.

PRD: https://claude.ai/artifact/JF66MvDzFKgVit8kg1e85k (mirrored at `docs/PRD.md`)

## Status: Phase 3 — four rooms + admin dashboard

All four scenarios, the full node beat per room (pose → collective answer →
Elder challenge → revise/hold → score → lock → consequence → epilogue),
Villager beats, role cards, printable worksheets, facilitator codes, the lead
facilitator's consolidation dashboard, exports, and the full game reset.

**Gate:** four-room dry run.

## Access (PRD §4: five logins in the world)

| Who | Where | Code |
|---|---|---|
| Room facilitators | `/` | Four distinct secret values in `ROOM_CODES` |
| Lead facilitator | `/admin` | A separate secret value in `ADMIN_CODE` |

Participants touch no device. Printables (worksheets + role cards) at `/api/print`.

## Run it

```bash
npm install
cp .env.example .env   # set DATABASE_URL, all access codes, and ANTHROPIC_API_KEY
npm run dev            # server :4600 + vite dev :4700 → open http://localhost:4700
```

Production-style (what Replit runs):

```bash
npm run build
npm start
```

Set four distinct `ROOM_CODES`, a separate `ADMIN_CODE`, and `DATABASE_URL`
before starting. No default codes or in-memory room storage are used.

**Runs on Replit Autoscale.** Postgres is the source of truth: every request
loads the room it needs, and every change is saved in a transaction that locks
that room's row, so any number of server instances can serve the rooms and an
instance can stop at any time. A unique index keeps each scenario to one room.
The Council round and the 12-month chat take a short lease on the room while
they stream and save in one locked transaction at the end; the admin themes
run happens inside its own request and keeps its status and result in
`tabletop_meta` (a run older than six minutes that never finished shows as cut
off). If Replit lets you cap Autoscale at one machine, that's a harmless extra
safeguard. Don't redeploy during a session.
The existing `tabletop_rooms` table is reused; legacy `data` rows are
migrated in place to `state`. Rooms saved under an older scenario-content
version (`CONTENT_VERSION` in `server/content/common.js`) are discarded at
startup and start fresh. Failed writes return an error
instead of acknowledging a decision that was not saved. Without an Anthropic
key or on an interrupted Elder stream, the challenge remains retryable, with
an explicit option to hold the answer and continue.

## Four-room rehearsal script

`scripts/rehearse.mjs` plays all four scenarios in all four rooms at once
against a running site — local or published — through the same API the room
screens use, with real Claude calls: Elder rounds (including asking again and
revisions), transcript lines, skips, declines, write-ins, the 12-month chat,
and the admin themes run. It checks every step, times the Elders, watches for
rooms going backwards (more than one server instance), and writes
`summary.json` and `export.json` to a `rehearsal-<time>/` folder.

It also tests what keeps the app safe on Autoscale: two rooms claiming one
scenario at the same moment, two Council rounds and two chat questions at once
on one room, and a second themes run while one is going (each: exactly one
goes through). Transcript lines go in simultaneous bursts, and at the end the
script reads every room back from the database: every line it sent must be
saved, and every locked decision's meters must add up (before + what the
decision moved = after). `--no-races` skips the at-the-same-moment checks.

```bash
# From the Replit shell (reads ROOM_CODES and ADMIN_CODE from the environment)
npm run rehearse -- --url https://tabletop.virtual-insights.com --reset

# From your own machine
ROOM_CODES=... ADMIN_CODE=... npm run rehearse -- --url https://... --reset
```

`--reset` wipes all four rooms first; the script refuses to run on rooms in
use without it. Rooms are left finished for a look on `/admin` unless you
pass `--reset-after`. `--seed N` repeats a run's choices; `--pace MS` slows
each room down; `--chat N`, `--no-themes`, and `--transcripts` shape the end.
`--help` lists everything. Exit code 0 means every check passed. Don't run it
while real rooms are in session.

## Paper kit

The session can also run entirely on paper: `npm run paper-kit` builds 27
editable Word documents (facilitator booklets, room packets, decision cards,
role cards, worksheets, 12-month report cards, a meter board, and the plenary
wall) from the same scenario content. See `paper/README.md`.

## Session-day runbook

1. Rehearsal (day before): run the four-room rehearsal script against the
   published site, then a full run by hand on the real app, then **admin →
   Export all rooms → Full game reset** (type `RESET`).
2. Session day: hand each facilitator their room code card; open `/admin`
   on the lead laptop. The dashboard consolidates live (2.5s poll).
3. After synthesis: export, then reset — session data is deletable on
   request (PRD §13).

## Layout

- `server/` — Express API. `npc.js` holds every Anthropic call — Elder turns,
  the answer check (clinician goodwill, and time added by process the answer
  writes in), the 12-month report's "how did we get here?" chat, and the
  admin themes run (key never reaches the client). `explain.js` builds the
  room's record for that chat (rules, every option's costs, scores, Council,
  outcomes, transcripts; names removed). `privacy.js` replaces roster first names with roles in
  anything sent to the model; `themes.js` bundles finished rooms for the
  themes run (transcripts only when the admin opts in). `content/` holds the four scenarios, Elders, roles,
  Villagers. The scenario shape is documented at the top of
  `content/common.js`; `s4.js` is the reference for voice and structure. `print.js` renders worksheets and role cards. `store.js` is the
  optional Postgres persistence.
- `client/` — React room screen + admin dashboard (Vite). Fixed 1280×800
  projected stage, Virtual Insights brand v2 (`design/handoff/`).
- Deploys on Replit (`.replit`), target `tabletop.virtual-insights.com`.

## Content rules (hard constraints)

No CoH interview transcripts, survey responses, or attributable material —
in the app, in prompts, or in this repo. Scenarios are fictional composites.
First names only, and they never reach the model or the reports. Elder
personas are placeholders until the `CoH_Council_Actor_Encoding.md`
derivation lands.
