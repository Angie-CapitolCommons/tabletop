// Server-side NPC turns. The API key lives here and only here (PRD §4).
// The prompt carries: the Elder's profile, the shared who's who, the scenario's
// model-only fact summary, the room's decision path so far, the answer at this
// node including free text, and what this Elder already said in this room. It
// carries NO CoH source material and no participant identities (PRD §7.3).
import Anthropic from "@anthropic-ai/sdk";
import { whosWhoForModel, SECTION_LABELS } from "./content/index.js";

const MODEL = process.env.MODEL || "claude-opus-5";
const FIRST_TOKEN_TIMEOUT_MS = Number(process.env.NPC_FIRST_TOKEN_TIMEOUT_MS) || 8000;

const client = new Anthropic();

export async function streamElderTurn({
  elder,
  scenario,
  node,
  option,
  answer,
  previous,
  previousOption,
  pathSummary,
  priorTurns,
  onDelta,
}) {
  // Stable, cacheable prefix: persona + who's who + scenario facts. The room
  // sees only the opening moment; the Elders need the backstory behind it.
  // Volatile per-turn content (the path and the room's answer) goes after the
  // cache breakpoint.
  const system = [
    {
      type: "text",
      text:
        `${elder.persona}\n\n${whosWhoForModel}\n\n` +
        `SCENARIO — ${scenario.title} (enters at ${scenario.entersAt}):\n${scenario.modelBrief}`,
      cache_control: { type: "ephemeral" },
    },
  ];

  const messages = [];
  // This Elder's memory in this room: prior live turns replay as its own words.
  for (const turn of priorTurns) {
    messages.push({ role: "user", content: "(The room is deliberating.)" });
    messages.push({ role: "assistant", content: turn.text });
  }
  messages.push({
    role: "user",
    content:
      (pathSummary
        ? `The room's decision path so far:\n${pathSummary}\n\n`
        : "") +
      (previous
        ? `The room has revised its answer at the "${node.title}" node (type: ${node.type}) after hearing from the Elders.\n` +
          `Question posed: ${node.question}\n` +
          `Their earlier answer: ${previousOption?.label} — "${previous.freeText}"\n` +
          `Respond to the revised answer below, not the earlier one, and don't repeat your earlier comment.\n`
        : `The room just committed its answer at the "${node.title}" node (type: ${node.type}).\n` +
          `Question posed: ${node.question}\n`) +
      `Their choice: ${option.label}\n` +
      `Their written specifics (verbatim): "${answer.freeText}"\n` +
      `Who at the table made the final call (verbatim): "${answer.decidedBy}"\n\n` +
      `Respond in character, briefly, politely, and supportively. If the answer names a real person or role with a real trigger or number, say so and offer your support or a condition. If something is missing, kindly ask for that one thing. If they didn't take up something you raised earlier, mention it gently. One to three short sentences, under 50 words.`,
  });

  console.log(`[npc] live call → ${elder.id} @ ${node.id} (model ${MODEL})`);
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 400,
    output_config: { effort: "low" },
    system,
    messages,
  });

  let text = "";
  let firstToken = false;
  const timeout = setTimeout(() => {
    if (!firstToken) stream.abort();
  }, FIRST_TOKEN_TIMEOUT_MS);

  stream.on("text", (delta) => {
    firstToken = true;
    text += delta;
    onDelta(delta);
  });

  try {
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal" || !text.trim()) {
      throw new Error(`empty or refused NPC turn (stop_reason: ${final.stop_reason})`);
    }
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

// After the Elders speak, two checks on the room's written answer, in one
// call: does it put work on clinicians that belongs elsewhere (goodwill), and
// does it add meetings, approvals, or other process beyond what the chosen
// option already involves (time to first value)? Applied when the score
// locks. Reads the same inputs the Elders saw, plus their comments (no
// transcript, no names). Best-effort: any failure returns null and the
// meters move as authored.
const ASSESS_TIMEOUT_MS = Number(process.env.ASSESS_TIMEOUT_MS) || 10000;

const ASSESS_SYSTEM = `You review one answer from a governance tabletop exercise at a fictional academic cancer center. A room of leaders answered a decision question, and AI "Elders" then commented on the answer. Make two separate judgments.

1. Clinician burden. Does the answer, as written, put work on clinicians (doctors, nurses, pharmacists, or clinic staff) that belongs with IT, operations, quality, finance, or another part of the business? Examples: manually double-checking a tool's output, monitoring, audits, logging or data entry, validation work, workarounds, or making clinicians the safety net, without taking anything else off their plate or funding the time. Use the Elders' comments as evidence: if an Elder raised this and the answer still doesn't deal with it, count it.

clinician_burden:
- none: no new work lands on clinicians, or the answer funds or staffs it.
- some: a modest or temporary added task.
- heavy: ongoing work, or clinicians become the safety net.

note: for some or heavy, one plain sentence under 20 words saying what work lands on clinicians, for example "Clinicians double-check the labs in every summary until the review ends." For none, an empty string.

2. Added process. Every meeting, committee, vote, sign-off, approval, review, audit, handoff between groups, or other added governance or complexity slows the time until the tool delivers value. The chosen option's own steps are already counted. Judge only what the written answer adds beyond what the chosen option already involves.

added_process:
- none: the answer adds no steps beyond the chosen option.
- some: one added meeting, approval, sign-off, or review step.
- heavy: several added steps, a new standing committee or recurring review, or approvals from more than one group.

process_note: for some or heavy, one plain sentence under 20 words saying what the answer adds, for example "Adds a second sign-off from the department chair before each campus goes live." For none, an empty string.

No acronyms in either note.`;

