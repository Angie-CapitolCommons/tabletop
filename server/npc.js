// Server-side NPC turns. The API key lives here and only here (PRD §4).
// The prompt carries: the Elder's profile, the shared who's who, the scenario's
// model-only fact summary, the room's decision path so far, the answer at this
// node including free text, and what this Elder already said in this room. It
// carries NO CoH source material and no participant identities (PRD §7.3).
import Anthropic from "@anthropic-ai/sdk";
import { whosWhoForModel } from "./content/index.js";

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

// After the Elders speak: does the room's answer put work on clinicians that
// belongs elsewhere? Drives the clinician-goodwill adjustment at lock. Reads
// the same inputs the Elders saw, plus their comments (no transcript, no
// names). Best-effort: any failure returns null and the meters move as
// authored.
const ASSESS_TIMEOUT_MS = Number(process.env.ASSESS_TIMEOUT_MS) || 10000;

const ASSESS_SYSTEM = `You review one answer from a governance tabletop exercise at a fictional academic cancer center. A room of leaders answered a decision question, and AI "Elders" then commented on the answer.

Decide whether the answer, as written, puts work on clinicians (doctors, nurses, pharmacists, or clinic staff) that belongs with IT, operations, quality, finance, or another part of the business. Examples: manually double-checking a tool's output, monitoring, audits, logging or data entry, validation work, workarounds, or making clinicians the safety net, without taking anything else off their plate or funding the time.

Use the Elders' comments as evidence. If an Elder raised this and the answer still doesn't deal with it, count it.

clinician_burden:
- none: no new work lands on clinicians, or the answer funds or staffs it.
- some: a modest or temporary added task.
- heavy: ongoing work, or clinicians become the safety net.

note: for some or heavy, one plain sentence under 20 words saying what work lands on clinicians, for example "Clinicians double-check the labs in every summary until the review ends." No acronyms. For none, an empty string.`;

const ASSESS_SCHEMA = {
  type: "object",
  properties: {
    clinician_burden: { type: "string", enum: ["none", "some", "heavy"] },
    note: { type: "string" },
  },
  required: ["clinician_burden", "note"],
  additionalProperties: false,
};

export async function assessClinicianBurden({ scenario, node, option, answer, elderTexts }) {
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
    if (!["none", "some", "heavy"].includes(parsed?.clinician_burden)) return null;
    return { clinicianBurden: parsed.clinician_burden, note: String(parsed.note ?? "").trim() };
  } catch (error) {
    console.error("Clinician-burden assessment skipped:", error?.message ?? error);
    return null;
  }
}
