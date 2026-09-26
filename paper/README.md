# Tabletop paper kit

The whole exercise on paper: no app, no network, no AI in the room. Built from
the same scenario content the app uses, so the two never drift apart.

```bash
npm run paper-kit    # → paper/out/Tabletop Paper Kit/ (27 editable .docx files)
```

Regenerate after any change to `server/content/`. Edit the generated Word
files freely for printing, but make content changes in the source and
regenerate, or the paper and the app will disagree.

## What's in the kit

Shared (print once, or once per facilitator):

| File | For |
|---|---|
| `00 - Facilitator Guide` | Every facilitator: run of show, the nine-step loop, scoring, the meter, what to print |
| `00 - Meter Board` | One per room: four tracks, starting values shaded |
| `00 - Lead Facilitator - Plenary Wall` | The lead facilitator: how to read the wall, which case asks which measure, the decider tally, and the A1–A9 matrix |

Per scenario (`S1 Intake` … `S4 Monitoring`), color-coded:

| File | For |
|---|---|
| `1 Facilitator Booklet` | The facilitator's script: setup, role nudges, background, the opening, then one spread per decision (memo branches, question, Elder lines, scoring, meter moves, what happens, the Villager), the 12-month report and debrief |
| `2 Room Packet` | On the table: the opening thread, evidence documents, who's who |
| `3 Decision Cards` | One per decision, handed out one at a time |
| `4 Role Cards` | Five cards with the "only you know this" facts, cut apart |
| `5 Worksheet` | The room's record, filled in by the facilitator |
| `6 Report Cards` | Two 12-month cards per decision (named / not named), cut apart |

## How the app's moving parts become paper

- **Memos ("Because you chose…")** are unrolled from each decision's
  `inject`: the generator evaluates it for every possible earlier answer and
  prints one row per distinct memo.
- **Elders** can't hear the room, so `elder-cards.js` holds scripted lines,
  one set per Elder per decision, with four branches: no one named, named but
  no trigger, specific, declined. Same rules as the live Elders.
- **The answer check** (the app's model call that adjusts the meter for added
  process and clinician burden) becomes two printed rules the facilitator
  applies by judgment.
- **Scoring** reads against each decision's own prompt.
- **The 12-month report** becomes cards the facilitator lays out in month
  order, choosing named or not named per decision from the score.
- **The dashboard** becomes a wall of colored sticky notes on the A1–A9
  matrix.
- The themes run and the "how did we get here" chat have no paper equivalent;
  they move to the lead facilitator's synthesis afterward.
