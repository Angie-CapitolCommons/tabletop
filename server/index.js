// Tabletop server — Phase 3: four rooms behind pre-defined facilitator codes,
// admin dashboard with live consolidation, exports, full game reset, and
// Postgres persistence. Access is deliberately simple: the app's short life
// is the security model (PRD §4).
import "dotenv/config";
import express from "express";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import {
  CONTENT_VERSION,
  scenarios,
  elders,
  elderFiresOn,
  roles,
  SECTION_LABELS,
  decidedByPrompt,
  buildConsequence,
  buildEpilogue,
  meterStart,
} from "./content/index.js";
import { streamElderTurn, assessAnswer, generateThemes } from "./npc.js";
import { scrubNames, scrubDecidedBy } from "./privacy.js";
import { buildThemesBundle } from "./themes.js";
import { worksheetPage, roleCardsPage, printIndexPage } from "./print.js";
import { initStore, saveRooms } from "./store.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ---------- codes (pre-defined; override via env) ----------

const ROOM_CODES = (process.env.ROOM_CODES || "")
  .split(",")
  .map((c) => c.trim().toUpperCase());
const ADMIN_CODE = (process.env.ADMIN_CODE || "").trim().toUpperCase();
const ROOM_NUMBERS = [1, 2, 3, 4];
if (ROOM_CODES.length !== 4 || ROOM_CODES.some((code) => !code) ||
    new Set([...ROOM_CODES, ADMIN_CODE]).size !== 5 || !ADMIN_CODE) {
  throw new Error("Configure four distinct ROOM_CODES and a separate ADMIN_CODE");
}

// ---------- state ----------

function freshRoom() {
  return {
    contentVersion: CONTENT_VERSION,
    scenarioId: null,
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

let rooms = Object.fromEntries(ROOM_NUMBERS.map((n) => [n, freshRoom()]));
// Admin themes run (see /api/admin/themes); in memory only.
let themes = { status: "idle" };

const restored = await initStore();
if (restored) for (const n of ROOM_NUMBERS) if (restored[n]) rooms[n] = restored[n];
// Successful mutations are persisted before responding by the middleware below.
const persist = () => {};

let mutationTail = Promise.resolve();
const npcInFlight = new Set();
app.use("/api", async (req, res, next) => {
  if (req.method !== "POST") {
    await mutationTail;
    return next();
  }
  if (req.path === "/npc") return next();
  let release;
  const turn = new Promise((resolve) => { release = resolve; });
  const previous = mutationTail;
  mutationTail = previous.then(() => turn);
  await previous;
  const before = structuredClone(rooms);
  let finished = false;
  const finish = () => { if (!finished) { finished = true; release(); } };
  res.once("close", finish);
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400) {
      finish();
      return originalJson(body);
    }
    saveRooms(rooms).then(() => {
      originalJson(body);
      finish();
    }).catch((error) => {
      rooms = before;
      console.error("Room write failed:", error);
      res.status(503);
      originalJson({ error: "Room was not saved. Please retry." });
      finish();
    });
    return res;
  };
  next();
});

const currentScenario = (room) => (room.scenarioId ? scenarios[room.scenarioId] : null);
const currentNode = (room) => currentScenario(room)?.nodes[room.nodeIndex];
const getRecord = (room, nodeId) =>
  (room.records[nodeId] ??= {
    firstAnswer: null,
    revisedAnswer: null,
    held: false,
    skipped: false,
    score: null,
    consequence: null,
    villager: null,
    discussion: [], // live-transcribed fragments, text only (PRD §8) — never sent to the model
    timings: { posedAt: room.posedAt, firstAnswerAt: null, lockedAt: null },
  });
const finalAnswer = (r) => r.revisedAnswer ?? r.firstAnswer;