const ASSESS_SCHEMA = {
  type: "object",
  properties: {
    clinician_burden: { type: "string", enum: ["none", "some", "heavy"] },
    note: { type: "string" },
    added_process: { type: "string", enum: ["none", "some", "heavy"] },
    process_note: { type: "string" },
  },
  required: ["clinician_burden", "note", "added_process", "process_note"],
  additionalProperties: false,
};

const LEVELS = ["none", "some", "heavy"];

export async function assessAnswer({ scenario, node, option, answer, elderTexts }) {
  try {
    const response = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 1024,
        output_config: { effort: "low", format: { type: "json_schema", schema: ASSESS_SCHEMA } },
        system: ASSESS_SYSTEM,
        messages: [
          {
            role: "user",
            content:
              `Scenario: ${scenario.title}\n` +
              `Question: ${node.question}\n` +
              `The room's choice: ${option.label}\n` +
              `What that choice involves: ${option.hint}\n` +
              `The room's written answer (verbatim): "${answer.freeText}"\n\n` +
              `The Elders' comments on this answer:\n${elderTexts.map((t) => `- ${t}`).join("\n") || "- (none)"}`,
          },
        ],
      },
      { timeout: ASSESS_TIMEOUT_MS, maxRetries: 0 },
    );
    if (response.stop_reason !== "end_turn") return null;
    const text = response.content.find((b) => b.type === "text")?.text;
    const parsed = text ? JSON.parse(text) : null;
    if (!parsed) return null;
    const burden = LEVELS.includes(parsed.clinician_burden) ? parsed.clinician_burden : "none";
    const added = LEVELS.includes(parsed.added_process) ? parsed.added_process : "none";
    return {
      clinicianBurden: burden,
      note: burden === "none" ? "" : String(parsed.note ?? "").trim(),
      addedProcess: added,
      processNote: added === "none" ? "" : String(parsed.process_note ?? "").trim(),
    };
  } catch (error) {
    console.error("Answer check skipped:", error?.message ?? error);
    return null;
  }
}

// The lead facilitator's themes run: every finished room, bundled by
// themes.js, synthesized into cross-room themes and next steps toward
// resolution. Streams (a long, high-effort call) and returns parsed JSON.
const THEMES_SYSTEM = `You are an analyst supporting the lead facilitator of an AI-governance tabletop exercise. Several breakout rooms of senior leaders each worked a fictional scenario about an AI tool at an academic cancer center. At each decision the room chose a position, wrote its specifics, and named who made the final call; AI "Elders" challenged the answer; the facilitator scored it (Specific means it named a person or role plus a trigger or number). The organizational questions under test: who decides, who accepts risk, what counts as proof, what ends a tool, who pays, and who does what between the AI Governance Workgroup (which today reviews risk only) and Information Security.

From the data, identify the themes that matter for resolving those questions:
- patterns that recur across rooms and scenarios, and which are specific to one scenario;
- where rooms agreed, where they diverged, and where they assigned the same authority to different people or bodies;
- what no room owned or answered, and where specificity dropped;
- which seats ended up making the calls;
- where answers changed after the Elders' challenge or once a cost appeared.

Cite evidence by room and section (for example "Room 2, Decider"). Stay with what the data shows; don't invent facts. The scenarios are fictional; the patterns in how the rooms decided are the point.

Then suggest next steps that would move the organization toward resolution. Each step concrete, in priority order, with the kind of owner (a role or a body from the who's who, never a person's name) and a timing (for example "before the next Workgroup meeting").

Write in plain language. No acronyms unless the data uses them. Five to eight themes; five to ten next steps.`;

const THEMES_SCHEMA = {
  type: "object",
  properties: {
    overview: { type: "string" },
    themes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          evidence: { type: "array", items: { type: "string" } },
          rooms: { type: "array", items: { type: "integer" } },
          sections: { type: "array", items: { type: "string", enum: Object.values(SECTION_LABELS) } },
        },
        required: ["title", "summary", "evidence", "rooms", "sections"],
        additionalProperties: false,
      },
    },
    next_steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          step: { type: "string" },
          why: { type: "string" },
          owner: { type: "string" },
          timing: { type: "string" },
          related_themes: { type: "array", items: { type: "string" } },
        },
        required: ["step", "why", "owner", "timing", "related_themes"],
        additionalProperties: false,
      },
    },
  },
  required: ["overview", "themes", "next_steps"],
  additionalProperties: false,
};

export async function generateThemes(bundle) {
  console.log(`[npc] themes run (model ${MODEL}, ${bundle.length} chars)`);
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema: THEMES_SCHEMA } },
    system: THEMES_SYSTEM,
    messages: [{ role: "user", content: bundle }],
  });
  const final = await stream.finalMessage();
  if (final.stop_reason !== "end_turn") throw new Error(`themes run stopped: ${final.stop_reason}`);
  const text = final.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("themes run returned no text");
  return JSON.parse(text);
}
