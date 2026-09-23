// Tabletop server — Phase 0 vertical slice.
// One room, one node, in-memory state. Postgres and multi-room arrive in Phase 3.
import "dotenv/config";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { scenario, node, meterStart } from "./content.js";
import { streamStewardTurn } from "./npc.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ---------- state ----------

function freshState() {
  return {
    phase: "posed", // posed -> challenge -> revise -> score -> locked
    firstAnswer: null, // { choice, freeText, decidedBy, at }
    revisedAnswer: null, // same shape; null until revised (hold keeps it null)
    held: false,
    score: null, // specific | generic | absent
    meter: { ...meterStart },
    consequence: null,
    npcTurns: [], // [{ text, live, at }] — Steward memory within the room
    timings: { posedAt: Date.now(), firstAnswerAt: null, lockedAt: null },
  };
}

let state = freshState();

function finalAnswer() {
  return state.revisedAnswer ?? state.firstAnswer;
}

function publicState() {
  return { scenario, node, state };
}

// ---------- api ----------

app.get("/api/state", (_req, res) => res.json(publicState()));

app.post("/api/answer", (req, res) => {
  const { choice, freeText, decidedBy } = req.body ?? {};
  if (!node.options.some((o) => o.id === choice)) {
    return res.status(400).json({ error: "unknown choice" });
  }
  if (!freeText?.trim() || !decidedBy?.trim()) {
    return res.status(400).json({ error: "freeText and decidedBy are required" });
  }
  const answer = { choice, freeText: freeText.trim(), decidedBy: decidedBy.trim(), at: Date.now() };
  if (state.phase === "posed") {
    state.firstAnswer = answer;
    state.timings.firstAnswerAt = answer.at;
    state.phase = "challenge";
  } else if (state.phase === "revise") {
    state.revisedAnswer = answer;
    state.phase = "score";
  } else {
    return res.status(409).json({ error: `cannot answer in phase ${state.phase}` });
  }
  res.json(publicState());
});

// Streams the Steward's in-character challenge as SSE.
// On any failure the room gets a plain unavailable message and moves on (PRD §4).
app.post("/api/npc", async (req, res) => {
  if (state.phase !== "challenge") {
    return res.status(409).json({ error: `cannot run NPC in phase ${state.phase}` });
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const answer = state.firstAnswer;
  const option = node.options.find((o) => o.id === answer.choice);
  try {
    const text = await streamStewardTurn({
      scenario,
      node,
      option,
      answer,
      priorTurns: state.npcTurns,
      onDelta: (t) => send({ type: "delta", text: t }),
    });
    state.npcTurns.push({ text, live: true, at: Date.now() });
    state.phase = "revise";
    send({ type: "done" });
  } catch (err) {
    console.error("NPC turn failed:", err?.message ?? err);
    state.npcTurns.push({
      text: "(The Steward could not be reached.)",
      live: false,
      at: Date.now(),
    });
    state.phase = "revise";
    send({
      type: "unavailable",
      message: "The Steward is unavailable — continue.",
    });
  }
  res.end();
});

app.post("/api/hold", (_req, res) => {
  if (state.phase !== "revise") {
    return res.status(409).json({ error: `cannot hold in phase ${state.phase}` });
  }
  state.held = true;
  state.phase = "score";
  res.json(publicState());
});

app.post("/api/lock", (req, res) => {
  const { score } = req.body ?? {};
  if (state.phase !== "score") {
    return res.status(409).json({ error: `cannot lock in phase ${state.phase}` });
  }
  if (!["specific", "generic", "absent"].includes(score)) {
    return res.status(400).json({ error: "score must be specific | generic | absent" });
  }
  state.score = score;
  const answer = finalAnswer();
  const deltas = node.meterDeltas[answer.choice];
  for (const k of Object.keys(deltas)) state.meter[k] += deltas[k];
  const variants = node.consequences[answer.choice];
  state.consequence =
    (score === "specific" ? variants.specific : null) ?? variants.generic;
  state.phase = "locked";
  state.timings.lockedAt = Date.now();
  res.json(publicState());
});

app.post("/api/reset", (_req, res) => {
  state = freshState();
  res.json(publicState());
});

app.get("/api/export", (_req, res) => {
  res.json({
    exportedAt: new Date().toISOString(),
    scenario: scenario.id,
    node: node.id,
    firstAnswer: state.firstAnswer,
    revisedAnswer: state.revisedAnswer,
    held: state.held,
    score: state.score,
    meter: state.meter,
    npcTurns: state.npcTurns,
    timings: state.timings,
  });
});

// ---------- static client (production build) ----------

const dist = path.join(here, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const port = Number(process.env.PORT) || 4600;
app.listen(port, () => {
  console.log(`Tabletop server on http://localhost:${port}`);
  console.log(
    process.env.ANTHROPIC_API_KEY
      ? "Anthropic key: present"
      : "Anthropic key: MISSING — NPC turns will fall back to the unavailable message",
  );
});
