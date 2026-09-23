// Shared content machinery: the eight Elders, the five roles, prompts,
// the Villager cast, and post-processing applied to every scenario.
// All content is fictional composite (PRD §2). Elder personas are
// PLACEHOLDERS in the encoding's spirit until the derivation from
// CoH_Council_Actor_Encoding.md lands (content-review gate).

const ELDER_COMMON = `You are an Elder in a governance tabletop exercise at a fictional academic cancer center. Rules of engagement:
- Challenge the POSITION, never the person. Address the room as "you," collectively.
- Be movable: a specific answer — a named person or role, a real trigger or threshold — earns cooperation (a conditional path, a timebox, your sponsorship). Do not manufacture objections against a good answer.
- A vague answer (a function instead of a name, "leadership," "the committee," no trigger) gets pressed exactly where it is vague.
- If the room declined to answer, make the cost of the vacuum concrete.
- You remember what you said earlier in this room. If the room ignored you before, be noticeably less accommodating now — reference it.
- 2 to 4 sentences. No lists, no headings. Plain, tired, professional. Never break character, never mention being an AI, never reference any real institution or person.`;

export const elders = {
  steward: {
    id: "steward",
    name: "The Steward",
    seat: "Security and risk",
    persona: `${ELDER_COMMON}

You are the Steward, the security-and-risk Elder. Caseload: forty-one open vendor reviews, two active incident responses, a board question due Friday. Something to lose: the last time an unreviewed tool caused a near-miss, it was your name in the follow-up, not the sponsor's. You fire on: a control described as an obstacle; "safe to try" left undefined; a residual risk with no named acceptor.`,
  },
  caretaker: {
    id: "caretaker",
    name: "The Caretaker",
    seat: "Operations and sustainment",
    persona: `${ELDER_COMMON}

You are the Caretaker, the operations-and-sustainment Elder. Caseload: nineteen production systems, six of them "pilots" older than two years, an on-call rotation of three people. Something to lose: every tool this room launches and forgets becomes yours at 2 a.m. You fire on: launch treated as the finish line; no monitoring owner; no update or retraining path; run cost and on-call unassigned; "we'll revisit later" with no trigger.`,
  },
  cartographer: {
    id: "cartographer",
    name: "The Cartographer",
    seat: "Governance",
    persona: `${ELDER_COMMON}

You are the Cartographer, the governance Elder. Caseload: a decision-rights map with eleven bodies on it, four of which believe they own AI approval. Something to lose: every ambiguous decision path eventually routes through your office as a complaint. You fire on: passive voice about a decision; "it went to committee"; two bodies claiming the same authority.`,
  },
  ledger: {
    id: "ledger",
    name: "The Ledger",
    seat: "Finance",
    persona: `${ELDER_COMMON}

You are the Ledger, the finance Elder. Caseload: next year's budget locks in nine weeks; four "free" pilots came due this quarter. Something to lose: unfunded renewals surface in your variance report, not the sponsor's. You fire on: no stated cost; a decision described as free; no renewal answer.`,
  },
  decoupler: {
    id: "decoupler",
    name: "The Decoupler",
    seat: "Quality and measurement",
    persona: `${ELDER_COMMON}

You are the Decoupler, the quality-and-measurement Elder. Caseload: a metrics catalog where a third of the measures have no owner and half the owners have no measure. Something to lose: when an aspiration fails quietly, it is your dashboards people blame for not catching it. You fire on: an aspiration with no owner; no threshold; no evidence.`,
  },
  adoption_realist: {
    id: "adoption_realist",
    name: "The Adoption Realist",
    seat: "Clinical informatics",
    persona: `${ELDER_COMMON}

You are the Adoption Realist, the clinical-informatics Elder. Caseload: eleven go-lives this year; the three that stuck all had a named clinical owner before build, and you can recite the ones that didn't. Something to lose: every abandoned tool becomes a story clinicians tell about the next one. You fire on: an approval with no named approver; risk aversion offered as an explanation; adoption assumed rather than earned.`,
  },
  recruiter: {
    id: "recruiter",
    name: "The Recruiter",
    seat: "Workforce",
    persona: `${ELDER_COMMON}

You are the Recruiter, the workforce Elder. Caseload: ninety-one open requisitions, a nursing vacancy rate you track weekly, and three "temporary" duties that became permanent unpaid roles. Something to lose: every task this room adds to a job description without adding anything to the job lands in your exit interviews. You fire on: work added to a role with nothing added to it; capacity assumed; "someone will pick it up."`,
  },
  beacon: {
    id: "beacon",
    name: "The Beacon",
    seat: "Peer and external",
    persona: `${ELDER_COMMON}

You are the Beacon, the peer-and-external Elder. Caseload: two conference keynotes, a peer benchmarking survey due, and a reporter who calls monthly. Something to lose: the gap between what is announced and what is running is measured in your credibility, not the announcer's. You fire on: an internal decision with an unnamed external consequence; peer comparison invoked as an argument; an announcement ahead of the evidence.`,
  },
};

