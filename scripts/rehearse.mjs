#!/usr/bin/env node
// Four-room rehearsal: plays every scenario in all four rooms at once against
// a running Tabletop (local or the published site), through the same API the
// room screens use, with real Claude calls. It checks every step, times the
// Elders and the chat, watches for rooms going backwards (a sign of more than
// one server instance), runs the admin themes, and writes a report.
//
// It also tests what keeps the app safe on Replit Autoscale: two rooms
// claiming one scenario at once, two Council rounds or chat questions at once
// on one room, a second themes run while one is going, transcript lines sent
// in bursts (every line must be saved), and the meter arithmetic of every
// locked decision, read back from the database.
//
//   node scripts/rehearse.mjs --url https://tabletop.example.com --reset
//
// Codes come from ROOM_CODES and ADMIN_CODE (the same variables the server
// uses), or --room-codes / --admin-code. Nothing is hard-coded.
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

// ---------- options ----------

const HELP = `Four-room rehearsal

  node scripts/rehearse.mjs --url <site> [options]

Options
  --url URL            The Tabletop site (or TABLETOP_URL). Default http://localhost:4600
  --room-codes A,B,C,D Room codes (default: ROOM_CODES)
  --admin-code CODE    Admin code (default: ADMIN_CODE)
  --reset              Full game reset first. Required if any room is already in use.
  --reset-after        Full game reset when done (after the report is saved).
  --rooms 1,2,3,4      Rooms to run (default all four)
  --seed N             Seed for the choices, to repeat a run (default: random, printed)
  --pace MS            Pause between a room's steps, to mimic people talking (default 0)
  --chat N             Questions to ask on each 12-month report (default 2)
  --no-themes          Skip the admin themes run
  --transcripts        Include discussion transcripts in the themes run
  --no-races           Skip the at-the-same-moment checks (claims, Council, chat, themes)
  --out DIR            Report folder (default ./rehearsal-<time>)
  --help               This help`;

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
if (flag("help")) {
  console.log(HELP);
  process.exit(0);
}

const BASE = (opt("url", process.env.TABLETOP_URL) || "http://localhost:4600").replace(/\/$/, "");
const ROOM_CODES = (opt("room-codes", process.env.ROOM_CODES) || "").split(",").map((c) => c.trim().toUpperCase());
const ADMIN_CODE = (opt("admin-code", process.env.ADMIN_CODE) || "").trim().toUpperCase();
const ROOMS = opt("rooms", "1,2,3,4").split(",").map(Number);
const SEED = Number(opt("seed", Math.floor(Math.random() * 1e9)));
const PACE = Number(opt("pace", 0));
const CHAT = Number(opt("chat", 2));
const THEMES = !flag("no-themes");
const RACES = !flag("no-races");
const OUT = opt("out", `rehearsal-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}`);

if (ROOM_CODES.length !== 4 || ROOM_CODES.some((c) => !c) || !ADMIN_CODE) {
  console.error("Set ROOM_CODES (four, comma-separated) and ADMIN_CODE, or pass --room-codes and --admin-code.\n");
  console.error(HELP);
  process.exit(2);
}

// ---------- seeded choices ----------

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];

const NAMES = [
  ["Avery", "Jordan", "Riley", "Casey", "Morgan"],
  ["Quinn", "Harper", "Rowan", "Emerson", "Sage"],
  ["Parker", "Reese", "Skyler", "Dakota", "Finley"],
  ["Hayden", "Kendall", "Logan", "Peyton", "Remy"],
];
const WHEN = ["By Friday", "Within 30 days", "Before go-live", "By the end of next month"];
const ACTS = ["signs off in writing", "reports back to this group", "decides and tells the other sponsors", "sets the target and checks it"];
const TRIGGERS = ["overrides pass 20% in a week", "a second miss is reported", "the target isn't met by day 90", "the vendor pushes a new version"];
const THEN = ["it stops until reviewed", "it goes back for review", "it's switched off the same day", "the decision comes back to this group"];
const VAGUE = ["The committee will look at it.", "IT will review this.", "The department decides later.", "Leadership should weigh in on this."];
const TALK = [
  "I don't think a committee can own this. Somebody has to sign.",
  "{name} made the point last time: who actually gets the call when it breaks?",
  "We keep saying the Workgroup, but they only look at risk.",
  "What's the number that tells us it's working?",
  "If we push this onto the clinics, the nurses will just stop using it.",
  "{name}, would your team pick this up, or is that wishful thinking?",
  "Information Security and the Workgroup both think this is theirs.",
  "I'd rather say no today than say yes with nobody on the hook.",
];
const QUESTIONS = [
  "Why did clinician goodwill end where it did?",
  "Which decision cost us the most time, and why?",
  "What would Specific answers have changed?",
  "Where did our discussion and our written answers differ?",
];

