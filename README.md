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

**Deploy as a single server (Replit Reserved VM), not Autoscale.** The server
works from its in-memory copy of the four rooms and saves each change to
Postgres before replying; a second instance would hold its own copy and
overwrite the first's saves. Each room's changes apply one at a time and save
only that room, so rooms never wait on each other. The admin themes result is
kept in `tabletop_meta`, so it survives a restart (a run cut off by a restart
shows as interrupted). Don't redeploy during a session.
The existing `tabletop_rooms` table is reused; legacy `data` rows are
migrated in place to `state`. Rooms saved under an older scenario-content
version (`CONTENT_VERSION` in `server/content/common.js`) are discarded at
startup and start fresh. Failed writes return an error
instead of acknowledging a decision that was not saved. Without an Anthropic
key or on an interrupted Elder stream, the challenge remains retryable, with
an explicit option to hold the answer and continue.

## Session-day runbook

1. Rehearsal (day before): full run on the real app, then **admin → Export
   all rooms → Full game reset** (type `RESET`).
2. Session day: hand each facilitator their room code card; open `/admin`
   on the lead laptop. The dashboard consolidates live (2.5s poll).
3. After synthesis: export, then reset — session data is deletable on
   request (PRD §13).

## Layout

- `server/` — Express API. `npc.js` holds every Anthropic call — Elder turns,
  the answer check (clinician goodwill, and time added by process the answer
  writes in), and the admin themes run (key never reaches the client). `privacy.js` replaces roster first names with roles in
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