// The section's discussion transcript, assembled from the live fragments when
// the decision locks: one artifact per section (Purpose, Tier, …), split into
// the talk before the answer and the talk after the Elders' challenge. Text
// only; it goes to the record, the admin view and the export.
function transcriptArtifact(node, r) {
  const frags = r.discussion ?? [];
  if (!frags.length) return null;
  const join = (list) => list.map((f) => f.text).join(" ");
  const beforeAnswer = join(frags.filter((f) => f.phase === "posed"));
  const afterChallenge = join(frags.filter((f) => f.phase !== "posed"));
  return {
    section: SECTION_LABELS[node.type],
    title: node.title,
    beforeAnswer,
    afterChallenge,
    fragments: frags.length,
    words: `${beforeAnswer} ${afterChallenge}`.split(/\s+/).filter(Boolean).length,
    createdAt: Date.now(),
  };
}

const scenarioClaims = () => {
  const claims = {};
  for (const n of ROOM_NUMBERS) if (rooms[n].scenarioId) claims[rooms[n].scenarioId] = n;
  return claims;
};

function roomProgress(room, scenario) {
  return scenario.nodes.map((n, i) => {
    const r = room.records[n.id];
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      status: room.epilogue
        ? r?.skipped
          ? "skipped"
          : "done"
        : i < room.nodeIndex
          ? r?.skipped
            ? "skipped"
            : "done"
          : i === room.nodeIndex
            ? "current"
            : "upcoming",
      score: r?.score ?? null,
    };
  });
}

function roomRecords(room, scenario) {
  return Object.fromEntries(
    Object.entries(room.records).map(([id, r]) => {
      const a = finalAnswer(r);
      const n = scenario?.nodes.find((x) => x.id === id);
      return [
        id,
        {
          score: r.score,
          skipped: r.skipped,
          answer: a && n ? { ...a, short: n.options.find((o) => o.id === a.choice)?.short } : null,
          transcript: r.transcript ? { section: r.transcript.section, words: r.transcript.words } : null,
        },
      ];
    }),
  );
}

function publicState(room, roomNumber) {
  const scenario = currentScenario(room);
  const node = scenario && !room.epilogue ? currentNode(room) : null;
  const claims = scenarioClaims();
  return {
    roomNumber,
    scenarios: Object.values(scenarios).map((s) => ({
      id: s.id,
      title: s.title,
      entersAt: s.entersAt,
      tagline: s.tagline,
      nodeCount: s.nodes.length,
      claimedBy: claims[s.id] ?? null,
    })),
    scenario: scenario
      ? { id: scenario.id, title: scenario.title, entersAt: scenario.entersAt, opening: scenario.opening, evidence: scenario.evidence }
      : null,
    decidedByPrompt,
    roles,
    roleAssignments: room.roleAssignments,
    progress: scenario ? roomProgress(room, scenario) : [],
    records: roomRecords(room, scenario),
    node: node
      ? {
          id: node.id,
          type: node.type,
          title: node.title,
          question: node.question,
          freeTextPrompt: node.freeTextPrompt,
          options: node.options,
          elders: node.elders.map((id) => ({ id, name: elders[id].name, seat: elders[id].seat })),
          inject: node.inject(room.records),
          index: room.nodeIndex,
          count: scenario.nodes.length,
        }
      : null,
    state: {
      phase: !room.scenarioId ? "select" : room.epilogue ? "epilogue" : room.phase,
      briefed: room.briefed,
      record: node ? room.records[node.id] ?? null : null,
      meter: room.meter,
      epilogue: room.epilogue,
      startedAt: room.startedAt,
    },
  };
}

// ---------- auth ----------

const failedAttempts = new Map();
function guardedCode(req, header, valid) {
  const ip = req.ip || "unknown";
  const now = Date.now();
  let record = failedAttempts.get(ip);
  if (!record || now >= record.until) record = { count: 0, until: now + 60_000 };
  if (record.count >= 10) return { limited: true };
  const input = Buffer.from((req.get(header) || "").trim().toUpperCase());
  const match = valid.findIndex((code) => {
    const bytes = Buffer.from(code);
    return input.length === bytes.length && crypto.timingSafeEqual(input, bytes);
  });
  if (match < 0) {
    record.count++;
    failedAttempts.set(ip, record);
  } else failedAttempts.delete(ip);
  return { match };
}
function roomAuth(req, res, next) {
  const { match: idx, limited } = guardedCode(req, "x-room-code", ROOM_CODES);
  if (limited) return res.status(429).json({ error: "too many invalid code attempts" });
  if (idx === -1) return res.status(401).json({ error: "invalid room code" });
  req.roomNumber = ROOM_NUMBERS[idx];
  req.room = rooms[req.roomNumber];
  next();
}

