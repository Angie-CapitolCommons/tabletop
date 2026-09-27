// Builds the paper kit (editable Word documents). Paper is its own track and
// is expected to drift from the app (PRD §12): the cases and the scoring
// rubric are still read from server/content and client/src/measures.js;
// everything under paper/ is paper-only.
//
//   npm run paper-kit            → paper/out/Tabletop Paper Kit/*.docx
//
// Per room: Facilitator Booklet; Role Cards and Worksheet (the facilitator's
// copy); Participant Packet (Scenario and Decision Cards, three copies for the
// room). Shared: Print Order, Facilitator Guide,
// Meter Board, Lead Facilitator's plenary wall. No 12-month report on paper. Paper-only content: the facilitator's
// challenge questions (paper/challenges.js) and all the kit's own wording.
// There is no AI Council on paper.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, HeightRule,
  LevelFormat, Packer, PageBreak, PageNumber, PageOrientation, Paragraph, ShadingType,
  Table, TableCell, TableLayoutType, TableRow, TextRun, VerticalAlign, WidthType,
} from "docx";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const load = (p) => import(pathToFileURL(path.join(root, p)).href);
const content = await load("server/content/index.js");
const { scenarios, roles, meterLabels } = content;
const { MEASURES, SCORING, GENERIC_ABSENT } = await load("client/src/measures.js");
const { challenges } = await load("paper/challenges.js");

const OUT = path.join(here, "out", "Tabletop Paper Kit");

// ---------- look ----------
const DEEP = "10122D", PURPLE = "2F2E78", BLUE = "387DB7", SLATE = "4A4E70", MUTED = "6C7196";
const RUST = "A24F2C", HAIR = "D9D6CE", WARM = "ECEAE4", PAPER = "F7F6F3", WHITE = "FFFFFF";
const HEAD = "Georgia", BODY = "Calibri", MONO = "Consolas", SYM = "Segoe UI Symbol";
const SCEN = {
  // Room assignments: lifecycle order, left to right across the plenary wall.
  s1: { color: "387DB7", colorName: "Blue", short: "S1 Intake", room: 1 },
  s2: { color: "2F7D4F", colorName: "Green", short: "S2 Evaluation", room: 2 },
  s3: { color: "B98A2F", colorName: "Gold", short: "S3 Deployment", room: 3 },
  s4: { color: "2F2E78", colorName: "Purple", short: "S4 Monitoring", room: 4 },
};
const PORTRAIT = { width: 12240, height: 15840 };
const MARGIN = { top: 1000, bottom: 1000, left: 1080, right: 1080 };
const W = PORTRAIT.width - MARGIN.left - MARGIN.right; // 10080
const LW = PORTRAIT.height - MARGIN.left - MARGIN.right; // 13680 landscape

const LETTER = { a: "A", b: "B", c: "C", writein: "Own plan", decline: "Can't answer" };
const OPTION_ORDER = ["a", "b", "c", "writein", "decline"];
const SECTION = {
  purpose: "Purpose", tier: "Tier", risk_accept: "Risk", decide: "Decider", proof: "Proof",
  funding: "Funding", retier: "Re-review", stop: "Off switch", represent: "The story",
};
const BOX = "☐";

// ---------- primitives ----------
const run = (text, o = {}) => new TextRun({ text, font: o.font ?? BODY, size: o.size ?? 21, ...o });
const p = (children, o = {}) =>
  new Paragraph({
    children: typeof children === "string" ? [run(children)] : children,
    spacing: { after: 100, ...(o.spacing ?? {}) },
    ...o,
  });
const eyebrow = (text, color = BLUE, o = {}) =>
  p([run(text.toUpperCase(), { font: MONO, size: 17, color, characterSpacing: 30 })], { spacing: { after: 60 }, ...o });
const h1 = (text, color = DEEP) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(text, { font: HEAD, size: 44, color })], spacing: { after: 120 }, keepNext: true });
const h2 = (text, color = DEEP, o = {}) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [run(text, { font: HEAD, size: 32, color })], spacing: { before: 120, after: 100 }, keepNext: true, ...o });
const h3 = (text, color = DEEP) =>
  new Paragraph({ heading: HeadingLevel.HEADING_3, children: [run(text, { bold: true, size: 23, color })], spacing: { before: 200, after: 80 }, keepNext: true });
const note = (text, o = {}) => p([run(text, { italics: true, color: SLATE, size: 19 })], o);
const bullet = (children, o = {}) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: typeof children === "string" ? [run(children)] : children,
    spacing: { after: 60 },
    ...o,
  });
const numbered = (children, ref = "steps") =>
  new Paragraph({
    numbering: { reference: ref, level: 0 },
    children: typeof children === "string" ? [run(children)] : children,
    spacing: { after: 70 },
  });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
// Word merges consecutive paragraphs with identical borders into one box and
// draws only the last rule, so alternate the rule weight to keep every line.
let lineCount = 0;
const writeLine = () =>
  new Paragraph({
    children: [run(" ")],
    spacing: { after: 0, before: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: lineCount++ % 2 ? 5 : 4, color: "8A8FAE", space: 1 } },
  });
// A non-breaking space keeps each checkbox on the same line as its label.
const box = () => run(`${BOX} `, { font: SYM, size: 22 });
const ticks = (labels, size = 20) => {
  const kids = [];
  labels.forEach((l, i) => {
    kids.push(box());
    kids.push(run(l.replace(/ /g, " "), { size }));
    if (i < labels.length - 1) kids.push(run("     ", { size }));
  });
  return kids;
};
const quote = (text, o = {}) =>
  p([run(`“${text}”`, { font: HEAD, size: 24, italics: true, color: DEEP })], { indent: { left: 360 }, ...o });

const none = { style: BorderStyle.NONE, size: 0, color: WHITE };
const line = (color = HAIR, size = 6) => ({ style: BorderStyle.SINGLE, size, color });
const allBorders = (b) => ({ top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b });

// A one-cell shaded panel.
const panel = (children, { fill = PAPER, border = line(HAIR), width = W, left } = {}) =>
  new Table({
    width: { size: width, type: WidthType.DXA },
    columnWidths: [width],
    layout: TableLayoutType.FIXED,
    borders: allBorders(border),
    ...(left ? { indent: { size: left, type: WidthType.DXA } } : {}),
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: width, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill, color: "auto" },
            margins: { top: 140, bottom: 120, left: 200, right: 200 },
            children,
          }),
        ],
      }),
    ],
  });
const spacer = (after = 120) => new Paragraph({ children: [run(" ", { size: 4 })], spacing: { after } });

// A grid table from rows of cell contents (string | Paragraph[]).
function grid(rows, widths, { header = true, fill = WHITE, headFill = WARM, border = line(HAIR), keep = true, fontSize = 19 } = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: allBorders(border),
    rows: rows.map((cells, ri) =>
      new TableRow({
        cantSplit: keep,
        tableHeader: header && ri === 0,
        children: cells.map((c, ci) =>
          new TableCell({
            width: { size: widths[ci], type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: header && ri === 0 ? headFill : fill, color: "auto" },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            verticalAlign: VerticalAlign.TOP,
            children:
              typeof c === "string"
                ? [p([run(c, { size: fontSize, bold: header && ri === 0 })], { spacing: { after: 0 } })]
                : c,
          }),
        ),
      }),
    ),
  });
}

