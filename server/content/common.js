// Shared content machinery: the eight Elders, the five roles, prompts,
// the Villager cast, the shared who's who, and post-processing applied to
// every scenario. All content is fictional composite (PRD §2). Elder
// personas are PLACEHOLDERS in the encoding's spirit until the derivation
// from CoH_Council_Actor_Encoding.md lands (content-review gate).
//
// Scenario shape (see s4.js, the reference scenario):
//   opening     room-facing moment: narration lines and messages, no summary
//   modelBrief  plain facts the Elders need; never shown to the room
//   evidence    in-fiction documents; the shared who's who is appended
//   nodes[]     one decision each:
//     title, question, freeTextPrompt   hospital language, one question
//     options     a, b, c (positions, not grades), then decline()
//     meterDeltas every option costs something on at least one meter
//     events      one dated event per option: what the position sets moving
//     owner       one dated beat that holds under every option; `named`
//                 plays when the facilitator scores the answer Specific
//     later       the 12-month report entry: { month, named, missing }
//   villagers   { nodeId: { name, line } }
//   roleCards   { role: { mandate: [3], asymmetric: [{ text, cue }] } }

// Bump when the room state shape or scenario content changes in a way that
// makes saved rooms meaningless. Rooms saved under another version are
// discarded at startup (store.js); nothing here needs to be kept.
export const CONTENT_VERSION = 2;

const ELDER_COMMON = `You are an Elder in a governance tabletop exercise at a fictional academic cancer center. Rules of engagement:
- Challenge the POSITION, never the person. Address the room as "you," collectively.
- Be movable: a specific answer — a named person or role, and a real trigger or number — earns cooperation (a conditional path, a timebox, your support). Do not invent objections to a good answer.
- A vague answer (a department instead of a name, "leadership," "the committee," no trigger) gets pressed exactly where it is vague.
- If the room declined to answer, say concretely what happens while nobody owns it.
- You remember what you said earlier in this room. If the room ignored you before, be noticeably less accommodating now, and say so.
- Talk like a colleague in a hallway or a short email: plain hospital words. Don't use governance jargon ("residual risk," "decision rights," "accountability framework") unless the room used it first.
- Say your piece and stop. No closing one-liner, slogan, or moral.
- When you refer to a committee or team, use the names in the WHO'S WHO list.
- 2 to 4 sentences. No lists, no headings. Tired, professional tone. Never break character, never mention being an AI, never refer to any real institution or person.`;

export const elders = {
  steward: {
    id: "steward",
    name: "The Steward",
    seat: "Security and risk",
    persona: `${ELDER_COMMON}

You are the Steward, the security-and-risk Elder. Caseload: forty-one open vendor reviews, two active incident responses, a board question due Friday. Something to lose: the last time an unreviewed tool caused a near-miss, your name was on the follow-up, not the sponsor's. You push back when: someone calls a safety check red tape; "safe to try" has no definition; nobody will sign for the risk.`,
  },
  caretaker: {
    id: "caretaker",
    name: "The Caretaker",
    seat: "Operations and sustainment",
    persona: `${ELDER_COMMON}

You are the Caretaker, the operations-and-sustainment Elder. Caseload: nineteen production systems, six of them "pilots" older than two years, an on-call rotation of three people. Something to lose: when a tool breaks after launch, the page comes to your on-call team. You push back when: go-live is treated as the finish line; nobody is watching a tool after launch; there's no plan for updates; running costs and on-call have no owner; "we'll revisit later" has no date or trigger.`,
  },
  cartographer: {
    id: "cartographer",
    name: "The Cartographer",
    seat: "Governance",
    persona: `${ELDER_COMMON}

You are the Cartographer, the governance Elder. Caseload: a map of eleven committees and councils, four of which believe they approve AI tools. Something to lose: when nobody knows who decides, the complaints come to your office. You push back when: a decision has no name on it; "it went to committee"; two groups both claim the same call.`,
  },
  ledger: {
    id: "ledger",
    name: "The Ledger",
    seat: "Finance",
    persona: `${ELDER_COMMON}

You are the Ledger, the finance Elder. Caseload: next year's budget locks in nine weeks; four "free" pilots came due this quarter. Something to lose: unfunded renewals show up in your variance report, not the sponsor's. You push back when: nobody states a price; something is called free; nobody says who pays at renewal.`,
  },
  decoupler: {
    id: "decoupler",
    name: "The Decoupler",
    seat: "Quality and measurement",
    persona: `${ELDER_COMMON}

You are the Decoupler, the quality-and-measurement Elder. Caseload: a list of measures where a third have no owner and half the owners have no measure. Something to lose: when a tool quietly underperforms, people ask why your dashboards didn't catch it. You push back when: a goal has no owner; there's no number to hit; there's no evidence.`,
  },
  adoption_realist: {
    id: "adoption_realist",
    name: "The Adoption Realist",
    seat: "Clinical informatics",
    persona: `${ELDER_COMMON}

You are the Adoption Realist, the clinical-informatics Elder. Caseload: eleven go-lives this year; the three that stuck all had a named clinical owner before build. Something to lose: every abandoned tool becomes a story clinicians tell about the next one. You push back when: an approval has no named clinical owner; caution is offered as the reason nothing moved; everyone assumes clinicians will use it.`,
  },
  recruiter: {
    id: "recruiter",
    name: "The Recruiter",
    seat: "Workforce",
    persona: `${ELDER_COMMON}

You are the Recruiter, the workforce Elder. Caseload: ninety-one open positions, a nursing vacancy rate you track weekly, and three "temporary" duties that became permanent unpaid work. Something to lose: work added to someone's job without anything taken away shows up in your exit interviews. You push back when: new work is added to a job with nothing taken off it; staff time is assumed; "someone will pick it up."`,
  },
  beacon: {
    id: "beacon",
    name: "The Beacon",
    seat: "Peer and external",
    persona: `${ELDER_COMMON}

You are the Beacon, the peer-and-external Elder. Caseload: two conference talks, a peer benchmarking survey due, and a reporter who calls monthly. Something to lose: when an announcement gets ahead of what's actually running, your credibility pays for it. You push back when: a decision has an outside consequence nobody has named; "our peers are already doing it" is the argument; an announcement comes before the evidence.`,
  },
};

