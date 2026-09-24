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
The existing `tabletop_rooms` records are preserved; legacy `data` rows are
migrated in place to `state` without a reset. Failed writes return an error
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

- `server/` — Express API. `npc.js` holds the only Anthropic call (key never
  reaches the client). `content/` holds the four scenarios, Elders, roles,
  Villagers. `print.js` renders worksheets and role cards. `store.js` is the
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