function adminAuth(req, res, next) {
  const { match, limited } = guardedCode(req, "x-admin-code", [ADMIN_CODE]);
  if (limited) return res.status(429).json({ error: "too many invalid code attempts" });
  if (match !== 0) return res.status(401).json({ error: "invalid admin code" });
  next();
}

// ---------- room api ----------

// Deploy fingerprint: which code is actually running, and can the Elders
// speak. No auth — nothing sensitive, and it exists precisely for the
// "is the deployed app the repo?" question.
let gitSha = "unknown";
try {
  gitSha = here.includes("/canonical/tabletop/")
    ? "d7c2e48+workspace"
    : execSync("git rev-parse --short HEAD", { cwd: here }).toString().trim();
} catch {}
const SERVER_STARTED_AT = new Date().toISOString();

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    commit: process.env.TABLETOP_SOURCE_REVISION || gitSha,
    source: "github-main",
    model: process.env.MODEL || "claude-opus-5",
    anthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
    storage: "postgres",
    startedAt: SERVER_STARTED_AT,
  });
});

app.get("/api/state", roomAuth, (req, res) => res.json(publicState(req.room, req.roomNumber)));

app.get("/api/elders", (_req, res) =>
  res.json(
    Object.values(elders).map((e) => ({ id: e.id, name: e.name, seat: e.seat, firesOn: elderFiresOn[e.id] })),
  ),
);

// The group chooses its case; once chosen it is unavailable to the other
// rooms (PRD §5.1). The admin dashboard shows who has claimed what.
app.post("/api/scenario", roomAuth, (req, res) => {
  const { id } = req.body ?? {};
  if (!scenarios[id]) return res.status(400).json({ error: "unknown scenario" });
  if (req.room.scenarioId) return res.status(409).json({ error: "scenario already chosen — reset to change" });
  const claimedBy = scenarioClaims()[id];
  if (claimedBy) return res.status(409).json({ error: `already claimed by Room ${claimedBy}` });
  req.room.scenarioId = id;
  req.room.posedAt = Date.now();
  persist();
  res.json(publicState(req.room, req.roomNumber));
});

// Role assignments (first names only). Editable at the briefing AND any time
// after from The Table drawer — people swap roles and arrive late. `start`
// marks the briefing complete; edits alone never skip the briefing.
app.post("/api/roles", roomAuth, (req, res) => {
  const { assignments, start } = req.body ?? {};
  if (assignments && typeof assignments === "object") {
    for (const role of roles) {
      const name = assignments[role];
      if (typeof name === "string") req.room.roleAssignments[role] = name.trim();
    }
  }
  if (start === true) req.room.briefed = true;
  persist();
  res.json(publicState(req.room, req.roomNumber));
});

app.post("/api/answer", roomAuth, (req, res) => {
  const room = req.room;
  const node = currentNode(room);
  if (!node || room.epilogue) return res.status(409).json({ error: "no active node" });
  const { choice, freeText, decidedBy } = req.body ?? {};
  if (!node.options.some((o) => o.id === choice)) return res.status(400).json({ error: "unknown choice" });
  if (!freeText?.trim() || !decidedBy?.trim()) {
    return res.status(400).json({ error: "freeText and decidedBy are required" });
  }
  const r = getRecord(room, node.id);
  const answer = { choice, freeText: freeText.trim(), decidedBy: decidedBy.trim(), at: Date.now() };
  if (room.phase === "posed") {
    r.firstAnswer = answer;
    r.timings.firstAnswerAt = answer.at;
    room.phase = "challenge";
  } else if (room.phase === "revise") {
    // A revised answer goes back to the Elders, who respond to what changed.
    r.previousAnswer = finalAnswer(r);
    r.revisedAnswer = answer;
    room.phase = "challenge";
  } else {
    return res.status(409).json({ error: `cannot answer in phase ${room.phase}` });
  }
  persist();
  res.json(publicState(room, req.roomNumber));
});

