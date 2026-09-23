// Scenario 4 — "Live a Year, Drifted, Spread Beyond Approval" (enters at
// Monitoring). Fictional composite; the Phase 1 reference scenario, now with
// Villager beats and role cards.
import { choiceOf } from "./common.js";

export default {
  id: "s4",
  title: "Live a Year, Drifted, Spread Beyond Approval",
  entersAt: "Monitoring",
  tagline: "Approved for six months, one clinic. Fourteen months, three clinics later.",
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
  nodes: [
    {
      id: "risk_accept",
      type: "risk_accept",
      title: "Who is carrying this risk?",
      question:
        "ChartPilot is operating outside its approval in two clinics, on a model version nobody evaluated. Until a re-review happens, someone is carrying the residual risk — today, whether or not anyone has said so. Who accepts it, in writing — or who turns it off?",
      freeTextPrompt:
        "Name the specific person or role who accepts the residual risk (or who orders the shutdown), and what triggers revisiting it.",
      elders: ["steward"],
      options: [
        { id: "a", label: "Keep it running everywhere while an expedited re-review happens", hint: "Fastest for users. The risk stays live and someone must own it.", short: "Run everywhere" },
        { id: "b", label: "Restrict to the originally approved clinic; switch it off in Clinics B and C today", hint: "Honors the approval. Two clinics lose a tool they now depend on.", short: "Restrict to Clinic A" },
        { id: "c", label: "Suspend everywhere until the re-review completes", hint: "Cleanest risk posture. All three clinics feel it tomorrow morning.", short: "Suspend all" },
        { id: "decline", label: "We cannot answer this today", hint: "Recorded as an explicit gap, not a failure. It is also not free.", short: "Declined" },
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
        writein:
          "The room's own arrangement goes on the record verbatim. Risk doesn't care how novel the plan is — only whether the name and the trigger in it are real.",
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
        { id: "a", label: "Name a kill-switch owner with same-day authority, and the conditions that trigger it", hint: "Someone must hold it — and know they hold it.", short: "Named kill switch" },
        { id: "b", label: "The vendor contract is the off switch: non-renewal ends it at term", hint: "Clean, but nothing can end it before the renewal date.", short: "Contract is the switch" },
        { id: "c", label: "Fold it into the re-review: it ends if the review says so", hint: "The review is not staffed yet.", short: "Review decides" },
        { id: "decline", label: "We cannot answer this today", hint: "The off switch remains a support ticket.", short: "Declined" },
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
        writein: "An off-switch nobody has built before. It works exactly as well as the words the room just wrote — the record is the spec now.",
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
      freeTextPrompt: "Name who assigns the tier, and state whether it binds the tool or the use.",
      elders: ["cartographer"],
      inject: () =>
        "The governance office asks what tier the re-review should file ChartPilot under. There is no answer on record — for this tool or for the two clinics that adopted it sideways.",
      options: [
        { id: "a", label: "Tier the uses, not the tool: oncology note-drafting is one tier; any new use or population re-tiers", hint: "More work per use. The template loophole gets a name: an untiered use.", short: "Tier the uses" },
        { id: "b", label: "Tier the tool once, centrally; the tier travels with it wherever it's enabled", hint: "One decision. Clinic C's sickest patients inherit it unexamined.", short: "Tier the tool once" },
        { id: "c", label: "Adopt the vendor's own risk classification as the tier", hint: "Zero effort. The vendor also sells it.", short: "Vendor's rating" },
        { id: "decline", label: "We cannot answer this today", hint: "Untiered, ChartPilot remains whatever anyone needs it to be.", short: "Declined" },
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
        writein: "A tiering scheme of the room's own design. The governance office files it verbatim, and will apply it literally.",
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
      freeTextPrompt: "Name the decider, the advising body, and the date the decision is due.",
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
        { id: "a", label: "A single named decider, advised by one named body, decision due by a date", hint: "Someone's name goes on it. That is the point.", short: "One named decider" },
        { id: "b", label: "A joint committee of both bodies decides by vote", hint: "Nobody's name goes on it. That is also the point.", short: "Joint committee" },
        { id: "c", label: "Escalate to executive leadership to assign a decider", hint: "Leadership will ask: “who do you recommend?”", short: "Escalate up" },
        { id: "decline", label: "We cannot answer this today", hint: "The re-review becomes a standing agenda item.", short: "Declined" },
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
        writein: "A decision path no chart shows. It exists only in the sentence the room wrote — people will follow it exactly as far as that sentence is clear.",
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
      freeTextPrompt: "State the threshold (a number, a rate, a bar) and name who owns measuring it.",
      elders: ["decoupler"],
      options: [
        { id: "a", label: "Define it now: an omission-rate ceiling on a monthly audited sample, with a named audit owner", hint: "A number someone is paid to look at.", short: "Omission ceiling" },
        { id: "b", label: "Commission a formal validation study before setting thresholds", hint: "Rigorous. Funded by whom, finished when?", short: "Validation study" },
        { id: "c", label: "Clinical judgment: the clinics using it decide whether it's good enough", hint: "The clinics like it. The clinics also enabled it without approval.", short: "Clinics judge" },
        { id: "decline", label: "We cannot answer this today", hint: "No threshold means good enough by default.", short: "Declined" },
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
        writein: "A homemade threshold. If the number and its owner are in the writing, it will function; if not, it will comfort.",
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
      question: "What forces a re-review of ChartPilot — automatically, without a hero having to notice?",
      freeTextPrompt: "List the triggers, and name who watches for them.",
      elders: ["caretaker"],
      inject: () =>
        "Mid-review, the vendor announces CP-4.0: new model, new features, “seamless upgrade,” auto-deploying to all customers in 60 days.",
      options: [
        { id: "a", label: "Defined triggers — version change, new use, new population, threshold breach — each forces re-review, with a named watcher", hint: "Boring by design. Boring is the goal.", short: "Defined triggers" },
        { id: "b", label: "Annual scheduled re-review, calendar-driven", hint: "CP-4.0 lands eight months before the next calendar slot.", short: "Annual calendar" },
        { id: "c", label: "Contract change: the vendor must notify and wait for approval before updates", hint: "The vendor's counsel knows which tier that clause is sold on.", short: "Vendor must notify" },
        { id: "decline", label: "We cannot answer this today", hint: "CP-4.0 will deploy the way CP-3.4 did: silently.", short: "Declined" },
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
        writein: "A custom tripwire. It fires only if someone builds it — and the record now says who.",
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
      freeTextPrompt: "Name the budget owner (or owners) and what, exactly, each one is signing for.",
      elders: ["ledger"],
      inject: () =>
        "The renewal quote arrives mid-meeting: up 38%, plus a new optional “PilotWatch” monitoring module — the one thing everyone in this room has wished existed. The auto-renew clause executes in 30 days absent written notice.",
      options: [
        { id: "a", label: "One owner: a single department owns license, audits, and monitoring as a package, with sponsor sign-off", hint: "One signature, one line item, one throat to choke.", short: "One budget owner" },
        { id: "b", label: "Split it: clinics pay the license, quality pays audits, IT pays monitoring", hint: "Three budgets, three approval cycles, one renewal date.", short: "Split three ways" },
        { id: "c", label: "Bridge it from contingency or innovation funds while a permanent home is found", hint: "Bridges are where orphans live.", short: "Bridge funds" },
        { id: "decline", label: "We cannot answer this today", hint: "The auto-renew clause is the one decision that makes itself.", short: "Declined" },
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
        writein: "An arrangement the budget office has never seen. It will be honored precisely as written, including everything it doesn't say.",
      },
      epilogue: {
        held: "Renewal was a decision, not an event. The monitoring line item survived two budget cycles because it had an owner, not a wish.",
        broke: "Money stayed the question nobody owned. ChartPilot auto-renewed at the higher price, unmonitored — the most expensive way to not decide.",
      },
    },
  ],
  villagers: {
    risk_accept: {
      name: "The One Who Signs",
      line: "Fourteen months ago somebody's signature made this safe. He transferred. The safety didn't transfer with him.",
    },
    tier: {
      name: "The One Who Makes It Work Anyway",
      line: "I turned it on for Clinic B with a template because asking takes six weeks and my nurses were drowning. Tell me the six weeks buys something and I'll wait next time.",
    },
    proof: {
      name: "The One Who Stopped Asking",
      line: "I flagged three bad summaries to ‘whoever owns this now.’ That was five weeks ago. I still read every summary the long way.",
    },
    funding: {
      name: "The Person in the Chair",
      line: "My chart got summarized 1,840 times this week, somewhere in that number. Whatever you decide about budgets, the summaries happen to someone.",
    },
  },
  roleCards: {
    "The Doctor": {
      mandate: [
        "Responsible for: what ChartPilot's summaries do to clinical decisions in three clinics.",
        "Cannot agree to: continued expansion before the omission findings are bottomed out.",
        "Measured on: patient outcomes, and whether clinicians trust the chart.",
      ],
      asymmetric: [
        "You know two of the three flagged omissions involved lab trends that changed treatment timing — no harm, but only because someone double-checked.",
        "You know Clinic A's physicians now skim primary notes less since ChartPilot arrived. Nobody has measured this. You've watched it.",
      ],
    },
    "The Security Guard": {
      mandate: [
        "Responsible for: an unreviewed model reading and writing clinical notes at scale.",
        "Cannot agree to: any path with no named risk acceptor while review is pending.",
        "Measured on: incidents, and time-to-contain when something goes wrong.",
      ],
      asymmetric: [
        "You know shutting ChartPilot off requires a vendor support ticket — SLA 24 hours, best observed 19.",
        "You know CP-3.4's release notes mention “expanded training data sources” that were never disclosed for review.",
      ],
    },
    "The Money Manager": {
      mandate: [
        "Responsible for: the renewal, the +38%, and the monitoring module everyone suddenly wants.",
        "Cannot agree to: auto-renew executing by default on the vendor's terms.",
        "Measured on: variance, and licenses that outlive their sponsors.",
      ],
      asymmetric: [
        "You know the auto-renew notice deadline is 30 days out — inside the re-review's likely timeline. Doing nothing is signing.",
        "You know usage tripled but the license is seat-based: the price rise is contractual escalation, not usage. There's negotiating room nobody has used.",
      ],
    },
    "The AI Guru": {
      mandate: [
        "Responsible for: what CP-2.1 → CP-3.4 actually changed, and what CP-4.0 will.",
        "Cannot agree to: treating model versions as interchangeable in any review.",
        "Measured on: whether deployed behavior matches evaluated behavior.",
      ],
      asymmetric: [
        "You know the omission pattern in the quality sample matches a known CP-3.x summarization regression discussed openly in the vendor's user forum.",
        "You know PilotWatch — the monitoring module — would have caught the version drift a year ago. The vendor unbundled it deliberately.",
      ],
    },
    "The Competitive Marketing Leader": {
      mandate: [
        "Responsible for: what “we run AI documentation” means when peers and press ask.",
        "Cannot agree to: external claims about a tool currently outside its own approval.",
        "Measured on: credibility, especially in a walk-back.",
      ],
      asymmetric: [
        "You know the vendor's website lists the institution as a “scaled deployment” case study. The approval said one clinic, six months.",
        "You know a peer CMIO asked about ChartPilot at a conference last month, and the colleague who answered described the three-clinic footprint as intentional.",
      ],
    },
  },
};
