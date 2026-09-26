// Scenario 3 — "Worked at One Site, Now Being Scaled" (enters at Deployment).
// Fictional composite. The vendor is mostly offstage; the pressure is the
// schedule, a grant ending, and one charge nurse. The four properties: an
// unstated purpose (the community campus's success was never defined, so
// scaling it scales an ambiguity); a mis-rated object (rated low risk on the
// assumption a charge nurse checks every prediction, never revisited); a
// split (campus autonomy vs the program's schedule; grant money vs operating
// budget); an ambiguous evidence base (one campus, no comparison, entangled
// with one person, no ending).
import { choiceOf, decline } from "./common.js";

export default {
  id: "s3",
  title: "Worked at One Site, Now Being Scaled",
  entersAt: "Deployment",
  tagline: "It worked at one community campus. Main campus goes live in June.",
  opening: [
    { text: "Wednesday, 6:10 a.m., main campus." },
    {
      channel: "Email",
      when: "6:10 a.m.",
      from: "Main campus bed command center director",
      to: "Rollout program manager",
      text: "I just saw the go-live date for the discharge-prediction tool on the schedule: June 2. This is the first I've heard of it. Who do I talk to about how it fits our command center?",
    },
    {
      channel: "Email",
      when: "7:30 a.m.",
      from: "Rollout program manager",
      to: "Main campus bed command center director",
      text: "Sorry, you should have been on the invite. The plan is to copy what the community campus does. Their charge nurse, Marisol, runs the huddle. I'll connect you.",
    },
    {
      channel: "Text",
      when: "7:52 a.m.",
      from: "Marisol, charge nurse, community campus",
      to: "Rollout program manager",
      text: "Happy to talk. Heads up: I adjust the tool's cut-offs by hand most mornings. It's in my notebook, not in the system.",
    },
  ],
  modelBrief: `The tool: a discharge-prediction tool that predicts which patients are likely ready to go home tomorrow. At the 90-bed community campus it drives the morning bed huddle, and has for 18 months.
Results there: length of stay down about half a day compared with the campus's own prior year (no comparison site); huddle attendance up from about 60% to 96%. The charge nurse, Marisol, adjusts the tool's cut-offs by hand most mornings and overrides about 30% of its predictions; the override reason field is optional and is filled in about 12% of the time. Her notebook of adjustments is not in any system. The tool was rated low risk at launch, on the assumption a charge nurse reviews every prediction; the rating has never been revisited.
At the table, The Executive Sponsor is the operations executive sponsoring the system-wide rollout; disagreements about the schedule go to them.
The rollout plan: main campus (about 380 beds, a central bed command center, a different EHR setup where 14 fields the tool reads are mapped differently or empty) goes live June 2; two regional hospitals follow. Main campus has retired two bed-management dashboards in three years. The command center director was not invited to planning.
A grant paid for the community campus; it ends at fiscal year-end, about four months away. Enterprise pricing requires four campuses. Communications has drafted a story, "AI cuts hospital stays across the system," to run two weeks before main campus goes live.`,
  evidence: [
    {
      id: "results",
      title: "Community campus results, 18 months",
      body: `DISCHARGE PREDICTION — COMMUNITY CAMPUS (90 BEDS)

Length of stay: down 0.6 days vs. our own prior year (no comparison site)
Morning huddle attendance: 96% (was 61%)
Predictions accepted: 71%
Overridden by charge nurse: 29%
Override reason recorded: 12% (field is optional)

Risk rating: low — assigned at launch, assuming a charge nurse reviews every prediction.

Not measured: whether the gain came from the predictions or from the huddle.`,
    },
    {
      id: "notebook",
      title: "Marisol's notebook (photos of three pages)",
      body: `Handwritten:

“Mondays: runs high after weekend discharges. Knock the cut-off down 5.”
“Oncology step-down: don't trust it on neutropenic patients. Check labs yourself.”
“Census over 84: predictions lag about half a day. Huddle catches it.”

43 pages like this. Not in any system. The vendor has never seen it.`,
    },
    {
      id: "integration-memo",
      title: "Main campus integration memo",
      body: `EHR setup: 14 fields the tool reads at the community campus are mapped differently or empty at main campus. Vendor estimate to remap: 6 weeks.
Bed management: a central command center (the community campus has none).
History: 2 bed-management dashboards retired at main campus in the last 3 years.
Planning invite list: does not include the command center director.`,
    },
    {
      id: "draft-story",
      title: "Draft story from Communications",
      body: `Headline: AI helps cut hospital stays across the system
“Following strong results at our community campus, the discharge-prediction tool is now being rolled out to every campus.”
Quote: [executive name to be confirmed]
Planned run date: May 19 (two weeks before main campus go-live)`,
    },
  ],
  nodes: [
    {
      id: "tier",
      type: "tier",
      title: "Does the community campus's risk rating still apply?",
      question:
        "The tool was rated low risk for a 90-bed campus where a charge nurse checks every prediction. Main campus has 380 beds and a command center. Does the rating carry over?",
      freeTextPrompt: "Does a new campus mean a new rating? Who sets it? Does it follow the tool or each campus?",
      elders: ["steward"],
      inject: () =>
        "Information Security says a new campus needs its own review. The AI Governance Workgroup says the rating is its call. Neither has seen the tool at main campus.",
      options: [
        {
          id: "a",
          label: "“Each campus gets its own rating before it goes live.”",
          hint: "Adds about three weeks before main campus's June go-live.",
          short: "Rate each campus",
        },
        {
          id: "b",
          label: "“Rate it once for the whole system, based on main campus.”",
          hint: "One review. The regional hospitals work more like the community campus than main.",
          short: "One system rating",
        },
        {
          id: "c",
          label: "“Keep the current rating. It's the same tool.”",
          hint: "No delay. The rating assumed a charge nurse reviews every prediction.",
          short: "Keep the rating",
        },
        decline("The June date stands on the current rating."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -2, dollars: 0, time: +2 },
        b: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
        c: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
        decline: { goodwill: 0, risk: +2, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 2",
          text: "Main campus's review starts with the integration memo. The 14 fields that read differently are the first item on the list.",
        },
        b: {
          when: "Week 2",
          text: "The system-wide review is written around the command center. The two regional hospitals, which have no command center, fall under the same rating.",
        },
        c: {
          when: "Week 1",
          text: "The rating is copied into the main campus plan. The line “charge nurse reviews every prediction” is copied with it.",
        },
        decline: {
          when: "Week 1",
          text: "June 2 stays on the schedule. The rating question goes on a list for after launch.",
        },
      },
      owner: {
        when: "Week 4",
        named:
          "Main campus IT finds that 3 of the 14 fields are simply empty there. The finding goes to the person you named, who adds a check before the rating is signed.",
        missing:
          "Main campus IT finds that 3 of the 14 fields are simply empty there. The finding goes into the integration tracker as low priority.",
      },
      later: {
        month: 5,
        named:
          "The first regional hospital's own rating turns up something main campus didn't have: its night shift handles discharges differently. It's fixed before go-live.",
        missing:
          "Main campus's predictions turn out to have run on three empty fields since go-live. Nobody had been asked to look.",
      },
    },
    {
      id: "risk_accept",
      type: "risk_accept",
      title: "Who signs for it on each campus?",
      question:
        "At the community campus, nobody ever signed for the tool's risk; the huddle just used it. Who signs for it at main campus, and at each regional hospital?",
      freeTextPrompt: "Who signs at main campus (a name or a role)? What's the rule for the regional hospitals?",
      elders: ["adoption_realist"],
      inject: (records) => {
        const c = choiceOf(records, "tier");
        const ask = "“Who signs for this on my floor? If it's not me, it doesn't run here.”";
        if (c === "c" || c === "decline" || c === null)
          return `Because the old rating carried over unchanged, the command center director has read it. She writes: “It says a charge nurse reviews every prediction. We don't have one.” Then: ${ask}`;
        return `The command center director writes to the program: ${ask}`;
      },
      options: [
        {
          id: "a",
          label: "“One executive signs once for all four campuses.”",
          hint: "One signature, from above the campuses, covers all four.",
          short: "One executive",
        },
        {
          id: "b",
          label: "“Write it into the vendor contract: the vendor shares the risk at new campuses.”",
          hint: "Legal estimates six weeks to negotiate. Vendor liability is usually capped at fees paid.",
          short: "Vendor shares it",
        },
        {
          id: "c",
          label: "“A named person at each campus signs before that campus goes live.”",
          hint: "Each campus can say no. Main campus's director will add conditions.",
          short: "Each campus signs",
        },
        decline("The director's question stays open."),
      ],
      meterDeltas: {
        a: { goodwill: -1, risk: +1, dollars: 0, time: -1 },
        b: { goodwill: 0, risk: +1, dollars: +1, time: +1 },
        c: { goodwill: +1, risk: -2, dollars: 0, time: +1 },
        decline: { goodwill: -1, risk: +2, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 2",
          text: "The executive signs. The command center director asks for a copy and for a name to call if it goes wrong.",
        },
        b: {
          when: "Week 6",
          text: "The vendor's draft rider caps its liability at fees paid and excludes problems caused by “local configuration or workflow.”",
        },
        c: {
          when: "Week 2",
          text: "The director signs with two conditions: a way to switch it off from the command center, and a named contact at the vendor. A regional hospital's nurse manager asks for a copy of her conditions.",
        },
        decline: {
          when: "Week 3",
          text: "The command center director moves the tool's integration to the bottom of her team's project list.",
        },
      },
      owner: {
        when: "Week 7",
        named:
          "A main campus unit asks to start early. It's sent to the person you named for that campus, who says not until the conditions are met.",
        missing:
          "A main campus unit turns on the predictions early to try them out. The command center hears about it at the next huddle.",
      },
      later: {
        month: 8,
        named:
          "A regional hospital's signer holds its go-live for three weeks over night-shift staffing. It goes live after that; the program absorbs the delay.",
        missing:
          "A patient at a regional hospital is discharged a day too early. The incident review asks who accepted the tool's risk there. The answer is a signature from the system office.",
      },
    },
    {
      id: "decide",
      type: "decide",
      title: "Who decides a campus is ready?",
      question:
        "The schedule says main campus goes live June 2. Someone has to decide whether it's actually ready. Who makes that call for each campus, and what do they check?",
      freeTextPrompt: "Who decides each campus is ready? What has to be true before go-live, besides the date?",
      elders: ["cartographer"],
      options: [
        {
          id: "a",
          label: "“The program decides. Keeping the schedule is the program's job.”",
          hint: "Dates hold. Campuses raise concerns through the program.",
          short: "Program decides",
        },
        {
          id: "b",
          label: "“Each campus's readiness lead decides, using a published checklist. The program sets dates, not go-lives.”",
          hint: "Campuses can move their date. June 2 may slip.",
          short: "Campus decides",
        },
        {
          id: "c",
          label: "“Both have to agree. Either the program or the campus can hold it.”",
          hint: "Two sign-offs. Disagreements go to the executive sponsor.",
          short: "Both agree",
        },
        decline("The schedule decides."),
      ],
      meterDeltas: {
        a: { goodwill: -1, risk: +1, dollars: 0, time: -1 },
        b: { goodwill: +1, risk: -1, dollars: 0, time: +1 },
        c: { goodwill: 0, risk: 0, dollars: 0, time: +2 },
        decline: { goodwill: -1, risk: +1, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "June 2",
          text: "Main campus goes live on schedule. The remapping of the 14 fields is about two-thirds done.",
        },
        b: {
          when: "Week 3",
          text: "Main campus's readiness lead moves go-live back five weeks, citing the field remapping. The program updates the schedule.",
        },
        c: {
          when: "Week 5",
          text: "The program says go; main campus says hold. The question goes to the executive sponsor, whose calendar opens in eight days.",
        },
        decline: {
          when: "June 2",
          text: "Main campus goes live on the scheduled date. Nobody was asked to confirm it was ready.",
        },
      },
      owner: {
        when: "Week 8",
        named:
          "The first regional hospital asks what it needs to have in place. The person you named sends the checklist that afternoon.",
        missing:
          "The first regional hospital asks what it needs to have in place. The program manager sends the community campus's huddle slides.",
      },
      later: {
        month: 6,
        named:
          "The main campus command center uses the predictions at every morning huddle.",
        missing:
          "The main campus command center has the tool open in a browser tab. Most mornings nobody looks at it.",
      },
    },
    {
      id: "stop",
      type: "stop",
      title: "Who can turn it off at a campus?",
      question:
        "If the tool starts misleading a campus's huddle — wrong data, a busier hospital, no Marisol — who can turn it off there, and what would make them do it?",
      freeTextPrompt: "Who can turn it off at each campus? What would make them do it?",
      elders: ["caretaker"],
      inject: () =>
        "Marisol emails the integration team: “I can't do the training trips, sorry. I've scanned my notebook. The Monday adjustment and the neutropenic patients are the big ones. I don't log my overrides — the reason box is optional.”",
      options: [
        {
          id: "a",
          label: "“Each campus can switch it off, on set triggers: acceptance drops, overrides spike, or an incident.”",
          hint: "Overrides must be logged with reasons for the triggers to work.",
          short: "Campus switch + triggers",
        },
        {
          id: "b",
          label: "“Only the program can switch it off. Campuses ask; the program decides.”",
          hint: "One switch, run centrally. Requests go through the program's queue.",
          short: "Program switch",
        },
        {
          id: "c",
          label: "“No formal switch. If a campus stops finding it useful, it stops using it.”",
          hint: "Nothing to build. The license keeps running either way.",
          short: "No formal switch",
        },
        decline("There's no switch at the campus level."),
      ],
      meterDeltas: {
        a: { goodwill: -1, risk: -2, dollars: 0, time: +1 },
        b: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
        c: { goodwill: 0, risk: +2, dollars: +1, time: 0 },
        decline: { goodwill: 0, risk: +2, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 3",
          text: "The override reason box becomes required. Marisol's notebook is typed up to make the list of reasons in the drop-down.",
        },
        b: {
          when: "Week 2",
          text: "The program sets up a request form for switching the tool off at a campus. The form's review target is three business days.",
        },
        c: {
          when: "Month 2",
          text: "The main campus huddle stops opening the predictions in week six. The license invoice arrives in month two as usual.",
        },
        decline: {
          when: "Week 2",
          text: "The go-live checklist has no line for switching the tool off.",
        },
      },
      owner: {
        when: "Week 9",
        named:
          "On the Monday after a holiday weekend, main campus's predictions are clearly off. The person you named pauses them for the day, and the huddle runs off the census board.",
        missing:
          "On the Monday after a holiday weekend, main campus's predictions are clearly off. The huddle uses them anyway; two discharges planned for that day slip to Tuesday.",
      },
      later: {
        month: 10,
        named:
          "A regional hospital's predictions drift after a software update. The campus pauses the tool for two weeks, the vendor fixes it, and the huddle goes back to using it.",
        missing:
          "The tool runs at all four campuses: relied on at one, ignored at two, and wrong at the fourth, where the huddle still follows it.",
      },
    },
    {
      id: "represent",
      type: "represent",
      title: "What can we say about the results?",
      question:
        "Communications wants to run “AI cuts hospital stays across the system” before main campus goes live. What can we say about one campus's results, and when?",
      freeTextPrompt: "Who approves the story? What can it claim? What date can't it run before?",
      elders: ["beacon"],
      inject: (records) =>
        choiceOf(records, "decide") === "b"
          ? "Because main campus's readiness lead moved go-live, the story's May 19 run date now falls seven weeks before go-live, not two."
          : "The story is scheduled for May 19. Main campus goes live June 2.",
      options: [
        {
          id: "a",
          label: "“Run it as drafted. Good news builds support for the rollout.”",
          hint: "Runs May 19. The claim covers campuses that haven't started.",
          short: "Run as drafted",
        },
        {
          id: "b",
          label: "“Nothing public until all four campuses are live and measured.”",
          hint: "About a year of silence. The community campus team's work isn't mentioned.",
          short: "Wait for all four",
        },
        {
          id: "c",
          label: "“Tell the community campus's story as it is: one campus, early results, rollout starting.”",
          hint: "Communications needs about a week to rewrite it. The headline gets smaller.",
          short: "One campus's story",
        },
        decline("The story stays on the May 19 schedule."),
      ],
      meterDeltas: {
        a: { goodwill: +1, risk: +2, dollars: 0, time: 0 },
        b: { goodwill: -1, risk: -1, dollars: 0, time: +1 },
        c: { goodwill: 0, risk: -1, dollars: 0, time: +1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "May 19",
          text: "The story runs. A main campus hospitalist posts it in the physicians' group chat with the comment “news to us.”",
        },
        b: {
          when: "Month 2",
          text: "Communications drops the story. The community campus's nurse manager asks why their results can't be mentioned.",
        },
        c: {
          when: "Week 2",
          text: "The rewritten story names the community campus and its charge nurses, and says main campus starts later this year.",
        },
        decline: {
          when: "May 19",
          text: "The story runs as drafted. Nobody had told Communications to change it.",
        },
      },
      owner: {
        when: "Week 6",
        named:
          "The state hospital association invites the system to present its results at a regional meeting. The invitation goes to the person you named, who sends the one-campus version.",
        missing:
          "The state hospital association invites the system to present its results at a regional meeting. Two people accept, one from the program and one from main campus.",
      },
      later: {
        month: 9,
        named:
          "One regional hospital's rollout is behind schedule. Nothing said publicly needs changing, because nothing public promised dates.",
        missing:
          "A regional hospital's rollout stalls. The May story is still the top search result for the tool, describing it at every campus.",
      },
    },
    {
      id: "funding",
      type: "funding",
      title: "Who pays for it after the grant?",
      question:
        "The grant that paid for the community campus ends in four months. Four campuses means four licenses, integration work, and training. Whose budget owns it from here on?",
      freeTextPrompt: "Whose budget owns it, permanently? What happens at the community campus if nobody does before the grant ends?",
      elders: ["ledger", "recruiter"],
      inject: (records) => {
        const base =
          "Marisol's manager emails the program: “Marisol has been offered a job at another hospital. Is there any way the huddle role becomes a real position?”";
        if (choiceOf(records, "stop") === "a")
          return `Because overrides are now logged, the program can see what the tool takes from Marisol: about 45 minutes every morning. ${base}`;
        return base;
      },
      options: [
        {
          id: "a",
          label: "“Each campus pays for its own, from its own budget.”",
          hint: "Campuses decide for themselves. The regional hospitals have the tightest budgets.",
          short: "Campuses pay",
        },
        {
          id: "b",
          label: "“Operations owns it for every campus: licenses, training, and a funded huddle lead at each.”",
          hint: "The largest cost of the three. The huddle lead is a new position at each campus.",
          short: "Operations owns it",
        },
        {
          id: "c",
          label: "“Cover the community campus from the Innovation Fund while we work out the numbers.”",
          hint: "Covers up to 12 months. Nothing is decided for the other three campuses.",
          short: "Innovation Fund",
        },
        decline("The grant ends in four months either way."),
      ],
      meterDeltas: {
        a: { goodwill: -1, risk: +1, dollars: +1, time: +1 },
        b: { goodwill: +1, risk: -1, dollars: +3, time: 0 },
        c: { goodwill: 0, risk: +1, dollars: +1, time: +1 },
        decline: { goodwill: -1, risk: +2, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Month 2",
          text: "A regional hospital's finance director asks for main campus's usage numbers before committing. The numbers aren't in yet.",
        },
        b: {
          when: "Month 1",
          text: "The budget line shows a huddle lead position at each campus next to the licenses. The first job posting is written from Marisol's notebook.",
        },
        c: {
          when: "Month 1",
          text: "The Innovation Fund covers the community campus for 12 months. The huddle role stays informal.",
        },
        decline: {
          when: "Month 4",
          text: "The grant ends. The vendor extends the community campus license for a 60-day courtesy period.",
        },
      },
      owner: {
        when: "Month 3",
        named:
          "Finance asks who will present the tool's budget in the fall planning cycle. The person you named is already on the list.",
        missing:
          "Finance asks who will present the tool's budget in the fall planning cycle. Nobody replies before the deadline.",
      },
      later: {
        month: 11,
        named:
          "The tool is in next year's budget under one owner. The community campus's results hold through the change of fiscal year.",
        missing:
          "Marisol leaves for another hospital. Within nine weeks, the community campus's length of stay is back where it was before the tool.",
      },
    },
  ],
  // Villager beats: shown after the named node locks (PRD §7.2).
  villagers: {
    risk_accept: {
      archetype: "The One Who Makes It Work Anyway",
      speaker: "Marisol, charge nurse at the community campus",
      line: "I get in at 5:45 to adjust the numbers before huddle. On my days off, the night charge nurse texts me a photo of the screen.",
    },
    decide: {
      archetype: "The Last to Be Asked",
      speaker: "The main campus bed command center director",
      line: "I found out our go-live date from the project schedule, the same morning as everyone else.",
    },
    stop: {
      archetype: "The Third Pilot This Year",
      speaker: "A main campus unit nurse",
      line: "Main campus has had two bed-management tools in three years. Nobody switched them off; we just stopped opening them. I sat through the training for both.",
    },
    funding: {
      archetype: "The Person in the Chair",
      speaker: "A patient at the community campus",
      line: "The plan said I'd go home Thursday. I went home Saturday. Nobody told me why the plan changed.",
    },
  },
  // Role cards with asymmetric information (PRD §6). Printed, dealt at setup.
  roleCards: {
    "The Executive Sponsor": {
      mandate: [
        "Your job: you sponsor the system-wide rollout. Is its schedule right for four very different hospitals?",
        "You won't go along with: a go-live date nobody will hold, or one nobody is allowed to stop.",
        "You're judged on: the system-wide results you promised, and how the next campuses go.",
      ],
      asymmetric: [
        {
          text: "You told the board in the spring that the tool would be live at all four campuses this fiscal year.",
          cue: "someone suggests slowing the rollout",
        },
        {
          text: "The command center director wasn't invited to planning because you asked for a small group to protect the date. The director has since asked you for a meeting.",
          cue: "the room talks about whether main campus is ready",
        },
      ],
    },
    "The Security Guard": {
      mandate: [
        "Your job: what a bigger rollout multiplies — access, connections, and settings drifting apart.",
        "You won't go along with: the community campus's rating being copied to a different EHR setup without a look.",
        "You're judged on: incidents, and overrides of automated recommendations that nobody logs.",
      ],
      asymmetric: [
        {
          text: "With only 12% of overrides explained, the community campus wouldn't pass the audit standard used for every other clinical decision tool here.",
          cue: "overrides come up",
        },
        {
          text: "The vendor's six-week remapping estimate covers building the new mappings, not testing them.",
          cue: "the June date comes up",
        },
      ],
    },
    "The Money Manager": {
      mandate: [
        "Your job: the full bill — four licenses, integration, training, and the people.",
        "You won't go along with: ongoing commitments made on grant money that's about to end.",
        "You're judged on: staying on budget, and licenses nobody uses.",
      ],
      asymmetric: [
        {
          text: "Enterprise pricing requires four campuses. Dropping one later saves almost nothing.",
          cue: "someone suggests starting with fewer campuses",
        },
        {
          text: "The Innovation Fund already carries two tools on bridge funding. Its own review says both are overdue for a permanent home.",
          cue: "bridge funding comes up",
        },
      ],
    },
    "The AI Guru": {
      mandate: [
        "Your job: whether the model works with different data, a busier hospital, and a different culture.",
        "You won't go along with: calling the hand-tuned version and the untuned version the same tool.",
        "You're judged on: whether what ships behaves like what was shown.",
      ],
      asymmetric: [
        {
          text: "The model was trained on community hospitals. Main campus's winter census is outside anything it has seen.",
          cue: "main campus's size comes up",
        },
        {
          text: "Marisol's Monday adjustment corrects a real, repeatable error in the model. The vendor has never acknowledged it.",
          cue: "Marisol's notebook comes up",
        },
      ],
    },
    "The Competitive Marketing Leader": {
      mandate: [
        "Your job: the system's story about this tool, and how close it is to what's happening on the floor.",
        "You won't go along with: a headline about the whole system based on one campus's results.",
        "You're judged on: credibility with other hospitals.",
      ],
      asymmetric: [
        {
          text: "The executive the draft story will quote hasn't seen it.",
          cue: "the story comes up",
        },
        {
          text: "A health-tech writer has been messaging community campus nurses on LinkedIn asking for interviews.",
          cue: "the room decides what can be said",
        },
      ],
    },
  },
};