// ---------- HTTP ----------

const requests = [];
const problems = [];
const note = (room, what) => {
  problems.push({ room, what });
  console.log(`  ! Room ${room}: ${what}`);
};

async function call(room, method, pathname, body, { admin = false, timeout = 120_000 } = {}) {
  const t0 = Date.now();
  const headers = { "Content-Type": "application/json", [admin ? "x-admin-code" : "x-room-code"]: admin ? ADMIN_CODE : ROOM_CODES[room - 1] };
  let res;
  try {
    res = await fetch(`${BASE}/api/${pathname}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
  } catch (error) {
    requests.push({ room, step: pathname, ms: Date.now() - t0, ok: false });
    throw new Error(`${pathname}: ${error.cause?.code || error.name || error.message}`);
  }
  const json = await res.json().catch(() => null);
  requests.push({ room, step: pathname, ms: Date.now() - t0, ok: res.ok });
  if (!res.ok) throw new Error(`${pathname}: HTTP ${res.status} ${json?.error ?? ""}`.trim());
  return json;
}
const get = (room, p, o) => call(room, "GET", p, undefined, o);
const post = (room, p, body, o) => call(room, "POST", p, body ?? {}, o);
// A call whose refusal is expected (race checks): status and body, no throw.
async function attempt(room, pathname, body, { admin = false } = {}) {
  const res = await fetch(`${BASE}/api/${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", [admin ? "x-admin-code" : "x-room-code"]: admin ? ADMIN_CODE : ROOM_CODES[room - 1] },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(9 * 60_000),
  });
  return { status: res.status, text: await res.text() };
}
const races = [];
const race = (what, ok, detail) => {
  races.push({ what, ok, detail });
  console.log(`  ${ok ? "✓" : "✗"} ${what}${detail ? ` (${detail})` : ""}`);
  if (!ok) problems.push({ room: 0, what: `race check failed: ${what}${detail ? ` (${detail})` : ""}` });
};

// A streamed call (Elders, chat): time to first word, total, and the text.
async function stream(room, pathname, body) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-room-code": ROOM_CODES[room - 1] },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(240_000),
  });
  if (!res.ok) throw new Error(`${pathname}: HTTP ${res.status} ${(await res.json().catch(() => ({}))).error ?? ""}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let first = null;
  let done = false;
  const texts = [];
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buf += decoder.decode(chunk.value, { stream: true });
    const events = buf.split("\n\n");
    buf = events.pop();
    for (const ev of events) {
      const line = ev.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const msg = JSON.parse(line.slice(6));
      if (msg.type === "error") throw new Error(`${pathname}: ${msg.message}`);
      if (msg.type === "elder-start") texts.push("");
      if (msg.type === "delta") {
        first ??= Date.now() - t0;
        if (!texts.length) texts.push("");
        texts[texts.length - 1] += msg.text;
      }
      if (msg.type === "done") done = true;
    }
  }
  if (!done) throw new Error(`${pathname}: stream ended before it finished`);
  return { firstMs: first, totalMs: Date.now() - t0, texts };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- one room ----------

async function playRoom(room, scenarioId) {
  const r = rng(SEED + room * 7919);
  const log = { room, scenarioId, decisions: [], elderRounds: [], chat: [], errors: [], linesSent: {} };
  const roster = {};
  // Every transcript line sent is counted against its decision (or the
  // debrief), and checked against the database at the end.
  const say = async (key, text, extra) => {
    await post(room, "discussion", { text, ...extra });
    log.linesSent[key] = (log.linesSent[key] ?? 0) + 1;
  };
  // Lines arrive together, the way speech recognition sends them.
  const burst = (key, lines) => Promise.all(lines.map((line) => say(key, line)));
  const leadRoom = room === ROOMS[0];
  // After every change, read the room back: if it isn't where the change left
  // it, a different server instance probably answered.
  const confirm = async (after, label) => {
    const s = await get(room, "state");
    if (s.state.phase !== after.state.phase || s.node?.id !== after.node?.id) {
      note(room, `state went backwards after ${label} (saw ${s.state.phase} at ${s.node?.id ?? "report"}, expected ${after.state.phase} at ${after.node?.id ?? "report"}): possibly more than one server instance`);
    }
    return s;
  };
  const elders = async (again, label) => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const e = await stream(room, "npc", { again });
        log.elderRounds.push({ decision: label, again, ...e, attempt });
        if (e.texts.some((t) => !t.trim())) note(room, `an Elder reply at ${label} was empty`);
        return true;
      } catch (error) {
        note(room, `Elders at ${label}${again ? " (asked again)" : ""}, attempt ${attempt}: ${error.message}`);
      }
    }
    return false;
  };

  let s = await post(room, "scenario", { id: scenarioId });
  s.roles.forEach((role, i) => (roster[role] = NAMES[room - 1][i % 5]));
  s = await post(room, "roles", { assignments: roster, start: true });
  console.log(`  Room ${room}: ${s.scenario.title}`);

  for (let guard = 0; guard < 20; guard++) {
    s = await get(room, "state");
    if (s.state.phase === "epilogue") break;
    const node = s.node;
    const label = `${String(node.index + 1).padStart(2, "0")} ${node.type}`;
    const d = { decision: label, nodeId: node.id, title: node.title };
    await sleep(PACE);

    if (node.index > 0 && r() < 0.08) {
      s = await post(room, "skip", {});
      d.skipped = true;
      log.decisions.push(d);
      await confirm(s, `skip ${label}`);
      continue;
    }

    const talk = (n) => Array.from({ length: n }, () => pick(r, TALK).replace("{name}", pick(r, NAMES[room - 1])));
    await burst(node.id, talk(3 + Math.floor(r() * 4)));

    const ids = node.options.map((o) => o.id);
    const roll = r();
    const choice = roll < 0.72 ? pick(r, ids.filter((id) => ["a", "b", "c"].includes(id))) : roll < 0.88 ? "writein" : "decline";
    const role = pick(r, s.roles);
    const specific = () =>
      `${role} owns this. ${pick(r, WHEN)}, ${role.replace(/^The /, "the ")} ${pick(r, ACTS)}; if ${pick(r, TRIGGERS)}, ${pick(r, THEN)}.`;
    const vague = choice !== "decline" && r() < 0.35;
    const freeText = choice === "decline" ? "We can't answer this today." : vague ? pick(r, VAGUE) : specific();
    const decidedBy = r() < 0.2 ? "The group" : `${role} · ${roster[role]}`;
    s = await post(room, "answer", { choice, freeText, decidedBy });
    Object.assign(d, { choice, freeText, decidedBy });
    await confirm(s, `answer ${label}`);

    let heard;
    if (RACES && leadRoom && node.index === 0) {
      // Two Council rounds started at the same moment: exactly one may run.
      const both = await Promise.allSettled([stream(room, "npc", {}), stream(room, "npc", {})]);
      const ran = both.filter((b) => b.status === "fulfilled");
      const refused = both.filter((b) => b.status === "rejected" && /409|already speaking|cannot run/.test(b.reason.message));
      race("two Council rounds at once on one room: one runs, one is refused", ran.length === 1 && refused.length === 1, `${ran.length} ran, ${refused.length} refused`);
      if (ran.length) log.elderRounds.push({ decision: label, again: false, ...ran[0].value, attempt: 1 });
      heard = ran.length > 0 || (await elders(false, label));
    } else heard = await elders(false, label);
    if (!heard) {
      s = await post(room, "hold", {});
      d.heldWithoutCouncil = true;
    } else {
      if (r() < 0.25) {
        d.askedAgain = true;
        await elders(true, label);
      }
      if (vague && r() < 0.5) {
        await burst(node.id, talk(1 + Math.floor(r() * 3)));
        const revised = specific();
        s = await post(room, "answer", { choice, freeText: revised, decidedBy });
        d.revisedTo = revised;
        await confirm(s, `revise ${label}`);
        await elders(false, `${label} revised`);
      }
      s = await post(room, "hold", {});
    }
    const score = choice === "decline" ? "absent" : vague && !d.revisedTo ? "generic" : "specific";
    s = await post(room, "lock", { score });
    await confirm(s, `lock ${label}`);
    Object.assign(d, { score, meters: s.state.meter, adjustment: s.state.record?.adjustment ?? null, checkSkipped: !!s.state.record?.checkSkipped });
    log.decisions.push(d);
    s = await post(room, "advance", {});
    await confirm(s, `advance past ${label}`);
  }

  s = await get(room, "state");
  if (s.state.phase !== "epilogue") throw new Error(`never reached the 12-month report (stuck in ${s.state.phase})`);
  log.finalMeters = s.state.meter;

  // Debrief and the 12-month chat.
  const parts = s.state.epilogue.parts;
  await Promise.all(parts.slice(0, 2).map((p) => say("debrief", `If we'd named someone at ${p.type}, month ${p.month} might have gone the other way.`, { focus: p.nodeId })));
  let questions = QUESTIONS.slice(0, CHAT);
  if (RACES && leadRoom && questions.length >= 2) {
    // Two chat questions at the same moment: one is answered, one is told to wait.
    const both = await Promise.allSettled(questions.slice(0, 2).map((q) => stream(room, "explain", { question: q })));
    const answered = both.map((b, i) => [b, questions[i]]).filter(([b]) => b.status === "fulfilled");
    const waited = both.filter((b) => b.status === "rejected" && /409|Still answering/.test(b.reason.message));
    if (answered.length === 2) console.log("  (chat check skipped: the two answers finished too quickly to overlap)");
    else race("two chat questions at once: one answered, one told to wait", answered.length === 1 && waited.length === 1, `${answered.length} answered, ${waited.length} waited`);
    for (const [b, q] of answered) log.chat.push({ question: q, firstMs: b.value.firstMs, totalMs: b.value.totalMs, answer: b.value.texts.join("") });
    // Ask the one that had to wait again.
    questions = questions.slice(0, 2).filter((q) => !answered.some(([, a]) => a === q)).concat(questions.slice(2));
  }
  for (const q of questions) {
    try {
      const a = await stream(room, "explain", { question: q });
      log.chat.push({ question: q, firstMs: a.firstMs, totalMs: a.totalMs, answer: a.texts.join("") });
      if (!a.texts.join("").trim()) note(room, `empty chat answer to "${q}"`);
    } catch (error) {
      note(room, `chat "${q}": ${error.message}`);
    }
  }
  s = await get(room, "state");
  if ((s.state.epilogue.qa ?? []).length !== log.chat.length) note(room, `chat saved ${(s.state.epilogue.qa ?? []).length} answers, expected ${log.chat.length}`);
  return log;
}

