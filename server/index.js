// Tabletop server — Phase 2: four scenarios, Villager beats, role cards,
// printable worksheets. Single room, in-memory state; Postgres, facilitator
// codes, and the admin dashboard arrive in Phase 3.
import "dotenv/config";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  scenarios,
  elders,
  elderFiresOn,
  roles,
  decidedByPrompt,
  villagerStandingLine,
  buildEpilogue,
  meterStart,
} from "./content/index.js";
import { streamElderTurn } from "./npc.js";
import { worksheetPage, roleCardsPage, printIndexPage } from "./print.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ---------- state ----------

function freshState() {
  return {
    scenarioId: null, // chosen with the group at the start of the breakout
    nodeIndex: 0,
    phase: "posed",
    epilogue: null,
    records: {},
    meter: { ...meterStart },
    elderTurns: {},
    roleAssignments: {},
    briefed: false,
    startedAt: Date.now(),
    posedAt: Date.now(),
  };
}

let state = freshState();

const currentScenario = () => (state.scenarioId ? scenarios[state.scenarioId] : null);
const currentNode = () => currentScenario()?.nodes[state.nodeIndex];
const record = (nodeId) =>
  (state.records[nodeId] ??= {
    firstAnswer: null,
    revisedAnswer: null,
    held: false,
    skipped: false,
    score: null,
    consequence: null,
    villager: null,
    timings: { posedAt: state.posedAt, firstAnswerAt: null, lockedAt: null },
  });
const finalAnswer = (r) => r.revisedAnswer ?? r.firstAnswer;

function publicState() {
  const scenario = currentScenario();
  const node = scenario && !state.epilogue ? currentNode() : null;
  return {
    scenarios: Object.values(scenarios).map((s) => ({
      id: s.id,
      title: s.title,
      entersAt: s.entersAt,
      tagline: s.tagline,
      nodeCount: s.nodes.length,
    })),
    scenario: scenario
      ? { id: scenario.id, title: scenario.title, entersAt: scenario.entersAt, brief: scenario.brief, evidence: scenario.evidence }
      : null,
    decidedByPrompt,
    villagerStandingLine,
    roles,
    roleAssignments: state.roleAssignments,
    progress: scenario
      ? scenario.nodes.map((n, i) => {
          const r = state.records[n.id];
          return {
            id: n.id,
            type: n.type,
            title: n.title,
            status: state.epilogue
              ? r?.skipped
                ? "skipped"
                : "done"
              : i < state.nodeIndex
                ? r?.skipped
                  ? "skipped"
                  : "done"
                : i === state.nodeIndex
                  ? "current"
                  : "upcoming",
            score: r?.score ?? null,
          };
        })
      : [],
    records: Object.fromEntries(
      Object.entries(state.records).map(([id, r]) => {
        const a = finalAnswer(r);
        const n = scenario?.nodes.find((x) => x.id === id);
        return [
          id,
          {
            score: r.score,
            skipped: r.skipped,
            answer: a && n ? { ...a, short: n.options.find((o) => o.id === a.choice)?.short } : null,
          },
        ];
      }),
    ),
    node: node
      ? {
          id: node.id,
          type: node.type,
          title: node.title,
          question: node.question,
          freeTextPrompt: node.freeTextPrompt,
          options: node.options,
          elders: node.elders.map((id) => ({ id, name: elders[id].name, seat: elders[id].seat })),
          inject: node.inject(state.records),
          index: state.nodeIndex,
          count: scenario.nodes.length,
        }
      : null,
    state: {
      phase: !state.scenarioId ? "select" : state.epilogue ? "epilogue" : state.phase,
      briefed: state.briefed,
      record: node ? state.records[node.id] ?? null : null,
      meter: state.meter,
      epilogue: state.epilogue,
      startedAt: state.startedAt,
    },
  };
}

// ---------- api ----------

app.get("/api/state", (_req, res) => res.json(publicState()));

