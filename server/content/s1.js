// Scenario 1 — "Three Worthy Requests, Capacity for One" (enters at Intake).
// Fictional composite. The room does not pick the winner; it sets how the AI
// Lab picks and what the winner must live by. The four properties: an
// unstated purpose (the AI Lab's charter says "to be completed"); never-rated
// objects (no request has a risk level); a budget/authority split (the slot
// is people, not money; the money sits with sponsors and outside parties);
// an ambiguous evidence base with no ending (one savings claim from other
// customers, one grant with no year two, one signed page, no day-90 bar).
import { choiceOf, decline } from "./common.js";

export default {
  id: "s1",
  title: "Three Worthy Requests, Capacity for One",
  entersAt: "Intake",
  tagline: "Three AI requests, one build slot this quarter, and no written rule for choosing.",
  opening: [
    {
      text: "Monday morning. The AI Lab has one build-and-test slot this quarter. Three requests came in last week.",
    },
    {
      channel: "Email",
      when: "8:12 a.m.",
      from: "Revenue cycle director",
      to: "AI Lab intake",
      text: "Following up on the appeal-letter tool. The vendor can start in 30 days, and our prior-auth denial backlog is around 4,000 claims. Can we get on this week's list?",
    },
    {
      channel: "Email",
      when: "9:30 a.m.",
      from: "Trial-matching grant PI",
      to: "AI Lab intake",
      text: "Our grant year starts next month. I don't need your money, I need your approval. Which committee do I write to — or can we just start in the department?",
    },
    {
      channel: "Teams",
      when: "11:47 a.m.",
      from: "Triage line charge nurse",
      to: "AI Lab intake",
      text: "Hi — just checking our request arrived? It's for a tool to help draft callback notes. We had two callbacks last month that went out later than they should have.",
    },
    {
      text: "The intake meeting is today. You're not picking the winner. You're deciding how the AI Lab picks, and what the winner has to live by.",
    },
  ],
  modelBrief: `The AI Lab has one build-and-test slot this quarter (about 90 days) and half of one analyst for evaluation. Its charter, drafted 11 months ago, still lists its purpose and intake process as "to be completed." Information Security's review wait is officially about six weeks.
Three requests arrived in the same week; none has a risk level:
1. An appeal-letter tool that drafts prior-authorization appeal letters from claims and clinical notes. Vendor product. Sponsor: a revenue cycle director with a backlog of around 4,000 denied claims. The vendor claims about $2.1M a year recovered, based on three other customers' self-reported results, and says it can go live in 30 days.
2. A trial-matching tool that screens charts for clinical-trial eligibility. Academic collaboration; a grant covers year one. The principal investigator says the department will start it on its own if the AI Lab doesn't approve it. Needs read access to full charts.
3. A triage-line assistant that drafts callback notes for the nurse triage phone line, for a nurse to edit and send. Requested by the triage nurses themselves after two late callbacks; no senior sponsor, no budget.
The room is not choosing the winner. It is deciding what the AI Lab is for, how requests get a risk level, who picks and who tells the others, what the winner must show at day 90, whose money builds it, and what can be said outside.`,
  evidence: [
    {
      id: "charter",
      title: "AI Lab charter (draft, 11 months old)",
      body: `AI LAB — CHARTER (DRAFT)

Sponsor: Executive sponsor for AI
Capacity: one build-and-test slot per quarter
Evaluation support: half of one analyst

Purpose: [to be completed]
Intake process: [to be completed]
How requests are ranked: [to be completed]

Last comment, 11 months ago: “Let's finalize this after the first few projects.”`,
    },
    {
      id: "appeal-one-pager",
      title: "Appeal-letter tool — vendor one-pager",
      body: `Drafts prior-authorization appeal letters from claims and clinical notes.

“About $2.1M a year recovered.”
Footnote: average of three customers' self-reported results; denial rates measured before 2020; no analysis of your data.

“Go-live in 30 days.”
Data used: claims, clinical notes.`,
    },
    {
      id: "grant-summary",
      title: "Trial-matching grant summary",
      body: `Tool: screens patient charts for clinical-trial eligibility and flags candidates to research coordinators.
Data needed: read access to full charts.

Year one (covered by the grant): software, setup, one research coordinator.
Years two and three: not addressed in the grant.

PI note: “Grant year starts next month.”`,
    },
    {
      id: "triage-request",
      title: "Triage line request (one page, 14 signatures)",
      body: `What we're asking for: a tool that drafts callback notes from our call documentation and the triage protocol, for a nurse to edit and send.

Why: callbacks are going out late on busy nights. Two last month were later than the protocol allows; both were reported through the safety-event system.

Sponsor: none yet. We weren't sure who to ask.

Signed: 14 triage line nurses`,
    },
  ],
  nodes: [
    {
      id: "purpose",
      type: "purpose",
      title: "What is the AI Lab for?",
      question:
        "The AI Lab's charter still says “purpose: to be completed.” Before anyone ranks the three requests: what is the lab for, and what isn't it for?",
      freeTextPrompt: "The lab's purpose in one sentence. One thing it is not for. Who signs off on that?",
      elders: ["cartographer"],
      options: [
        {
          id: "a",
          label: "“Use the AI goals in the strategic plan. They're already approved.”",
          hint: "No new sign-off needed. All three requests fit its wording.",
          short: "Strategic plan",
        },
        {
          id: "b",
          label: "“Skip the purpose for now. Rank the three on expected return and readiness.”",
          hint: "Faster. Only the appeal-letter tool has a dollar figure attached.",
          short: "Rank on return",
        },
        {
          id: "c",
          label: "“Write it here today and send it to the executive sponsor to confirm.”",
          hint: "This meeting plus about a week for sign-off. The grant year starts next month.",
          short: "Write it today",
        },
        decline("The charter stays blank. The three get ranked some other way."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
        b: { goodwill: -1, risk: +2, dollars: 0, time: -1 },
        c: { goodwill: 0, risk: -1, dollars: 0, time: +1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Tuesday",
          text: "The strategic plan's wording goes into the charter: “advance our mission through responsible AI across every domain.” All three requests meet it.",
        },
        b: {
          when: "Tuesday",
          text: "The intake analyst builds a scoring sheet. The appeal-letter tool leads on expected return; the triage-line assistant scores zero on that line.",
        },
        c: {
          when: "Next Monday",
          text: "The executive sponsor confirms the purpose with one edit. The PI emails the same day to ask whether a grant-funded research tool is in or out.",
        },
        decline: {
          when: "Tuesday",
          text: "The charter stays at “to be completed.” The revenue cycle director asks for a meeting with the executive sponsor directly.",
        },
      },
      owner: {
        when: "Week 3",
        named:
          "A fourth request arrives, a scheduling tool from outpatient access. The person you named sends back the purpose statement and a yes or no within two days.",
        missing:
          "A fourth request arrives, a scheduling tool from outpatient access. It joins the other three in the intake inbox with no way to compare it.",
      },
      later: {
        month: 5,
        named:
          "The AI Lab turns down a request in writing, quoting its purpose statement. The requester appeals once, then withdraws.",
        missing:
          "The AI Lab has seven requests in its queue and no written way to rank them. The two with the most senior sponsors are at the top.",
      },
    },
    {
      id: "tier",
      type: "tier",
      title: "What risk level is each request?",
      question:
        "None of the three requests has a risk level. Does intake set one before ranking — and does it follow the tool, or what the tool is used for?",
      freeTextPrompt: "Who sets the risk level at intake? Does it follow the tool, or what the tool is used for?",
      elders: [],
      options: [
        {
          id: "a",
          label: "“Rate all three now, by what they'd be used for and what data they touch.”",
          hint: "About a week of Information Security's time. The ranking may change.",
          short: "Rate all three now",
        },
        {
          id: "b",
          label: "“Rate only the one that wins. The others don't need it yet.”",
          hint: "One rating instead of three, done after the pick.",
          short: "Rate the winner",
        },
        {
          id: "c",
          label: "“Send all three to Information Security's review queue.”",
          hint: "The queue is about six weeks. The grant year starts before that.",
          short: "Security queue",
        },
        decline("They're ranked with no risk level."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -2, dollars: 0, time: +1 },
        b: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
        c: { goodwill: -1, risk: -1, dollars: 0, time: +2 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      },
      events: {
        a: {
          when: "Friday",
          text: "Information Security's first pass rates the triage-line assistant highest of the three, because it reads live patient call notes. The appeal-letter tool comes back lowest.",
        },
        b: {
          when: "Friday",
          text: "The rule goes into the intake notes. The PI writes back to ask whether a tool run inside the department would ever need a rating.",
        },
        c: {
          when: "Week 4",
          text: "All three are still in the review queue. The appeal-letter vendor offers to fill in the security questionnaire itself to speed things up.",
        },
        decline: {
          when: "Friday",
          text: "The ranking meeting goes ahead with no risk information. Each request is described only by its sponsor's cover note.",
        },
      },
      owner: {
        when: "Week 6",
        named:
          "The trial-matching team asks to add a feature that reads pathology reports. The person you named says it needs its own rating first, and gives a date.",
        missing: "The trial-matching team adds a feature that reads pathology reports. Nobody is told.",
      },
      later: {
        month: 8,
        named:
          "A department tries to start an AI tool without going through intake. Its first vendor invoice is held because the tool has no risk rating on file.",
        missing:
          "A department AI tool that never went through intake is found reading full charts. It has been running for five months and has about 40 users.",
      },
    },
    {
      id: "decide",
      type: "decide",
      title: "Who picks, and who tells the other two?",
      question:
        "One slot, three requests. Who makes the pick, who do they listen to, and who tells the two that don't get it?",
      freeTextPrompt: "Who makes the pick? Who advises them? By what date? Who tells the other two?",
      elders: ["adoption_realist"],
      inject: (records) => {
        const c = choiceOf(records, "purpose");
        const email =
          "The PI's email is forwarded into the meeting: “Which committee do I write to, or can we just start?”";
        if (c === "a")
          return `${email} Because you used the strategic plan's wording, all three requests fit it, the PI's included.`;
        if (c === "c" || c === "writein")
          return `${email} The purpose statement you wrote is the first thing anyone will quote back to the PI.`;
        return `${email} Because the lab has no written purpose, there is nothing to answer it with except the ranking.`;
      },
      options: [
        {
          id: "a",
          label: "“Put it to the AI Oversight Committee. They vote at next month's meeting.”",
          hint: "Everyone gets a say. The meeting is four weeks out; the grant year starts in five.",
          short: "Committee vote",
        },
        {
          id: "b",
          label: "“One person picks by the end of the month, after hearing from all three sponsors.”",
          hint: "One name on the pick and on the two “no” emails.",
          short: "One person picks",
        },
        {
          id: "c",
          label: "“Send it up. The executive sponsor for AI makes the call.”",
          hint: "Clear authority. The sponsor's calendar has an opening in about ten days.",
          short: "Send it up",
        },
        decline("All three keep waiting. The grant year starts next month."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: 0, dollars: 0, time: +2 },
        b: { goodwill: -1, risk: 0, dollars: 0, time: 0 },
        c: { goodwill: 0, risk: 0, dollars: 0, time: +1 },
        decline: { goodwill: -1, risk: +1, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 4",
          text: "The committee asks for a scoring sheet and moves the vote to next month. The PI starts the tool in the department the following week.",
        },
        b: {
          when: "Friday",
          text: "The decider books 20 minutes with each sponsor. The revenue cycle director sends a new slide deck the night before.",
        },
        c: {
          when: "Day 10",
          text: "The meeting with the sponsor runs short. The sponsor asks for a one-page recommendation by Friday.",
        },
        decline: {
          when: "Week 3",
          text: "The appeal-letter vendor books a demo with the CFO directly. The triage nurses stop checking the intake inbox.",
        },
      },
      owner: {
        when: "Week 5",
        named:
          "The triage nurses ask where their request stands. The person you named calls their charge nurse that day with a yes or no and the reason.",
        missing:
          "The triage nurses ask where their request stands. Nobody is sure who should answer; their charge nurse gets three different replies.",
      },
      later: {
        month: 3,
        named:
          "The two requests that didn't get the slot each have a date to reapply. Neither has started on its own.",
        missing:
          "One of the requests that didn't get the slot is running anyway, inside its own department, outside the AI Lab.",
      },
    },
    {
      id: "proof",
      type: "proof",
      title: "What does the winner have to show at day 90?",
      question:
        "The slot is 90 days of building and testing. What does the winner have to show at day 90 to keep going, and is that set before anyone knows who wins?",
      freeTextPrompt: "What number at day 90? Who checks it? Is it set now, or after the pick?",
      elders: ["decoupler", "recruiter"],
      options: [
        {
          id: "a",
          label: "“Let the winner propose its own targets in the first week.”",
          hint: "The team that knows the tool sets the targets.",
          short: "Winner sets targets",
        },
        {
          id: "b",
          label: "“Day 90 is a demo to the sponsor, then a go/no-go meeting.”",
          hint: "Nothing to agree now. The decision rests on the demo and the discussion.",
          short: "Demo day",
        },
        {
          id: "c",
          label: "“Set it now, for whoever wins: one measurable target, a usage floor, and who checks.”",
          hint: "About an hour today. The winner inherits targets it didn't write.",
          short: "Set it now",
        },
        decline("Day 90 arrives with no target."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
        b: { goodwill: 0, risk: +1, dollars: 0, time: -1 },
        c: { goodwill: -1, risk: -1, dollars: 0, time: +1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      },
      events: {
        a: {
          when: "Week 1",
          text: "The winning team proposes three targets, all of them things it already tracks.",
        },
        b: {
          when: "Week 10",
          text: "The half-time analyst spends most of the last three weeks building the demo.",
        },
        c: {
          when: "Week 1",
          text: "The targets go into the intake record before the pick is announced. The two sponsors who don't get the slot ask for a copy.",
        },
        decline: {
          when: "Day 90",
          text: "The go/no-go meeting opens with “So, did it work?” The sponsor answers first.",
        },
      },
      owner: {
        when: "Week 6",
        named:
          "The half-time analyst is moved onto another project. The person you named has the checking reassigned within the week.",
        missing:
          "The half-time analyst is moved onto another project. Nobody picks up the checking, and the week-six numbers aren't pulled.",
      },
      later: {
        month: 4,
        named:
          "At day 90 the winner clears its target by a small margin. The number and the margin both go into next quarter's intake notes.",
        missing:
          "Day 90 is a well-attended demo, and the pilot rolls into a second 90 days. Nobody can say what the first 90 showed.",
      },
    },
    {
      id: "funding",
      type: "funding",
      title: "Whose money builds it?",
      question:
        "The slot comes with people, not money. Whose budget pays to build the winner, and what's the rule for grant money or a vendor's free pilot?",
      freeTextPrompt: "Whose budget pays for the build? What's the rule for outside money?",
      elders: ["ledger"],
      inject: (records) =>
        choiceOf(records, "decide") === "c"
          ? "Because the pick went to the executive sponsor, it took ten days. In that time the appeal-letter vendor sent a new offer: six months free, then list price."
          : "The appeal-letter vendor sends a new offer: six months free, then list price. The terms are attached.",
      options: [
        {
          id: "a",
          label: "“The AI Lab's budget pays. Outside money comes in only on our written terms.”",
          hint: "The lab's budget becomes the limit on what gets built.",
          short: "Lab pays, our terms",
        },
        {
          id: "b",
          label: "“The winning sponsor pays for their own build.”",
          hint: "Sponsors with budgets can start. The triage nurses have no budget.",
          short: "Sponsor pays",
        },
        {
          id: "c",
          label: "“Take the free pilot or the grant. It's real money and it's on the table.”",
          hint: "No cost this year. The terms decide what happens at renewal.",
          short: "Take outside money",
        },
        decline("Money comes in on whatever terms it arrives with."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -1, dollars: +2, time: 0 },
        b: { goodwill: -1, risk: 0, dollars: 0, time: +1 },
        c: { goodwill: 0, risk: +2, dollars: -1, time: -1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      },
      events: {
        a: {
          when: "Week 2",
          text: "The AI Lab's budget is written into the intake record for the first time. Finance asks whether it is enough for the lab's stated purpose.",
        },
        b: {
          when: "Week 2",
          text: "The triage-line request is marked “no sponsor funding.” The intake analyst moves it to the bottom of the list.",
        },
        c: {
          when: "Week 2",
          text: "The free-pilot terms arrive: the vendor keeps usage data, renewal is at list price, and the cancer center agrees to be a reference customer.",
        },
        decline: {
          when: "Week 3",
          text: "The grant money starts being spent in the department, and the vendor's free pilot starts in revenue cycle. Neither went through the AI Lab.",
        },
      },
      owner: {
        when: "Week 6",
        named:
          "A second vendor offers a free pilot to another department. It goes to the person you named, who sends back the outside-money rule and asks the vendor to agree to it first.",
        missing:
          "A second vendor offers a free pilot to another department. A manager there signs it, under their $50,000 signing limit.",
      },
      later: {
        month: 10,
        named:
          "The winner's renewal goes to Finance with a named owner and a price agreed a year earlier.",
        missing:
          "A renewal invoice at list price arrives for a tool the AI Lab never chose. The tool has users by now, so it is paid.",
      },
    },
    {
      id: "represent",
      type: "represent",
      title: "What can we say about it outside?",
      question:
        "Whichever request wins, someone will want to talk about it: the vendor has a press release drafted, and the PI has an abstract due. What can we say outside, and when?",
      freeTextPrompt: "Who approves what we say outside? What has to be true before we say it?",
      elders: ["beacon"],
      inject: () =>
        "Communications forwards the appeal-letter vendor's draft release. It says the cancer center is partnering with the vendor to “transform prior authorization.” The vendor hasn't been picked.",
      options: [
        {
          id: "a",
          label: "“Each sponsor handles their own outside communication, as they do now.”",
          hint: "No new process. Up to three versions go out under our name.",
          short: "Sponsors decide",
        },
        {
          id: "b",
          label: "“Nothing goes out until the day-90 target is met. Communications approves every claim.”",
          hint: "The vendor and the PI both wait. The abstract is due before day 90.",
          short: "Wait for day 90",
        },
        {
          id: "c",
          label: "“Announce the partnership now and the results later. Keep the two separate.”",
          hint: "The vendor gets its release this month. Results aren't mentioned.",
          short: "Announce now",
        },
        decline("The vendor's draft stays in Communications' inbox."),
      ],
      meterDeltas: {
        a: { goodwill: +1, risk: +2, dollars: 0, time: 0 },
        b: { goodwill: -1, risk: -1, dollars: 0, time: +1 },
        c: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      },
      events: {
        a: {
          when: "Month 1",
          text: "Two versions go out in the first month: the vendor's release and a department newsletter item. They describe the tool differently.",
        },
        b: {
          when: "Week 2",
          text: "Communications gives the vendor and the PI the date day-90 results are due. The PI pulls the abstract and plans for next year's meeting.",
        },
        c: {
          when: "Week 3",
          text: "The release runs in two trade newsletters. An informatics lead at another cancer center emails to ask how the pilot is going. It hasn't started.",
        },
        decline: {
          when: "Week 5",
          text: "Hearing nothing back, the vendor puts the release in its own customer newsletter.",
        },
      },
      owner: {
        when: "Week 8",
        named:
          "A reporter asks about the cancer center's use of AI in billing. The call goes to the person you named, who gives a two-sentence answer that matches the record.",
        missing:
          "A reporter asks about the cancer center's use of AI in billing. The story quotes three people from three departments.",
      },
      later: {
        month: 12,
        named:
          "The only public statement about the pilot is the one approved at day 90. It hasn't needed a correction.",
        missing:
          "Another cancer center presents a talk on why it chose not to use the same vendor. One of its slides is our press release.",
      },
    },
  ],
  // Villager beats: shown after the named node locks (PRD §7.2).
  villagers: {
    tier: {
      name: "The Person in the Chair",
      line: "I called the triage line at 2 a.m. about a fever. I didn't know my call notes might be read by anything other than the nurse.",
    },
    decide: {
      name: "The Last to Be Asked",
      line: "Fourteen of us signed the request and sent it to the intake inbox. Nobody has replied. We don't know who reads it.",
    },
    proof: {
      name: "The Third Pilot This Year",
      line: "My team won a slot last year. Nobody told us what counted as success, so we spent the last month on the demo.",
    },
    funding: {
      name: "The One Who Signs",
      line: "I sign department contracts up to $50,000. Last year I signed two free pilots. Both renewal invoices came to me this spring, and both tools had users by then.",
    },
  },
  // Role cards with asymmetric information (PRD §6). Printed, dealt at setup.
  roleCards: {
    "The Doctor": {
      mandate: [
        "Your job: what each request would do to patient care and to clinicians' time.",
        "You won't go along with: a pick made without a clinician's view in the ranking.",
        "You're judged on: whether clinicians use what gets built.",
      ],
      asymmetric: [
        {
          text: "The triage nurses wrote their request after two late callbacks last month. To them it's a safety tool.",
          cue: "the room compares the three requests",
        },
        {
          text: "The PI's last department pilot used about a day a week of clinic staff time for “optional” data checks.",
          cue: "the room talks about what the winner has to show",
        },
      ],
    },
    "The Security Guard": {
      mandate: [
        "Your job: the risk each request brings in.",
        "You won't go along with: any of the three starting before someone has looked at what patient data it touches.",
        "You're judged on: incidents, and how long the review queue is.",
      ],
      asymmetric: [
        {
          text: "The real wait for a security review is closer to nine weeks than six. The six-week figure is from before someone left.",
          cue: "someone suggests sending it to Information Security",
        },
        {
          text: "The appeal-letter vendor's standard contract sends de-identified text to a subcontractor in a country Legal has raised concerns about before.",
          cue: "the appeal-letter tool comes up",
        },
      ],
    },
    "The Money Manager": {
      mandate: [
        "Your job: what each option costs to build, to grow, and to renew.",
        "You won't go along with: anything described as free without the renewal terms in writing.",
        "You're judged on: staying on budget. Surprises land on you.",
      ],
      asymmetric: [
        {
          text: "The AI Lab's build budget this year is about $180,000, less than one year of the appeal-letter tool at list price.",
          cue: "money comes up",
        },
        {
          text: "The grant carries a 20% institutional overhead the department hasn't budgeted for.",
          cue: "the grant is described as free money",
        },
      ],
    },
    "The AI Guru": {
      mandate: [
        "Your job: what each tool actually does, compared with what its sponsor says.",
        "You won't go along with: ranking on the vendor's savings figure without checking it against our own numbers.",
        "You're judged on: whether what ships works.",
      ],
      asymmetric: [
        {
          text: "The appeal-letter tool's 30-day start assumes an EHR connection we don't have. A realistic start is about four months.",
          cue: "timelines come up",
        },
        {
          text: "The triage-line assistant is by far the simplest of the three to build.",
          cue: "the room compares the three requests",
        },
      ],
    },
    "The Competitive Marketing Leader": {
      mandate: [
        "Your job: what people outside hear about our AI work, and when.",
        "You won't go along with: claims under our name that go further than the evidence.",
        "You're judged on: our standing with other cancer centers.",
      ],
      asymmetric: [
        {
          text: "Two other cancer centers tried the appeal-letter tool and dropped it. Neither said so publicly.",
          cue: "the appeal-letter tool comes up",
        },
        {
          text: "A reporter has an open question with Communications about AI in cancer care and will run the first concrete example anyone offers.",
          cue: "announcements come up",
        },
      ],
    },
  },
};
