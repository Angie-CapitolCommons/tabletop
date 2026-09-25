// Bundles every finished room into one plain-text brief for the admin's
// themes run (npc.js → generateThemes). Everything that came from the room
// is name-scrubbed first (PRD §4). Discussion transcripts are included only
// when the lead facilitator opts in; PRD §5.3 keeps them from the model by
// default.
import { whosWhoForModel } from "./content/index.js";
import { scrubNames, scrubDecidedBy } from "./privacy.js";

const SCORE_WORDS = { specific: "Specific", generic: "Generic", absent: "Absent" };
const final = (r) => r.revisedAnswer ?? r.firstAnswer;

export function buildThemesBundle(items, { includeTranscripts, sectionLabels, elders }) {
  const out = [whosWhoForModel, ""];

  // Cross-room view: how each room scored each section it saw.
  out.push("SCORES BY SECTION ACROSS ROOMS (Specific = named a person or role plus a trigger or number):");
  for (const [type, label] of Object.entries(sectionLabels)) {
    const cells = items
      .map(({ roomNumber, room, scenario }) => {
        const node = scenario.nodes.find((n) => n.type === type);
        if (!node) return null;
        const r = room.records[node.id];
        const score = !r || r.skipped ? "Skipped" : SCORE_WORDS[r.score] ?? "Not scored";
        return `Room ${roomNumber} ${score}`;
      })
      .filter(Boolean);
    if (cells.length) out.push(`- ${label}: ${cells.join("; ")}`);
  }
  out.push("");

  for (const { roomNumber, room, scenario } of items) {
    const scrub = (t) => scrubNames(t, room.roleAssignments);
    out.push(`=== ROOM ${roomNumber}: "${scenario.title}" (enters at ${scenario.entersAt}) ===`);
    out.push(
      `Final meters: clinician goodwill ${room.meter.goodwill} (higher is better), risk ${room.meter.risk}, dollars ${room.meter.dollars}, time to first value ${room.meter.time} (lower is better for these three).`,
    );
    const tally = {};
    for (const r of Object.values(room.records)) {
      const a = r && !r.skipped && final(r);
      if (a) {
        const who = scrubDecidedBy(a.decidedBy, room.roleAssignments);
        tally[who] = (tally[who] ?? 0) + 1;
      }
    }
    out.push(`Who made the final calls: ${Object.entries(tally).map(([w, n]) => `${w} (${n})`).join(", ") || "none recorded"}`);
    out.push("Decisions, in order:");

    scenario.nodes.forEach((node, i) => {
      const r = room.records[node.id];
      const label = sectionLabels[node.type];
      out.push(`${i + 1}. ${label}: ${node.question}`);
      if (!r || r.skipped) {
        out.push("   Skipped: the room never answered it.");
      } else {
        const a = final(r);
        const option = node.options.find((o) => o.id === a.choice);
        out.push(`   Room's choice: ${option?.label ?? a.choice}`);
        out.push(`   Room's written answer: "${scrub(a.freeText)}"`);
        if (r.revisedAnswer) {
          const first = r.firstAnswer;
          const firstOption = node.options.find((o) => o.id === first.choice);
          out.push(`   Before the Elders' challenge it had answered: ${firstOption?.label ?? first.choice}, "${scrub(first.freeText)}"`);
        }
        out.push(`   Final call made by: ${scrubDecidedBy(a.decidedBy, room.roleAssignments)}`);
        const score = SCORE_WORDS[r.score] ?? "Not scored";
        out.push(`   Score: ${a.choice === "decline" ? `Declined to answer (${score})` : score}`);
        const { posedAt, lockedAt } = r.timings ?? {};
        if (posedAt && lockedAt) out.push(`   Minutes on this decision: ${Math.max(1, Math.round((lockedAt - posedAt) / 60000))}`);
      }
      const said = Object.entries(room.elderTurns ?? {})
        .map(([id, turns]) => [id, (turns ?? []).filter((t) => t.nodeId === node.id && t.live).at(-1)])
        .filter(([, t]) => t)
        .map(([id, t]) => `${elders[id]?.name ?? id}: ${t.text}`);
      if (said.length) out.push(`   The Elders said: ${said.join(" | ")}`);
      if (r?.adjustment) out.push(`   Goodwill cost for work pushed onto clinicians: ${r.adjustment.goodwill} (${r.adjustment.note})`);
      const later = room.epilogue?.parts?.find((p) => p.nodeId === node.id);
      if (later) out.push(`   Twelve months later (month ${later.month}): ${later.text}`);
      if (includeTranscripts && r?.transcript) {
        if (r.transcript.beforeAnswer) out.push(`   Discussion before the answer (transcribed): ${scrub(r.transcript.beforeAnswer)}`);
        if (r.transcript.afterChallenge) out.push(`   Discussion after the challenge (transcribed): ${scrub(r.transcript.afterChallenge)}`);
      }
    });

    if (includeTranscripts && room.epilogue?.discussion?.length) {
      out.push(`Debrief discussion (transcribed): ${scrub(room.epilogue.discussion.map((f) => f.text).join(" "))}`);
    }
    out.push("");
  }
  return out.join("\n");
}