// ---------- document shell ----------
const numbering = {
  config: [
    {
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 220 } } } }],
    },
    {
      reference: "steps",
      levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } } } }],
    },
  ],
};
const styles = {
  default: { document: { run: { font: BODY, size: 21, color: "1F2A33" } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: HEAD, size: 44, color: DEEP }, paragraph: { spacing: { after: 120 } } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: HEAD, size: 32, color: DEEP }, paragraph: { spacing: { before: 120, after: 100 } } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: BODY, size: 23, bold: true, color: DEEP }, paragraph: { spacing: { before: 200, after: 80 } } },
  ],
};

function headerFor(label, color) {
  return new Header({
    children: [
      p([run(`TABLETOP · ${label.toUpperCase()}`, { font: MONO, size: 15, color, characterSpacing: 20 })], {
        spacing: { after: 0 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color, space: 4 } },
      }),
    ],
  });
}
function footer() {
  return new Footer({
    children: [
      p(
        [
          run("Fictional composite. No real cases, no patient data. First names only.   ", { size: 15, color: MUTED }),
          run("Page ", { size: 15, color: MUTED }),
          new TextRun({ children: [PageNumber.CURRENT], font: BODY, size: 15, color: MUTED }),
        ],
        { alignment: AlignmentType.CENTER, spacing: { after: 0 } },
      ),
    ],
  });
}
function section(children, { label, color = PURPLE, landscape = false } = {}) {
  return {
    properties: {
      page: {
        size: landscape ? { ...PORTRAIT, orientation: PageOrientation.LANDSCAPE } : PORTRAIT,
        margin: MARGIN,
      },
    },
    headers: { default: headerFor(label, color) },
    footers: { default: footer() },
    children,
  };
}
async function save(name, sections) {
  const doc = new Document({ creator: "Tabletop · Virtual Insights", title: name, styles, numbering, sections });
  fs.writeFileSync(path.join(OUT, `${name}.docx`), await Packer.toBuffer(doc));
  written.push(name);
}
const written = [];

// ---------- content helpers ----------
// Paper meter: the room judges each decision's effect; + means more of it.
const METER_ORDER = ["goodwill", "risk", "dollars", "time"];
const METER_ASK = {
  goodwill: "Did this build clinicians' goodwill (+) or spend it (−)?",
  risk: "Did this add risk (+) or take risk away (−)?",
  dollars: "Did this commit more money (+) or less (−)?",
  time: "Does value arrive later (+) or sooner (−)?",
};
const METER_QUESTIONS = [["Measure", "Ask the room"], ...METER_ORDER.map((k) => [meterLabels[k], METER_ASK[k]])];
const optionLabel = (o) =>
  o.id === "writein" ? "None of these — we'll write our own" : o.label.replace(/^“|”$/g, "");

// Unroll a decision's "Meanwhile" memo into readable branches: evaluate the
// inject for every possible final answer at the decision it depends on.
function unrollInject(scenario, node) {
  const src = node.inject.toString();
  const deps = [...src.matchAll(/choiceOf\(records,\s*"(\w+)"\)/g)].map((m) => m[1]);
  if (!deps.length) {
    const text = node.inject({});
    return text ? { deps: [], groups: [{ keys: ["any"], text }] } : null;
  }
  if (new Set(deps).size !== 1) throw new Error(`${scenario.id}/${node.id}: inject depends on more than one decision`);
  const dep = deps[0];
  const depIndex = scenario.nodes.findIndex((n) => n.id === dep);
  const values = [...OPTION_ORDER, null];
  const groups = [];
  for (const v of values) {
    const records = { [dep]: v === null ? { skipped: true } : { skipped: false, firstAnswer: { choice: v }, revisedAnswer: null } };
    const text = node.inject(records);
    const g = groups.find((x) => x.text === text);
    if (g) g.keys.push(v);
    else groups.push({ keys: [v], text });
  }
  return { dep, depIndex, groups };
}
const keyName = (k) => (k === null ? "skipped it" : k === "writein" ? "wrote their own plan" : k === "decline" ? "couldn't answer" : `chose ${LETTER[k]}`);

// ---------- per-scenario documents ----------
function scenarioLabel(s, i) {
  return `Scenario ${i + 1} · Enters at ${s.entersAt}`;
}

function coverBlock(s, i, docName) {
  const c = SCEN[s.id].color;
  return [
    panel(
      [
        p([run(scenarioLabel(s, i).toUpperCase(), { font: MONO, size: 18, color: WHITE, characterSpacing: 30 })], { spacing: { after: 80 } }),
        p([run(s.title, { font: HEAD, size: 46, color: WHITE })], { spacing: { after: 80 } }),
        p([run(s.tagline, { italics: true, size: 22, color: WHITE })], { spacing: { after: 20 } }),
      ],
      { fill: c, border: line(c) },
    ),
    spacer(200),
  ];
}

function openingBlocks(s) {
  const out = [];
  for (const item of s.opening) {
    if (!item.channel) {
      out.push(p([run(item.text, { font: HEAD, size: 23, color: DEEP })], { spacing: { after: 160 } }));
      continue;
    }
    out.push(
      panel(
        [
          p([run(`${item.channel.toUpperCase()}  ·  ${item.when}`, { font: MONO, size: 16, color: SLATE, characterSpacing: 20 })], { spacing: { after: 40 } }),
          p([run("From: ", { bold: true, size: 19 }), run(item.from, { size: 19 })], { spacing: { after: 0 } }),
          p([run("To: ", { bold: true, size: 19 }), run(item.to, { size: 19 })], { spacing: { after: 80 } }),
          p([run(item.text, { size: 21 })], { spacing: { after: 0 } }),
        ],
        { fill: WHITE },
      ),
      spacer(100),
    );
  }
  return out;
}