app.post("/api/npc", roomAuth, async (req, res) => {
  const room = req.room;
  const scenario = currentScenario(room);
  const node = currentNode(room);
  if (!node || room.epilogue || room.phase !== "challenge") {
    return res.status(409).json({ error: `cannot run NPC in phase ${room.phase}` });
  }
  if (npcInFlight.has(req.roomNumber)) return res.status(409).json({ error: "Elders are already speaking" });
  npcInFlight.add(req.roomNumber);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const r = getRecord(room, node.id);
  // Model-safe copies: roster first names become roles before anything is
  // sent (PRD §4). The record itself keeps what the room wrote.
  const safe = (a) =>
    a && {
      ...a,
      freeText: scrubNames(a.freeText, room.roleAssignments),
      decidedBy: scrubDecidedBy(a.decidedBy, room.roleAssignments),
    };
  const answer = finalAnswer(r);
  const safeAnswer = safe(answer);
  const option = node.options.find((o) => o.id === answer.choice);
  // On a revision, the Elders see the answer they last responded to.
  const previous = r.revisedAnswer ? safe(r.previousAnswer) : null;
  const previousOption = previous ? node.options.find((o) => o.id === previous.choice) : null;
  const pathSummary = scenario.nodes
    .slice(0, room.nodeIndex)
    .map((n) => {
      const pr = room.records[n.id];
      if (!pr || pr.skipped) return `${n.type}: skipped`;
      const a = safe(finalAnswer(pr));
      return `${n.type}: chose "${n.options.find((o) => o.id === a.choice)?.label}" — "${a.freeText}" (decided by: ${a.decidedBy}; scored ${pr.score})`;
    })
    .join("\n");

  const completed = [];
  try {
  for (const elderId of node.elders) {
    const elder = elders[elderId];
    const priorTurns = (room.elderTurns[elderId] ?? []).filter((t) => t.live);
    send({ type: "elder-start", elder: { id: elder.id, name: elder.name, seat: elder.seat } });
    try {
      const text = await streamElderTurn({
        elder,
        scenario,
        node,
        option,
        answer: safeAnswer,
        previous,
        previousOption,
        pathSummary,
        priorTurns,
        onDelta: (t) => send({ type: "delta", text: t }),
      });
      completed.push({ elderId, turn: { nodeId: node.id, text, live: true, at: Date.now() } });
      send({ type: "elder-done" });
    } catch (err) {
      console.error(`${elder.name} turn failed:`, err?.message ?? err);
      throw new Error(`${elder.name} could not be reached. Retry the Elder challenge or hold the answer.`);
    }
  }
  // With the Elders' comments in hand: does this answer put work on
  // clinicians that belongs elsewhere (goodwill), or add process beyond the
  // chosen option (time to first value)? Applied when it locks.
  const assessment = await assessAnswer({
    scenario,
    node,
    option,
    answer: safeAnswer,
    elderTexts: completed.map(({ turn }) => turn.text),
  });
  if (rooms[req.roomNumber] !== room || room.phase !== "challenge" || currentNode(room)?.id !== node.id)
    throw new Error("The room changed while the Elders were speaking. Refresh and retry.");
  const nextRoom = structuredClone(room);
  for (const { elderId, turn } of completed) (nextRoom.elderTurns[elderId] ??= []).push(turn);
  nextRoom.records[node.id].assessment = assessment ? { ...assessment, answerAt: answer.at } : null;
  nextRoom.phase = "revise";
  await saveRooms({ [req.roomNumber]: nextRoom });
  rooms[req.roomNumber] = nextRoom;
  send({ type: "done" });
  } catch (error) {
    console.error("Elder challenge failed:", error);
    send({ type: "error", message: error.message || "Elder challenge failed. Retry or hold the answer." });
  } finally {
    npcInFlight.delete(req.roomNumber);
  }
  res.end();
});

