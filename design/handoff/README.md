# Handoff: Tabletop Room Screen Redesign

## Overview
This is a redesign of the projected **room screen** in `Angie-CapitolCommons/tabletop` (`client/src/App.jsx` + `client/src/styles.css`). It also applies the Virtual Insights brand. The goals:
- Every beat fits on one 1280×800 projected laptop screen, with no scrolling.
- The room-facing content is separated from the facilitator's controls.
- The redesign adds a decision path that fills in as nodes lock, segmented cost meters, and one-tap entry for who made the final call.

## About the Design Files
`Tabletop Review.dc.html` is a **design reference built in HTML**. It shows the intended look and states; it is not production code. Recreate it inside the existing React + Vite client, keeping the current state machine, API and SSE logic in `App.jsx`. Only the presentation and flow change. Open the HTML file in a browser (with `support.js` beside it) to view it. Screens `2a–2d` are the target; `1a–1e` are a recreation of the current build, included for comparison.

## Fidelity
**High-fidelity.** Colours, type, spacing and copy are final. Match them.

## Global layout (all phases)
Fixed stage: 1280×800 design size. Scale it to fit the viewport with `transform: scale()` and letterboxing, rather than reflowing, so projected output is predictable. Paper background `#F7F6F3`.

The stage has four stacked regions:

1. **Top bar**, 92px tall, 40px side padding, 1px bottom border `#d9d6ce`.
   - **Left side:**
     - Eyebrow: JetBrains Mono 13px, uppercase, letter-spacing 0.14em, `#387DB7`. Text: `TABLETOP · ENTERS AT {entersAt}`.
     - Scenario title below it: Archivo 21px/600, letter-spacing −0.01em, `#10122D`.
     - **No logo.**
   - **Right side:** four meters with a 22px gap, each 124px wide (see Meters).
2. **Step rail**, 54px tall, background `#ECEAE4`, 24px side padding, 4px gap between steps, 1px bottom border `#d9d6ce`.
   - Each step: 16px horizontal padding, Archivo 17px. The number comes first in JetBrains Mono 13px (`01`–`07`), followed by the label.
   - Labels: Risk, Off switch, Tier, Decider, Proof, Re-review, Funding. Map these from node `type`; never show raw IDs like `risk_accept`.
   - **Current step:** background `#10122D`, text `#F7F6F3`, weight 600, number `#a8b6de`.
   - **Done step:** text `#10122D`, 3px bottom border `#2F2E78`.
   - **Pending step:** text `#6c7196`, no border.
   - **Skipped step:** pending style with line-through (suggested; not drawn in the mocks).
3. **Main area**, absolutely positioned from top 146px to bottom 64px. Padding 34px 40px 28px. The layout inside depends on the phase (below).
4. **Facilitator bar**, 64px tall, background `#10122D`, 40px side padding, 12px gap between items.
   - Left to right:
     - Label `FACILITATOR`: JetBrains Mono 12px, 0.16em tracking, `#a8b6de`.
     - Secondary buttons: **Evidence**, **AI Council**, then phase-specific actions.
     - Primary action, pushed to the far right with `margin-left: auto`.
   - Secondary buttons: Archivo 15px, `#d5d8e8`, 1px border `rgba(247,246,243,0.3)`, radius 2px, padding 9px 16px.
   - Primary button: Archivo 16px/500, background `#F7F6F3`, text `#10122D`, radius 2px, padding 12px 26px.
   - **Evidence** and **AI Council** are available in **every** phase. Today Evidence only exists on the pose step.

## Screens

### 2a — Discuss (phase `posed`)
Two-column grid, `1.15fr 1fr`, 48px gap.

**Left column** (flex column):
- Eyebrow: JetBrains Mono 15px, uppercase, 0.14em tracking, `#387DB7`. Text: `0{n} / {Node type long name}` (e.g. `01 / Risk acceptance`).
- Title: Instrument Serif 62px/1.02, letter-spacing −0.02em, margin 12px 0 18px. Uses `node.title`.
- Question: Archivo 23px/1.5, `#10122D`. Uses `node.question`.
- Evidence folder, pinned to the bottom (`margin-top: auto`):
  - Label: JetBrains Mono 13px, `#4a4e70`.
  - A 2×2 grid with 1px gaps over a `#d9d6ce` background. Each cell: white, padding 11px 14px, Archivo 17px, showing the document title.
  - Clicking a cell opens the existing modal, restyled: paper background, 2px radius, hairline border.