async function facilitatorBooklet(s, i) {
  const c = SCEN[s.id].color;
  const n = s.nodes.length;
  const kids = [...coverBlock(s, i, "Facilitator booklet")];
  kids.push(
    p([run(`Room ${SCEN[s.id].room}     Facilitator ________________________`, { size: 22 })], { spacing: { after: 200 } }),
    p([run("Keep this booklet on your side of the table. The room reads from its three Participant Packets (the opening and every decision). You hold the Role Cards and Worksheet.", { size: 21 })]),
    h3("In this booklet"),
    bullet("Before you start: setup, the roles at this table, and what to say first"),
    bullet("The opening"),
    ...s.nodes.map((node, k) => bullet(`Decision ${k + 1}: ${node.title}`)),
    bullet("The debrief"),
    bullet("Hand-off to the lead facilitator"),
  );
  if (n >= 7) {
    kids.push(spacer(80), panel([p([run("Pace: this scenario has seven decisions. Aim for about 8 minutes each. If you're past 70 minutes before the last decision, skip one and record it as skipped.", { size: 20, color: DEEP })], { spacing: { after: 0 } })], { fill: "FFF6E5", border: line("E3C793") }));
  }

  // Before you start
  kids.push(pageBreak(), eyebrow("Before you start", c), h2("Setup"));
  [
    "Deal the five role cards (from your Role Cards and Worksheet). Every person plays a role and every role is played: two people can share a role, or one person can play two.",
    "Write each person's first name next to their role on the worksheet's first page.",
    "Put the three Participant Packets face down around the table. They hold the opening and every decision, so ask the room not to read ahead: you'll say when to turn to each decision.",
    "Put the meter board in the middle of the table, where everyone can reach it, with a pen.",
    "Worksheet, pen, and a clock where you can see them.",
  ].forEach((t) => kids.push(p([box(), run(t)], { indent: { left: 360, hanging: 360 } })));

  kids.push(h3("Say this first"));
  kids.push(
    quote("Today you're one team making real decisions about a made-up case. Each decision needs one answer the whole group owns, and it has to name a person or role, not a committee. I'll write down what you decide and who made the final call. We're paying attention to how decisions get made, not only what's decided, and nothing is written down against anyone by name."),
  );

  kids.push(h3("The roles at this table"));
  kids.push(note("Nudge a quiet role when the moment on the right comes up. Their card has a fact the room needs."));
  const cueRows = [["Role", "What they're here for", "Nudge them when…"]];
  for (const r of roles) {
    const card = s.roleCards[r];
    if (!card) continue;
    cueRows.push([
      [p([run(r, { bold: true, size: 19 })], { spacing: { after: 0 } })],
      card.mandate[0].replace(/^Your job:\s*/i, "").replace(/^./, (ch) => ch.toUpperCase()),
      [...card.asymmetric.map((a) => p([run(`• ${a.cue}`, { size: 18 })], { spacing: { after: 30 } }))],
    ]);
  }
  kids.push(grid(cueRows, [2200, 4280, 3600], { fontSize: 18 }));

  kids.push(h3("What's true in this story"));
  kids.push(note("Background for answering the room's questions. Don't read it aloud. The room has only the opening and the role cards, so when it asks for a fact, answer from here."));
  for (const para of s.modelBrief.split("\n")) if (para.trim()) kids.push(p([run(para.trim(), { size: 19, color: "33375C" })], { spacing: { after: 80 } }));

  // Opening
  kids.push(pageBreak(), eyebrow("The opening", c), h2("Start the story"));
  kids.push(p("Have the room turn over the Participant Packets to the opening (the first page). Read the first paragraph aloud and let the room read the messages. Give them a minute before the first decision."));
  kids.push(...openingBlocks(s));

  // Decisions
  s.nodes.forEach((node, k) => {
    kids.push(pageBreak(), eyebrow(`Decision ${k + 1} of ${n}  ·  ${SECTION[node.type]}`, c), h2(node.title));

    // 1. Meanwhile
    const inj = unrollInject(s, node);
    let step = 1;
    if (inj) {
      kids.push(h3(`${step++} · Read the “Meanwhile” memo first`));
      if (!inj.dep) {
        kids.push(quote(inj.groups[0].text));
      } else {
        kids.push(note(`Read the one that matches the room's final answer at Decision ${inj.depIndex + 1} (the revised answer, if they revised).`));
        const rows = [["If at Decision " + (inj.depIndex + 1) + " the room…", "Read aloud"]];
        const big = [...inj.groups].sort((a, b) => b.keys.length - a.keys.length)[0];
        const catchAll = big.keys.length >= 3 && inj.groups.length > 1 ? big : null;
        // Specific branches first; the catch-all ("did anything else") reads last.
        const ordered = [...inj.groups.filter((g) => g !== catchAll), ...(catchAll ? [catchAll] : [])];
        for (const g of ordered) {
          const who = g === catchAll ? "did anything else" : g.keys.map(keyName).join(", or ");
          rows.push([who, g.text ? [p([run(g.text, { size: 19 })], { spacing: { after: 0 } })] : [p([run("No memo. Go straight to the question.", { italics: true, size: 19, color: SLATE })], { spacing: { after: 0 } })]]);
        }
        kids.push(grid(rows, [2600, 7480], { fontSize: 19 }));
      }
    }

    // 2. Pose
    kids.push(h3(`${step++} · Have the room turn to Decision ${k + 1} and read the question`));
    kids.push(quote(node.question));
    kids.push(note("Discussion: about 5 minutes. Keep them working toward one answer the whole room owns. If they drift into a vote, ask who would sign it."));

    // 3. Record
    kids.push(h3(`${step++} · Record the room's answer`));
    kids.push(p([run("On the worksheet: tick their choice, write their answer, and tick who made the final call. Their answer should say: ", { size: 20 }), run(node.freeTextPrompt, { size: 20, bold: true })]));

    // 4. Challenge: the facilitator presses for the missing piece, in their own voice.
    const ch = challenges[s.id]?.[node.id];
    if (!ch) throw new Error(`${s.id}/${node.id}: no challenge questions in paper/challenges.js`);
    kids.push(h3(`${step++} · Challenge the answer`));
    kids.push(note("Ask the one that fits what they wrote, in your own words if you like. Press on the answer, never on a person."));
    const chRows = [
      ["If no person or role is named (a committee, a department, “leadership”)", ch.noName],
      ["If someone is named, but the trigger, number, or date is missing", ch.noTrigger],
      ["If it names a person or role and a trigger, number, or date: say what's solid; the question is optional", ch.specific],
      ["If the room chose “We can't answer this today”", ch.declined],
    ];
    kids.push(
      new Table({
        width: { size: W, type: WidthType.DXA },
        columnWidths: [3000, 7080],
        layout: TableLayoutType.FIXED,
        borders: allBorders(line(HAIR)),
        rows: chRows.map(
          (r) =>
            new TableRow({
              cantSplit: true,
              children: [
                new TableCell({
                  width: { size: 3000, type: WidthType.DXA },
                  shading: { type: ShadingType.CLEAR, fill: PAPER, color: "auto" },
                  margins: { top: 90, bottom: 90, left: 140, right: 120 },
                  children: [p([run(r[0], { size: 17, color: SLATE })], { spacing: { after: 0 } })],
                }),
                new TableCell({
                  width: { size: 7080, type: WidthType.DXA },
                  margins: { top: 90, bottom: 90, left: 160, right: 140 },
                  children: [p([run(r[1], { size: 20 })], { spacing: { after: 0 } })],
                }),
              ],
            }),
        ),
      }),
      spacer(100),
    );

    // 5. Hold or revise
    kids.push(h3(`${step++} · Hold or revise`));
    kids.push(p("Ask: “Does your answer stand, or do you want to change it?” If they change it, write the revised answer on the worksheet. Both are kept."));

    // 6. Score
    kids.push(h3(`${step++} · Score it`));
    // The same rubric the app shows the facilitator at scoring.
    kids.push(p([run("Specific: ", { bold: true, color: "2F7D4F" }), run(`${SCORING[node.type]}.`)]));
    kids.push(p([run(GENERIC_ABSENT, { size: 20, color: SLATE })]));
    kids.push(note("Only Specific counts as an answer. Score the final answer (the revised one, if they revised)."));

    // 7. Meter: on paper the room judges the effect itself (no authored amounts).
    kids.push(h3(`${step++} · Ask the room how it moved the meter`));
    kids.push(p(`For each measure, the room decides together whether this decision pushed it up, pushed it down, or left it alone. On the meter board, mark a + to the right of the center line or a − to the left, with the decision number (“+${k + 1}”, “−${k + 1}”). No change, no mark.`));
    kids.push(grid(METER_QUESTIONS, [2800, 7280], { fontSize: 19 }));
    kids.push(note("Let them argue it; the trade-off matters more than the mark. If every mark looks good, ask what this decision costs."));

    // 8. What happens
    kids.push(h3(`${step++} · Read what happens`));
    const evRows = [["Their final choice", "When", "Read aloud"]];
    for (const o of node.options) {
      const ev = node.events[o.id];
      evRows.push([LETTER[o.id], ev.when, [p([run(ev.text, { size: 19 })], { spacing: { after: 0 } })]]);
    }
    kids.push(grid(evRows, [1600, 1500, 6980], { fontSize: 19 }));
    kids.push(p([run("Then read one more beat, depending on your score:", { bold: true, size: 20 })], { spacing: { before: 140 } }));
    kids.push(
      grid(
        [
          ["Your score", `Read aloud (${node.owner.when})`],
          ["Specific", [p([run(node.owner.named, { size: 19 })], { spacing: { after: 0 } })]],
          ["Generic, Absent, or declined", [p([run(node.owner.missing, { size: 19 })], { spacing: { after: 0 } })]],
        ],
        [2600, 7480],
      ),
    );

    // 9. Villager
    const v = s.villagers?.[node.id];
    if (v) {
      kids.push(h3(`${step++} · Who lives with this decision`));
      kids.push(quote(v.line, { spacing: { after: 40 } }), p([run(`— ${v.speaker}`, { size: 20, color: SLATE })], { indent: { left: 360 } }));
    }

    kids.push(h3(`${step++} · Write the lock time on the worksheet`));
    kids.push(note(k < n - 1 ? `Then move to Decision ${k + 2}.` : "Then go to the debrief."));
  });

  // Debrief (no 12-month report on paper)
  kids.push(pageBreak(), eyebrow("After the last decision", c), h2("The debrief"));
  kids.push(p("About ten minutes. Work from the worksheet and the meter board. Let the room talk; your job is to ask, not to sum up."));
  kids.push(h3("Debrief questions"));
  [
    "Which decision would you most want to change? What would you decide differently?",
    "Look at the meter board. Where did the marks pile up, and what did the room trade for what?",
    "Look at who made the final call on each decision. Did one person end up deciding, or did it move around?",
    "Where did the room name a committee instead of a person? What stopped it from naming someone?",
    "What would you need to be true at the real organization to answer these the same way?",
  ].forEach((q) => kids.push(bullet(q)));

  // Hand-off
  kids.push(h3("Hand-off to the lead facilitator"));
  [
    "Write the finish time on the worksheet.",
    "Fill one sticky note per decision for the plenary wall: the short answer and who made the final call. Green for Specific, yellow for Generic, pink for Absent or declined, blue for skipped.",
    "Bring the worksheet and the stickies to the lead facilitator. Leave the role cards and the Participant Packets behind.",
  ].forEach((t) => kids.push(bullet(t)));

  await save(fileName(s, "Facilitator Booklet"), [section(kids, { label: `${scenarioLabel(s, i)} · Facilitator booklet`, color: c })]);
}