// Live discussion transcription (facilitator-controlled, PRD §8): text
// fragments only. No audio is stored by the app, no voices are attributed,
// and the transcript is never included in any model prompt.
app.post("/api/discussion", roomAuth, (req, res) => {
  const room = req.room;
  const text = (req.body?.text ?? "").trim();
  if (!text) return res.status(400).json({ error: "text required" });
  // After the 12-month report: the debrief discussion, tagged with the
  // decision the room was looking at.
  if (room.epilogue) {
    const focus = currentScenario(room)?.nodes.some((n) => n.id === req.body?.focus) ? req.body.focus : null;
    (room.epilogue.discussion ??= []).push({ text: text.slice(0, 2000), at: Date.now(), phase: "debrief", focus });
    persist();
    return res.json({ ok: true });
  }
  const node = currentNode(room);
  if (!node) return res.status(409).json({ error: "no active node" });
  if (!["posed", "challenge", "revise", "score"].includes(room.phase)) {
    return res.status(409).json({ error: `cannot transcribe in phase ${room.phase}` });
  }
  // Fragments attach to the current node, tagged with the beat they came from
  // (posed = pre-answer discussion, revise = after the Elder challenge).
  getRecord(room, node.id).discussion.push({ text: text.slice(0, 2000), at: Date.now(), phase: room.phase });
  persist();
  res.json({ ok: true });
});

// Hold is also the escape valve if the Elder beat never completed
// (challenge phase): the first answer locks as written and play continues.
app.post("/api/hold", roomAuth, (req, res) => {
  const room = req.room;
  if (room.epilogue || !["revise", "challenge"].includes(room.phase)) {
    return res.status(409).json({ error: `cannot hold in phase ${room.phase}` });
  }
  getRecord(room, currentNode(room).id).held = true;
  room.phase = "score";
  persist();
  res.json(publicState(room, req.roomNumber));
});

// Back from scoring: reopen the room's answer for editing before it locks.
// The edit is recorded as the revised answer, so both stay on the record.
app.post("/api/reopen", roomAuth, (req, res) => {
  const room = req.room;
  const node = currentNode(room);
  if (!node || room.epilogue || room.phase !== "score") {
    return res.status(409).json({ error: "The answer can only be reopened before it's scored." });
  }
  getRecord(room, node.id).held = false;
  room.phase = "revise";
  persist();
  res.json(publicState(room, req.roomNumber));
});

// Undo the most recent lock, while its consequence is still on screen:
// the meters roll back and the decision returns to scoring.
app.post("/api/unlock", roomAuth, (req, res) => {
  const room = req.room;
  const node = currentNode(room);
  if (!node || room.epilogue || room.phase !== "consequence") {
    return res.status(409).json({ error: "Only the score just stamped can be undone." });
  }
  const r = getRecord(room, node.id);
  const deltas = node.meterDeltas[finalAnswer(r).choice];
  for (const k of Object.keys(deltas)) room.meter[k] -= deltas[k];
  for (const k of ["goodwill", "time"]) room.meter[k] -= r.adjustment?.[k] ?? 0;
  r.adjustment = null;
  r.score = null;
  r.consequence = null;
  r.villager = null;
  r.timings.lockedAt = null;
  room.phase = "score";
  persist();
  res.json(publicState(room, req.roomNumber));
});

