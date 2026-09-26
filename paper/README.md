# Tabletop paper kit

The whole exercise on paper: no app, no network, no AI in the room. Paper is
its own track and is expected to drift from the app (PRD §12).

```bash
npm run paper-kit    # → paper/out/Tabletop Paper Kit/ (27 editable .docx files)
```

**What's shared and what's paper-only.** The cases (`server/content/`) and the
scoring rubric (`client/src/measures.js`) are still read from the app at
build time, so regenerate after any change there. Everything under `paper/` is
paper-only. A paper-only change never edits `server/content/` or `client/`,
because that changes the live app too; when paper needs a shared item to read
differently, move its paper version under `paper/` and read it from there.
Edits to the generated Word files are fine for one-off printing fixes but are
lost on the next build.

## What's in the kit

Shared (print once, or once per facilitator):

| File | For |
|---|---|
| `00 - Facilitator Guide` | Every facilitator: run of show, the nine-step loop, scoring, the meter, what to print |
| `00 - Meter Board` | One per room: four measures, − to the left of center, + to the right |
| `00 - Lead Facilitator - Assignments and Plenary Wall` | The lead facilitator: the room-to-case assignment table for packing kits, how to read the wall, which case asks which measure, the decider tally, and the A1–A9 matrix |

Per scenario (`S1 Intake` … `S4 Monitoring`), color-coded. Each room is
assigned one case in advance (rooms don't choose), so each scenario's set is
one room's kit:

| File | For |
|---|---|
| `1 Facilitator Booklet` | The facilitator's script: setup, role nudges, background, the opening, then one spread per decision (memo branches, question, challenge questions, scoring, meter moves, what happens, the Villager), the 12-month report and debrief |
| `2 Room Packet` | On the table: the opening thread, evidence documents, who's who |
| `3 Decision Cards` | One per decision, handed out one at a time |
| `4 Role Cards` | Five cards with the "only you know this" facts, cut apart |
| `5 Worksheet` | The room's record, filled in by the facilitator |
| `6 Report Cards` | Two 12-month cards per decision (named / not named), cut apart |

## How the app's moving parts become paper

- **Memos ("Because you chose…")** are unrolled from each decision's
  `inject`: the generator evaluates it for every possible earlier answer and
  prints one row per distinct memo.
- **There is no AI Council on paper.** The app's Elders are replaced by the
  facilitator challenging the answer in their own voice. `challenges.js`
  holds one set of questions per decision, with four branches: no one named,
  named but no trigger, specific, declined. The worksheet records whether the
  room held or revised after the challenge.
- **The cost meter is deliberately different on paper.** The app's authored
  amounts (`meterDeltas`) and its answer check aren't used. After each
  decision the room judges the effect on each of the four measures itself
  and marks the board: a + to the right of the center line, a − to the left.
- **Scoring** uses the same per-measure rubric the app shows the facilitator
  (`client/src/measures.js`). The A-codes appear only on the plenary wall, as
  they do only on the app's dashboard.
- **The 12-month report** becomes cards the facilitator lays out in month
  order, choosing named or not named per decision from the score.
- **The dashboard** becomes a wall of colored sticky notes on the A1–A9
  matrix.
- The themes run and the "how did we get here" chat have no paper equivalent;
  they move to the lead facilitator's synthesis afterward.
