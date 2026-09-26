// Builds one room's record as plain text for the 12-month report's chat
// ("how did we get here?"): the engine's rules, then every decision with the
// options it offered and what each would have cost, what the room chose and
// wrote, the answer check, the Council, what happened, and the 12-month
// entry with the one a different score would have produced. Discussion
// transcripts are included. Everything from the room is name-scrubbed first.
import { whosWhoForModel, meterStart, meterLabels } from "./content/index.js";
import { scrubNames, scrubDecidedBy } from "./privacy.js";

const final = (r) => r.revisedAnswer ?? r.firstAnswer;
const signed = (n) => (n > 0 ? `+${n}` : `${n}`);
const costs = (d) =>
  Object.keys(meterLabels)
    .map((k) => `${meterLabels[k].toLowerCase()} ${signed(d?.[k] ?? 0)}`)
    .join(", ");

const RULES = `HOW THE EXERCISE WORKS
- Four meters start at: ${Object.entries(meterStart).map(([k, v]) => `${meterLabels[k].toLowerCase()} ${v}`).join(", ")}. Higher clinician goodwill is better; lower risk exposure, dollars committed, and time to first value are better.
- Every answer option carries fixed costs on the meters, applied when the facilitator locks the decision. Writing your own answer adds 1 to time. "We can't answer this today" always adds time, because the question comes back to another meeting. Skipping a decision costs the same as answering "We can't answer this today".
- After the AI Council (the Elders) responds, an answer check reads what the room wrote. Work it pushes onto clinicians that belongs elsewhere costs goodwill (−1 for some, −2 for heavy). Meetings, approvals, reviews, or other process it adds beyond the chosen option cost time (+1 for some, +2 for heavy). If the check didn't run, only the option's own costs applied.
- The facilitator scores each answer: Specific (names a person or role plus a trigger or number), Generic (a committee or department, or no trigger), or Absent (no one named, or declined). The score doesn't move the meters. It decides which follow-up plays after the decision and which 12-month outcome appears: Specific plays the version where the named owner acts; anything else, or skipping, plays the version where nobody owns it. The 12-month outcomes are written in advance for each decision, one for each case.
- The 12-month report has one dated entry per decision.`;

export function buildExplainBundle(room, scenario, { sectionLabels, elders }) {
  const scrub = (t) => scrubNames(t ?? "", room.roleAssignments);
  const out = [RULES, "", whosWhoForModel, ""];
  out.push(`THIS ROOM: "${scenario.title}" (enters at ${scenario.entersAt})`);
  out.push(`Final meters: ${Object.keys(meterLabels).map((k) => `${meterLabels[k].toLowerCase()} ${room.meter[k]}`).join(", ")}.`);
  out.push("");
  const later = Object.fromEntries((room.epilogue?.parts ?? []).map((p) => [p.nodeId, p]));

  scenario.nodes.forEach((node, i) => {
    const r = room.records[node.id];
    out.push(`DECISION ${i + 1} — ${sectionLabels[node.type]}: ${node.title}`);
    out.push(`Question: ${node.question}`);
    out.push("Options and their meter costs:");
    for (const o of node.options) out.push(`- ${o.label} (${o.hint}) → ${costs(node.meterDeltas[o.id])}`);
    if (!r || r.skipped) {
      out.push(`The room skipped this decision. It cost what "We can't answer this today" costs → ${costs(node.meterDeltas.decline)}; nobody owned it.`);
    } else {
      const a = final(r);
      const option = node.options.find((o) => o.id === a.choice);
      out.push(`The room chose: ${option?.label ?? a.choice}`);
      out.push(`The room wrote: "${scrub(a.freeText)}"`);
      if (r.revisedAnswer) {
        const f = r.firstAnswer;
        out.push(`Before the Council's challenge it had answered: ${node.options.find((o) => o.id === f.choice)?.label ?? f.choice}, "${scrub(f.freeText)}"`);
      } else if (r.held) out.push("The room held its answer after the Council's challenge.");
      out.push(`Final call made by: ${scrubDecidedBy(a.decidedBy, room.roleAssignments)}`);
      out.push(`Score: ${r.score ?? "not scored"}`);
      if (r.adjustment?.goodwill) out.push(`Answer check: goodwill ${signed(r.adjustment.goodwill)} — ${r.adjustment.note}`);
      if (r.adjustment?.time) out.push(`Answer check: time ${signed(r.adjustment.time)} — ${r.adjustment.timeNote}`);
      if (r.checkSkipped) out.push("Answer check: didn't run, so only the option's own costs applied.");
      if (!r.adjustment && !r.checkSkipped) out.push("Answer check: found nothing to add.");
      if (r.meterBefore) {
        const after = Object.fromEntries(
          Object.keys(meterLabels).map((k) => [k, r.meterBefore[k] + (node.meterDeltas[a.choice]?.[k] ?? 0) + (r.adjustment?.[k] ?? 0)]),
        );
        out.push(`Meters before → after this decision: ${Object.keys(meterLabels).map((k) => `${meterLabels[k].toLowerCase()} ${r.meterBefore[k]} → ${after[k]}`).join(", ")}`);
      }
      const said = Object.entries(room.elderTurns ?? {}).flatMap(([id, turns]) =>
        (turns ?? []).filter((t) => t.nodeId === node.id && t.live).map((t) => ({ t, name: elders[id]?.name ?? id })),
      );
      said.sort((x, y) => x.t.at - y.t.at);
      for (const { t, name } of said) out.push(`The Council — ${name}${(t.round ?? 1) > 1 ? ` (asked again, round ${t.round})` : ""}: ${t.text}`);
      for (const e of r.consequence ?? []) out.push(`What happened next (${e.when}): ${e.text}`);
      if (r.villager) out.push(`Who lives with it — ${r.villager.speaker}: "${r.villager.line}"`);
    }
    const l = later[node.id];
    if (l) {
      out.push(`Twelve months later (month ${l.month}, ${l.named ? "owner named" : l.skipped ? "skipped, so nobody owned it" : "nobody owned it"}): ${l.text}`);
      out.push(`With ${l.named ? "no named owner" : "a Specific answer"} it would have read: ${l.alt}`);
    }
    if (r?.transcript?.beforeAnswer) out.push(`Discussion before the answer (transcribed, fragmentary): ${scrub(r.transcript.beforeAnswer)}`);
    if (r?.transcript?.afterChallenge) out.push(`Discussion after the challenge (transcribed, fragmentary): ${scrub(r.transcript.afterChallenge)}`);
    out.push("");
  });
  if (room.epilogue?.discussion?.length) {
    out.push(`Debrief discussion (transcribed, fragmentary): ${scrub(room.epilogue.discussion.map((f) => f.text).join(" "))}`);
  }
  return out.join("\n");
}