app.post("/api/lock", roomAuth, (req, res) => {
  const room = req.room;
  const scenario = currentScenario(room);
  const node = currentNode(room);
  if (!node || room.epilogue || room.phase !== "score") {
    return res.status(409).json({ error: `cannot lock in phase ${room.phase}` });
  }
  const { score } = req.body ?? {};
  if (!["specific", "generic", "absent"].includes(score)) {
    return res.status(400).json({ error: "score must be specific | generic | absent" });
  }
  const r = getRecord(room, node.id);
  r.score = score;
  r.timings.lockedAt = Date.now();
  const choice = finalAnswer(r).choice;
  const deltas = node.meterDeltas[choice];
  for (const k of Object.keys(deltas)) room.meter[k] += deltas[k];
  // Beyond the option's own cost: work pushed onto clinicians costs goodwill,
  // and process the written answer adds (meetings, approvals, reviews) costs
  // time. Only if the assessment was of this exact answer.
  const a = r.assessment?.answerAt === finalAnswer(r).at ? r.assessment : null;
  const goodwill = { some: -1, heavy: -2 }[a?.clinicianBurden] ?? 0;
  const time = { some: +1, heavy: +2 }[a?.addedProcess] ?? 0;
  r.adjustment =
    goodwill || time ? { goodwill, note: goodwill ? a.note : "", time, timeNote: time ? a.processNote : "" } : null;
  for (const k of ["goodwill", "time"]) room.meter[k] += r.adjustment?.[k] ?? 0;
  r.consequence = buildConsequence(node, choice, score);
  r.villager = scenario.villagers?.[node.id] ?? null;
  r.transcript = transcriptArtifact(node, r);
  room.phase = "consequence";
  persist();
  res.json(publicState(room, req.roomNumber));
});

app.post("/api/skip", roomAuth, (req, res) => {
  const room = req.room;
  const node = currentNode(room);
  if (!node || room.epilogue || room.phase === "consequence") {
    return res.status(409).json({ error: "cannot skip now" });
  }
  const r = getRecord(room, node.id);
  r.skipped = true;
  r.timings.lockedAt = Date.now();
  r.transcript = transcriptArtifact(node, r);
  advance(room);
  persist();
  res.json(publicState(room, req.roomNumber));
});

app.post("/api/advance", roomAuth, (req, res) => {
  const room = req.room;
  if (room.epilogue || room.phase !== "consequence") {
    return res.status(409).json({ error: `cannot advance in phase ${room.phase}` });
  }
  advance(room);
  persist();
  res.json(publicState(room, req.roomNumber));
});

function advance(room) {
  const scenario = currentScenario(room);
  if (room.nodeIndex + 1 < scenario.nodes.length) {
    room.nodeIndex += 1;
    room.phase = "posed";
    room.posedAt = Date.now();
    getRecord(room, currentNode(room).id).timings.posedAt = room.posedAt;
  } else {
    room.epilogue = {
      // Each entry also carries what the Elders last said at that decision,
      // for the debrief ("how could it have gone differently?").
      parts: buildEpilogue(scenario, room.records).map((p) => ({
        ...p,
        elders: Object.entries(room.elderTurns)
          .map(([id, turns]) => [id, turns.filter((t) => t.nodeId === p.nodeId && t.live).at(-1)])
          .filter(([, turn]) => turn)
          .map(([id, turn]) => ({ name: elders[id].name, text: turn.text })),
      })),
      meter: { ...room.meter },
      finishedAt: Date.now(),
      minutes: Math.round((Date.now() - room.startedAt) / 60000),
      discussion: [], // debrief transcript, text only — never sent to the model
    };
  }
}

// Facilitator reset: this room only (rehearsal convenience).
app.post("/api/reset", roomAuth, (req, res) => {
  rooms[req.roomNumber] = freshRoom();
  persist();
  res.json(publicState(rooms[req.roomNumber], req.roomNumber));
});

app.get("/api/export", roomAuth, (req, res) => {
  res.json(exportRoom(req.room, req.roomNumber));
});

function exportRoom(room, roomNumber) {
  return {
    exportedAt: new Date().toISOString(),
    roomNumber,
    scenario: room.scenarioId,
    roleAssignments: room.roleAssignments,
    records: room.records,
    elderTurns: room.elderTurns,
    meter: room.meter,
    epilogue: room.epilogue,
    startedAt: room.startedAt,
  };
}

// ---------- admin api (lead facilitator) ----------