// Output file names lead with the room, so the folder sorts room by room.
const fileName = (s, doc) => `Room ${SCEN[s.id].room} - ${SCEN[s.id].short} - ${doc}`;

// Two room files, each in sections with a section break between them and
// every section named in its page header:
//   Role Cards and Worksheet: the facilitator's copy (one printed).
//   Participant Packet: the Scenario and the Decision Cards (three printed).
async function packet(s, doc, parts) {
  const c = SCEN[s.id].color;
  await save(
    fileName(s, doc),
    parts.map(([name, kids], k) => section(kids, { label: `Room ${SCEN[s.id].room} · ${SCEN[s.id].short} · ${doc} · ${k + 1} ${name}`, color: c })),
  );
}
async function roomFiles(s, i) {
  await packet(s, "Role Cards and Worksheet", [["Role Cards", roleCardKids(s, i)], ["Worksheet", worksheetKids(s)]]);
  await packet(s, "Participant Packet", [["Scenario", scenarioKids(s, i)], ["Decision Cards", decisionCardKids(s)]]);
}

function scenarioKids(s, i) {
  const c = SCEN[s.id].color;
  const kids = [...coverBlock(s, i, "Participant packet")];
  kids.push(p([run(`Room ${SCEN[s.id].room}`, { size: 22 })], { spacing: { after: 200 } }), eyebrow("The opening", c), h2("What happened"));
  kids.push(...openingBlocks(s));
  // Paper leaves out the app's evidence folder and who's who: too much to
  // read in the room. The facilitator answers from the booklet's background.
  return kids;
}

function decisionCardKids(s) {
  const c = SCEN[s.id].color;
  const n = s.nodes.length;
  const kids = [];
  s.nodes.forEach((node, k) => {
    if (k > 0) kids.push(pageBreak());
    kids.push(
      eyebrow(`Decision ${k + 1} of ${n}  ·  ${SECTION[node.type]}`, c),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(node.title, { font: HEAD, size: 48, color: DEEP })], spacing: { after: 160 } }),
      p([run(node.question, { size: 26 })], { spacing: { after: 200 } }),
    );
    const rows = node.options.map((o) => {
      const special = o.id === "writein" || o.id === "decline";
      return new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 900, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: special ? PAPER : WHITE, color: "auto" },
            margins: { top: 120, bottom: 120, left: 160, right: 80 },
            children: [p([run(LETTER[o.id] === "Own plan" ? "✎" : LETTER[o.id] === "Can't answer" ? "–" : LETTER[o.id], { font: MONO, size: 28, color: BLUE, bold: true })], { spacing: { after: 0 } })],
          }),
          new TableCell({
            width: { size: W - 900, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: special ? PAPER : WHITE, color: "auto" },
            margins: { top: 120, bottom: 120, left: 120, right: 160 },
            children: [
              p([run(optionLabel(o), { size: 24, bold: true, color: DEEP })], { spacing: { after: 40 } }),
              p([run(o.hint, { size: 20, color: SLATE })], { spacing: { after: 0 } }),
            ],
          }),
        ],
      });
    });
    kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [900, W - 900], layout: TableLayoutType.FIXED, borders: allBorders(line(HAIR, 8)), rows }));
    kids.push(
      spacer(160),
      panel(
        [
          p([run("YOUR ANSWER SHOULD SAY", { font: MONO, size: 17, color: c, characterSpacing: 30 })], { spacing: { after: 60 } }),
          p([run(node.freeTextPrompt, { size: 23, color: DEEP })], { spacing: { after: 100 } }),
          p([run("And tell your facilitator who at the table made the final call.", { size: 21, color: SLATE })], { spacing: { after: 0 } }),
        ],
        { fill: PAPER },
      ),
    );
  });
  return kids;
}

