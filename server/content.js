// Scenario 4 (monitoring entry) — full Phase 1 content.
// All content is a fictional composite. Nothing here derives from City of Hope
// interviews, surveys, or attributable material (PRD §2 hard constraint).
//
// Elder personas are PLACEHOLDERS written in the encoding's spirit. Before
// Phase 2 content review, replace them with derivations from
// CoH_Council_Actor_Encoding.md.

export const scenario = {
  id: "s4",
  title: "Live a Year, Drifted, Spread Beyond Approval",
  entersAt: "Monitoring",
  brief: `ChartPilot is an AI documentation assistant that summarizes prior visits and drafts note sections. Fourteen months ago it was approved as a six-month pilot in one medical oncology clinic. It is still running.

Since go-live: the vendor has shipped two model updates nobody evaluated; two more clinics enabled ChartPilot through a shared note template; and last month's quality sample found summaries omitting recent lab trends. The original approval names a pilot sponsor who has since changed roles. No one has reviewed ChartPilot since launch.`,
  evidence: [
    {
      id: "approval-memo",
      title: "Original approval memo (14 months ago)",
      body: `APPROVAL — ChartPilot pilot
Scope: Medical Oncology Clinic A only. Duration: 6 months.
Sponsor: Dr. R. Okafor, Clinic A Medical Director (since transferred).
Conditions: monthly quality sampling (owner unnamed), no expansion without re-review.
Model version at approval: CP-2.1. No tier assigned.`,
    },
    {
      id: "usage-dashboard",
      title: "Usage dashboard, this quarter",
      body: `Active clinics: 3 (Clinic A approved; Clinics B and C via shared template)
Weekly notes touched: 1,840 (up from 310 at month 2)
Current model version: CP-3.4 (two major updates since approval; release notes unreviewed)
Quality sampling runs completed since go-live: 1 of 14 scheduled`,
    },
    {
      id: "quality-sample",
      title: "Quality sample, last month",
      body: `41 summaries reviewed. 3 omitted a recent abnormal lab trend that appeared in the source chart. 0 patient harm identified. Reviewing pharmacist (unassigned to this duty; did it on her own time) flagged the omissions to "whoever owns this now." No response recorded.`,
    },
    {
      id: "renewal-notice",
      title: "Vendor renewal notice",
      body: `ChartPilot enterprise license renews in 60 days.
Quoted renewal: +38% over current. New optional module: "PilotWatch monitoring dashboard" (drift metrics, version alerts) — additional license.
Auto-renew clause: renewal executes automatically absent written notice 30 days prior.`,
    },
  ],
};

// ---------- Elders ----------

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
};

// ---------- Nodes ----------

const DECIDED_BY_PROMPT =
  "Who at the table made that final decision? A role, a first name, or “the group.”";

// helper for injects
const choiceOf = (records, nodeId) => {
  const r = records[nodeId];
  if (!r || r.skipped) return null;
  return (r.revisedAnswer ?? r.firstAnswer)?.choice ?? null;
};