**Right column** (options, read-only while the room discusses):
- Options A–C sit in a stack with 1px gaps over `#d9d6ce`. Each is a white cell, padding 16px 18px:
  - Letter: JetBrains Mono 18px, `#387DB7`, 22px wide.
  - Label: Archivo 20px/600, line-height 1.3.
  - Hint: Archivo 16px/1.4, `#4a4e70`, **not italic**.
- The decline option sits separately, 10px below the stack: background `#EFECE5`, 1px dashed border `#c9c6bd`, letter colour `#6c7196`.

**Inject:** if `node.inject` exists, render it above the title as a block with background `#ECEAE4`, padding 16px 20px, a `MEANWHILE` mono eyebrow, and Archivo 20px text. The mocks don't show it (node 1 has no inject).

**Facilitator bar:** Evidence · AI Council · Skip node · primary **Record the room's answer**.

### 2b — Record (a new sub-state of `posed`)
Clicking Record swaps the right column for a record panel. The left column stays, scaled down: title 54px, question 21px. The grid becomes `1fr 1.2fr`.

The record panel: white background, 1px border `#e3e1db`, padding 24px 26px, 20px gap between items. Contents, top to bottom:
- Eyebrow `RECORDING THE ROOM'S ANSWER` in `#387DB7`.
- **Choice:** the options as a selectable list. The selected option has a 2px `#2F2E78` border and `#F7F6F3` background. (The mock shows only the selected option; the real panel should show all four, compact.)
- **Free text:** the label is `node.freeTextPrompt` in Archivo 16px, `#4a4e70`. The textarea uses Archivo 20px/1.45, minimum height 88px, and a 2px `#2F2E78` border when focused (1px `#c9c6bd` otherwise), radius 2px.
- **Who made the final decision:**
  - Label: Archivo 16px, `#4a4e70`.
  - A wrap of chip buttons: Archivo 16px, padding 8px 14px, radius 2px, 1px border `#c9c6bd`, white background.
  - Selected chip: background and border `#2F2E78`, text `#F7F6F3`.
  - Chips are built from the role roster as `{Role} · {first name}` (first names come from role assignment), plus `The group`, plus `Other…` (dashed border). Other reveals a text input.
  - Store the chip label verbatim in `decidedBy`.

**Facilitator bar:** Evidence · AI Council · Back to discussion · primary **Commit the room's answer**. Commit is disabled until choice, free text and decider are all filled.

The same panel is reused for revising (pre-filled, primary label **Commit the revised answer**).

### 2c — Challenge / revise (phases `challenge` and `revise`)
Grid `1fr 2fr`, 48px gap.

**Left column:** "The room committed"
- Label: JetBrains Mono 13px, `#4a4e70`.
- A card with background `#ECEAE4`, padding 22px, 14px gap, containing:
  - Choice letter (mono, `#387DB7`) plus label (Archivo 19px/600).
  - The free text as a quote: Archivo 18px/1.5, `#33375c`.
  - A 1px `#d9d6ce` rule, then `FINAL CALL` (mono 12px, `#6c7196`) with the decider in Archivo 17px.

**Right column:** the Elder, who is the largest element on screen.
- A 64×64 square, background `#10122D`, holding the Elder's initial in Instrument Serif 36px, `#F7F6F3`.
- Name: Instrument Serif 42px.
- Seat: JetBrains Mono 13px, uppercase, `#387DB7`, as `ELDER · {seat}`.
- Streamed text: Archivo 30px/1.45, margin-top 24px. Keep the blinking cursor while streaming, using the existing `@keyframes blink`, cursor colour `#387DB7`.
- If two Elders speak, stack them. The second is smaller (text 24px), or put a 1px rule between them.
- Unavailable state: text in `#6c7196`, same size.
- **Hold / Revise** sit at the bottom of the column (`margin-top: auto`) as two equal cells in a 2-column grid, 1px gap over `#d9d6ce`. Each cell: white, padding 18px 22px, title Archivo 22px/600, subtitle Archivo 16px `#4a4e70`.
  - Hold: "The first answer locks as written."
  - Revise: "Reopens the record, pre-filled. Both are kept."
  - Shown only once the phase is `revise` (the Elders have finished).
  - Hold calls `api("hold")`. Revise opens the 2b panel pre-filled.