function roleCardKids(s, i) {
  const c = SCEN[s.id].color;
  const kids = [
    h2("Role cards"),
    note("Five roles, full coverage: every person plays a role, and every role is played. Share a card or play two."),
    spacer(80),
  ];
  roles.forEach((r) => {
    const card = s.roleCards[r];
    if (!card) return;
    const cellKids = [
      p([run(scenarioLabel(s, i).toUpperCase(), { font: MONO, size: 15, color: c, characterSpacing: 20 })], { spacing: { after: 40 } }),
      p([run(r, { font: HEAD, size: 34, color: DEEP })], { spacing: { after: 100 } }),
      ...card.mandate.map((m) => bullet([run(m, { size: 20 })])),
      new Paragraph({
        spacing: { before: 140, after: 60 },
        border: { top: { style: BorderStyle.DASHED, size: 6, color: "999999", space: 6 } },
        children: [run("ONLY YOU KNOW THIS. BRING IT UP WHEN IT MATTERS.", { font: MONO, size: 16, color: RUST, characterSpacing: 20 })],
      }),
      ...card.asymmetric.flatMap((a) => [
        bullet([run(a.text, { size: 20 })]),
        p([run(`Bring it up when ${a.cue}.`, { italics: true, size: 18, color: SLATE })], { indent: { left: 360 }, spacing: { after: 80 } }),
      ]),
    ];
    kids.push(
      new Table({
        width: { size: W, type: WidthType.DXA },
        columnWidths: [W],
        layout: TableLayoutType.FIXED,
        borders: allBorders({ style: BorderStyle.SINGLE, size: 10, color: DEEP }),
        rows: [new TableRow({ cantSplit: true, children: [new TableCell({ width: { size: W, type: WidthType.DXA }, margins: { top: 180, bottom: 160, left: 240, right: 240 }, children: cellKids })] })],
      }),
      spacer(260),
    );
  });
  return kids;
}

function worksheetKids(s) {
  const c = SCEN[s.id].color;
  // Pace: ten minutes of setup, then an even share of the decision window
  // (65 minutes) per decision, leaving the last fifteen for the debrief.
  const per = Math.floor(65 / s.nodes.length);
  const paceRows = [["Decision", "Lock it by (minutes in)", "Clock time"]];
  s.nodes.forEach((node, k) => paceRows.push([`${k + 1}. ${node.title}`, `${10 + per * (k + 1)}`, ""]));
  paceRows.push(["Debrief", "75–85", ""], ["Stickies and hand-off", "90", ""]);
  const kids = [
    h2("Worksheet"),
    p([run(`Room ${SCEN[s.id].room}     Facilitator ____________________     Date ____________     Start time ________`, { size: 21 })], { spacing: { after: 160 } }),
    h3("Who is playing which role (first names only)"),
    grid([["Role", "First name(s)"], ...roles.map((r) => [r, ""])], [4000, 6080], { fontSize: 20 }),
    note("Write what the room decides, in their words. In the notes, write what was said, never who said it."),
    h3("Pace"),
    note(`About ${per} minutes per decision. Fill in the clock times when you start; if you fall more than one decision behind, skip one.`),
    grid(paceRows, [5980, 2200, 1900], { fontSize: 18 }),
  ];
  const deciders = [...roles.map((r) => r.replace(/^The /, "")), "The group", "Other: ________"];
  s.nodes.forEach((node, k) => {
    if (k % 2 === 0) kids.push(pageBreak());
    const rowSpecs = [
      [
        p([run(`Decision ${k + 1} · ${node.title}`, { bold: true, size: 22, color: WHITE })], { spacing: { after: 0 } }),
        p([run("Start ______   Lock ______", { size: 19, color: WHITE })], { spacing: { after: 0 }, alignment: AlignmentType.RIGHT }),
      ],
      [p(ticks(["A", "B", "C", "Own plan", "Can't answer", "Skipped"]), { spacing: { after: 0 } })],
      [p([run(`Their answer (${node.freeTextPrompt})`, { size: 17, color: SLATE })], { spacing: { after: 0 } }), writeLine(), writeLine(), writeLine()],
      [p([run("Final call:  ", { size: 18, bold: true }), ...ticks(deciders, 17)], { spacing: { after: 0 } })],
      [
        p([run("After the challenge:  ", { size: 18, bold: true }), ...ticks(["Held", "Revised to"], 18), run("   ", { size: 18 }), ...ticks(["A", "B", "C", "Own plan"], 18)], { spacing: { after: 0 } }),
        p([run("New wording:", { size: 17, color: SLATE })], { spacing: { before: 60, after: 0 } }),
        writeLine(),
      ],
      [
        p([run("Score:  ", { size: 18, bold: true }), ...ticks(["Specific", "Generic", "Absent"], 18)], { spacing: { after: 60 } }),
        p(
          [
            run("Meter:  ", { size: 18, bold: true }),
            ...["Goodwill", "Risk", "Dollars", "Time"].flatMap((m, mi) => [
              run(`${m} `, { size: 18 }),
              ...ticks(["+", "−"], 18),
              run(mi < 3 ? "      " : "", { size: 18 }),
            ]),
          ],
          { spacing: { after: 0 } },
        ),
      ],
      [p([run("What was said (words, not names)", { size: 17, color: SLATE })], { spacing: { after: 0 } }), writeLine(), writeLine()],
    ];
    const rows = rowSpecs.map((cells, ri) => {
      const isHead = ri === 0;
      return new TableRow({
        cantSplit: true,
        children: isHead
          ? [
              new TableCell({ width: { size: 6800, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: c, color: "auto" }, margins: { top: 90, bottom: 90, left: 140, right: 80 }, children: [cells[0]] }),
              new TableCell({ width: { size: W - 6800, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: c, color: "auto" }, margins: { top: 90, bottom: 90, left: 80, right: 140 }, verticalAlign: VerticalAlign.CENTER, children: [cells[1]] }),
            ]
          : [new TableCell({ columnSpan: 2, width: { size: W, type: WidthType.DXA }, margins: { top: 60, bottom: 80, left: 140, right: 140 }, children: cells })],
      });
    });
    kids.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [6800, W - 6800], layout: TableLayoutType.FIXED, borders: allBorders(line(HAIR, 6)), rows }), spacer(120));
  });
  kids.push(
    pageBreak(),
    p([run("Finish time ________", { size: 20 })], { spacing: { before: 120 } }),
    h3("Anything else the lead facilitator should know"),
    writeLine(), writeLine(), writeLine(), writeLine(), writeLine(),
  );
  return kids;
}

