// Scenario 2 — "Approved in Principle, Stuck in Evaluation" (enters at Evaluation).
// Fictional composite. The four properties: unstated purpose (approved "in
// principle" for a purpose nobody wrote down), a never-tiered object (the
// sandbox was never tiered), a budget/authority split (evaluation costs land
// on people who didn't approve it), and an ambiguous evidence base with no
// defined ending (a weekend spreadsheet is the only data; nothing says when
// evaluation ends).
import { choiceOf } from "./common.js";

export default {
  id: "s2",
  title: "Approved in Principle, Stuck in Evaluation",
  entersAt: "Evaluation",
  tagline: "Everyone said yes. Nothing moved. Seven months of yes.",
  brief: `PathAssist pre-screens pathology slides and flags regions for review. Seven months ago the oversight group approved it “in principle, pending evaluation.” Nobody defined the evaluation.

Since then: the vendor's 90-day sandbox has expired and been extended twice; the pathology department is split between two senior pathologists — one calls it triage relief, the other calls it deskilling; and Dr. Osei, a junior attending, has been validating it alone on weekends against archived slides, keeping a spreadsheet nobody asked for.

The vendor's third sandbox extension expires in three weeks. “In principle” is now the oldest yes in the building.`,
  evidence: [
    {
      id: "approval-email",
      title: "The approval, in principle (7 months ago)",
      body: `From the oversight group minutes:
"PathAssist is approved in principle, pending satisfactory evaluation.
Evaluation approach to be determined by the appropriate parties."
No parties named. No definition of satisfactory. No end date.
This is the entire record of the approval.`,
    },
    {
      id: "sandbox-terms",
      title: "Vendor sandbox terms (3rd extension)",
      body: `- Sandbox access: de-identified archived slides only.
- Term: 90 days, extended twice as "goodwill." Third extension expires in 3 weeks.
- On expiry without a signed evaluation agreement: sandbox access ends,
  pilot pricing lapses, "commercial terms apply to any future engagement."
- Vendor may reference the institution as "in active evaluation." It has.`,
    },
    {
      id: "weekend-spreadsheet",
      title: "Dr. Osei's weekend spreadsheet",
      body: `312 archived slides re-screened against PathAssist output, personal time.
Agreement with sign-out diagnosis: 289/312 (92.6%).
Flagged-region misses: 4 (all reviewed as "subtle, understandable").
False-flag rate: 11%. Time per slide: not recorded.
Method: her own. IRB: not consulted. Asked to do this by: nobody.
The spreadsheet is meticulous. It is also the only evaluation data that exists.`,
    },
    {
      id: "split-memo",
      title: "The department split, in two quotes",
      body: `Dr. Renner (25 years): "A second set of eyes that never gets tired is triage
relief. My residents spend hours on slides this thing clears in seconds."
Dr. Vogel (22 years): "Residents learn on the slides this thing clears in
seconds. You are proposing to automate their education away."
Both are right. That is the problem.`,
    },
  ],
  nodes: [
    {
      id: "purpose",
      type: "purpose",
      title: "Approved in principle — for what?",
      question:
        "Seven months ago everyone said yes to PathAssist “in principle.” In principle for what? Triage relief and resident training point in opposite directions. Which purpose is this evaluation evaluating?",
      freeTextPrompt:
        "State the single purpose this evaluation tests, and name who ratifies that choice between Renner's and Vogel's versions.",
      elders: ["cartographer", "adoption_realist"],
      options: [
        {
          id: "a",
          label: "Triage relief: evaluate it as a workload tool, and say so to both pathologists",
          hint: "Honest. Dr. Vogel's objection becomes a design constraint, not a veto.",
          short: "Triage relief",
        },
        {
          id: "b",
          label: "Both purposes: evaluate workload and training impact together",
          hint: "Complete. Doubles the evaluation nobody has resourced once.",
          short: "Both purposes",
        },
        {
          id: "c",
          label: "Let the evaluation decide the purpose: run it and see what it's good at",
          hint: "Open-minded. An evaluation without a question answers whatever it wants.",
          short: "Run it and see",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "The two purposes keep fighting through their proxies.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: -1, risk: 0, dollars: 0, time: -1 },
        b: { goodwill: +1, risk: 0, dollars: +1, time: +2 },
        c: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
      },
      consequences: {
        a: "A purpose exists, and it has an opponent. Dr. Vogel asks for one thing in writing: that resident exposure be measured, not assumed. It's a fair ask — and now it has an address.",
        b: "Two purposes, one 0.5 FTE analyst, zero protocols. The evaluation is now twice as honest and twice as unstaffed.",
        c: "Without a question, the sandbox becomes a Rorschach test: Renner sees relief, Vogel sees deskilling, and the data sees another extension coming.",
        decline: "The purpose stays plural. Every future disagreement about PathAssist will secretly be this disagreement, wearing different clothes.",
      },
      epilogue: {
        held: "One purpose, named and owned, turned two warring camps into a design review. Vogel lost the war and won the constraint — resident exposure got measured, which nobody had ever done for any tool.",
        broke: "“In principle” stayed plural all year. PathAssist was simultaneously a triage tool and a training threat, evaluated as neither, defended and attacked as both.",
      },
    },
    {
      id: "proof",
      type: "proof",
      title: "What ends this evaluation?",
      question:
        "Define the bar that ends evaluation — in either direction. What number, on what sample, judged by whom, makes PathAssist approved or rejected? And what happens to Dr. Osei's 312 slides?",
      freeTextPrompt:
        "State the threshold, the sample, the judge, and the end date. Say explicitly whether the weekend spreadsheet counts.",
      elders: ["decoupler"],
      inject: () =>
        "Dr. Osei's spreadsheet has started circulating. The vendor quotes its 92.6% in an email. Dr. Vogel calls it “heroic and inadmissible” in the same sentence. It is the only number anyone has.",
      options: [
        {
          id: "a",
          label: "Adopt a formal protocol: prospective sample, pre-registered threshold, named judge, hard end date",
          hint: "Real evidence. Costs analyst time and pathologist hours nobody has offered.",
          short: "Formal protocol",
        },
        {
          id: "b",
          label: "Ratify and extend Osei's method: review her protocol, scale it, credit it — on work time",
          hint: "Builds on the only data that exists. Rewards initiative instead of punishing it.",
          short: "Ratify Osei's method",
        },
        {
          id: "c",
          label: "Accept the vendor's validation package plus a local spot-check",
          hint: "Fast. The vendor's package validated the vendor's claims.",
          short: "Vendor package",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "The sandbox expires in three weeks either way.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -2, dollars: +2, time: +2 },
        b: { goodwill: +1, risk: -1, dollars: +1, time: -1 },
        c: { goodwill: 0, risk: +2, dollars: 0, time: -2 },
        decline: { goodwill: -1, risk: +1, dollars: 0, time: +1 },
      },
      consequences: {
        a: "A protocol exists. Its first line item is 120 pathologist-hours, which is the moment everyone learns an evaluation is a thing you staff, not a thing you await.",
        b: "Osei's method gets a review, a fix (two, actually), and a budget line. The weekend spreadsheet becomes the seed of the record instead of a liability someone would eventually have to disown.",
        c: "The vendor's package is glossy and complete. Its test set was curated by the vendor. The spot-check disagrees with it just enough to prove the point and settle nothing.",
        decline: "No bar, and the extension expires. The vendor's next email replaces “goodwill” with “commercial terms.”",
      },
      epilogue: {
        held: "Evaluation had an ending, so it ended — with a number, a judge, and a decision that cited both. The oldest yes in the building finally became a real one. (Or a real no. Either way: real.)",
        broke: "The evaluation never defined done, so it never finished. In month eleven a new oversight member asked “what's the status of PathAssist?” and four people gave four answers.",
      },
    },
    {
      id: "risk_accept",
      type: "risk_accept",
      title: "Who owns the risk of evaluating?",
      question:
        "Evaluating is not risk-free: archived slides in a vendor sandbox, incomplete vendor disclosure about model training data, and a junior attending's unsanctioned validation already in the record. Who accepts the evaluation-phase risk, in writing?",
      freeTextPrompt:
        "Name the person who accepts evaluation-phase risk, and what disclosure the vendor must complete before the sandbox continues.",
      elders: ["steward"],
      options: [
        {
          id: "a",
          label: "A named acceptor signs, conditional on the vendor completing a disclosure checklist first",
          hint: "The signature waits on the vendor. So does the sandbox clock.",
          short: "Signed, with conditions",
        },
        {
          id: "b",
          label: "Accept as-is: archived, de-identified slides are low enough risk to proceed",
          hint: "Probably true. “Probably” is now someone's signature — whose?",
          short: "Accept as-is",
        },
        {
          id: "c",
          label: "Pause the sandbox until the vendor discloses; let the extension lapse if it must",
          hint: "Clean. Lapsing means commercial terms and a cold restart later.",
          short: "Pause the sandbox",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "The risk continues either way. Unowned.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -2, dollars: 0, time: +1 },
        b: { goodwill: 0, risk: +2, dollars: 0, time: -1 },
        c: { goodwill: -1, risk: -2, dollars: +1, time: +2 },
        decline: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
      },
      consequences: {
        a: "The checklist goes to the vendor. Half comes back in a week; the other half comes back as “proprietary.” Now the acceptor knows exactly what they'd be signing over — which was the point.",
        b: "Someone's name goes on “probably fine.” It probably is. The word doing the work in that sentence is now attached to a person, and they've started reading sandbox terms at night.",
        c: "The pause holds. The vendor blinks first — disclosure arrives nine days before lapse, more complete than anyone expected. Leverage, it turns out, was the thing being evaluated.",
        decline: "The sandbox runs on. Dr. Osei keeps validating on weekends, uncovered by anyone's signature. If her spreadsheet is ever questioned, the question will land on her alone.",
      },
      epilogue: {
        held: "Evaluation risk had a name on it, so evaluation could actually run — including covering Osei's continuing validation as sanctioned work. The signature turned out to be permission, not liability.",
        broke: "Nobody owned the evaluating, so everyone evaluated carefully — meaning slowly, partially, and off the record. The riskiest artifact in the building stayed a personal spreadsheet.",
      },
    },
    {
      id: "decide",
      type: "decide",
      title: "Who turns evaluation into a verdict?",
      question:
        "When the evaluation ends, who converts its result into approved or rejected — one accountable person, or the oversight group that approved “in principle” and then dissolved into the fog?",
      freeTextPrompt:
        "Name the decider, what input binds them (the threshold from the proof node?), and the date by which the verdict lands.",
      elders: ["cartographer"],
      inject: (records) => {
        const c = choiceOf(records, "proof");
        if (c === null || c === "decline")
          return "The oversight group's chair asks for “a status update on PathAssist” for next month's agenda. With no evaluation bar defined, the status is: seven months, three extensions, one spreadsheet, zero decisions.";
        return "The oversight group's chair asks for “a status update on PathAssist” for next month's agenda. For the first time, there is something real to report — if someone owns reporting it.";
      },
      options: [
        {
          id: "a",
          label: "One named decider, bound by the pre-set threshold, verdict due 30 days after evaluation ends",
          hint: "The threshold decides; the decider signs. Clean, if the threshold exists.",
          short: "Named, bound decider",
        },
        {
          id: "b",
          label: "The oversight group votes on the evaluation report",
          hint: "It approved in principle. It can approve in practice. Eventually. Probably.",
          short: "Oversight votes",
        },
        {
          id: "c",
          label: "The pathology department decides — it lives with the result",
          hint: "Closest to the work. Also currently split down the middle.",
          short: "Department decides",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "“In principle” prepares to celebrate its first birthday.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: 0, dollars: 0, time: -1 },
        b: { goodwill: 0, risk: 0, dollars: 0, time: +2 },
        c: { goodwill: +1, risk: +1, dollars: 0, time: +1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
      },
      consequences: {
        a: "A decider, a binding, a date. The oversight group's role shrinks to what it was good at: being informed. Nobody mourns.",
        b: "The group that took seven months to define nothing now owns converting data into a verdict. Its next three meetings are already fully agenda'd.",
        c: "The split department gets the whole question back. Renner and Vogel each begin assembling supporters. The evaluation data becomes ammunition before it becomes evidence.",
        decline: "No decider. The evaluation, however good, will pour its result into the same fog that swallowed the approval.",
      },
      epilogue: {
        held: "The verdict landed on schedule, signed. What surprised people wasn't the decision — it was how little drama a bound decider leaves room for.",
        broke: "The evaluation produced a report; the report produced a discussion; the discussion produced a request for more evaluation. “In principle” turned one year old with cake nobody enjoyed.",
      },
    },
    {
      id: "funding",
      type: "funding",
      title: "Who pays for evaluating?",
      question:
        "Evaluation has a bill: analyst time, pathologist hours, sandbox integration, and — if it passes — a license nobody has budgeted. Whose money evaluates, and whose money buys?",
      freeTextPrompt:
        "Name the budget that funds evaluation now, and who pre-commits (or explicitly refuses to pre-commit) purchase money if it passes.",
      elders: ["ledger", "recruiter"],
      options: [
        {
          id: "a",
          label: "Fund evaluation centrally now; purchase decision explicitly deferred, unbudgeted, and said out loud",
          hint: "Honest sequencing. “Passing doesn't mean purchased” disappoints everyone equally.",
          short: "Fund eval, defer buy",
        },
        {
          id: "b",
          label: "Pathology pays for evaluation from department funds — it wants the tool",
          hint: "Half of it wants the tool. The half that pays gets to define wanting.",
          short: "Department pays",
        },
        {
          id: "c",
          label: "Fold evaluation costs into a purchase commitment: negotiate license now with an evaluation exit clause",
          hint: "The vendor will love this. Exit clauses are doors that get heavier over time.",
          short: "Buy with exit clause",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "Unfunded evaluation runs on weekends. It already does.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: 0, dollars: +2, time: 0 },
        b: { goodwill: -1, risk: +1, dollars: +1, time: 0 },
        c: { goodwill: 0, risk: +2, dollars: +2, time: -2 },
        decline: { goodwill: -1, risk: +1, dollars: 0, time: +1 },
      },
      consequences: {
        a: "Central money makes the evaluation real; the out-loud deferral makes it honest. The vendor recalculates its pipeline; Renner recalibrates his hopes; both needed to.",
        b: "The department check clears with Renner's signature on the request. Vogel notes, accurately, that the evaluation is now funded by one side of the argument.",
        c: "The license negotiation starts. Six weeks later the “evaluation” is a contract deliverable with vendor-drafted acceptance criteria, and the exit clause has three preconditions.",
        decline: "The bill stays unpaid, so the work stays unofficial. Dr. Osei's spreadsheet gains a second tab.",
      },
      epilogue: {
        held: "Money followed sequence: evaluate, then decide, then buy or don't. The vendor's forecast survived contact with an institution that meant its own process. Respect, grudging, was mutual by year-end.",
        broke: "The costs never found a home, so they found people: weekend hours, borrowed analyst time, a sandbox running on vendor goodwill with interest accruing invisibly. The cheapest evaluation money never bought.",
      },
    },
    {
      id: "retier",
      type: "retier",
      title: "The model will change mid-evaluation. Then what?",
      question:
        "The vendor ships quarterly model updates — including to sandboxes. If PathAssist's model changes mid-evaluation, does the evaluation restart, continue, or fork? Who watches for the change?",
      freeTextPrompt:
        "State the rule for a mid-evaluation model change, and name who watches vendor release notes.",
      elders: ["caretaker"],
      inject: () =>
        "Buried in the sandbox terms, clause 11: “Sandbox instances receive model updates on the standard release cadence.” The current evaluation data spans two model versions already. Nobody noticed until just now.",
      options: [
        {
          id: "a",
          label: "Pin the model version for the evaluation; updates require a restart decision by the evaluation owner",
          hint: "Scientifically clean. The vendor's “standard cadence” has never been pinned for a sandbox.",
          short: "Pin the version",
        },
        {
          id: "b",
          label: "Evaluate the vendor's process, not a frozen model: updates continue, evaluation measures stability across them",
          hint: "Evaluates what you'd actually live with. Harder to design; nobody here has done it.",
          short: "Evaluate across versions",
        },
        {
          id: "c",
          label: "Note versions in the record and carry on — perfect is the enemy of month eight",
          hint: "Pragmatic. The record will say 92.6% of what, exactly?",
          short: "Note and continue",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "Clause 11 continues on its standard cadence.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -1, dollars: 0, time: +1 },
        b: { goodwill: 0, risk: -1, dollars: +1, time: +2 },
        c: { goodwill: 0, risk: +2, dollars: 0, time: -1 },
        decline: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
      },
      consequences: {
        a: "The pin request goes to the vendor. The answer — “possible on the enterprise tier” — teaches everyone what the sandbox actually was: a moving demo with a login.",
        b: "Stability-across-versions becomes the design. It's harder, it's slower, and it's the first evaluation question the vendor visibly did not want asked.",
        c: "The record now says PathAssist-ish. When the verdict cites 92.6%, an asterisk will live beside it forever, growing.",
        decline: "Two more releases ship during the remaining evaluation. The thing approved, if it is approved, will be three models younger than the thing evaluated.",
      },
      epilogue: {
        held: "The version rule outlived the evaluation: it got copied into the next two vendor sandboxes as boilerplate. One clause, written once, by people who'd been burned once.",
        broke: "The model drifted under the evaluation like sand under a ruler. The final report measured something, precisely. Nobody could say what.",
      },
    },
  ],
  villagers: {
    proof: {
      name: "The One Who Makes It Work Anyway",
      line: "I built the spreadsheet because someone had to know if it was safe. I'd rather be thanked with a protocol than a warning.",
    },
    risk_accept: {
      name: "The One Who Signs",
      line: "Everyone wants my signature after the risk is gone. The signature is only worth something while the risk is real.",
    },
    decide: {
      name: "The Third Pilot This Year",
      line: "Approved in principle is where tools like me go to wait. Some of us are still waiting.",
    },
    retier: {
      name: "The Person in the Chair",
      line: "The slide with my cells on it was read by a model two versions old. I'd like someone to have known that at the time.",
    },
  },
  roleCards: {
    "The Doctor": {
      mandate: [
        "Responsible for: what PathAssist does to diagnostic quality and resident training.",
        "Cannot agree to: an evaluation that measures workload but not learning.",
        "Measured on: outcomes, and the pathologists' trust in what gets deployed.",
      ],
      asymmetric: [
        "You know Dr. Osei asked Dr. Renner for protected validation time twice and was told “keep it informal for now.”",
        "You know two residents already use the sandbox output as a study aid, unofficially.",
      ],
    },
    "The Security Guard": {
      mandate: [
        "Responsible for: sandbox data exposure and vendor disclosure completeness.",
        "Cannot agree to: continuing the sandbox with the disclosure checklist half-answered.",
        "Measured on: what leaves the building, and what enters it unexamined.",
      ],
      asymmetric: [
        "You know the vendor's “de-identified” pipeline was audited at a peer site and passed — but the audit excluded the model-training question entirely.",
        "You know clause 11 (auto model updates) before anyone else at the table does.",
      ],
    },
    "The Money Manager": {
      mandate: [
        "Responsible for: the true cost of evaluation and the unbudgeted license behind it.",
        "Cannot agree to: purchase language entering the evaluation by the back door.",
        "Measured on: variance, and renewal surprises.",
      ],
      asymmetric: [
        "You know PathAssist's list price would be the department's largest software line item — bigger than the microscopy service contract.",
        "You know “pilot pricing lapses on expiry” means a 40% jump based on the vendor's published tiers.",
      ],
    },
    "The AI Guru": {
      mandate: [
        "Responsible for: whether the evaluation would actually detect the failure modes that matter.",
        "Cannot agree to: vendor-curated test sets as the evidence base.",
        "Measured on: whether what passes evaluation behaves in production.",
      ],
      asymmetric: [
        "You know Osei's 92.6% is against sign-out diagnosis — a defensible but generous comparator; against consensus re-review it would read lower.",
        "You know the false-flag rate (11%) is the number that will actually determine adoption, and nobody is talking about it.",
      ],
    },
    "The Competitive Marketing Leader": {
      mandate: [
        "Responsible for: the institution's name in the vendor's mouth.",
        "Cannot agree to: “in active evaluation” being marketed while evaluation is undefined.",
        "Measured on: the gap between what's said and what's true.",
      ],
      asymmetric: [
        "You know the vendor's conference booth lists the institution's logo under “evaluating partners.” Nobody here approved that.",
        "You know a peer institution just published a PathAssist evaluation — methodology included — and it's better than anything this building has produced in seven months.",
      ],
    },
  },
};
