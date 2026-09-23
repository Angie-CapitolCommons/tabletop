# Tabletop

AI Integration Environment Tabletop — a facilitated governance exercise for the
City of Hope HCD session. Virtual Insights LLC.

PRD: https://claude.ai/artifact/JF66MvDzFKgVit8kg1e85k (v0.6)

## Status: Phase 0 — vertical slice

One room, one node (Scenario 4, `risk_accept`), the full beat:
pose → discuss → collective answer (choice + free text + who-decided) →
live Steward challenge (streamed) → revise or hold → facilitator scores →
lock → consequence + cost meter. In-memory state; Postgres, facilitator
codes, and the admin dashboard arrive in Phase 3.

**Gate:** does the beat feel engaging? Angie plays it.

## Run it

```bash
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY
npm run dev            # server :4600 + vite dev :4700 → open http://localhost:4700
```

Production-style (what Replit runs):

```bash
npm run build
npm start              # serves the built client + API on :4600
```

Without an API key the app still runs — the Steward beat degrades to
"The Steward is unavailable — continue," which is also the designed
in-session failure behavior.

## Layout

- `server/` — Express API. `npc.js` holds the only Anthropic call; the key
  lives in server env only. `content.js` is the Phase 0 slice content
  (fictional composite; the Steward profile is a placeholder until the
  Council-encoding derivation lands in Phase 2).
- `client/` — React room screen (Vite). Designed to be projected: large
  type, readable across a room.
- Deploys on Replit (`.replit`), target `tabletop.virtual-insights.com`.

## Content rules (hard constraints)

No CoH interview transcripts, survey responses, or attributable material —
in the app, in prompts, or in this repo. Scenarios are fictional composites.
First names only, and they never reach the model.