app.get("/api/elders", (_req, res) =>
  res.json(
    Object.values(elders).map((e) => ({ id: e.id, name: e.name, seat: e.seat, firesOn: elderFiresOn[e.id] })),
  ),
);

// The group chooses its scenario at the start of the breakout (PRD §5.1).
app.post("/api/scenario", (req, res) => {
  const { id } = req.body ?? {};
  if (!scenarios[id]) return res.status(400).json({ error: "unknown scenario" });
  if (state.scenarioId) return res.status(409).json({ error: "scenario already chosen — reset to change" });
  state.scenarioId = id;
  state.posedAt = Date.now();
  res.json(publicState());
});

app.post("/api/roles", (req, res) => {
  const { assignments } = req.body ?? {};
  if (assignments && typeof assignments === "object") {
    for (const role of roles) {
      const name = assignments[role];
      if (typeof name === "string") state.roleAssignments[role] = name.trim();
    }
  }
  state.briefed = true;
  res.json(publicState());
});

app.post("/api/answer", (req, res) => {
  const node = currentNode();
  if (!node || state.epilogue) return res.status(409).json({ error: "no active node" });
  const { choice, freeText, decidedBy } = req.body ?? {};
  if (!node.options.some((o) => o.id === choice)) return res.status(400).json({ error: "unknown choice" });
  if (!freeText?.trim() || !decidedBy?.trim()) {
    return res.status(400).json({ error: "freeText and decidedBy are required" });
  }
  const r = record(node.id);
  const answer = { choice, freeText: freeText.trim(), decidedBy: decidedBy.trim(), at: Date.now() };
  if (state.phase === "posed") {
    r.firstAnswer = answer;
    r.timings.firstAnswerAt = answer.at;
    state.phase = "challenge";
  } else if (state.phase === "revise") {
    r.revisedAnswer = answer;
    state.phase = "score";
  } else {
    return res.status(409).json({ error: `cannot answer in phase ${state.phase}` });
  }
  res.json(publicState());
});