**Facilitator bar:** Evidence · AI Council · Skip node, then on the right `SCORE AT LOCK` followed by **Specific / Generic / Absent** buttons (secondary style, `#F7F6F3` text, 1px border `rgba(247,246,243,0.5)`).
- The score buttons are disabled (opacity 0.45) until phase `score`.
- **This replaces the separate score screen:** in phase `score` they become active, and clicking one calls `api("lock", { score })`.
- The rubric shows as a `title` or tooltip on hover.

### 2d — Consequence (phase `consequence`)
Grid with columns `1.35fr 1fr` and rows `1fr auto`; gap 28px vertically, 56px horizontally.

**Left column:**
- Eyebrow `WHAT THIS SETS IN MOTION` (mono 15px, `#387DB7`).
- Consequence text: Instrument Serif 48px/1.1.
- Meta line: JetBrains Mono 14px, uppercase, `#4a4e70`. Text: `LOCKED · {SCORE} · HELD AFTER CHALLENGE | REVISED AFTER CHALLENGE`, with the score in `#2F2E78`.

**Right column:** "What moved"
- Four rows, each with a 1px rule `#d9d6ce` and padding 10px 0, laid out as a grid `1fr auto auto`:
  - Meter name (Archivo 18px/600) with a direction note beneath (14px, `#6c7196`): "Higher is better" for goodwill, "Lower is better" for the other three.
  - `before → after` in Instrument Serif 34px.
  - Delta in JetBrains Mono 15px, right-aligned in a 64px column. Rust `#a24f2c` if worse, `#387DB7` if better, `#8a8fae` "—" if unchanged.

**Bottom row (full width):** "Decision path"
- A 92px-tall flex row of 7 cells, 1px gaps over `#d9d6ce`.
- **Locked cells:** background `#2F2E78`, text `#F7F6F3`. Each shows a mono eyebrow `0{n} {LABEL} · {score}` in `#a8b6de`, the short choice (Archivo 17px/600), and a detail line (14px, `#d5d8e8`, e.g. who accepts).
  - The most recent locked cell is flex 2.4; older ones can be flex 1.2.
  - Skipped or absent cells: suggest background `#4A4E70`.
- **Next cell:** white, with a 3px top border `#387DB7` and the eyebrow `0{n} · NEXT`.
- **Pending cells:** background `#ECEAE4`, text `#6c7196`.
- The path also needs a short choice summary per option. Add `short` to each option in `server/content.js`, or truncate the label.

**Facilitator bar:** Evidence · AI Council · primary **Continue to node {n+1}** (calls `api("advance")`).

### Epilogue (not redrawn)
Restyle `Epilogue` in the same system:
- Instrument Serif headline.
- Parts as hairline-ruled rows (not left-border cards). Mono verdict text: `HELD` in `#2F2E78`, `BROKE` in `#a24f2c`.
- The full decision path strip above the parts.
- Export and Reset move into the facilitator bar.

### Recommended new beat: Scenario briefing (not drawn)
Move `scenario.brief` out of node 1 into its own screen before node 1:
- Instrument Serif title and Archivo 22px paragraphs.
- Role roster entry (first names against the five roles).
- Facilitator bar primary: **Start node 1**.