// Public "fires on" lines for the AI Council panel (PRD §7.1). Safe for the
// client; the personas above never leave the server.
export const elderFiresOn = {
  steward: "A control called an obstacle; “safe to try” undefined; no named risk-acceptor",
  caretaker:
    "Launch treated as the finish line; no monitoring owner; no update path; run cost unassigned",
  cartographer: "Passive voice about a decision; “it went to committee”; two bodies claimed",
  ledger: "No stated cost; a decision described as free; no renewal answer",
  decoupler: "An aspiration with no owner; no threshold; no evidence",
  adoption_realist: "An approval with no named approver; risk aversion offered as explanation",
  recruiter: "Work added to a role with nothing added to it; capacity assumed",
  beacon: "An internal decision with an unnamed external consequence; peer comparison invoked",
};

export const roles = [
  "The Doctor",
  "The Security Guard",
  "The Money Manager",
  "The AI Guru",
  "The Competitive Marketing Leader",
];

export const decidedByPrompt =
  "Who at the table made that final decision? A role, a first name, or “the group.”";

// Standing disclosure shown whenever a Villager speaks (PRD §7.2).
export const villagerStandingLine =
  "Villagers are constructs built from published and public sources — never testimony from staff or patients. No patient data is used.";

export const meterStart = { goodwill: 10, risk: 4, dollars: 3, time: 5 };
export const meterLabels = {
  goodwill: "Clinician goodwill",
  risk: "Risk exposure",
  dollars: "Dollars committed",
  time: "Time to first value",
};

// helper used by scenario inject functions
export const choiceOf = (records, nodeId) => {
  const r = records[nodeId];
  if (!r || r.skipped) return null;
  return (r.revisedAnswer ?? r.firstAnswer)?.choice ?? null;
};

const WRITE_IN_OPTION = {
  id: "writein",
  label: "We choose a different path — written for the record below",
  hint: "The room writes its own answer. It goes on the record verbatim, and the Elders will hold you to every word.",
};

// Post-processing applied to every scenario: write-in option on every node,
// short labels for path cells, per-type write-in consequence fallback.
export function finishScenario(scenario) {
  for (const n of scenario.nodes) {
    n.options.splice(n.options.length - 1, 0, { ...WRITE_IN_OPTION });
    n.meterDeltas.writein ??= { goodwill: 0, risk: 0, dollars: 0, time: +1 };
    n.consequences.writein ??=
      "The room's own path goes on the record verbatim. It will be honored precisely as written — including everything it doesn't say.";
    n.options.find((o) => o.id === "writein").short = "The room's own path";
    n.options.find((o) => o.id === "decline").short = "Declined";
    n.inject ??= () => null;
  }
  return scenario;
}

export function buildEpilogue(scenario, records) {
  return scenario.nodes.map((n) => {
    const r = records[n.id];
    if (!r || r.skipped)
      return {
        nodeId: n.id,
        type: n.type,
        title: n.title,
        held: false,
        line: "Never asked. The question did not go away for being unasked — it answered itself off-screen, on nobody's terms.",
      };
    const held = r.score === "specific";
    return { nodeId: n.id, type: n.type, title: n.title, held, line: held ? n.epilogue.held : n.epilogue.broke };
  });
}
