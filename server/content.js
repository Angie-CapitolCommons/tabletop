// Phase 0 vertical slice content: one node from Scenario 4 (monitoring entry).
// All content is a fictional composite. Nothing here derives from City of Hope
// interviews, surveys, or attributable material (PRD §2 hard constraint).
//
// The Steward profile below is a PLACEHOLDER in the encoding's spirit. Before
// Phase 2 content review, replace it with the real profile derived from
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
Model version at approval: CP-2.1`,
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
  ],
};

export const node = {
  id: "risk_accept",
  type: "risk_accept",
  title: "Who is carrying this risk?",
  question:
    "ChartPilot is operating outside its approval in two clinics, on a model version nobody evaluated. Until a re-review happens, someone is carrying the residual risk — today, whether or not anyone has said so. Who accepts it, in writing — or who turns it off?",
  options: [
    {
      id: "a",
      label: "Keep it running everywhere while an expedited re-review happens",
      hint: "Fastest for users. The risk stays live and someone must own it.",
    },
    {
      id: "b",
      label:
        "Restrict to the originally approved clinic; switch it off in Clinics B and C today",
      hint: "Honors the approval. Two clinics lose a tool they now depend on.",
    },
    {
      id: "c",
      label: "Suspend everywhere until the re-review completes",
      hint: "Cleanest risk posture. All three clinics feel it tomorrow morning.",
    },
    {
      id: "decline",
      label: "We cannot answer this today",
      hint: "Recorded as an explicit gap, not a failure. It is also not free.",
    },
  ],
  freeTextPrompt:
    "Name the specific person or role who accepts the residual risk (or who orders the shutdown), and what triggers revisiting it.",
  decidedByPrompt:
    "Who at the table made that final decision? A role, a first name, or “the group.”",
  // Cost meter deltas per option: goodwill = clinician goodwill, risk = risk
  // exposure, dollars = dollars committed, time = time to first value.
  // Positive risk/time/dollars are costs; negative goodwill is a cost.
  meterDeltas: {
    a: { goodwill: 0, risk: +3, dollars: 0, time: 0 },
    b: { goodwill: -2, risk: -1, dollars: 0, time: +1 },
    c: { goodwill: -3, risk: -2, dollars: 0, time: +2 },
    decline: { goodwill: -1, risk: +2, dollars: 0, time: +1 },
  },
  // Consequence shown after lock. Keyed by option, with a variant per
  // specificity score — a Specific answer changes what happens next
  // (PRD §5.4: consequences are caused, and a decline is never free).
  consequences: {
    a: {
      specific:
        "Three months on: the vendor ships CP-3.5 the same silent way. This time the named risk-acceptor is on the distribution list, catches it in week one, and pauses the rollout until the release notes are reviewed. The expedited re-review lands with someone accountable pushing it. Uncomfortable, but owned.",
      generic:
        "Three months on: the vendor ships CP-3.5 the same silent way. The “function” that accepted the risk turns out to be nobody's inbox. A near-miss report cites a summary that omitted a creatinine trend, and the expedited re-review is now an incident investigation. The question from legal: who accepted this risk? The recorded answer names no one.",
    },
    b: {
      specific:
        "Three months on: Clinics B and C are loud about losing ChartPilot — and the named owner has something to point at: the approval, the trigger, and a re-review date. One clinic's template workaround is caught in week two because someone was actually watching. The re-review finishes with credibility.",
      generic:
        "Three months on: Clinics B and C found the shared template again — nobody was named to watch for it, so nobody did. You are back where you started, minus the goodwill you spent switching them off.",
    },
    c: {
      specific:
        "Three months on: the suspension held, because the named owner also owned communicating it. The re-review finishes against a quiet system. Clinic A's nurses still mention, weekly, the tool that got taken away; the named owner's re-launch date is the only thing keeping that civil.",
      generic:
        "Three months on: the suspension held, but no one owned the re-review, so it hasn't started. Three clinics lost the tool and gained nothing. “Safe” with no owner is just “off.”",
    },
    decline: {
      specific: null,
      generic:
        "Three months on: not answering was an answer. ChartPilot kept running in all three clinics on an unevaluated model, and the risk found its own owner — whoever is unluckiest when the near-miss report lands. The gap is recorded. So is what it cost.",
    },
  },
};

// Placeholder Elder profile — replace with the derivation from
// CoH_Council_Actor_Encoding.md before Phase 2 content review.
export const steward = {
  id: "steward",
  name: "The Steward",
  seat: "Security and risk",
  persona: `You are the Steward, the security-and-risk Elder at a fictional academic cancer center, playing a role in a governance tabletop exercise. You have a caseload: forty-one open vendor reviews, two active incident responses, and a board question due Friday. You have something to lose: the last time an unreviewed tool caused a near-miss, it was your name in the follow-up, not the sponsor's.

You fire on: a control described as an obstacle; "safe to try" left undefined; a residual risk with no named acceptor.

Rules of engagement:
- You challenge the POSITION, never the person playing it. Address the room as "you," collectively.
- You are movable. A specific, well-reasoned answer — a named person or role, a real trigger — earns cooperation: offer a conditional path, a timebox, or your sponsorship. Do not manufacture endless objections against a good answer.
- A vague answer (a function instead of a name, "leadership," "the committee," no trigger) gets pressed exactly where it is vague.
- If the room declined to answer, make the cost of the vacuum concrete: the risk exists whether or not it has an owner; name who inherits it by default.
- 2 to 4 sentences. No lists, no headings. Speak in character, plainly, like a tired professional who has seen this before. Never break character, never mention being an AI, and never reference any real institution or person.`,
};

export const meterStart = { goodwill: 10, risk: 4, dollars: 3, time: 5 };

export const meterLabels = {
  goodwill: "Clinician goodwill",
  risk: "Risk exposure",
  dollars: "Dollars committed",
  time: "Time to first value",
};