// ---------- shared documents ----------
async function facilitatorGuide() {
  const kids = [
    h1("Running the room on paper"),
    p("Four rooms, each assigned one case, about 90 minutes. The room answers as one group. You keep it answering, write down what it decides, and read the story back to it. Your scenario's Facilitator Booklet has every line you need, decision by decision. This guide is the part that's the same in every room."),
    h3("The kit for your room"),
  ];
  [
    ["Facilitator Booklet", "Your script. Setup, the opening, every decision step by step, the debrief."],
    ["Role Cards and Worksheet", "Your copy:"],
    ["   Role Cards", "Five, one per role. Dealt at setup."],
    ["   Worksheet", "The room's record. You fill it in."],
    ["Participant Packets", "Three, for the room:"],
    ["   Scenario", "The opening: what happened, and the messages that started it."],
    ["   Decision Cards", "One page per decision. The room turns to each one when you pose it, not before."],
    ["Meter Board", "Four measures. After each decision the room marks + or − on each one."],
    ["Also", "Pens, a clock or timer, four colors of sticky notes (green, yellow, pink, blue)."],
  ].forEach(([k, v]) => kids.push(p([run(`${k}: `, { bold: true }), run(v)])));

  kids.push(h3("Run of show (90 minutes)"));
  kids.push(
    grid(
      [
        ["Minutes", "What happens"],
        ["0–10", "Deal roles, write first names, say the opening lines, turn to the opening"],
        ["10–75", "The decisions: about 9 minutes each (8 for a seven-decision case)"],
        ["75–85", "Debrief, from the worksheet and the meter board"],
        ["85–90", "Fill the plenary stickies; hand in the worksheet"],
      ],
      [1800, 8280],
    ),
  );

  kids.push(h3("Every decision, the same nine steps"));
  [
    "Read the “Meanwhile” memo, if the booklet has one for this decision. It depends on an earlier answer.",
    "Have the room turn to the decision in their packets, and read the question.",
    "Let the room discuss, about 5 minutes. One answer the whole room owns.",
    "Record their choice, their written answer, and who made the final call.",
    "Challenge the answer: ask the booklet's question that fits what they wrote.",
    "Ask whether the answer stands or changes. Record any change.",
    "Score it: Specific, Generic, or Absent.",
    "Ask the room how the decision moved the meter, and mark it. Then read what happens.",
    "Read the voice of who lives with it (when there is one). Write the lock time.",
  ].forEach((t) => kids.push(numbered(t)));

  kids.push(h3("Scoring"));
  kids.push(
    grid(
      [
        ["Score", "What it means", "Sounds like"],
        ["Specific", "Names a person or role, plus a trigger, a number, or a date. The only score that counts as an answer.", "“The oncology clinics' leader signs by Friday, and pulls it if another lab is missed.”"],
        ["Generic", "Names a committee, department, or function, or leaves out the trigger.", "“The Workgroup will own it.” / “Quality will keep an eye on it.”"],
        ["Absent", "Names no one, or the room couldn't answer.", "“We'll work that out later.”"],
      ],
      [1500, 4580, 4000],
    ),
  );
  kids.push(note("Each decision page in the booklet says exactly what a Specific answer contains for that question."));

  kids.push(h3("Challenging the answer"));
  [
    "After you record the answer, press for the piece that's missing. The booklet gives one question for each case: nobody named, named but missing a trigger or number or date, specific, or declined.",
    "Ask it in your own voice. One question, then wait. Let the room answer before you say anything else.",
    "Press on the answer, never on a person. Don't argue for an option, and don't hint at what happens next.",
    "If the answer is already specific, say so plainly. The follow-up question is optional; never invent an objection.",
    "If the room let something slide at an earlier decision, you can bring it back once, kindly.",
  ].forEach((t) => kids.push(bullet(t)));

  kids.push(h3("The meter"));
  [
    "Four measures: clinician goodwill, risk exposure, dollars committed, and time to first value.",
    "After each decision the room decides, together, whether the decision pushed each one up or down. A + goes to the right of the center line, a − to the left, with the decision number. No change, no mark.",
    "“Up” means more of that thing: more goodwill (good), but also more risk, more dollars, and more time before it helps anyone.",
    "There's no winning score. The meter exists to make trade-offs visible and to stop “let's do both.” The debrief starts from where the marks piled up.",
  ].forEach((t) => kids.push(bullet(t)));

  kids.push(h3("Skips, declines, and the room's own plan"));
  [
    "“We can't answer this today” is always allowed. Record it; it's a gap, not a failure. It still has consequences, and the booklet reads them.",
    "“None of these — we'll write our own” is allowed. Write their plan word for word. The booklet reads “the room's plan goes out exactly as written.”",
    "If you run out of time, skip a decision: tick Skipped and move on. Skipped is different from declined.",
  ].forEach((t) => kids.push(bullet(t)));

  kids.push(h3("Capturing what was said"));
  kids.push(p("The notes box on each decision is for the tensions: the words people used, the argument that nearly won, the moment the room got stuck. Write words, never names. Nothing in this exercise is attributed to anyone present."));

  kids.push(h3("When the room gets stuck"));
  [
    "“Who in this room would sign that?”",
    "“If this goes wrong in March, whose phone rings?”",
    "“What would have to happen for you to change your mind?”",
    "“What does your role card say about this?”",
  ].forEach((t) => kids.push(bullet(t)));

  kids.push(h3("After the session"));
  [
    "The worksheets are the record of the session. Hand them to the lead facilitator and don't photograph them.",
    "When worksheets are typed up for synthesis, replace first names with roles.",
    "Role cards and participant packets can be recycled; they hold nothing about the people in the room.",
  ].forEach((t) => kids.push(bullet(t)));

  await save("00 - Facilitator Guide", [section(kids, { label: "Facilitator guide", color: PURPLE })]);
}

// Everything the print shop needs, in one document: every file by its exact
// name, with copies, paper, sides, and finishing. No other document carries
// printing instructions.
const PRINT_SHARED = [
  ["00 - Facilitator Guide", "5 (4 facilitators + 1 spare)", "Plain", "Double-sided", "Staple top left"],
  ["00 - Meter Board", "5 (4 rooms + 1 spare)", "Plain or card stock", "Single-sided", "Landscape"],
  ["00 - Lead Facilitator - Assignments and Plenary Guide", "1", "Plain", "Single-sided", "Staple top left"],
  ["00 - Plenary Wall Poster", "1", "Poster paper, matte", "Single-sided", "Poster, 24×36 in, portrait. The file is laid out at 12×18 in, the same shape: print it at 200%. Roll it; don't fold."],
];
const PRINT_PER_ROOM = [
  ["Facilitator Booklet", "1", "Plain", "Single-sided", "Staple top left, so it folds flat"],
  ["Role Cards and Worksheet", "1 (for the facilitator)", "Plain; the role cards (section 1) on card stock if you can", "Single-sided", "Cut the role cards apart along the borders. Staple the worksheet (section 2) top left."],
  ["Participant Packet", "3 (for the room)", "Plain", "Single-sided", "Staple top left"],
];

