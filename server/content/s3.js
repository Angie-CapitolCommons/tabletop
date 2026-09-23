// Scenario 3 — "Worked at One Site, Now Being Scaled" (enters at Deployment).
// Fictional composite. The four properties: unstated purpose (Site H's success
// was never defined, so "scaling it" scales an ambiguity), a mis-tiered object
// (Site H's tier never migrated), an entity/system split (site autonomy vs
// enterprise authority; grant budget vs operating budget), and an ambiguous
// evidence base (one site's results, entangled with one person, no ending).
import { choiceOf } from "./common.js";

export default {
  id: "s3",
  title: "Worked at One Site, Now Being Scaled",
  entersAt: "Deployment",
  tagline: "It worked. Nobody can say exactly why. Ship it everywhere.",
  brief: `BedFlow predicts next-day discharge readiness and drives the morning bed huddle at Site H, a 90-bed community campus. Eighteen months in, Site H's length-of-stay is down 0.6 days and its huddle is famous — executives visit it like a shrine.

The scale plan: main campus next quarter, two regional sites after. Main campus runs a different EHR configuration, has four times the beds, and its own bed-management culture. And an open secret travels with the plan: half of BedFlow's magic at Site H is Marisol, the charge nurse who tunes its thresholds by hand every morning and overrides it without logging why.

The vendor has drafted a press release about “enterprise expansion.” The grant that paid for Site H ends at fiscal year-end.`,
  evidence: [
    {
      id: "site-h-results",
      title: "Site H results one-pager",
      body: `BedFlow at Site H, 18 months:
- Length of stay: -0.6 days (vs. own baseline; no control site)
- Morning huddle attendance: 96% (was 61%)
- Prediction acceptance rate: 71% (29% overridden by charge nurse)
- Override log completeness: 12% ("reason" field optional)
- Not measured: whether predictions or the huddle itself drive the gain.`,
    },
    {
      id: "marisol-notes",
      title: "The tuning notebook (photographed pages)",
      body: `Handwritten, spiral-bound, Marisol R., charge nurse:
"Mondays: model runs hot after weekend discharges — knock threshold down 5."
"Oncology stepdown: never trust it on neutropenic pts, check labs yourself."
"If census > 84, predictions lag reality by half a day. Huddle fixes it."
43 pages of this. The vendor has not seen it. It is not in any system.`,
    },
    {
      id: "press-draft",
      title: "Vendor press release (draft)",
      body: `"Following breakthrough results, [health system] expands BedFlow
enterprise-wide, bringing AI-powered capacity intelligence to every campus."
Quote attributed to "[EXECUTIVE NAME TBD]".
Embargo date: two weeks before main-campus go-live.
Nobody at main campus has seen the tool yet.`,
    },
    {
      id: "config-memo",
      title: "Main campus integration memo",
      body: `EHR config divergence: 14 fields BedFlow reads at Site H are mapped
differently or unpopulated at main campus. Vendor estimate to remap: 6 weeks.
Main campus bed management: centralized command center (Site H has none).
Prior tool history at main campus: 2 capacity dashboards retired in 3 years.
The command center director has not been invited to a single scale-planning
meeting. This memo is the invitation.`,
    },
  ],
  nodes: [
    {
      id: "tier",
      type: "tier",
      title: "Does Site H's tier travel?",
      question:
        "BedFlow was tiered (lightly) for a 90-bed site with a human in the loop named Marisol. Does that tier travel to a 380-bed campus with a command center — or is scale itself a re-tiering event?",
      freeTextPrompt:
        "State whether scale re-tiers the tool, who assigns the new tier, and what the tier attaches to (tool, site, or use).",
      elders: ["steward", "caretaker"],
      options: [
        {
          id: "a",
          label: "Scale is a re-tiering event: each new site gets its own tier before go-live",
          hint: "The honest reading. Adds a gate in front of a schedule that has a press date.",
          short: "Re-tier per site",
        },
        {
          id: "b",
          label: "The tier travels: same tool, same tier, faster rollout",
          hint: "Same tool on paper. Site H's tier quietly assumed Marisol.",
          short: "Tier travels",
        },
        {
          id: "c",
          label: "Tier the enterprise deployment once, centrally, covering all sites",
          hint: "One decision. Regional sites inherit assumptions made for main campus.",
          short: "One enterprise tier",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "The rollout schedule becomes the de facto tiering authority.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -2, dollars: 0, time: +2 },
        b: { goodwill: 0, risk: +2, dollars: 0, time: -1 },
        c: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
        decline: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
      },
      consequences: {
        a: "Main campus's tier review surfaces the config memo's fourteen divergent fields in week one — before they could become fourteen quiet inaccuracies in a live tool.",
        b: "The traveling tier arrives at main campus missing its most important dependency. The paperwork says “same tool.” The notebook in Marisol's locker disagrees.",
        c: "The enterprise tier is written at main-campus scale. The regionals — smaller, Site-H-like, huddle-capable — inherit controls designed for a command center they don't have.",
        decline: "Untiered scale proceeds on schedule. The schedule was set by the press embargo.",
      },
      epilogue: {
        held: "Re-tier-per-site felt like bureaucracy in month one and looked like foresight by month six: each site's tier caught exactly the assumption that site would have broken.",
        broke: "One tier stretched across four sites like a fitted sheet on the wrong bed. Every corner that popped loose did so at 6 a.m., during a huddle, in front of nurses.",
      },
    },
    {
      id: "risk_accept",
      type: "risk_accept",
      title: "Who accepts the risk, site by site?",
      question:
        "Site H's risk was accepted, implicitly, by the people standing in its huddle. Main campus is someone else's floor. Who accepts BedFlow's residual risk at each new site — the enterprise, or the site that lives with it?",
      freeTextPrompt:
        "Name the risk acceptor for main campus (a person), and state the rule for the regionals.",
      elders: ["steward", "adoption_realist"],
      inject: (records) =>
        choiceOf(records, "tier") === "b" || choiceOf(records, "tier") === null
          ? "The main-campus command center director, invited at last, reads the Site H one-pager and asks the room: “Who signs for this here? Because my floor, my signature — or it doesn't run on my floor.”"
          : "The main-campus command center director, invited at last, asks the room: “Who signs for this here? My floor, my signature — or it doesn't run on my floor.” The re-tiering answer gives her question somewhere to land.",
      options: [
        {
          id: "a",
          label: "Site acceptors: a named person at each site signs before their go-live",
          hint: "The director gets her signature. Each signature can also say no.",
          short: "Per-site signature",
        },
        {
          id: "b",
          label: "Enterprise acceptance: one executive signs once for all sites",
          hint: "Efficient. The person signing has never stood in any of the huddles.",
          short: "One enterprise signer",
        },
        {
          id: "c",
          label: "The vendor contractually shares deployment risk at new sites",
          hint: "Sounds strong. Read what “shares” means in vendor legalese.",
          short: "Vendor shares risk",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "The director's question stays open. So does her floor's door — barely.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: +1, risk: -2, dollars: 0, time: +1 },
        b: { goodwill: -1, risk: +1, dollars: 0, time: -1 },
        c: { goodwill: 0, risk: +1, dollars: +1, time: +1 },
        decline: { goodwill: -1, risk: +2, dollars: 0, time: 0 },
      },
      consequences: {
        a: "The director signs — with two conditions that improve the deployment. A regional site director, watching, starts drafting her own conditions. This is the system working.",
        b: "One signature covers four sites. At the first main-campus incident review, the question “who accepted this risk?” gets an answer nobody in the room has met.",
        c: "The vendor's risk-sharing rider arrives: liability capped at fees paid, excludes “configuration and workflow factors” — which is to say, excludes everything on the memo.",
        decline: "No signature, and the director quietly de-prioritizes BedFlow's command-center integration. Deployment proceeds; adoption doesn't.",
      },
      epilogue: {
        held: "Signatures with conditions became the pattern, and the conditions became the deployment checklist. The right to say no, exercised once, made every yes real.",
        broke: "Risk pooled at the enterprise level like water on a flat roof. It found the seam eighteen months later, at the site with the least say and the least support.",
      },
    },
    {
      id: "decide",
      type: "decide",
      title: "Who decides a site is ready?",
      question:
        "Between “the rollout schedule says June” and “this site is actually ready” stands a decision. Who makes the go-live call for each site — the enterprise program, or someone at the site — and against what readiness bar?",
      freeTextPrompt:
        "Name who makes each site's go-live call and the readiness bar that binds it (not the calendar).",
      elders: ["cartographer", "adoption_realist"],
      options: [
        {
          id: "a",
          label: "Site readiness owner decides against a published bar; the program owns the schedule, not the go",
          hint: "Sites can slip the calendar. That is the feature, not the bug.",
          short: "Site owns the go",
        },
        {
          id: "b",
          label: "The enterprise program decides: schedule integrity is the point of a program",
          hint: "Predictable. Main campus retired its last two tools on schedule too.",
          short: "Program owns the go",
        },
        {
          id: "c",
          label: "Joint go: program and site must both agree, either can hold",
          hint: "Balanced. Two keys can also mean two excuses.",
          short: "Joint go",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "The calendar decides. The calendar was set by the embargo.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: +1, risk: -1, dollars: 0, time: +1 },
        b: { goodwill: -1, risk: +1, dollars: 0, time: -1 },
        c: { goodwill: 0, risk: 0, dollars: 0, time: +1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: -1 },
      },
      consequences: {
        a: "Main campus's readiness owner promptly slips go-live five weeks — citing the fourteen fields. The program absorbs it. The press date does not survive; the deployment does.",
        b: "June holds. The fourteen unmapped fields hold too. BedFlow goes live at main campus predicting discharges from data that isn't there.",
        c: "The joint-go works until it doesn't: week three, program says go, site says hold, and the escalation lands on an executive with a press date in their calendar.",
        decline: "With no owner of “ready,” the schedule inherits the decision. Schedules never met a floor they couldn't overestimate.",
      },
      epilogue: {
        held: "“The site owns the go” survived its first collision with a press date, which is the only test that counts. Sites stopped gaming readiness because readiness was theirs.",
        broke: "Go-lives happened to sites, on time. The main-campus command center ran BedFlow in a browser tab nobody enlarged, and the regionals learned from watching.",
      },
    },
    {
      id: "stop",
      type: "stop",
      title: "What ends BedFlow at a site that it's failing?",
      question:
        "Site H can't imagine life without it; main campus hasn't met it. If BedFlow misleads a site's huddle — wrong census regime, wrong config, no Marisol — who can turn it off at that site, and what triggers the question?",
      freeTextPrompt:
        "Name the per-site off-switch holder and the trigger that forces the stop conversation.",
      elders: ["caretaker"],
      inject: () =>
        "Marisol, asked to help train main campus, declines the travel but offers her notebook. Reading it, the integration team realizes the overrides aren't noise to eliminate — they're the safety system, unlogged. If BedFlow ships without a Marisol-equivalent, what stands where she stood?",
      options: [
        {
          id: "a",
          label: "Per-site kill authority with defined triggers: acceptance-rate floor, override-spike alarm, incident",
          hint: "Marisol's notebook, formalized. The overrides finally get logged — as triggers.",
          short: "Per-site switch + triggers",
        },
        {
          id: "b",
          label: "Enterprise off-switch only: sites request, the program decides",
          hint: "Consistent. A site in trouble files a ticket and keeps huddling around bad numbers.",
          short: "Enterprise switch",
        },
        {
          id: "c",
          label: "No formal switch: sites can simply stop using it — adoption is voluntary",
          hint: "True and useless. Tools nobody turned off run for years, misleading quietly.",
          short: "Voluntary fade",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "The off-switch question waits for the incident that makes it urgent.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: +1, risk: -2, dollars: 0, time: +1 },
        b: { goodwill: -1, risk: +1, dollars: 0, time: 0 },
        c: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
        decline: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
      },
      consequences: {
        a: "The trigger design has a side effect nobody predicted: to build the override-spike alarm, overrides must be logged with reasons — and Marisol's notebook becomes a data model.",
        b: "The program holds the switch for sites it visits quarterly. The distance between the hand and the switch is measured in ticket queues.",
        c: "Voluntary fade begins at main campus in week six — not as a decision, but as a browser tab that stops being opened. The license, of course, does not fade.",
        decline: "No switch, no triggers. BedFlow will run at every site until something with a name makes it stop, and things with names arrive at 6 a.m.",
      },
      epilogue: {
        held: "The triggers fired once, at a regional site, exactly as designed: the huddle kept meeting (that part was never the tool), BedFlow paused for re-config, and came back trusted — because leaving was survivable.",
        broke: "Nothing could end it, so nothing did. At year-end, BedFlow ran at four sites: beloved at one, ignored at two, and quietly miscalibrated at the fourth, where the huddle believes it.",
      },
    },
    {
      id: "represent",
      type: "represent",
      title: "The press release is already drafted",
      question:
        "“Enterprise expansion, breakthrough results.” The embargo date is two weeks before a go-live main campus hasn't agreed to. What may be claimed, when — and does Site H's 0.6 days, one site, no control, carry an enterprise headline?",
      freeTextPrompt:
        "Name who approves the claim, what the claim may say about causality, and what date it may not precede.",
      elders: ["beacon", "decoupler"],
      options: [
        {
          id: "a",
          label: "Re-scope the claim to what's true: one site's results, expansion beginning; no enterprise claims until enterprise evidence",
          hint: "The vendor's marketing team will grieve. Briefly.",
          short: "Claim what's true",
        },
        {
          id: "b",
          label: "Run the release as drafted at embargo: momentum is part of change management",
          hint: "Momentum, yes. It will also be exhibit A at every future setback.",
          short: "Run as drafted",
        },
        {
          id: "c",
          label: "No external claims until all four sites are live and measured",
          hint: "Purist. Site H's team earned a story, and silence has costs too.",
          short: "Silence till done",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "The embargo date decides. It's on the vendor's calendar, not yours.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: +1, risk: -1, dollars: 0, time: 0 },
        b: { goodwill: 0, risk: +2, dollars: 0, time: -1 },
        c: { goodwill: -1, risk: -1, dollars: 0, time: +1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      },
      consequences: {
        a: "The re-scoped release runs: Site H's story, told true, with Marisol in the second paragraph. It reads smaller and lands bigger — peers can smell a real result.",
        b: "“Breakthrough” ships at embargo. Five weeks later the main-campus slip (or stumble) is measured against a headline, and the delta is the story.",
        c: "Silence holds. Site H's huddle team watches a peer institution announce something smaller with something louder, and asks why their work doesn't count.",
        decline: "The embargo arrives; the release runs as drafted, because stopping it required a decision and there wasn't one. The institution learns its own news from the wire.",
      },
      epilogue: {
        held: "The external story stayed one step behind the truth, which meant it never had to walk anything back. In a year of peer-institution retractions, boring proved to be the brand.",
        broke: "The headline arrived before the evidence and waited for it, publicly, tapping its foot. Every internal setback now had an external mirror, and the program spent its second year managing the story of its first.",
      },
    },
    {
      id: "funding",
      type: "funding",
      title: "The grant ends at fiscal year-end",
      question:
        "Site H ran on grant money that dies in four months. Scale multiplies the license by four and adds integration, training, and a Marisol-shaped hole at every site. Whose budget owns BedFlow as an operating expense — forever?",
      freeTextPrompt:
        "Name the permanent budget owner, and what happens at Site H if no one claims it before the grant ends.",
      elders: ["ledger", "recruiter"],
      options: [
        {
          id: "a",
          label: "Operations owns it enterprise-wide from day one of scale: license, training, and a funded huddle-facilitator role per site",
          hint: "Expensive and honest. The Marisol role becomes a job, not a miracle.",
          short: "Ops owns it, staffed",
        },
        {
          id: "b",
          label: "Each site funds its own instance from its own budget",
          hint: "Autonomy again. The sites that need it most can afford it least.",
          short: "Sites self-fund",
        },
        {
          id: "c",
          label: "Bridge Site H on innovation funds while scale economics get modeled",
          hint: "The bridge fund again. Site H becomes an orphan with a famous huddle.",
          short: "Bridge Site H",
        },
        {
          id: "decline",
          label: "We cannot answer this today",
          hint: "The grant clock doesn't attend meetings.",
          short: "Declined",
        },
      ],
      meterDeltas: {
        a: { goodwill: +1, risk: -1, dollars: +3, time: 0 },
        b: { goodwill: -1, risk: +1, dollars: +1, time: +1 },
        c: { goodwill: 0, risk: +1, dollars: +1, time: +1 },
        decline: { goodwill: -1, risk: +2, dollars: 0, time: 0 },
      },
      consequences: {
        a: "The budget line makes the invisible visible: BedFlow costs more than its license, and the extra line item — a human per site — is the one that made Site H work.",
        b: "Site-funded means site-optional. A regional CFO, reading main campus's adoption numbers, quietly zeroes the line for next year.",
        c: "The bridge holds Site H for eight months. Marisol's role stays informal, unfunded, and hers alone — and she is interviewing elsewhere.",
        decline: "The grant ends on schedule. Site H's license lapses into a vendor “courtesy period,” which is a countdown wearing a smile.",
      },
      epilogue: {
        held: "Funding the human next to the tool — a job title, a backup, a training path — turned out to be the whole ballgame. Marisol trained her successor and took the enterprise role. The notebook became a curriculum.",
        broke: "The money never found a permanent home, so the tool lived hand-to-mouth across four budgets. When Marisol left in March, Site H's numbers regressed to baseline in nine weeks — the clearest evaluation BedFlow ever got, run by accident, at the worst possible time.",
      },
    },
  ],
  villagers: {
    risk_accept: {
      name: "The One Who Makes It Work Anyway",
      line: "You're scaling my mornings. I tune it before you're awake. Put that in the plan or don't call it the plan.",
    },
    decide: {
      name: "The Last to Be Asked",
      line: "The command center found out about its own go-live from a memo. We run beds for a living; we'd have had opinions.",
    },
    stop: {
      name: "The Third Pilot This Year",
      line: "Main campus retired two of me already. Nobody turned us off — they just stopped opening the tab. The licenses ran three more years.",
    },
    funding: {
      name: "The Person in the Chair",
      line: "My discharge got predicted by a tool a grant paid for. If the grant ends and the tool stays wrong, nobody bills anyone for the extra night. I just stay in it.",
    },
  },
  roleCards: {
    "The Doctor": {
      mandate: [
        "Responsible for: what discharge predictions do to clinical judgment at four different sites.",
        "Cannot agree to: scale claims built on one site's uncontrolled before/after.",
        "Measured on: outcomes, and whether huddles stay clinical or become dashboard-readings.",
      ],
      asymmetric: [
        "You know Site H's LOS drop began the month the huddle format changed — one month before BedFlow's thresholds were even tuned.",
        "You know two main-campus hospitalists have already labeled BedFlow “the bed police” in group chat. Adoption is pre-poisoned.",
      ],
    },
    "The Security Guard": {
      mandate: [
        "Responsible for: what scale multiplies — access, integration surface, config drift.",
        "Cannot agree to: the Site H tier traveling unexamined to a different EHR configuration.",
        "Measured on: incidents, and unlogged human overrides of automated recommendations.",
      ],
      asymmetric: [
        "You know the 12% override-log completeness at Site H would fail the audit standard applied to every other clinical decision tool in the building.",
        "You know the vendor's remap estimate (6 weeks) excludes validation — mapped is not verified.",
      ],
    },
    "The Money Manager": {
      mandate: [
        "Responsible for: the full scale bill — license ×4, integration, training, the human roles.",
        "Cannot agree to: operating commitments made on grant money's ghost.",
        "Measured on: variance, and orphaned licenses.",
      ],
      asymmetric: [
        "You know the vendor's enterprise pricing has a 4-site minimum — dropping a site later saves almost nothing.",
        "You know the innovation fund already carries two bridged tools, and the bridge fund's own review calls it “the hospice.”",
      ],
    },
    "The AI Guru": {
      mandate: [
        "Responsible for: whether BedFlow's model survives a different config, census regime, and culture.",
        "Cannot agree to: calling threshold-tuning-by-notebook “the same tool” as untuned deployment.",
        "Measured on: whether what ships behaves like what was demonstrated.",
      ],
      asymmetric: [
        "You know the model was trained on community-hospital census patterns; main campus's census regime is outside its training distribution most winters.",
        "You know Marisol's Monday adjustment corrects a real, reproducible model bias the vendor has never acknowledged.",
      ],
    },
    "The Competitive Marketing Leader": {
      mandate: [
        "Responsible for: the enterprise story, and the distance between it and the floor.",
        "Cannot agree to: “breakthrough” as a description of one uncontrolled site result.",
        "Measured on: peer credibility, which retracts louder than it prints.",
      ],
      asymmetric: [
        "You know the executive quote in the draft is attributed to someone who hasn't seen the draft.",
        "You know a health-tech reporter has been asking Site H nurses for interviews on LinkedIn. One said yes, then unsent it.",
      ],
    },
  },
};