## Meters (top bar)
Each meter is a column 124px wide with a 4px gap:
- **Label:** JetBrains Mono 12px, uppercase, 0.1em tracking, `#4a4e70`, `white-space: nowrap`. Labels: Goodwill, Risk, Dollars, Time to value.
- **Value row:** value in Instrument Serif 36px/1. The last delta sits beside it in JetBrains Mono 14px, `+1` or `−2` (true minus sign), rust `#a24f2c` if worse, `#387DB7` if better, hidden if zero.
- **Segmented bar:** 12 segments, flex 1 each, 2px gap, 10px tall. Assumes meter values run 0–12; clamp at 12. For each index `i`, with `v` = current and `pv` = value before the last lock:
  - `i < min(v, pv)`: filled `#2F2E78`.
  - `v > pv` and `i < v`: filled with the tone colour (these segments were added).
  - `v < pv` and `i < pv`: transparent, 1px **dashed** border in the tone colour (these segments were lost).
  - Otherwise: `#ddd9d0`.
  - Tone is rust `#a24f2c` if the change is worse, `#387DB7` if better. Worse means an increase for risk, dollars and time, and a decrease for goodwill (`COST_UP` in `App.jsx`).
- `prevMeter` is already set at lock. Keep it until the next lock, as today.
- **Do not use red/yellow/green level zones.** The PRD has no win threshold for the meter.

## Interactions & state
Keep the existing server phases: `posed → challenge → revise → score → consequence → … → epilogue`. Add these client state variables:
- `recording` (boolean, inside `posed`): toggles between 2a and 2b.
- `revising` (boolean, inside `revise`): opens the record panel pre-filled.
- `evidenceOpen` (doc or null) and `councilOpen` (boolean): drawers or modals available in every phase.
- `deciderOther` (string): used when the Other chip is selected.

Behaviour:
- Skip node moves to the facilitator bar in every phase before `consequence`. Consider a confirm step, since it sits near other controls.
- The **AI Council** button opens a panel listing the Elders: name, seat, and what they fire on (from `server/content.js` `elders` and PRD §7.1). A new `GET /api/elders` endpoint returning only name, seat and a public "fires on" line is needed. Never send persona prompts to the client.
- No hover animations are required. Hover on secondary buttons: border `rgba(247,246,243,0.6)`. Hover on option and doc cells: background `#F7F6F3`.

## Design tokens (Virtual Insights brand v2)
**Colours**
- Deep Purple `#10122D`: ink, facilitator bar, current step.
- Purple `#2F2E78`: primary state, filled meter segments, locked path cells, selected choice or chip.
- Blue `#387DB7`: the single accent (eyebrows, "better" changes, next-step border).
- Paper `#F7F6F3`: stage background.
- Warm grey `#ECEAE4`: step rail, committed card, pending path cells.
- Slate `#4A4E70`: secondary text.
- Muted text: `#6c7196`, `#8a8fae`.
- Hairlines: `#d9d6ce`, `#ddd9d0`, `#e3e1db`, `#c9c6bd`.
- Decline background: `#EFECE5`.
- Text on dark: `#d5d8e8`, `#a8b6de`.
- "Worse" rust: `#a24f2c`. Not a brand colour; used for status only.
- **Pink `#B43388` and the gradient are not used in the UI.**

**Type** (Google Fonts)
- Instrument Serif 400: headlines, numbers, Elder name; never below 30px.
- Archivo 400/500/600: all readable text.
- JetBrains Mono 400/500: labels and eyebrows, always uppercase with 0.1–0.16em tracking.
- Minimum size on the projected screen is 12px for mono labels and 16px for everything else; anything the room must read is 20px or larger.

**Shape:** 2px radius everywhere. No shadows, no gradients, no rounded pills, no left-border accent cards. Separate elements with 1px gaps over a tinted parent.

**Spacing:** 40px stage side padding. Gaps of 4, 8, 10, 12, 14, 18, 20, 22, 28, 48 and 56px as noted above.

## Assets
None. No logo on the room screen. Fonts come from Google Fonts:
`https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Archivo:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap`

## Files
- `Tabletop Review.dc.html`: the design reference. `recs` = the 12 recommendations, `2a–2d` = target screens, `1a–1e` = the current build for comparison.
- `support.js`: the runtime needed to open the HTML file locally.
- The repo files to change are `client/src/App.jsx`, `client/src/styles.css`, and `client/index.html` (font link). Optionally add `server/content.js` (short option labels) and `server/index.js` (the `/api/elders` endpoint).
