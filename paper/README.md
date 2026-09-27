# Tabletop paper kit

The whole exercise on paper: no app, no network, no AI in the room. Paper is
its own track and is expected to drift from the app (PRD §12).

```bash
npm run paper-kit    # → paper/out/Tabletop Paper Kit/ (13 editable .docx files)
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

Shared (the Print Order says how many of each):

| File | For |
|---|---|
| `00 - Print Order` | The print shop: every file by its exact name, with copies, paper, sides, and finishing, then how to cut and bundle the kits. The only document with printing instructions. |
| `00 - Facilitator Guide` | Every facilitator: run of show, the nine-step loop, scoring, the meter |
| `00 - Meter Board` | One per room: four measures, − to the left of center, + to the right |
| `00 - Lead Facilitator - Assignments and Plenary Guide` | The lead facilitator: the room assignments, how to read the wall, which case asks which measure, and the decider tally |
| `00 - Plenary Wall Poster` | The A1–A9 matrix as a 24×36 in portrait poster (laid out at 12×18 in, printed at 200%, because Word caps a page at 22 in). Each room's column is headed with its case, answer cells are outlined and sized for a 3×3 in sticky note, and unasked measures are shaded. |

Per room (`Room 1 - S1 Intake` … `Room 4 - S4 Monitoring`), color-coded.
Rooms don't choose: Room 1 is S1, Room 2 is S2, Room 3 is S3, and Room 4 is S4
(lifecycle order, left to right on the plenary wall; set in `SCEN` in
`build-kit.mjs`). Two files per room:

| File | For |
|---|---|
| `Facilitator Booklet` | The facilitator's script: setup, role nudges, background, the opening, then one spread per decision (memo branches, question, challenge questions, scoring, meter moves, what happens, the Villager), the debrief, and the hand-off |
| `Room Packet` | Everything the room uses, in four sections with a section break between each: **1 Scenario** (the opening thread only), **2 Role Cards** (five, with the "only you know this" facts), **3 Decision Cards** (one per page, handed out one at a time), **4 Worksheet** (the room's record, filled in by the facilitator) |

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
- **There is no evidence folder or who's who on paper.** It was too much
  to read in the room. The Scenario section is the opening thread; the room's
  other facts are on the role cards, and the facilitator answers questions
  from the booklet's background.
- **There is no 12-month report on paper.** The debrief works from the
  worksheet and the meter board. Each decision's owner beat (read at the
  decision) still depends on the score.
- **The dashboard** becomes a wall of colored sticky notes on the A1–A9
  matrix.
- The themes run and the "how did we get here" chat have no paper equivalent;
  they move to the lead facilitator's synthesis afterward.