// ---------- run ----------

const pct = (list, p) => {
  if (!list.length) return null;
  const sorted = [...list].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
};
const secs = (ms) => (ms == null ? "—" : `${(ms / 1000).toFixed(1)}s`);

async function main() {
  console.log(`Tabletop four-room rehearsal → ${BASE}`);
  const health = await (await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(20_000) })).json();
  console.log(`  server: commit ${health.commit}, model ${health.model}, Claude key ${health.anthropicKey ? "set" : "MISSING"}, started ${health.startedAt}`);
  if (!health.anthropicKey) console.log("  ! The server has no Claude key: every Elder round and chat answer will fail.");
  console.log(`  seed ${SEED} (repeat this run with --seed ${SEED})`);

  const overview = await get(1, "admin/overview", { admin: true });
  const busy = overview.rooms.filter((r) => r.scenario);
  if (busy.length && !flag("reset")) {
    console.error(`\nRooms ${busy.map((r) => r.roomNumber).join(", ")} are already in use. Re-run with --reset to wipe all four rooms first.`);
    process.exit(2);
  }
  if (flag("reset")) {
    await post(1, "admin/reset", { confirm: "RESET" }, { admin: true });
    console.log("  full game reset done");
  }

  const scenarioIds = (await get(1, "state")).scenarios.map((s) => s.id);
  if (RACES && ROOMS.length >= 2) {
    // Two rooms claim the same scenario at the same moment: exactly one gets it.
    console.log("\nChecking the at-the-same-moment protections…");
    const [a, b] = ROOMS;
    const sid = scenarioIds[(b - 1) % scenarioIds.length];
    const both = await Promise.all([attempt(a, "scenario", { id: sid }), attempt(b, "scenario", { id: sid })]);
    const statuses = both.map((x) => x.status).sort();
    race("two rooms claim one scenario at once: one gets it, one is refused", JSON.stringify(statuses) === "[200,409]", statuses.join(" / "));
    for (const room of [a, b]) await post(1, "admin/reset-room", { room, confirm: "RESET" }, { admin: true });
  }
  const t0 = Date.now();
  console.log(`\nPlaying rooms ${ROOMS.join(", ")} at once…`);
  const results = await Promise.all(
    ROOMS.map((room) =>
      playRoom(room, scenarioIds[(room - 1) % scenarioIds.length]).catch((error) => {
        note(room, `stopped: ${error.message}`);
        return { room, failed: error.message, decisions: [], elderRounds: [], chat: [] };
      }),
    ),
  );
  const wall = Date.now() - t0;

  // Read everything back from the database and check nothing was lost.
  console.log("\nReading the rooms back…");
  const saved = await get(1, "admin/export", { admin: true });
  const integrity = [];
  for (const r of results.filter((x) => !x.failed)) {
    const er = saved.rooms.find((x) => x.roomNumber === r.room);
    const check = { room: r.room, linesSent: 0, linesSaved: 0, metersChecked: 0, problems: 0 };
    // Every transcript line sent is saved, per decision and in the debrief.
    for (const [key, n] of Object.entries(r.linesSent)) {
      const got = key === "debrief" ? er.epilogue?.discussion?.length ?? 0 : er.records[key]?.discussion?.length ?? 0;
      check.linesSent += n;
      check.linesSaved += got;
      if (got !== n) {
        check.problems++;
        note(r.room, `transcript lines at ${key}: sent ${n}, saved ${got}`);
      }
    }
    for (const d of r.decisions.filter((x) => !x.skipped && x.meters)) {
      const rec = er.records[d.nodeId];
      // Meters before + what the decision moved = meters after the lock.
      const rv = await get(r.room, `review/${d.nodeId}`);
      const wrong = ["goodwill", "risk", "dollars", "time"].filter((k) => rec?.meterBefore?.[k] + (rv.moved?.[k] ?? 0) !== d.meters[k]);
      check.metersChecked++;
      if (wrong.length) {
        check.problems++;
        note(r.room, `meters don't add up at ${d.decision}: ${wrong.join(", ")}`);
      }
      // A decision that heard the Council has its replies saved.
      const turns = Object.values(er.elderTurns ?? {}).flat().filter((t) => t.nodeId === d.nodeId && t.live);
      if (!d.heldWithoutCouncil && !turns.length) {
        check.problems++;
        note(r.room, `no Council replies saved for ${d.decision}`);
      }
    }
    integrity.push(check);
    console.log(`  ${check.problems ? "✗" : "✓"} Room ${r.room}: ${check.linesSaved}/${check.linesSent} transcript lines saved, ${check.metersChecked} decisions' meters add up`);
  }

  // Admin view and themes.
  const after = await get(1, "admin/overview", { admin: true });
  const finished = after.rooms.filter((r) => r.epilogue).map((r) => r.roomNumber);
  for (const room of ROOMS) if (!finished.includes(room)) note(room, "the admin view doesn't show this room as finished");
  let themes = null;
  if (THEMES && finished.length) {
    const tt = Date.now();
    // The run happens inside this request, so allow it time to finish.
    const body = { includeTranscripts: flag("transcripts"), force: true };
    const first = attempt(1, "admin/themes", body, { admin: true });
    if (RACES) {
      await sleep(1500);
      if ((await get(1, "admin/overview", { admin: true })).themes.status === "running") {
        const second = await attempt(1, "admin/themes", body, { admin: true });
        race("a second themes run while one is going is refused", second.status === 409, `${second.status}`);
      } else console.log("  (second-run check skipped: the themes run finished too quickly to overlap)");
    }
    const firstRes = await first;
    if (firstRes.status !== 200 || !firstRes.text.includes('"type":"done"')) note(0, `themes request: HTTP ${firstRes.status}`);
    for (;;) {
      await sleep(3000);
      themes = (await get(1, "admin/overview", { admin: true })).themes;
      if (themes.status !== "running" || Date.now() - tt > 6 * 60_000) break;
    }
    themes.ms = Date.now() - tt;
    if (themes.status !== "done") note(0, `themes run ended as "${themes.status}": ${themes.error ?? "timed out"}`);
  }
  const exported = await get(1, "admin/export", { admin: true });

  // Report.
  fs.mkdirSync(OUT, { recursive: true });
  const plain = requests.map((q) => q.ms);
  const summary = {
    site: BASE,
    server: health,
    seed: SEED,
    startedAt: new Date(t0).toISOString(),
    wallSeconds: Math.round(wall / 1000),
    requests: { count: requests.length, failed: requests.filter((q) => !q.ok).length, p50ms: pct(plain, 0.5), p95ms: pct(plain, 0.95), maxms: pct(plain, 1) },
    rooms: results,
    races,
    integrity,
    themes: themes && { status: themes.status, seconds: Math.round(themes.ms / 1000), themes: themes.result?.themes?.length, openQuestions: themes.result?.open_questions?.length },
    problems,
    pass: problems.length === 0,
  };
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUT, "export.json"), JSON.stringify(exported, null, 2));

  console.log(`\nDone in ${secs(wall)}. Report: ${path.resolve(OUT)}\n`);
  for (const r of results) {
    const firsts = r.elderRounds.map((e) => e.firstMs).filter((x) => x != null);
    const decided = r.decisions.filter((d) => !d.skipped).length;
    const skipped = r.decisions.length - decided;
    const again = r.elderRounds.filter((e) => e.again).length;
    const meters = r.finalMeters ? ["goodwill", "risk", "dollars", "time"].map((k) => `${k} ${r.finalMeters[k]}`).join(" · ") : "—";
    console.log(
      `Room ${r.room}  ${r.failed ? "STOPPED" : "finished"}  ${decided} decided${skipped ? `, ${skipped} skipped` : ""}  ` +
        `Elder rounds ${r.elderRounds.length} (${again} asked again), first word p50 ${secs(pct(firsts, 0.5))} max ${secs(pct(firsts, 1))}  ` +
        `chat ${r.chat.length}/${CHAT}  final: ${meters}`,
    );
  }
  console.log(
    `\nRequests ${summary.requests.count} (${summary.requests.failed} failed), p50 ${summary.requests.p50ms} ms, p95 ${summary.requests.p95ms} ms, max ${summary.requests.maxms} ms (streams excluded)`,
  );
  if (themes) console.log(`Themes: ${themes.status} in ${secs(themes.ms)}${themes.result ? `, ${themes.result.themes.length} themes, ${themes.result.open_questions.length} open questions` : ""}`);
  if (races.length) console.log(`At-the-same-moment checks: ${races.filter((x) => x.ok).length}/${races.length} passed`);
  if (integrity.length) {
    const sent = integrity.reduce((a, x) => a + x.linesSent, 0);
    const kept = integrity.reduce((a, x) => a + x.linesSaved, 0);
    console.log(`Read-back: ${kept}/${sent} transcript lines saved, ${integrity.reduce((a, x) => a + x.metersChecked, 0)} decisions' meters add up${integrity.some((x) => x.problems) ? " — with problems above" : ""}`);
  }
  console.log(problems.length ? `\nFAIL — ${problems.length} problem(s) above and in summary.json` : "\nPASS");

  if (flag("reset-after")) {
    await post(1, "admin/reset", { confirm: "RESET" }, { admin: true });
    console.log("Full game reset done (--reset-after).");
  } else {
    console.log("The rooms are left finished for a look on /admin. Run a full reset there before the real session.");
  }
  process.exit(problems.length ? 1 : 0);
}

main().catch((error) => {
  console.error(`\nRehearsal failed: ${error.message}`);
  process.exit(1);
});