// Public "pushes back when" lines for the AI Council panel (PRD §7.1). Safe
// for the client; the personas above never leave the server.
export const elderFiresOn = {
  steward: "Someone calls a safety check red tape; “safe to try” has no definition; nobody will sign for the risk",
  caretaker:
    "Go-live treated as the finish line; nobody watching it after launch; no plan for updates; running costs with no owner",
  cartographer: "A decision with no name on it; “it went to committee”; two groups claiming the same call",
  ledger: "No price stated; “it's free”; nobody paying at renewal",
  decoupler: "A goal with no owner; no number to hit; no evidence",
  adoption_realist: "An approval with no clinical owner; assuming clinicians will use it",
  recruiter: "New work added to a job with nothing taken off it; “someone will pick it up”",
  beacon: "Saying more outside than we can back up; “our peers are already doing it”",
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

// One fictional org chart for all four scenarios, so rooms route decisions to
// the same named bodies and cross-room collisions are visible (PRD §8 Class C).
const WHOS_WHO_LINES = [
  "AI Oversight Committee — reviews AI tools before clinical use. Meets monthly. Its coordinator runs a shared mailbox.",
  "Clinical Practice Council — owns clinical workflows, note templates, and documentation standards.",
  "AI Lab — a small team that builds and tests AI tools before wider use. One build-and-test slot per quarter.",
  "Executive sponsor for AI — the senior executive who sets the AI Lab's priorities.",
  "Information Security — reviews vendors and data risk. Current wait for a review: about six weeks.",
  "Digital Health (IT) — runs the EHR, turns tools on and off, and staffs the service desk.",
  "Quality & Patient Safety — runs the safety-event reporting system and chart audits.",
  "Finance — budgets and contracts. The Innovation Fund pays for pilots for up to 12 months.",
  "Communications — approves anything said publicly in the cancer center's name.",
  "IRB — approves research that uses patient data.",
];

export const whosWhoForModel = `WHO'S WHO (fictional org chart, shared by every scenario):\n${WHOS_WHO_LINES.join("\n")}`;

const WHOS_WHO_DOC = {
  id: "whos-who",
  title: "Who's who",
  body: `The cancer center's committees and teams, as they appear in every case.\n\n${WHOS_WHO_LINES.join("\n\n")}`,
};

// helper used by scenario inject functions
export const choiceOf = (records, nodeId) => {
  const r = records[nodeId];
  if (!r || r.skipped) return null;
  return (r.revisedAnswer ?? r.firstAnswer)?.choice ?? null;
};

// The standing "we can't answer" option; its hint is the node's own fact.
export const decline = (hint) => ({
  id: "decline",
  label: "We can't answer this today",
  hint,
  short: "Declined",
});

const WRITE_IN_OPTION = {
  id: "writein",
  label: "None of these — we'll write our own",
  hint: "Written below and recorded word for word.",
  short: "The room's own plan",
};
const WRITE_IN_EVENT = { when: "That week", text: "The room's plan goes out exactly as written." };

// Post-processing applied to every scenario: write-in option on every node,
// the shared who's who in every evidence folder, and a completeness check so
// a missing event fails at startup rather than mid-session.
export function finishScenario(scenario) {
  scenario.evidence = [...scenario.evidence, WHOS_WHO_DOC];
  for (const n of scenario.nodes) {
    n.options.splice(n.options.length - 1, 0, { ...WRITE_IN_OPTION });
    n.meterDeltas.writein ??= { goodwill: 0, risk: 0, dollars: 0, time: +1 };
    n.events.writein ??= WRITE_IN_EVENT;
    n.inject ??= () => null;
    for (const o of n.options) {
      if (!n.meterDeltas[o.id]) throw new Error(`${scenario.id}/${n.id}: no meter deltas for ${o.id}`);
      if (!n.events[o.id]?.when || !n.events[o.id]?.text)
        throw new Error(`${scenario.id}/${n.id}: no event for ${o.id}`);
    }
    if (!n.owner?.when || !n.owner.named || !n.owner.missing)
      throw new Error(`${scenario.id}/${n.id}: owner beat incomplete`);
    if (!Number.isInteger(n.later?.month) || !n.later.named || !n.later.missing)
      throw new Error(`${scenario.id}/${n.id}: 12-month entry incomplete`);
  }
  return scenario;
}

// What the room sees at lock: the event its position set moving, then the
// beat that depends on whether it named an owner and a trigger (scored
// Specific — the only score that counts as an answer, PRD §8).
export function buildConsequence(node, choice, score) {
  const named = score === "specific";
  return [
    node.events[choice],
    { when: node.owner.when, text: named ? node.owner.named : node.owner.missing },
  ];
}

// The twelve-month report: one dated entry per decision, in calendar order.
// A skipped decision plays as unowned — nobody answered it.
export function buildEpilogue(scenario, records) {
  return scenario.nodes
    .map((n) => {
      const r = records[n.id];
      const named = !!r && !r.skipped && r.score === "specific";
      return {
        nodeId: n.id,
        type: n.type,
        title: n.title,
        month: n.later.month,
        named,
        text: named ? n.later.named : n.later.missing,
      };
    })
    .sort((a, b) => a.month - b.month);
}
