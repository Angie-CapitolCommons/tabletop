// Scenario 2 — "Approved in Principle, Stuck in Evaluation" (enters at
// Evaluation). Fictional composite. The vendor is cooperative; the stall is
// internal. The four properties: an unstated purpose (approved "in principle"
// for a purpose nobody wrote down, and two senior pathologists want different
// things); a never-rated object (the sandbox was never given a risk level); a
// budget/authority split (the committee approved, the department carries the
// work, and a yes means a purchase nobody budgeted); an ambiguous evidence
// base with no ending (two published numbers that disagree, none on our own
// slides, and no end date).
import { choiceOf, decline } from "./common.js";

export default {
  id: "s2",
  title: "Approved in Principle, Stuck in Evaluation",
  entersAt: "Evaluation",
  tagline: "Approved seven months ago “pending evaluation.” Nobody defined the evaluation.",
  opening: [
    { text: "Thursday afternoon." },
    {
      channel: "Email",
      when: "4:52 p.m.",
      from: "Vendor account manager",
      to: "AI Oversight Committee coordinator",
      text: "Our sandbox term ends on the 28th. We're happy to extend again or move to an evaluation agreement. Could you send us the evaluation criteria your team is using, so we can support it?",
    },
    {
      channel: "Email",
      when: "Friday, 8:15 a.m.",
      from: "AI Oversight Committee coordinator",
      to: "Pathology department administrator",
      text: "Can you send me the evaluation criteria for the pathology pre-screen tool? I can't find them in the minutes.",
    },
    {
      channel: "Email",
      when: "Friday, 10:40 a.m.",
      from: "Pathology department administrator",
      to: "AI Oversight Committee coordinator",
      text: "I thought the committee was setting those. Dr. Renner and Dr. Vogel see the tool differently. Copying both.",
    },
  ],
  modelBrief: `The tool: a pathology pre-screen tool that flags areas on digitized slides for the pathologist to look at first.
History: seven months ago the AI Oversight Committee approved it "in principle, pending satisfactory evaluation," with the evaluation approach "to be determined." No criteria, owner, or end date were ever set. The vendor's sandbox, using archived de-identified slides, has been extended twice; the current term ends in about three weeks, after which pilot pricing ends and the vendor's standard price applies. The vendor is cooperative and has asked for the evaluation criteria. The sandbox receives the vendor's model updates automatically; results so far span two versions.
The department is split: Dr. Renner, a senior pathologist, sees it as a way to clear routine slides faster; Dr. Vogel, also senior, worries residents will stop learning on the slides it clears. Two residents already use the sandbox as a study aid without approval.
Evidence: the vendor's validation study reports 96% agreement with final diagnosis on the vendor's own slide set from other hospitals; another cancer center published 89% agreement on its slides, with more false flags. Nobody has run a structured test on our own slides. The vendor has not fully disclosed what data its model was trained on. The vendor lists the cancer center as an "evaluation partner." No budget exists for a purchase if the tool passes.`,
  evidence: [
    {
      id: "minutes",
      title: "Committee minutes, seven months ago",
      body: `AI OVERSIGHT COMMITTEE — MINUTES (EXCERPT)

Item 4: Pathology pre-screen tool
The committee approves the tool in principle, pending satisfactory evaluation. Evaluation approach to be determined by the appropriate parties.

Action: none recorded.`,
    },
    {
      id: "sandbox-terms",
      title: "Sandbox terms (current extension)",
      body: `Sandbox access: archived, de-identified slides only.
Term: extended twice. Current term ends in about three weeks.
On expiry without an evaluation agreement: sandbox access ends and pilot pricing lapses; the standard price list applies to any future agreement.
Model updates: the sandbox receives updates on the vendor's normal release schedule.
Listing: the vendor may describe the cancer center as an evaluation partner.`,
    },
    {
      id: "vendor-study",
      title: "Vendor validation study (summary)",
      body: `Slides: 2,400 cases from three hospitals, selected by the vendor.
Agreement with final diagnosis: 96%.
False flags (areas flagged that weren't significant): about 8%.
Scanner used: vendor's reference model.`,
    },
    {
      id: "peer-paper",
      title: "Another cancer center's published evaluation (abstract)",
      body: `Setting: a comprehensive cancer center, 600 consecutive cases.
Agreement with final diagnosis: 89%.
False flags: about 14%. Lower agreement on one stain type.
Scanner: a different model from the vendor's study.
Conclusion: “Useful as a second look; results depend on local slide preparation.”`,
    },
    {
      id: "two-views",
      title: "Two pathologists, one email thread",
      body: `Dr. Renner: “My residents spend hours on routine slides this could clear in seconds. That's time back for the hard cases.”

Dr. Vogel: “Residents learn on the routine slides. If the tool clears them, where does that learning happen?”`,
    },
  ],
  nodes: [
    {
      id: "purpose",
      type: "purpose",
      title: "What is the evaluation testing for?",
      question:
        "Dr. Renner wants it judged as a way to clear routine slides faster. Dr. Vogel wants to know what it does to resident training. Which question does the evaluation answer?",
      freeTextPrompt: "The one question the evaluation answers. Who confirms that choice with both pathologists?",
      elders: ["adoption_realist"],
      options: [
        {
          id: "a",
          label: "“Both. Measure time saved and the effect on residents in the same evaluation.”",
          hint: "Covers both views. Roughly twice the work, and none of it is staffed yet.",
          short: "Both questions",
        },
        {
          id: "b",
          label: "“Workload: does it save pathologist time? Track resident slide counts alongside.”",
          hint: "One question to answer. Dr. Vogel's concern is tracked but doesn't decide the result.",
          short: "Workload, tracked",
        },
        {
          id: "c",
          label: "“Run it on our slides first and see what it turns out to be good at.”",
          hint: "No choice needed today. The sandbox term ends in three weeks.",
          short: "Run it and see",
        },
        decline("Each pathologist keeps judging it by their own question."),
      ],
      meterDeltas: {
        a: { goodwill: +1, risk: 0, dollars: +1, time: +2 },
        b: { goodwill: -1, risk: 0, dollars: 0, time: 0 },
        c: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
        decline: { goodwill: -1, risk: 0, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 2",
          text: "The evaluation plan grows to two sections and 14 measures. Nobody has been given time to run either section.",
        },
        b: {
          when: "Week 1",
          text: "Dr. Vogel asks for one thing in writing: resident slide counts before and after, reported monthly. It goes into the plan.",
        },
        c: {
          when: "Week 2",
          text: "The sandbox runs on a batch of our archived slides. Dr. Renner reads the results as time saved; Dr. Vogel reads the same results as slides residents never see.",
        },
        decline: {
          when: "Week 2",
          text: "The department administrator sends the vendor two answers to its question, one from each pathologist.",
        },
      },
      owner: {
        when: "Week 3",
        named:
          "The residency program director asks whether residents may use the sandbox to study. The request goes to the person you named, who answers within the week.",
        missing:
          "The residency program director asks whether residents may use the sandbox to study. Two residents already are. Nobody replies.",
      },
      later: {
        month: 6,
        named:
          "The evaluation report answers the question it was set up to answer. Resident slide counts, measured monthly since week one, are in the appendix.",
        missing:
          "The department is still arguing about what the tool is for. Each side cites the same sandbox results.",
      },
    },
    {
      id: "proof",
      type: "proof",
      title: "What result ends the evaluation?",
      question:
        "The vendor's study says 96% agreement on its own slides. Another cancer center published 89% on theirs. What result, on what slides, ends the evaluation either way?",
      freeTextPrompt: "What result counts as a pass? On which slides? Who judges it, and by what date?",
      elders: ["decoupler"],
      inject: (records) => {
        const c = choiceOf(records, "purpose");
        if (c === null || c === "decline")
          return "Because nobody settled what is being tested, the vendor writes back asking which number matters to you: time per slide, or agreement with diagnosis.";
        return "The vendor sends its full validation package, 60 pages, and offers a call to walk through it.";
      },
      options: [
        {
          id: "a",
          label: "“Test it on our own slides: 300 recent cases, pass mark agreed now, fixed end date.”",
          hint: "About 120 pathologist hours over six weeks. Nobody has offered them yet.",
          short: "Our slides, fixed end",
        },
        {
          id: "b",
          label: "“Accept the vendor's study, plus a spot check of 30 of our slides.”",
          hint: "Done in two weeks. The vendor chose the slides in its study.",
          short: "Vendor study + spot check",
        },
        {
          id: "c",
          label: "“Use the other cancer center's published results. It's peer-reviewed and it's a similar place.”",
          hint: "No new work. Their slide preparation differs from ours in ways nobody has checked.",
          short: "Published results",
        },
        decline("The sandbox term ends in three weeks either way."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -2, dollars: +2, time: +1 },
        b: { goodwill: 0, risk: +2, dollars: 0, time: -1 },
        c: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 2",
          text: "The case list is pulled: 300 cases from the last year. The first line of the protocol is 120 pathologist hours, and the department asks where they come from.",
        },
        b: {
          when: "Week 2",
          text: "The 30-slide spot check matches the vendor's reading on 27. The department asks whether 30 slides is enough to say anything.",
        },
        c: {
          when: "Week 1",
          text: "The published paper goes round the department. Its methods section says their slides were stained and scanned differently from ours.",
        },
        decline: {
          when: "Week 3",
          text: "The sandbox term ends. The vendor's next email says pilot pricing has lapsed and the standard price list applies.",
        },
      },
      owner: {
        when: "Week 4",
        named:
          "A pathologist asks whether cases she read with the sandbox open this month count toward the evaluation. The person you named answers the same day, in writing.",
        missing:
          "A pathologist asks whether cases she read with the sandbox open this month count toward the evaluation. Three people give her three answers.",
      },
      later: {
        month: 5,
        named:
          "The evaluation ends on its end date with a result measured against the pass mark. The committee has something to decide on.",
        missing:
          "A new committee member asks for the status of the pre-screen tool. Four people give four answers.",
      },
    },
    {
      id: "risk_accept",
      type: "risk_accept",
      title: "Who signs for the risk of testing it?",
      question:
        "Testing isn't risk-free: our slides sit in the vendor's sandbox, the vendor hasn't said everything its model trained on, and residents already study with it. Who signs for that?",
      freeTextPrompt: "Who signs for the testing risk? What does the vendor have to tell us before testing goes on?",
      elders: ["steward"],
      options: [
        {
          id: "a",
          label: "“Carry on as is. Archived, de-identified slides are low risk.”",
          hint: "Testing continues without a pause.",
          short: "Carry on",
        },
        {
          id: "b",
          label: "“Pause the sandbox until the vendor answers every question, even if the term lapses.”",
          hint: "If it lapses, pilot pricing ends and restarting takes about two months.",
          short: "Pause the sandbox",
        },
        {
          id: "c",
          label: "“One person signs now, on condition the vendor answers the open questions within two weeks.”",
          hint: "Testing continues. The vendor has two weeks to answer.",
          short: "Sign, with conditions",
        },
        decline("Testing continues with nobody signed on."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
        b: { goodwill: -1, risk: -2, dollars: +1, time: +2 },
        c: { goodwill: 0, risk: -1, dollars: 0, time: +1 },
        decline: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
      },
      events: {
        a: {
          when: "Week 1",
          text: "The sandbox stays open. Information Security logs the decision and asks for the name of the person accepting it.",
        },
        b: {
          when: "Week 2",
          text: "The pause holds. The vendor's answers arrive nine days later, including a list of the outside slide collections it trained on.",
        },
        c: {
          when: "Week 2",
          text: "The vendor answers eight of the ten questions by the deadline. The two about training data come back marked “proprietary.”",
        },
        decline: {
          when: "Week 2",
          text: "The sandbox stays open. The two residents keep using it to study, and a third joins them.",
        },
      },
      owner: {
        when: "Week 3",
        named:
          "A screenshot from the sandbox turns up in a resident's teaching slides. It goes to the person you named, who has it taken out and sends the residents one message about what's allowed.",
        missing:
          "A screenshot from the sandbox turns up in a resident's teaching slides. The deck is shared with an outside course before anyone notices.",
      },
      later: {
        month: 7,
        named:
          "The contract draft includes a clause letting the vendor train on customer slides by default. The person who signed for the testing risk spots it and has it removed.",
        missing:
          "The contract draft includes a clause letting the vendor train on customer slides by default. It is signed along with the rest.",
      },
    },
    {
      id: "retier",
      type: "retier",
      title: "What happens when the vendor updates it?",
      question:
        "The sandbox updates itself on the vendor's schedule, so part of the testing so far was on an older version. What should happen when the version changes, and who watches for it?",
      freeTextPrompt: "When the version changes: restart, carry on, or split the results? Who watches for updates?",
      elders: ["caretaker"],
      inject: (records) =>
        choiceOf(records, "proof") === "a"
          ? "Because you're testing on 300 of our own cases, the analyst checks which version read them. Cases 1 to 140 went through version 2.3; the rest went through 2.4."
          : "The vendor's release email from last month says the sandbox moved from version 2.3 to 2.4. The numbers people have been quoting come from both.",
      options: [
        {
          id: "a",
          label: "“Write down the version for each result and keep going.”",
          hint: "No delay. The final numbers will mix versions.",
          short: "Note it, carry on",
        },
        {
          id: "b",
          label: "“Freeze the version for testing. After any update, the evaluation lead decides whether to restart.”",
          hint: "The vendor can freeze a version only on its enterprise plan.",
          short: "Freeze the version",
        },
        {
          id: "c",
          label: "“Let updates happen, and test whether results hold steady from version to version.”",
          hint: "Tests what we'd actually live with. Nobody here has run this kind of test.",
          short: "Test across versions",
        },
        decline("The sandbox keeps updating on the vendor's schedule."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
        b: { goodwill: 0, risk: -1, dollars: +1, time: +1 },
        c: { goodwill: 0, risk: -1, dollars: +1, time: +2 },
        decline: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
      },
      events: {
        a: {
          when: "Week 1",
          text: "A version column is added to the results sheet. The vendor's next update is due in five weeks.",
        },
        b: {
          when: "Week 2",
          text: "The vendor quotes enterprise-plan pricing for a frozen version. Finance asks whether that cost belongs to the evaluation or to the purchase.",
        },
        c: {
          when: "Week 3",
          text: "The test plan adds a repeat run after each update. The analyst estimates it adds about three weeks.",
        },
        decline: {
          when: "Week 5",
          text: "Version 2.5 installs in the sandbox overnight, halfway through testing.",
        },
      },
      owner: {
        when: "Week 6",
        named:
          "The release email for version 2.5 arrives. The person you named reads it that afternoon and pauses testing for two days to check what changed.",
        missing: "The release email for version 2.5 arrives in a shared mailbox. It is opened three weeks later.",
      },
      later: {
        month: 9,
        named:
          "The approval names the version it covers. The next update gets a short check before it reaches live cases.",
        missing:
          "The tool goes live on version 2.7. The evaluation report is about versions 2.3 and 2.4.",
      },
    },
    {
      id: "decide",
      type: "decide",
      title: "Who turns the result into a yes or no?",
      question:
        "When testing ends, someone has to turn the result into approved or not. Seven months ago the committee said yes “in principle.” Who decides this time, and by when?",
      freeTextPrompt: "Who decides? What result are they held to? By what date?",
      elders: ["cartographer", "ledger"],
      inject: (records) => {
        const c = choiceOf(records, "proof");
        if (c === null || c === "decline")
          return "The committee chair asks for a status update for next month's agenda. Because no pass mark was set, the update can only list dates: seven months, two extensions, no result.";
        return "The committee chair asks for a status update for next month's agenda. The pass mark you set is the first line of it.";
      },
      options: [
        {
          id: "a",
          label: "“One person decides within 30 days of the end date, held to the pass mark.”",
          hint: "The committee is told, not asked. The decider needs the pass mark set first.",
          short: "One decider",
        },
        {
          id: "b",
          label: "“The AI Oversight Committee votes on the evaluation report.”",
          hint: "The same committee decides. It meets monthly; this would be two meetings out.",
          short: "Committee votes",
        },
        {
          id: "c",
          label: "“The pathology department decides. It's their workflow.”",
          hint: "The people who use it decide. Right now the department is split.",
          short: "Department decides",
        },
        decline("The result, when it comes, has nowhere set to go."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: 0, dollars: 0, time: +1 },
        b: { goodwill: 0, risk: 0, dollars: 0, time: +2 },
        c: { goodwill: +1, risk: +1, dollars: 0, time: +1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 1",
          text: "The decider's name and the decision date go on the committee agenda as information. Nobody asks to discuss them.",
        },
        b: {
          when: "Month 2",
          text: "The report is item six of eight. The committee runs out of time at item five and moves it to next month.",
        },
        c: {
          when: "Week 2",
          text: "Dr. Renner and Dr. Vogel each ask for time at the department meeting to present their reading of the results.",
        },
        decline: {
          when: "Month 2",
          text: "The evaluation report is emailed to the committee mailbox, the department administrator, and the vendor. None of them replies to the others.",
        },
      },
      owner: {
        when: "Week 8",
        named: "The vendor asks when it will hear a decision. The person you named gives a date, and the vendor puts it in its forecast.",
        missing:
          "The vendor asks when it will hear a decision. The department says the committee decides; the committee says the department does.",
      },
      later: {
        month: 6,
        named:
          "The decision lands on the date set, signed by one person, with the result attached. The vendor hears the same day.",
        missing:
          "The tool is still “approved in principle.” The committee's next agenda lists it under old business.",
      },
    },
    {
      id: "represent",
      type: "represent",
      title: "What can we say about it outside?",
      question:
        "The vendor's website lists us as an “evaluation partner,” and another cancer center's pathology chair has called asking what we've found. What can we say while testing is under way?",
      freeTextPrompt: "Who approves what we say outside? What can be said now, and what has to wait?",
      elders: [],
      inject: (records) =>
        choiceOf(records, "risk_accept") === "b"
          ? "Because you paused the sandbox, the vendor asks whether it should also take our name off its partner list for now. It offers to do it today."
          : null,
      options: [
        {
          id: "a",
          label: "“Let the vendor keep the listing. It's accurate: we are evaluating it.”",
          hint: "No action needed. The listing stays up while testing continues.",
          short: "Keep the listing",
        },
        {
          id: "b",
          label: "“Say nothing outside, including to other centers, until there's a decision.”",
          hint: "The other center's chair gets no answer. The vendor takes the listing down.",
          short: "Say nothing",
        },
        {
          id: "c",
          label: "“Communications approves one plain statement: we're testing it, no results yet.”",
          hint: "About a week to agree the wording. The vendor changes its listing to match.",
          short: "One plain statement",
        },
        decline("The listing stays up. Calls from other centers go to whoever picks up."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
        b: { goodwill: -1, risk: 0, dollars: 0, time: 0 },
        c: { goodwill: 0, risk: -1, dollars: 0, time: +1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
      },
      events: {
        a: {
          when: "Week 3",
          text: "A regional pathology newsletter cites the vendor's partner list and describes the cancer center as “using” the tool.",
        },
        b: {
          when: "Week 1",
          text: "The vendor takes the listing down within a day. Dr. Renner asks whether he can still present the sandbox results at grand rounds.",
        },
        c: {
          when: "Week 2",
          text: "Communications signs off a two-sentence statement. The vendor's listing changes to match it the next day.",
        },
        decline: {
          when: "Week 3",
          text: "Dr. Renner tells the other center's chair it's “looking very promising.” Dr. Vogel hears about the call a week later.",
        },
      },
      owner: {
        when: "Week 6",
        named:
          "A resident submits a conference abstract about studying with the sandbox. It reaches the person you named before the deadline, who asks for one sentence to be changed.",
        missing:
          "A resident submits a conference abstract about studying with the sandbox. The department finds out when it's accepted.",
      },
      later: {
        month: 10,
        named: "Everything said outside about the tool this year matches what the evaluation found. None of it needed correcting.",
        missing:
          "The vendor publishes a case study describing the cancer center as having “adopted” the tool. There is still no decision.",
      },
    },
  ],
  // Villager beats: shown after the named node locks (PRD §7.2).
  villagers: {
    purpose: {
      name: "The Last to Be Asked",
      line: "I'm a second-year resident. I use the sandbox to study at night. Nobody has told me whether I'm supposed to.",
    },
    proof: {
      name: "The One Who Makes It Work Anyway",
      line: "I've been reading my routine slides with the sandbox open on the second screen. It's faster. I haven't told anyone, because I don't know if I'm allowed.",
    },
    decide: {
      name: "The Third Pilot This Year",
      line: "This is the third tool our lab has trialed this year. The other two are still waiting for a decision. My team stopped asking about them in the summer.",
    },
    represent: {
      name: "The One Who Stopped Asking",
      line: "Last spring I asked the vendor to take our name off its conference booth. They said to ask Communications. Communications said to ask the committee.",
    },
  },
  // Role cards with asymmetric information (PRD §6). Printed, dealt at setup.
  roleCards: {
    "The Doctor": {
      mandate: [
        "Your job: what the tool does to diagnostic accuracy and to how residents learn.",
        "You won't go along with: an evaluation that measures speed and ignores training.",
        "You're judged on: diagnostic accuracy, and pathologists' trust in what gets used.",
      ],
      asymmetric: [
        {
          text: "A junior pathologist asked Dr. Renner twice for protected time to test the tool properly and was told to keep it informal.",
          cue: "the room asks who will do the testing",
        },
        {
          text: "The residents using the sandbox to study are mostly first- and second-years, the ones who most need the routine slides.",
          cue: "someone says the sandbox is only archived slides",
        },
      ],
    },
    "The Security Guard": {
      mandate: [
        "Your job: what patient data sits with the vendor, and what the vendor has told us about it.",
        "You won't go along with: keeping the sandbox open while the vendor's answers are incomplete.",
        "You're judged on: what leaves the building, and what comes in without being checked.",
      ],
      asymmetric: [
        {
          text: "The vendor's de-identification was audited at another site and passed. That audit didn't look at what the model is trained on.",
          cue: "the vendor's answers come up",
        },
        {
          text: "You checked the sandbox logs: at least two residents have downloaded flagged images, not just viewed them.",
          cue: "the room talks about residents using the sandbox",
        },
      ],
    },
    "The Money Manager": {
      mandate: [
        "Your job: the real cost of testing, and the purchase waiting behind a yes.",
        "You won't go along with: purchase terms slipping into the evaluation agreement.",
        "You're judged on: staying on budget, and no surprise renewals.",
      ],
      asymmetric: [
        {
          text: "At list price the tool would be the department's biggest software cost, bigger than the microscope service contract. Nobody has budgeted for it.",
          cue: "someone asks what happens after a yes",
        },
        {
          text: "When pilot pricing lapses, the vendor's published price goes up about 40%.",
          cue: "someone suggests pausing the sandbox",
        },
      ],
    },
    "The AI Guru": {
      mandate: [
        "Your job: whether the testing would catch the problems that matter.",
        "You won't go along with: the vendor's own slide set as the main evidence.",
        "You're judged on: whether what passes testing works on live cases.",
      ],
      asymmetric: [
        {
          text: "Our slide scanners are the same model the other cancer center used, not the one in the vendor's study.",
          cue: "the room compares the 96% and the 89%",
        },
        {
          text: "The false-flag rate is what will decide whether pathologists keep using it. Neither study leads with it.",
          cue: "the room sets a pass mark",
        },
      ],
    },
    "The Competitive Marketing Leader": {
      mandate: [
        "Your job: what the vendor and others say about us.",
        "You won't go along with: the vendor calling us a partner while we haven't decided anything.",
        "You're judged on: the gap between what's said about us and what's true.",
      ],
      asymmetric: [
        {
          text: "The vendor showed our logo on its booth at last month's pathology conference, under “evaluation partners.”",
          cue: "the vendor's listing comes up",
        },
        {
          text: "The pathology chair who called is deciding whether to buy the tool. What we say may be quoted in their decision.",
          cue: "the room decides what to say outside",
        },
      ],
    },
  },
};
