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