// All nine node types, in lifecycle order, for the consolidation matrix.
const TYPE_ORDER = ["purpose", "tier", "risk_accept", "decide", "proof", "funding", "retier", "stop", "represent"];

app.get("/api/admin/overview", adminAuth, (_req, res) => {
  const claims = scenarioClaims();
  const roomSummaries = ROOM_NUMBERS.map((n) => {
    const room = rooms[n];
    const scenario = currentScenario(room);
    return {
      roomNumber: n,
      code: ROOM_CODES[n - 1],
      scenario: scenario ? { id: scenario.id, title: scenario.title, entersAt: scenario.entersAt } : null,
      phase: !room.scenarioId ? "select" : room.epilogue ? "epilogue" : room.phase,
      briefed: room.briefed,
      nodeIndex: room.nodeIndex,
      meter: room.meter,
      roleAssignments: room.roleAssignments,
      progress: scenario ? roomProgress(room, scenario) : [],
      records: scenario ? roomRecords(room, scenario) : {},
      currentNode: scenario && !room.epilogue ? { id: currentNode(room).id, type: currentNode(room).type, title: currentNode(room).title } : null,
      startedAt: room.startedAt,
      epilogue: room.epilogue
        ? { minutes: room.epilogue.minutes, debriefFragments: room.epilogue.discussion?.length ?? 0 }
        : null,
    };
  });

  // Class C, computed where computable (PRD §8): per node type across rooms.
  const matrix = TYPE_ORDER.map((type) => {
    const cells = roomSummaries.map((rs) => {
      const scenario = rooms[rs.roomNumber].scenarioId ? scenarios[rooms[rs.roomNumber].scenarioId] : null;
      const nodeInScenario = scenario?.nodes.find((x) => x.type === type) ?? null;
      if (!nodeInScenario) return { present: false };
      const rec = rs.records[nodeInScenario.id];
      return {
        present: true,
        nodeId: nodeInScenario.id,
        answered: !!rec?.answer && !!rec?.score,
        skipped: rec?.skipped ?? false,
        score: rec?.score ?? null,
        short: rec?.answer?.short ?? null,
        freeText: rec?.answer?.freeText ?? null,
        decidedBy: rec?.answer?.decidedBy ?? null,
        declined: rec?.answer?.choice === "decline",
        transcript: rec?.transcript ?? null,
      };
    });
    const presented = cells.filter((c) => c.present);
    const settled = presented.filter((c) => c.answered || c.skipped);
    const absentish = settled.filter((c) => c.skipped || c.declined || c.score === "absent");
    // Three rooms, or every room when only two scenarios present the measure,
    // so each of the nine can register orphan and alignment (PRD §8 Class C).
    const quorum = Math.min(3, presented.length);
    return {
      type,
      cells,
      orphan: presented.length >= 2 && absentish.length >= quorum,
      friction:
        settled.filter((c) => c.score).length >= 2 &&
        new Set(settled.filter((c) => c.score).map((c) => c.score)).size > 1,
      alignment:
        presented.length >= 2 && settled.filter((c) => c.score === "specific").length >= quorum,
    };
  });

  // Decider emergence across rooms (PRD §8 Class C).
  const deciders = roomSummaries.map((rs) => {
    const tally = {};
    for (const rec of Object.values(rs.records)) {
      if (rec.answer?.decidedBy) tally[rec.answer.decidedBy] = (tally[rec.answer.decidedBy] ?? 0) + 1;
    }
    return { roomNumber: rs.roomNumber, tally };
  });

  const started = ROOM_NUMBERS.filter((n) => rooms[n].scenarioId);
  const finished = started.filter((n) => rooms[n].epilogue);
  res.json({
    rooms: roomSummaries,
    matrix,
    deciders,
    claims,
    typeOrder: TYPE_ORDER,
    themes: { ...themes, readiness: { started, finished } },
  });
});

app.get("/api/admin/export", adminAuth, (_req, res) => {
  res.json({
    exportedAt: new Date().toISOString(),
    rooms: ROOM_NUMBERS.map((n) => exportRoom(rooms[n], n)),
    themes,
  });
});