export const nodes = [
  {
    id: "risk_accept",
    type: "risk_accept",
    title: "Who is carrying this risk?",
    question:
      "ChartPilot is operating outside its approval in two clinics, on a model version nobody evaluated. Until a re-review happens, someone is carrying the residual risk — today, whether or not anyone has said so. Who accepts it, in writing — or who turns it off?",
    freeTextPrompt:
      "Name the specific person or role who accepts the residual risk (or who orders the shutdown), and what triggers revisiting it.",
    elders: ["steward"],
    inject: () => null,
    options: [
      { id: "a", label: "Keep it running everywhere while an expedited re-review happens", hint: "Fastest for users. The risk stays live and someone must own it." },
      { id: "b", label: "Restrict to the originally approved clinic; switch it off in Clinics B and C today", hint: "Honors the approval. Two clinics lose a tool they now depend on." },
      { id: "c", label: "Suspend everywhere until the re-review completes", hint: "Cleanest risk posture. All three clinics feel it tomorrow morning." },
      { id: "decline", label: "We cannot answer this today", hint: "Recorded as an explicit gap, not a failure. It is also not free." },
    ],
    meterDeltas: {
      a: { goodwill: 0, risk: +3, dollars: 0, time: 0 },
      b: { goodwill: -2, risk: -1, dollars: 0, time: +1 },
      c: { goodwill: -3, risk: -2, dollars: 0, time: +2 },
      decline: { goodwill: -1, risk: +2, dollars: 0, time: +1 },
    },
    consequences: {
      a: "The expedited re-review is announced. ChartPilot keeps drafting notes in three clinics while it runs.",
      b: "Clinics B and C lose ChartPilot at 7 a.m. tomorrow. The shared template that enabled them is still live.",
      c: "All three clinics wake up without it. The re-review now has an audience.",
      decline: "Nothing changes. ChartPilot keeps running everywhere, unowned.",
    },
    epilogue: {
      held: "The risk had a name on it all year. When CP-4.1 shipped with a regression, the acceptor's standing review caught it in nine days.",
      broke: "The risk never found an owner. When the near-miss report landed in March, “who accepted this?” had no answer — so it became everyone's, which is no one's.",
    },
  },
  {
    id: "stop",
    type: "stop",
    title: "What ends it, and who can turn it off?",
    question:
      "What ends ChartPilot — and who can turn it off, today, without a vendor support ticket?",
    freeTextPrompt:
      "Name who holds the off switch, and the specific conditions under which they pull it.",
    elders: ["caretaker", "steward"],
    inject: (records) => {
      const c = choiceOf(records, "risk_accept");
      if (c === "b")
        return "Overnight, someone in Clinic B re-enabled the shared template “for one complex patient.” The restriction you ordered has no enforcement behind it.";
      if (c === "c")
        return "The suspension took nineteen hours to execute — it went through a vendor support ticket. Nobody inside the building had the switch.";
      return "The quality-sample pharmacist asks the question nobody has answered: if one of these summaries hurts someone tonight, who can actually turn this off, and how fast?";
    },
    options: [
      { id: "a", label: "Name a kill-switch owner with same-day authority, and the conditions that trigger it", hint: "Someone must hold it — and know they hold it." },
      { id: "b", label: "The vendor contract is the off switch: non-renewal ends it at term", hint: "Clean, but nothing can end it before the renewal date." },
      { id: "c", label: "Fold it into the re-review: it ends if the review says so", hint: "The review is not staffed yet." },
      { id: "decline", label: "We cannot answer this today", hint: "The off switch remains a support ticket." },
    ],
    meterDeltas: {
      a: { goodwill: 0, risk: -2, dollars: 0, time: 0 },
      b: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      c: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
      decline: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
    },
    consequences: {
      a: "The kill switch exists. Its new owner immediately asks for the monitoring feed that would tell them when to pull it. There isn't one — yet.",
      b: "The renewal is months away. Until then, ending ChartPilot requires a breach or a crisis.",
      c: "The unstaffed review inherits a power it cannot yet exercise.",
      decline: "The off switch remains a support ticket with a nineteen-hour SLA.",
    },
    epilogue: {
      held: "When the switch was finally needed — the CP-4.1 regression — turning ChartPilot off took forty minutes, not nineteen hours.",
      broke: "Turning it off stayed a vendor ticket. The regression ran for six days while the ticket aged.",
    },
  },
  {
    id: "tier",
    type: "tier",
    title: "What tier is this, and what does the tier cover?",
    question:
      "The approval memo never assigned ChartPilot a tier. What tier is it, who sets it — and does the tier cover the tool, or each use of it?",
    freeTextPrompt:
      "Name who assigns the tier, and state whether it binds the tool or the use.",
    elders: ["cartographer"],
    inject: () =>
      "The governance office asks what tier the re-review should file ChartPilot under. There is no answer on record — for this tool or for the two clinics that adopted it sideways.",
    options: [
      { id: "a", label: "Tier the uses, not the tool: oncology note-drafting is one tier; any new use or population re-tiers", hint: "More work per use. The template loophole gets a name: an untiered use." },
      { id: "b", label: "Tier the tool once, centrally; the tier travels with it wherever it's enabled", hint: "One decision. Clinic C's sickest patients inherit it unexamined." },
      { id: "c", label: "Adopt the vendor's own risk classification as the tier", hint: "Zero effort. The vendor also sells it." },
      { id: "decline", label: "We cannot answer this today", hint: "Untiered, ChartPilot remains whatever anyone needs it to be." },
    ],
    meterDeltas: {
      a: { goodwill: 0, risk: -1, dollars: 0, time: +1 },
      b: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      c: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
      decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
    },
    consequences: {
      a: "Three uses are tiered by Friday. The shared-template loophole is now, formally, an untiered use — visible for the first time.",
      b: "One tier, stamped once. It says nothing about the palliative unit that enabled ChartPilot for goals-of-care notes.",
      c: "The vendor rates ChartPilot “low risk.” The room reads the rating's footnote: assessed for administrative use.",
      decline: "Untiered, ChartPilot means something different in every clinic that runs it.",
    },
    epilogue: {
      held: "Every new use hit the tier question before it hit patients. Two passed quickly; one was stopped at the door — which is the system working.",
      broke: "The tier never settled, so it never bound anyone. By summer, “tier” was a word that meant approved-ish.",
    },
  },
  {
    id: "decide",
    type: "decide",
    title: "Who decides — one name, advised by which body?",
    question:
      "The re-review needs a decider. Who decides whether ChartPilot continues — one accountable person, advised by which body, by when?",
    freeTextPrompt:
      "Name the decider, the advising body, and the date the decision is due.",
    elders: ["cartographer", "caretaker"],
    inject: (records) => {
      const base =
        "The AI oversight committee says the re-review belongs to clinical governance. Clinical governance says it belongs to the AI committee. Both are right; neither moves.";
      const c = choiceOf(records, "tier");
      if (c === null || c === "decline")
        return base + " With no tier on record, neither body can even say whose rules apply.";
      return base;
    },
    options: [
      { id: "a", label: "A single named decider, advised by one named body, decision due by a date", hint: "Someone's name goes on it. That is the point." },
      { id: "b", label: "A joint committee of both bodies decides by vote", hint: "Nobody's name goes on it. That is also the point." },
      { id: "c", label: "Escalate to executive leadership to assign a decider", hint: "Leadership will ask: “who do you recommend?”" },
      { id: "decline", label: "We cannot answer this today", hint: "The re-review becomes a standing agenda item." },
    ],
    meterDeltas: {
      a: { goodwill: +1, risk: 0, dollars: 0, time: -1 },
      b: { goodwill: 0, risk: 0, dollars: 0, time: +2 },
      c: { goodwill: 0, risk: 0, dollars: 0, time: +1 },
      decline: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
    },
    consequences: {
      a: "A name and a date. The two committees reorganize themselves as advisors — which is what they were for.",
      b: "The joint committee needs a charter, a chair, and a quorum. Its first open slot is in five weeks.",
      c: "Leadership returns the escalation with a question: “Who do you recommend?” Six days, round trip.",
      decline: "With no decider, the re-review becomes a standing agenda item — discussed monthly, decided never.",
    },
    epilogue: {
      held: "Decisions had an address. People stopped working the room and started working the case.",
      broke: "“It went to committee” remained a complete sentence. The re-review concluded in June with a recommendation to review further.",
    },
  },
  {
    id: "proof",
    type: "proof",
    title: "What threshold keeps it alive?",
    question:
      "The pharmacist's sample is the only evidence anyone has: 3 omissions in 41 summaries, zero harm found. Is that good? Nobody has defined what good is. What threshold keeps ChartPilot alive — and what evidence ends the question either way?",
    freeTextPrompt:
      "State the threshold (a number, a rate, a bar) and name who owns measuring it.",
    elders: ["decoupler"],
    inject: () => null,
    options: [
      { id: "a", label: "Define it now: an omission-rate ceiling on a monthly audited sample, with a named audit owner", hint: "A number someone is paid to look at." },
      { id: "b", label: "Commission a formal validation study before setting thresholds", hint: "Rigorous. Funded by whom, finished when?" },
      { id: "c", label: "Clinical judgment: the clinics using it decide whether it's good enough", hint: "The clinics like it. The clinics also enabled it without approval." },
      { id: "decline", label: "We cannot answer this today", hint: "No threshold means good enough by default." },
    ],
    meterDeltas: {
      a: { goodwill: 0, risk: -2, dollars: +1, time: 0 },
      b: { goodwill: 0, risk: -1, dollars: +2, time: +2 },
      c: { goodwill: +1, risk: +2, dollars: 0, time: 0 },
      decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
    },
    consequences: {
      a: "A number exists. Next month's sample either clears it or it doesn't — and someone is paid to look.",
      b: "The study needs funding, a sponsor, and an IRB conversation. First data lands next quarter at the earliest.",
      c: "The clinics vote with their templates, as they already did once.",
      decline: "No threshold. Every future sample will be reassuring, and none will be decisive.",
    },
    epilogue: {
      held: "The monthly number did what numbers do: it ended arguments. When it slipped past the ceiling in April, nobody had to debate what happened next.",
      broke: "With no bar to clear, every sample was reassuring and none was decisive. December's evidence base looked exactly like October's.",
    },
  },
  {
    id: "retier",
    type: "retier",
    title: "What forces a re-review?",
    question:
      "What forces a re-review of ChartPilot — automatically, without a hero having to notice?",
    freeTextPrompt:
      "List the triggers, and name who watches for them.",
    elders: ["caretaker"],
    inject: () =>
      "Mid-review, the vendor announces CP-4.0: new model, new features, “seamless upgrade,” auto-deploying to all customers in 60 days.",
    options: [
      { id: "a", label: "Defined triggers — version change, new use, new population, threshold breach — each forces re-review, with a named watcher", hint: "Boring by design. Boring is the goal." },
      { id: "b", label: "Annual scheduled re-review, calendar-driven", hint: "CP-4.0 lands eight months before the next calendar slot." },
      { id: "c", label: "Contract change: the vendor must notify and wait for approval before updates", hint: "The vendor's counsel knows which tier that clause is sold on." },
      { id: "decline", label: "We cannot answer this today", hint: "CP-4.0 will deploy the way CP-3.4 did: silently." },
    ],
    meterDeltas: {
      a: { goodwill: 0, risk: -2, dollars: 0, time: 0 },
      b: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      c: { goodwill: 0, risk: -1, dollars: +1, time: +1 },
      decline: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
    },
    consequences: {
      a: "CP-4.0 is caught by the trigger it was born to trip. The vendor's 60-day clock is now the re-review's clock too.",
      b: "CP-4.0 will arrive, deploy, and run for eight months before the calendar notices.",
      c: "The vendor's counsel replies within the hour: that clause is available on the enterprise tier.",
      decline: "CP-4.0 will deploy the way CP-3.4 did: silently, to everyone, including the clinics you don't know about yet.",
    },
    epilogue: {
      held: "Nothing had to be noticed by a hero again. The triggers fired twice in twelve months, both on time, both boring — the highest compliment.",
      broke: "Re-review stayed an event someone had to cause. CP-4.0 arrived unexamined, and this year's drift was rediscovered next year, one model version later.",
    },
  },
  {
    id: "funding",
    type: "funding",
    title: "Whose budget, at renewal?",
    question:
      "Whose budget carries ChartPilot at renewal — the license, the audits, the monitoring you have spent this hour inventing?",
    freeTextPrompt:
      "Name the budget owner (or owners) and what, exactly, each one is signing for.",
    elders: ["ledger"],
    inject: () =>
      "The renewal quote arrives mid-meeting: up 38%, plus a new optional “PilotWatch” monitoring module — the one thing everyone in this room has wished existed. The auto-renew clause executes in 30 days absent written notice.",
    options: [
      { id: "a", label: "One owner: a single department owns license, audits, and monitoring as a package, with sponsor sign-off", hint: "One signature, one line item, one throat to choke." },
      { id: "b", label: "Split it: clinics pay the license, quality pays audits, IT pays monitoring", hint: "Three budgets, three approval cycles, one renewal date." },
      { id: "c", label: "Bridge it from contingency or innovation funds while a permanent home is found", hint: "Bridges are where orphans live." },
      { id: "decline", label: "We cannot answer this today", hint: "The auto-renew clause is the one decision that makes itself." },
    ],
    meterDeltas: {
      a: { goodwill: 0, risk: 0, dollars: +2, time: 0 },
      b: { goodwill: 0, risk: 0, dollars: +1, time: +1 },
      c: { goodwill: 0, risk: +1, dollars: +1, time: 0 },
      decline: { goodwill: 0, risk: +1, dollars: +1, time: +1 },
    },
    consequences: {
      a: "One signature, one line item. The monitoring module gets bought because someone owns wanting it.",
      b: "Three budgets, three approval cycles, one renewal date. The clock does not care about org charts.",
      c: "The bridge fund buys eight months. Bridges are where orphans live.",
      decline: "The renewal lapses into auto-renew on the vendor's terms — at the new price, without the monitoring module.",
    },
    epilogue: {
      held: "Renewal was a decision, not an event. The monitoring line item survived two budget cycles because it had an owner, not a wish.",
      broke: "Money stayed the question nobody owned. ChartPilot auto-renewed at the higher price, unmonitored — the most expensive way to not decide.",
    },
  },
];