async function printOrder() {
  const widths = [4700, 2500, 1900, 1400, 3180];
  const head = ["File", "Copies", "Paper", "Sides", "Finishing"];
  const tick = (name) => [p([run("☐ ", { font: SYM, size: 20 }), run(name, { size: 19, bold: true })], { spacing: { after: 0 } })];
  const kids = [
    h2("Print order"),
    p("Every file below is in the kit folder under exactly this name. Print everything in color: each case is color-coded, and the colors tell the kits apart. US Letter and single-sided unless the table says otherwise (the plenary wall is a poster)."),
    h3("Shared"),
    grid([head, ...PRINT_SHARED.map(([f, ...rest]) => [tick(f), ...rest])], widths, { fontSize: 19 }),
  ];
  for (const s of Object.values(scenarios)) {
    const sc = SCEN[s.id];
    // Rooms 3 and 4 start a new page, so no table splits across pages.
    if (sc.room === 3) kids.push(pageBreak());
    kids.push(
      h3(`Room ${sc.room} · ${sc.short} · ${sc.colorName} kit`),
      grid([head, ...PRINT_PER_ROOM.map(([f, ...rest]) => [tick(fileName(s, f)), ...rest])], widths, { fontSize: 19 }),
    );
  }
  kids.push(h3("After printing"));
  [
    "Each room has three files. The Facilitator Booklet and the Role Cards and Worksheet are the facilitator's (one copy each). The Participant Packet is the room's (three copies). Each section starts on a new page with its name in the page header.",
    "Cut the role cards apart along the printed borders, and keep each room's set in its own envelope.",
    "Bundle one kit per room, by color: the room's Facilitator Booklet, Role Cards and Worksheet, and three Participant Packets, plus a Facilitator Guide and a Meter Board.",
    "Label each kit with its room: Room 1 is S1 Intake (Blue), Room 2 is S2 Evaluation (Green), Room 3 is S3 Deployment (Gold), Room 4 is S4 Monitoring (Purple). Every file name and cover already carries the room number. Tick “Kit packed” on the lead facilitator's room assignments as each kit is done.",
    "The poster goes on the wall of the plenary room before the rooms hand off; each answer cell is sized for a 3×3 in sticky note. If it can't be printed in time, the lead facilitator can copy the grid onto flip chart paper.",
  ].forEach((t) => kids.push(bullet(t)));
  await save("00 - Print Order", [section(kids, { label: "Print order", color: PURPLE, landscape: true })]);
}

// The room's own meter: a center line per measure, minus marks to the left,
// plus marks to the right. No starting values, no authored amounts.
async function meterBoard() {
  const labelW = 3400, centerW = 240;
  const sideW = Math.floor((LW - labelW - centerW) / 2);
  const widths = [labelW, sideW, centerW, sideW];
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (w, children, o = {}) =>
    new TableCell({ width: { size: w, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, margins: { left: 140, right: 140 }, children, ...o });
  const header = new TableRow({
    tableHeader: true,
    children: [
      cell(labelW, [p("")], { shading: { type: ShadingType.CLEAR, fill: WHITE, color: "auto" } }),
      cell(sideW, [p([run("−   LESS", { font: MONO, size: 22, bold: true, color: SLATE, characterSpacing: 30 })], { alignment: AlignmentType.LEFT, spacing: { after: 0 } })], { shading: { type: ShadingType.CLEAR, fill: WARM, color: "auto" } }),
      cell(centerW, [p("")], { shading: { type: ShadingType.CLEAR, fill: DEEP, color: "auto" } }),
      cell(sideW, [p([run("MORE   +", { font: MONO, size: 22, bold: true, color: SLATE, characterSpacing: 30 })], { alignment: AlignmentType.RIGHT, spacing: { after: 0 } })], { shading: { type: ShadingType.CLEAR, fill: WARM, color: "auto" } }),
    ],
  });
  const rows = METER_ORDER.map((key) =>
    new TableRow({
      height: { value: 1700, rule: HeightRule.ATLEAST },
      cantSplit: true,
      children: [
        cell(labelW, [
          p([run(meterLabels[key], { font: HEAD, size: 30, color: DEEP })], { spacing: { after: 40 } }),
          p([run(METER_ASK[key], { size: 17, color: SLATE })], { spacing: { after: 0 } }),
        ], { shading: { type: ShadingType.CLEAR, fill: PAPER, color: "auto" } }),
        cell(sideW, [p("")]),
        cell(centerW, [p("")], { shading: { type: ShadingType.CLEAR, fill: DEEP, color: "auto" } }),
        cell(sideW, [p("")]),
      ],
    }),
  );
  const kids = [
    h2("The cost meter"),
    note("After each decision, the room decides together: did it push each measure up, push it down, or leave it alone? Mark a + to the right of the center line or a − to the left, with the decision number (“+3”, “−3”). No change, no mark. There's no winning score: the board shows what the room traded for what."),
    spacer(120),
    new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, borders: allBorders(line("B9BCCB", 8)), rows: [header, ...rows] }),
  ];
  await save("00 - Meter Board", [section(kids, { label: "Meter board", color: PURPLE, landscape: true })]);
}

async function plenaryWall() {
  // The nine measures in framework order, A1 to A9.
  const types = Object.keys(MEASURES).sort((a, b) => Number(MEASURES[a].id.slice(1)) - Number(MEASURES[b].id.slice(1)));
  const scenarioList = Object.values(scenarios);
  const guide = [
    h1("Room assignments"),
    p("Each room is assigned one case; rooms don't choose. The cases run in lifecycle order from Room 1 to Room 4, left to right across the plenary wall. Use this table to pack the kits and hand each facilitator theirs."),
    grid(
      [
        ["Room", "Case", "Kit color", "Facilitator", "Kit packed"],
        ...scenarioList.map((s) => [`Room ${SCEN[s.id].room}`, `${SCEN[s.id].short.slice(0, 2)} ${s.title}`, SCEN[s.id].colorName, "", [p(ticks([""]), { spacing: { after: 0 } })]]),
      ],
      [1400, 3880, 1500, 2300, 1000],
      { fontSize: 20 },
    ),
    h3("The four cases"),
    grid(
      [
        ["Case", "Room", "Enters at", "Decisions"],
        ...scenarioList.map((s) => [`${SCEN[s.id].short.slice(0, 2)} ${s.title}`, `Room ${SCEN[s.id].room}`, s.entersAt, String(s.nodes.length)]),
      ],
      [5480, 1700, 1500, 1400],
      { fontSize: 19 },
    ),
    note("With four rooms and four cases, every case is played once, so every measure is asked in at least one room."),
    pageBreak(),
    h1("The plenary wall"),
    p("While the rooms work, the wall is empty. At hand-off, each facilitator brings one sticky note per decision: the short answer and who made the final call, colored by score. You put them on the matrix, and the wall shows the four rooms side by side."),
    h3("Sticky colors"),
    grid(
      [
        ["Color", "Score"],
        ["Green", "Specific: a person or role, plus a trigger, number, or date"],
        ["Yellow", "Generic: a committee or department, or no trigger"],
        ["Pink", "Absent, or the room declined"],
        ["Blue", "Skipped for time"],
      ],
      [1800, 8280],
    ),
    h3("Reading the wall"),
  ];
  [
    ["Alignment", "Three or more rooms gave the same substantive answer to the same measure."],
    ["Friction", "Rooms gave different answers to the same measure."],
    ["Collision", "Rooms gave the same authority to different people, or sent the same kind of call to different groups. Look for the same decision landing on the Workgroup in one room and the AI Leader in another."],
    ["Orphan", "Pink or blue in three or more of the rooms whose case asked it. A cell whose case didn't ask that measure doesn't count."],
    ["Drop-off", "Read top to bottom: where along the lifecycle do rooms stop naming people?"],
    ["Who decides", "Look at the “final call” names across the wall. Did the same role end up deciding in every room, or did it move around? That is the organization's own open question."],
  ].forEach(([k, v]) => guide.push(p([run(`${k}: `, { bold: true }), run(v)])));

  guide.push(h3("Which case asks which measure"));
  guide.push(note("The poster (00 - Plenary Wall Poster) already shows each room's case at the top of its column, outlines the cells that should get an answer, and shades the measures that case doesn't ask."));
  const cov = [["Measure", ...Object.values(scenarios).map((s) => `Room ${SCEN[s.id].room} · ${SCEN[s.id].short.slice(0, 2)}`)]];
  for (const t of types) {
    cov.push([
      `${MEASURES[t].id} ${MEASURES[t].name}`,
      ...Object.values(scenarios).map((s) => {
        const k = s.nodes.findIndex((n) => n.type === t);
        return k === -1 ? "—" : `Decision ${k + 1}`;
      }),
    ]);
  }
  guide.push(grid(cov, [3280, 1700, 1700, 1700, 1700], { fontSize: 18 }));

  guide.push(pageBreak(), h2("Who made the final calls"));
  guide.push(note("Tally from each worksheet's “Final call” line: one mark per decision."));
  guide.push(
    grid(
      [["", ...scenarioList.map((s) => `Room ${SCEN[s.id].room} · ${SCEN[s.id].short.slice(0, 2)}`)], ...[...roles, "The group", "Other"].map((r) => [r, "", "", "", ""])],
      [3280, 1700, 1700, 1700, 1700],
      { fontSize: 19 },
    ),
  );

  await save("00 - Lead Facilitator - Assignments and Plenary Guide", [section(guide, { label: "Lead facilitator · assignments and plenary", color: PURPLE })]);
}

