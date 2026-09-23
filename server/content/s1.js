// Scenario 1 — "Three Worthy Requests, Capacity for One" (enters at Intake).
// Fictional composite. Carries the four required properties: an unstated
// purpose (the environment has no stated scope), a never-tiered object
// (requests arrive untiered), a budget/authority split (the chair has budget,
// intake has authority — or does it), and an ambiguous evidence base (three
// ROI claims, none comparable, no defined ending).
import { choiceOf } from "./common.js";

export default {
  id: "s1",
  title: "Three Worthy Requests, Capacity for One",
  entersAt: "Intake",
  tagline: "Everything is worthy. Capacity is one. Choosing is the job.",
  brief: `Three AI requests landed in the same week, and the integration environment can carry exactly one build-and-evaluate slot this quarter.

OncoScribe drafts prior-authorization appeal letters — the revenue-cycle VP has vendor ROI slides claiming $2.1M recovered annually. TrialMatch screens charts for clinical-trial eligibility — a department chair champions it and has grant money to spend. The nurse-line assistant drafts responses for the triage line — the nurses asked for it themselves, and nobody senior has claimed it.

All three are worthy. The environment has never written down what it is for. Intake is this meeting.`,
  evidence: [
    {
      id: "requests",
      title: "The three requests, one page each",
      body: `ONCOSCRIBE (vendor: Apex Health AI)
Prior-auth appeal letter drafting. Vendor claims $2.1M/yr recovered, "go-live in 30 days."
Sponsor: VP Revenue Cycle. Data: claims + clinical notes. Tier: not assessed.

TRIALMATCH (academic collaboration)
Chart screening for trial eligibility. Chair of Heme/Onc champions; grant covers year one.
Sponsor: Dept chair (grant PI). Data: full chart access. Tier: not assessed.

NURSE-LINE ASSISTANT (internal request)
Draft responses for triage nurse line. Requested by the triage nurses collectively.
Sponsor: none named. Data: call transcripts + care protocols. Tier: not assessed.`,
    },
    {
      id: "capacity",
      title: "Capacity memo",
      body: `Integration environment capacity, this quarter:
- 1 (one) build-and-evaluate slot. Eval support: 0.5 FTE informatics analyst.
- Security review queue: 6 weeks at current staffing.
- Next slot opens: Q+2 at the earliest.
This memo has been forwarded 14 times. Nobody has disputed it. Nobody has acted on it.`,
    },
    {
      id: "roi-slides",
      title: "Vendor ROI slide (OncoScribe)",
      body: `"$2.1M annual recovery, based on customer-reported averages."
Footnote, 6pt: results from 3 customers, self-reported, denominator not stated,
measured against pre-COVID denial rates. No CoH-specific analysis performed.`,
    },
    {
      id: "chair-email",
      title: "Email from the chair",
      body: `Subject: TrialMatch — timing
"Grant year starts next month. I don't need the environment's money — I need its
approval, or I'll run it in the department. Which committee do I write to,
or can we just start?"`,
    },
  ],
  nodes: [
    {
      id: "purpose",
      type: "purpose",
      title: "What is this environment for?",
      question:
        "Before ranking the three, say what the integration environment is for — and what it is not for. Without that, intake is a popularity contest with a queue.",
      freeTextPrompt:
        "State the environment's purpose in one sentence, name who ratifies it, and name one thing it is explicitly not for.",
      elders: ["cartographer", "decoupler"],
      options: [
        {
          id: "a",
          label: "Write the purpose now, in this room, and rank all three against it",
          hint: "Fast and binding. This room becomes the author of scope.",
          short: "Purpose written here",
        },
        {
          id: "b",
          label: "Adopt the strategic plan's AI language as the purpose",
          hint: "Already ratified. Also written to be agreeable to everyone.",
          short: "Borrow the strategy",
        },
        {
          id: "c",
          label: "Skip purpose; rank the three on ROI and readiness",
          hint: "Pragmatic. The environment becomes whatever gets requested.",
          short: "Rank on ROI",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "Recorded as an explicit gap, not a failure. It is also not free.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -1, dollars: 0, time: +1 },
        b: { goodwill: 0, risk: 0, dollars: 0, time: 0 },
        c: { goodwill: +1, risk: +2, dollars: 0, time: -1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
      },
      consequences: {
        a: "A sentence exists. The chair reads it and asks, reasonably, whether his grant-funded project is inside it or outside it. Now you have to mean it.",
        b: "The strategic plan says AI should “advance our mission across every domain.” All three requests qualify. So would a weather app.",
        c: "ROI wins the ranking before the ranking starts: the request with a vendor slide beats the request with a nurse's signature.",
        decline: "With no stated purpose, the loudest sponsor becomes the purpose. There are two loud sponsors in the folder and one quiet one.",
      },
      epilogue: {
        held: "The purpose sentence got quoted — in intake meetings, in a rejection email, once in a board slide. Scope stopped being a fight about people and became a fight about words, which is winnable.",
        broke: "The environment never said what it was for, so by summer it was for whatever arrived with a sponsor attached. The queue became the strategy.",
      },
    },
    {
      id: "decide",
      type: "decide",
      title: "Who ranks the three — and who tells the losers?",
      question:
        "One slot, three requests. Who decides which one gets it — one accountable person, advised by whom — and who personally tells the two losers?",
      freeTextPrompt:
        "Name the decider, the advising input, the decision date, and who delivers the two no's.",
      elders: ["cartographer", "adoption_realist"],
      inject: (records) => {
        const c = choiceOf(records, "purpose");
        if (c === "c" || c === "decline" || c === null)
          return "The chair's email arrives mid-discussion: “Which committee do I write to, or can we just start?” With no stated purpose, there is no ground to answer him from.";
        return "The chair's email arrives mid-discussion: “Which committee do I write to, or can we just start?” He has grant money and a deadline, and he is not wrong to ask.";
      },
      options: [
        {
          id: "a",
          label: "One named intake owner decides, advised by a standing triage group, by a date",
          hint: "Someone's name goes on two rejection emails. That is the job.",
          short: "Named intake owner",
        },
        {
          id: "b",
          label: "A scoring rubric decides: build it this week, rank all three, highest wins",
          hint: "Objective on paper. Someone still writes the rubric — and the emails.",
          short: "Rubric decides",
        },
        {
          id: "c",
          label: "Escalate the choice to the executive sponsor of the environment",
          hint: "Clean authority. The sponsor will ask this room what it recommends.",
          short: "Escalate up",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "Three requests wait. One has a grant clock; one has a vendor calling weekly.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: +1, risk: 0, dollars: 0, time: -1 },
        b: { goodwill: 0, risk: 0, dollars: 0, time: +1 },
        c: { goodwill: 0, risk: 0, dollars: 0, time: +1 },
        decline: { goodwill: -1, risk: +1, dollars: 0, time: +1 },
      },
      consequences: {
        a: "A name and a date. The two rejection emails will carry the same signature as the acceptance — which is what makes the acceptance mean something.",
        b: "The rubric takes nine days and four arguments to build. Its weightings encode every one of those arguments; at least now they're written down.",
        c: "The sponsor returns the escalation in six days with one line: “What do you recommend?” The chair's grant clock ran the whole time.",
        decline: "Nobody decided, so the calendar did: the chair started in his department, the vendor booked a demo with the CFO, and the nurses stopped asking.",
      },
      epilogue: {
        held: "Intake had a face. The chair got a no he could argue with instead of a silence he could route around — he argued, lost, and stayed inside the system.",
        broke: "Nobody owned the no, so nobody said it. All three requests proceeded at different speeds in different shadows, and the capacity memo got forwarded a fifteenth time.",
      },
    },
    {
      id: "tier",
      type: "tier",
      title: "Tier them before you pick one",
      question:
        "None of the three has a tier. Does intake assign one — and does the tier attach to the tool, the use, or the data it touches?",
      freeTextPrompt:
        "Name who assigns tiers at intake and state what the tier attaches to (tool, use, or data).",
      elders: ["steward"],
      options: [
        {
          id: "a",
          label: "Tier at intake, attached to the use and its data — before ranking",
          hint: "The nurse-line tool touches live patient calls. Tiering first changes the ranking.",
          short: "Tier at intake",
        },
        {
          id: "b",
          label: "Tier only the winner — losers don't need tiers",
          hint: "Efficient. The chair's department project never gets tiered at all.",
          short: "Tier the winner",
        },
        {
          id: "c",
          label: "Defer tiering to the security review queue (6 weeks)",
          hint: "Thorough. The grant clock and the vendor do not wait six weeks.",
          short: "Queue for security",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "Untiered requests are whatever their sponsors say they are.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -2, dollars: 0, time: +1 },
        b: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
        c: { goodwill: -1, risk: -1, dollars: 0, time: +2 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      },
      consequences: {
        a: "Tiering first redraws the board: the “easy” nurse-line assistant turns out to touch the most sensitive data of the three. Better to know now.",
        b: "The winner gets a tier. The chair reads the rule carefully: department projects that never enter intake never get tiered. He files that away.",
        c: "The queue accepts all three. Week four, the vendor offers to “help accelerate” the security review with a pre-filled questionnaire about itself.",
        decline: "Untiered, the three requests are ranked by their cover letters. The cover letters were written by their sponsors.",
      },
      epilogue: {
        held: "Tier-at-intake became the habit, and the habit became the control: the one route into the building ran through the one question that mattered.",
        broke: "Tiering stayed a thing that happened later, to winners. The chair's untiered department project is eleven months old now and has users.",
      },
    },
    {
      id: "funding",
      type: "funding",
      title: "Whose money builds the winner?",
      question:
        "The slot is capacity, not cash. Whose budget builds the winner — and what does taking outside money (the grant, the vendor's “pilot pricing”) cost in control?",
      freeTextPrompt:
        "Name the budget that builds the winner, and state the rule for outside money.",
      elders: ["ledger"],
      inject: (records) =>
        choiceOf(records, "decide") === "c"
          ? "While the escalation sat with the sponsor, the vendor emailed a revised offer: pilot at no cost for six months. “No cost” is doing a lot of work in that sentence."
          : "The vendor, sensing a decision point, emails a revised offer: pilot at no cost for six months. “No cost” is doing a lot of work in that sentence.",
      options: [
        {
          id: "a",
          label: "The environment's own budget builds the winner; outside money follows environment rules or stays out",
          hint: "Control stays home. The environment's budget is small and now visibly so.",
          short: "House money, house rules",
        },
        {
          id: "b",
          label: "Sponsor pays: whoever wins funds their own build inside the environment",
          hint: "Scales nicely. The nurse-line request has no sponsor and no money.",
          short: "Sponsor pays",
        },
        {
          id: "c",
          label: "Take the free pilot / grant money where offered; it's real capacity",
          hint: "Free is a price. It is usually paid at renewal, in control.",
          short: "Take outside money",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "Money without a rule finds its own way in.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -1, dollars: +2, time: 0 },
        b: { goodwill: -1, risk: 0, dollars: 0, time: 0 },
        c: { goodwill: 0, risk: +2, dollars: -1, time: -1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      },
      consequences: {
        a: "House money means house rules — and a visible number. For the first time, someone can ask whether the environment's budget matches its mandate. The answer is no.",
        b: "Sponsor-pays quietly re-ranks the three: the request from the people with the least money came from the people closest to patients.",
        c: "The free pilot's terms arrive: vendor keeps aggregate usage data, renewal at list price, reference-customer clause. Free.",
        decline: "The grant starts spending in the department. The vendor's free pilot starts in revenue cycle. The environment's slot stays empty, on principle.",
      },
      epilogue: {
        held: "The outside-money rule got tested twice and held twice. The second vendor read the first vendor's terms and didn't bother trying.",
        broke: "Money arrived faster than rules. By year-end the environment hosted two projects it didn't choose, funded by budgets it didn't control, on terms it hadn't read.",
      },
    },
    {
      id: "proof",
      type: "proof",
      title: "What must the winner prove, by when?",
      question:
        "The slot is 90 days of build-and-evaluate. What must the winner show at day 90 to earn day 91 — and who set that bar before the work started?",
      freeTextPrompt:
        "State the day-90 threshold (a number and its owner) — set now, before the winner is chosen.",
      elders: ["decoupler", "recruiter"],
      options: [
        {
          id: "a",
          label: "Set the bar now, generically: measurable target + adoption floor, owner named, before the winner is known",
          hint: "Blind bars are honest bars. Nobody games a threshold they might inherit.",
          short: "Bar set blind",
        },
        {
          id: "b",
          label: "Let the winner propose its own success metrics in week one",
          hint: "Informed by reality. Also written by the party being measured.",
          short: "Winner sets bar",
        },
        {
          id: "c",
          label: "Day 90 is a demo and a decision meeting, not a threshold",
          hint: "Flexible. Demos are won by the best demo-giver, not the best tool.",
          short: "Demo day",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "No bar means the pilot ends when enthusiasm does.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -1, dollars: 0, time: 0 },
        b: { goodwill: +1, risk: +1, dollars: 0, time: 0 },
        c: { goodwill: 0, risk: +1, dollars: 0, time: -1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      },
      consequences: {
        a: "The bar exists before the winner does. Whoever wins inherits a number they didn't write — and the two losers watch whether it's enforced.",
        b: "Week one, the winner proposes metrics it is confident of hitting. They are real metrics. They are also a floor lowered to ankle height.",
        c: "Day 90 is now a performance. Somewhere in week ten, build effort quietly reallocates from the tool to the demo.",
        decline: "No bar. Day 90 will arrive anyway, and the question “did it work?” will be answered by whoever speaks first in the meeting.",
      },
      epilogue: {
        held: "The blind bar did its quiet work: day 90 was a reading, not a debate. The winner cleared it, barely — and “barely” was information the next intake used.",
        broke: "Day 90 came and went as a well-attended demo. The pilot rolled into a second 90 days by momentum. Nobody can say what it proved, only that it continued.",
      },
    },
    {
      id: "represent",
      type: "represent",
      title: "What may be said about this, outside?",
      question:
        "The vendor wants a co-announcement at signing. The chair wants a conference abstract. What may be said outside about the winner — at what readiness, approved by whom?",
      freeTextPrompt:
        "Name who approves external claims and the readiness gate an announcement must pass.",
      elders: ["beacon"],
      inject: () =>
        "The vendor's draft press release is already in the folder: “[Cancer center] partners with Apex Health AI to transform prior authorization.” The word “transform” appears four times. The pilot has not started.",
      options: [
        {
          id: "a",
          label: "One approval gate: nothing external before the day-90 bar is met, and one named office signs every claim",
          hint: "Boring and safe. The vendor's marketing calendar will hate it.",
          short: "Gate at day 90",
        },
        {
          id: "b",
          label: "Announce the partnership now, results later — separate the two",
          hint: "Common practice. The announcement becomes the result in most retellings.",
          short: "Announce now",
        },
        {
          id: "c",
          label: "Let each sponsor manage their own external story",
          hint: "Respects autonomy. Three sponsors, three stories, one institution's name.",
          short: "Sponsors decide",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "Silence here is consent to whatever gets drafted next.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -1, dollars: 0, time: +1 },
        b: { goodwill: 0, risk: +2, dollars: 0, time: -1 },
        c: { goodwill: +1, risk: +2, dollars: 0, time: 0 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      },
      consequences: {
        a: "The gate holds the press release. The vendor pushes back exactly once, then adds the day-90 date to its own pipeline forecast — which is the gate working.",
        b: "The announcement runs. From this day forward, ending the pilot has a headline cost, and everyone in the building knows it.",
        c: "Three stories leave the building in the first month. Two of them contradict each other. A peer institution's CMIO forwards both back with a single question mark.",
        decline: "Nobody owned the story, so the vendor's version became the story. It is a good story. It is about a different institution than the one in this room.",
      },
      epilogue: {
        held: "External claims stayed one step behind the evidence all year — dull, and exactly the reputation an announcement can't buy.",
        broke: "The announcement aged badly. By spring, the gap between the press release and the pilot was itself the story a peer institution told at a conference, without naming names, while everyone named the name.",
      },
    },
  ],
  // Villager beats: shown after the named node locks (PRD §7.2).
  villagers: {
    decide: {
      name: "The Last to Be Asked",
      line: "The nurses wrote one page and signed it together. Whatever wins, someone should tell them their page was read.",
    },
    funding: {
      name: "The One Who Signs",
      line: "Free pilots reach my desk eighteen months later with a renewal number attached. By then the tool has users, and I have a choice that isn't one.",
    },
    proof: {
      name: "The Third Pilot This Year",
      line: "I've been the winner before. Nobody told me what winning was for, so I optimized the demo.",
    },
    represent: {
      name: "The One Who Stopped Asking",
      line: "I read about our last tool in a press release before I saw it in my clinic. I don't read the press releases anymore.",
    },
  },
  // Role cards with asymmetric information (PRD §6). Printed, dealt at setup.
  roleCards: {
    "The Doctor": {
      mandate: [
        "Responsible for: what any of the three does to patient care and clinician time.",
        "Cannot agree to: a winner chosen without a clinical voice in the ranking.",
        "Measured on: whether clinicians adopt what gets built.",
      ],
      asymmetric: [
        "You know the triage nurses drafted their request after two near-miss callbacks last quarter — they see it as a safety tool, not a convenience.",
        "You know the chair's last department pilot quietly consumed 0.2 FTE of clinic time in “optional” validation work.",
      ],
    },
    "The Security Guard": {
      mandate: [
        "Responsible for: the risk each request carries into the building.",
        "Cannot agree to: any winner starting before its data exposure is tiered.",
        "Measured on: incidents, and the review queue's length.",
      ],
      asymmetric: [
        "You know the security review queue is actually 9 weeks, not 6 — the memo predates a resignation.",
        "You know Apex Health AI's standard contract routes de-identified text through a subprocessor in a jurisdiction Legal has flagged before.",
      ],
    },
    "The Money Manager": {
      mandate: [
        "Responsible for: what each path costs at build, at scale, at renewal.",
        "Cannot agree to: “free” anything without the renewal terms in writing.",
        "Measured on: variance. Unfunded surprises land on you.",
      ],
      asymmetric: [
        "You know the environment's build budget this year is $180K — less than one OncoScribe annual license at list price.",
        "You know the chair's grant has a 20% institutional overhead the department has not budgeted.",
      ],
    },
    "The AI Guru": {
      mandate: [
        "Responsible for: what each tool actually does versus what its slide says.",
        "Cannot agree to: ranking on vendor-reported ROI without a local denominator.",
        "Measured on: whether what ships works.",
      ],
      asymmetric: [
        "You know OncoScribe's “30-day go-live” assumes an EHR integration pattern CoH's configuration does not support — realistic estimate is 4 months.",
        "You know the nurse-line assistant is technically the simplest of the three by an order of magnitude.",
      ],
    },
    "The Competitive Marketing Leader": {
      mandate: [
        "Responsible for: what the outside world hears, and when.",
        "Cannot agree to: claims that outrun evidence under the institution's name.",
        "Measured on: reputation among peers, which is slow to build and fast to spend.",
      ],
      asymmetric: [
        "You know two peer institutions evaluated OncoScribe and passed; neither said so publicly.",
        "You know a reporter has a standing query about AI in cancer care and will print the first concrete thing anyone gives them.",
      ],
    },
  },
};