app.post("/api/npc", async (_req, res) => {
  const scenario = currentScenario();
  const node = currentNode();
  if (!node || state.epilogue || state.phase !== "challenge") {
    return res.status(409).json({ error: `cannot run NPC in phase ${state.phase}` });
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const r = record(node.id);
  const answer = r.firstAnswer;
  const option = node.options.find((o) => o.id === answer.choice);
  const pathSummary = scenario.nodes
    .slice(0, state.nodeIndex)
    .map((n) => {
      const pr = state.records[n.id];
      if (!pr || pr.skipped) return `${n.type}: skipped`;
      const a = finalAnswer(pr);
      return `${n.type}: chose "${n.options.find((o) => o.id === a.choice)?.label}" — "${a.freeText}" (decided by: ${a.decidedBy}; scored ${pr.score})`;
    })
    .join("\n");

  for (const elderId of node.elders) {
    const elder = elders[elderId];
    const priorTurns = (state.elderTurns[elderId] ?? []).filter((t) => t.live);
    send({ type: "elder-start", elder: { id: elder.id, name: elder.name, seat: elder.seat } });
    try {
      const text = await streamElderTurn({
        elder,
        scenario,
        node,
        option,
        answer,
        pathSummary,
        priorTurns,
        onDelta: (t) => send({ type: "delta", text: t }),
      });
      (state.elderTurns[elderId] ??= []).push({ nodeId: node.id, text, live: true, at: Date.now() });
      send({ type: "elder-done" });
    } catch (err) {
      console.error(`${elder.name} turn failed:`, err?.message ?? err);
      (state.elderTurns[elderId] ??= []).push({
        nodeId: node.id,
        text: `(${elder.name} could not be reached.)`,
        live: false,
        at: Date.now(),
      });
      send({ type: "elder-unavailable", message: `${elder.name} is unavailable — continue.` });
    }
  }
  state.phase = "revise";
  send({ type: "done" });
  res.end();
});

app.post("/api/hold", (_req, res) => {
  if (state.epilogue || state.phase !== "revise") {
    return res.status(409).json({ error: `cannot hold in phase ${state.phase}` });
  }
  record(currentNode().id).held = true;
  state.phase = "score";
  res.json(publicState());
});

app.post("/api/lock", (req, res) => {
  const scenario = currentScenario();
  const node = currentNode();
  if (!node || state.epilogue || state.phase !== "score") {
    return res.status(409).json({ error: `cannot lock in phase ${state.phase}` });
  }
  const { score } = req.body ?? {};
  if (!["specific", "generic", "absent"].includes(score)) {
    return res.status(400).json({ error: "score must be specific | generic | absent" });
  }
  const r = record(node.id);
  r.score = score;
  r.timings.lockedAt = Date.now();
  const choice = finalAnswer(r).choice;
  const deltas = node.meterDeltas[choice];
  for (const k of Object.keys(deltas)) state.meter[k] += deltas[k];
  r.consequence = node.consequences[choice];
  // Villager beat: one short first-person line after this decision locks (PRD §7.2).
  r.villager = scenario.villagers?.[node.id] ?? null;
  state.phase = "consequence";
  res.json(publicState());
});

app.post("/api/skip", (_req, res) => {
  const node = currentNode();
  if (!node || state.epilogue || state.phase === "consequence") {
    return res.status(409).json({ error: "cannot skip now" });
  }
  const r = record(node.id);
  r.skipped = true;
  r.timings.lockedAt = Date.now();
  advance();
  res.json(publicState());
});

app.post("/api/advance", (_req, res) => {
  if (state.epilogue || state.phase !== "consequence") {
    return res.status(409).json({ error: `cannot advance in phase ${state.phase}` });
  }
  advance();
  res.json(publicState());
});

function advance() {
  const scenario = currentScenario();
  if (state.nodeIndex + 1 < scenario.nodes.length) {
    state.nodeIndex += 1;
    state.phase = "posed";
    state.posedAt = Date.now();
    record(currentNode().id).timings.posedAt = state.posedAt;
  } else {
    state.epilogue = {
      parts: buildEpilogue(scenario, state.records),
      meter: { ...state.meter },
      finishedAt: Date.now(),
      minutes: Math.round((Date.now() - state.startedAt) / 60000),
    };
  }
}

app.post("/api/reset", (_req, res) => {
  state = freshState();
  res.json(publicState());
});

app.get("/api/export", (_req, res) => {
  res.json({
    exportedAt: new Date().toISOString(),
    scenario: state.scenarioId,
    roleAssignments: state.roleAssignments,
    records: state.records,
    elderTurns: state.elderTurns,
    meter: state.meter,
    epilogue: state.epilogue,
    startedAt: state.startedAt,
  });
});

// ---------- printables (PRD Phase 2: worksheets + role cards) ----------

app.get("/print", (_req, res) => res.type("html").send(printIndexPage(scenarios)));
app.get("/print/worksheet/:sid", (req, res) => {
  const s = scenarios[req.params.sid];
  if (!s) return res.status(404).send("unknown scenario");
  res.type("html").send(worksheetPage(s));
});
app.get("/print/rolecards/:sid", (req, res) => {
  const s = scenarios[req.params.sid];
  if (!s) return res.status(404).send("unknown scenario");
  res.type("html").send(roleCardsPage(s, roles));
});

// ---------- static client (production build) ----------

const dist = path.join(here, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api\/|print).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const port = Number(process.env.PORT) || 4600;
app.listen(port, () => {
  console.log(`Tabletop server on http://localhost:${port}`);
  console.log(
    process.env.ANTHROPIC_API_KEY
      ? "Anthropic key: present"
      : "Anthropic key: MISSING — Elder turns will fall back to the unavailable message",
  );
});