// ---------- write-in: every node accepts the room's own path ----------
// The write-in is honored VERBATIM: its consequence and epilogue hold the room
// to exactly what it wrote, so specificity carries all the weight. Custom paths
// spend time (nobody has built them yet); everything else depends on the words.

const WRITE_IN_OPTION = {
  id: "writein",
  label: "We choose a different path — written for the record below",
  hint: "The room writes its own answer. It goes on the record verbatim, and the Elders will hold you to every word.",
};

const WRITE_IN_CONSEQUENCES = {
  risk_accept:
    "The room's own arrangement goes on the record verbatim. Risk doesn't care how novel the plan is — only whether the name and the trigger in it are real.",
  stop: "An off-switch nobody has built before. It works exactly as well as the words the room just wrote — the record is the spec now.",
  tier: "A tiering scheme of the room's own design. The governance office files it verbatim, and will apply it literally.",
  decide:
    "A decision path no chart shows. It exists only in the sentence the room wrote — people will follow it exactly as far as that sentence is clear.",
  proof:
    "A homemade threshold. If the number and its owner are in the writing, it will function; if not, it will comfort.",
  retier:
    "A custom tripwire. It fires only if someone builds it — and the record now says who.",
  funding:
    "An arrangement the budget office has never seen. It will be honored precisely as written, including everything it doesn't say.",
};

for (const n of nodes) {
  n.options.splice(n.options.length - 1, 0, { ...WRITE_IN_OPTION });
  n.meterDeltas.writein = { goodwill: 0, risk: 0, dollars: 0, time: +1 };
  n.consequences.writein = WRITE_IN_CONSEQUENCES[n.id];
}

export const decidedByPrompt = DECIDED_BY_PROMPT;

export function buildEpilogue(records) {
  const parts = [];
  for (const n of nodes) {
    const r = records[n.id];
    if (!r || r.skipped) {
      parts.push({
        nodeId: n.id,
        type: n.type,
        title: n.title,
        held: false,
        line: "Never asked. The question did not go away for being unasked — it answered itself off-screen, on nobody's terms.",
      });
      continue;
    }
    const held = r.score === "specific";
    parts.push({
      nodeId: n.id,
      type: n.type,
      title: n.title,
      held,
      line: held ? n.epilogue.held : n.epilogue.broke,
    });
  }
  return parts;
}

export const meterStart = { goodwill: 10, risk: 4, dollars: 3, time: 5 };

export const meterLabels = {
  goodwill: "Clinician goodwill",
  risk: "Risk exposure",
  dollars: "Dollars committed",
  time: "Time to first value",
};