// The plenary wall as a poster: 24×36 in, portrait. Word caps a page at 22 in,
// so the file is laid out at half size (12×18 in, the same shape) and printed
// at 200%. Everything below is sized for that: a 2,400-twip row is 3.3 in on
// the poster, room for a 3×3 in sticky note.
const POSTER = { width: 12 * 1440, height: 18 * 1440 };
const POSTER_MARGIN = { top: 576, bottom: 576, left: 576, right: 576, header: 300, footer: 300 };
const STICKY = [["8BC34A", "Green", "Specific"], ["FFE066", "Yellow", "Generic"], ["F48FB1", "Pink", "Absent or declined"], ["81D4FA", "Blue", "Skipped"]];

async function plenaryPoster() {
  const PW = POSTER.width - POSTER_MARGIN.left - POSTER_MARGIN.right; // 16128
  const types = Object.keys(MEASURES).sort((a, b) => Number(MEASURES[a].id.slice(1)) - Number(MEASURES[b].id.slice(1)));
  const roomCases = Object.values(scenarios).sort((a, b) => SCEN[a.id].room - SCEN[b.id].room);
  const measureW = 3200, colW = 2600;
  const widths = [measureW, colW, colW, colW, colW, PW - measureW - colW * 4];
  const cellBorder = line("B9BCCB", 8);
  const answerBorder = line(DEEP, 36);

  const title = [
    p([run("The plenary wall", { font: HEAD, size: 64, color: DEEP })], { spacing: { after: 0 } }),
    p(
      [
        run("One sticky note per decision: the short answer and who made the final call.   ", { size: 24, color: SLATE }),
        ...STICKY.flatMap(([fill, name, score]) => [run("■ ", { font: SYM, size: 30, color: fill }), run(`${name} ${score}   `, { size: 24, color: DEEP })]),
      ],
      { spacing: { after: 120 } },
    ),
  ];

  const headRow = new TableRow({
    tableHeader: true,
    height: { value: 800, rule: HeightRule.ATLEAST },
    children: ["Measure", ...roomCases.map((s) => `Room ${SCEN[s.id].room}\n${SCEN[s.id].short} · ${SCEN[s.id].colorName}`), "What we see"].map((h, ci) =>
      new TableCell({
        width: { size: widths[ci], type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        shading: { type: ShadingType.CLEAR, fill: ci >= 1 && ci <= 4 ? SCEN[roomCases[ci - 1].id].color : DEEP, color: "auto" },
        margins: { top: 60, bottom: 60, left: 160, right: 160 },
        children: h.split("\n").map((l, li) => p([run(l, { color: WHITE, bold: li === 0, size: li === 0 ? 34 : 22 })], { spacing: { after: 0 } })),
      }),
    ),
  });

  const bodyRows = types.map(
    (t) =>
      new TableRow({
        cantSplit: true,
        height: { value: 2400, rule: HeightRule.EXACT },
        children: [
          new TableCell({
            width: { size: measureW, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: PAPER, color: "auto" },
            borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
            margins: { top: 140, bottom: 100, left: 180, right: 160 },
            children: [
              p([run(`${MEASURES[t].id}`, { font: MONO, size: 24, color: BLUE, bold: true })], { spacing: { after: 20 } }),
              p([run(MEASURES[t].name, { bold: true, size: 30, color: DEEP })], { spacing: { after: 60 } }),
              p([run(MEASURES[t].def, { size: 20, color: SLATE })], { spacing: { after: 0 } }),
            ],
          }),
          // A cell that should get an answer (the room's case asks this measure) has
          // a bold outline and its decision number; the rest are shaded "Not asked".
          ...roomCases.map((s) => {
            const k = s.nodes.findIndex((n) => n.type === t);
            return k === -1
              ? new TableCell({
                  width: { size: colW, type: WidthType.DXA },
                  verticalAlign: VerticalAlign.CENTER,
                  shading: { type: ShadingType.CLEAR, fill: WARM, color: "auto" },
                  borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
                  children: [p([run("Not asked", { size: 24, color: MUTED, italics: true })], { alignment: AlignmentType.CENTER, spacing: { after: 0 } })],
                })
              : new TableCell({
                  width: { size: colW, type: WidthType.DXA },
                  borders: { top: answerBorder, bottom: answerBorder, left: answerBorder, right: answerBorder },
                  margins: { top: 80, left: 120, right: 120 },
                  children: [p([run(`Decision ${k + 1}`, { font: MONO, size: 18, color: MUTED })], { spacing: { after: 0 } })],
                });
          }),
          new TableCell({ width: { size: widths[5], type: WidthType.DXA }, borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder }, children: [p("")] }),
        ],
      }),
  );

  const table = new Table({ width: { size: PW, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, borders: allBorders(cellBorder), rows: [headRow, ...bodyRows] });
  await save("00 - Plenary Wall Poster", [
    {
      properties: { page: { size: POSTER, margin: POSTER_MARGIN } },
      footers: { default: footer() },
      children: [...title, table],
    },
  ]);
}

// ---------- build ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
await printOrder();
await facilitatorGuide();
await meterBoard();
await plenaryWall();
await plenaryPoster();
const list = Object.values(scenarios);
for (const [i, s] of list.entries()) {
  await facilitatorBooklet(s, i);
  await roomFiles(s, i);
}
console.log(`Wrote ${written.length} documents to ${OUT}`);