// One section's discussion transcript, for the admin view and download.
app.get("/api/admin/transcript/:room/:node", adminAuth, (req, res) => {
  const room = rooms[Number(req.params.room)];
  const t = room?.records?.[req.params.node]?.transcript;
  if (!t) return res.status(404).json({ error: "no transcript for that section" });
  res.json({ roomNumber: Number(req.params.room), scenario: currentScenario(room)?.title ?? null, ...t });
});

// The debrief ("talk it through") transcript for one room.
app.get("/api/admin/debrief/:room", adminAuth, (req, res) => {
  const room = rooms[Number(req.params.room)];
  const scenario = room && currentScenario(room);
  const fragments = room?.epilogue?.discussion ?? [];
  if (!fragments.length) return res.status(404).json({ error: "no debrief transcript for that room" });
  res.json({
    roomNumber: Number(req.params.room),
    scenario: scenario?.title ?? null,
    fragments: fragments.map((f) => ({
      text: f.text,
      section: f.focus ? SECTION_LABELS[scenario?.nodes.find((n) => n.id === f.focus)?.type] ?? null : null,
    })),
  });
});

// Themes and next steps across every finished room, from Claude. Runs in the
// background (it can take a minute); the dashboard polls for the result.
// Everything sent is name-scrubbed; discussion transcripts are included only
// when the lead facilitator opts in (PRD §5.3 keeps them from the model by
// default). Held in memory: download the result to keep it.
app.post("/api/admin/themes", adminAuth, (req, res) => {
  if (themes.status === "running") return res.status(409).json({ error: "Themes are already being generated." });
  const started = ROOM_NUMBERS.filter((n) => rooms[n].scenarioId);
  const finished = started.filter((n) => rooms[n].epilogue);
  if (!finished.length) return res.status(409).json({ error: "No room has finished its scenario yet." });
  if (finished.length < started.length && req.body?.force !== true) {
    return res.status(409).json({ error: `${finished.length} of ${started.length} rooms have finished.` });
  }
  const includeTranscripts = req.body?.includeTranscripts === true;
  const bundle = buildThemesBundle(
    finished.map((n) => ({ roomNumber: n, room: rooms[n], scenario: currentScenario(rooms[n]) })),
    { includeTranscripts, sectionLabels: SECTION_LABELS, elders },
  );
  const job = { status: "running", startedAt: Date.now(), includeTranscripts, rooms: finished };
  themes = job;
  generateThemes(bundle)
    .then((result) => {
      if (themes === job) themes = { ...job, status: "done", finishedAt: Date.now(), result };
    })
    .catch((error) => {
      console.error("Themes generation failed:", error?.message ?? error);
      if (themes === job) themes = { ...job, status: "error", finishedAt: Date.now(), error: "Themes couldn't be generated. Try again." };
    });
  res.json({ themes });
});

// Full game reset: wipes all rooms back to pristine while keeping scenario
// content. Type-to-confirm; the client offers an export first (PRD §9).
app.post("/api/admin/reset", adminAuth, async (req, res) => {
  if (req.body?.confirm !== "RESET") {
    return res.status(400).json({ error: 'confirmation required: send { "confirm": "RESET" }' });
  }
  rooms = Object.fromEntries(ROOM_NUMBERS.map((n) => [n, freshRoom()]));
  themes = { status: "idle" };
  persist();
  res.json({ ok: true, resetAt: new Date().toISOString() });
});

// ---------- printables ----------

app.get("/api/print", (_req, res) => res.type("html").send(printIndexPage(scenarios)));
app.get("/api/print/worksheet/:sid", (req, res) => {
  const s = scenarios[req.params.sid];
  if (!s) return res.status(404).send("unknown scenario");
  res.type("html").send(worksheetPage(s));
});
app.get("/api/print/rolecards/:sid", (req, res) => {
  const s = scenarios[req.params.sid];
  if (!s) return res.status(404).send("unknown scenario");
  res.type("html").send(roleCardsPage(s, roles));
});

// ---------- static client ----------

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
