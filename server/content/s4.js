// Scenario 4 — "Live a Year, Drifted, Spread Beyond Approval" (enters at
// Monitoring). Fictional composite; the reference scenario for voice and
// shape. The four properties: an unstated purpose (the approval said where
// and for how long, never what the tool was for, so GI's use can't be judged
// against anything); a never-rated object (no risk level, ever); a split
// (the sponsor moved on, no budget line owns it, two bodies each say it's the
// other's); an ambiguous evidence base with no ending (one spot check, the
// vendor's own number, no threshold, a six-month pilot in month fourteen).
import { choiceOf, decline } from "./common.js";

export default {
  id: "s4",
  title: "Live a Year, Drifted, Spread Beyond Approval",
  entersAt: "Monitoring",
  tagline: "Approved for one clinic for six months. Fourteen months later, three clinics use it.",
  opening: [
    {
      text: "Tuesday, 7:40 a.m. A GI oncology fellow is prepping for her 9:00 patient. The AI-drafted visit summary says “renal function stable.” The chart shows creatinine has doubled over three weeks. She fixes the note.",
    },
    {
      channel: "Secure chat",
      when: "7:46 a.m.",
      from: "GI oncology fellow",
      to: "GI clinic medical director",
      text: "Is someone supposed to be checking these summaries? This one missed a doubled creatinine.",
    },
    {
      channel: "Email",
      when: "9:15 a.m.",
      from: "GI clinic medical director",
      to: "Digital Health service desk",
      text: "Forwarding the message below. Who owns the AI summary tool?",
    },
    {
      channel: "Email",
      when: "11:02 a.m.",
      from: "Digital Health service desk",
      to: "GI clinic medical director",
      text: "That tool was approved as a pilot for the medical oncology clinic only. We didn't know GI was using it. Can you tell us how it got turned on in your clinic?",
    },
  ],
  modelBrief: `The tool: an AI visit-summary tool. It summarizes prior visits and drafts sections of the clinic note, and it is attached to a shared note template.
History: approved 14 months ago by the AI Governance Workgroup as a six-month pilot in the medical oncology clinic only. Conditions: a monthly chart check (no owner named) and no use elsewhere without coming back to the Workgroup. No risk level was assigned. The sponsoring clinic director has since moved to another role. Nobody has reviewed the tool since launch.
Now: it runs in three clinics. GI oncology and breast oncology turned it on by copying the medical oncology note template; the service desk didn't know. About 1,800 notes a week use it, up from about 300 early in the pilot. The vendor has pushed two model updates (version 2.1 to 3.4); the release emails went to a shared mailbox nobody reads. One chart check has been done in 14 months: a pharmacist found 3 of 41 summaries left out an abnormal lab trend, with no harm found; her email to the Workgroup mailbox got no reply. This week a GI fellow caught a summary calling renal function stable when creatinine had doubled.
Turning the tool off for a clinic takes a vendor support ticket; the fastest so far took 19 hours. The license renews automatically in 60 days at a price 38% higher unless written notice is given 30 days before; a monitoring add-on is sold separately. Version 4.0 installs for all customers in 60 days.`,
  evidence: [
    {
      id: "approval-email",
      title: "Pilot approval email (14 months ago)",
      body: `From: AI Governance Workgroup coordinator
To: Medical oncology clinic medical director
Subject: Visit-summary tool — pilot approved

The Workgroup completed its risk review and approved a six-month pilot of the visit-summary tool in the medical oncology clinic.

Conditions:
1. A monthly chart check of AI summaries (owner to be confirmed).
2. No use outside medical oncology without coming back to the Workgroup.

Risk tier: not assigned at this meeting.
Information Security review: not requested.
Model version reviewed: 2.1`,
    },
    {
      id: "usage-report",
      title: "Vendor usage report, this quarter",
      body: `VENDOR USAGE REPORT — CURRENT QUARTER

Clinics with active users: 3
  Medical oncology (pilot)
  GI oncology (shared note template)
  Breast oncology (shared note template)

Notes with an AI summary, last 7 days: 1,842
Same figure, pilot month 2: 311

Model version in use: 3.4
Release notes sent to: Digital Health vendor-notices mailbox`,
    },
    {
      id: "spot-check",
      title: "Pharmacist's spot check (last month)",
      body: `From: Oncology clinical pharmacist
To: AI Governance Workgroup mailbox
Subject: Summary tool — 3 misses in a spot check

While doing medication reconciliations last week I checked 41 AI summaries from medical oncology. Three left out an abnormal lab trend that was in the chart (two potassium, one platelets). I found no patient harm.

I couldn't find who owns the monthly check, so I'm sending it here.

— No replies in this thread.`,
    },
    {
      id: "renewal-notice",
      title: "Vendor renewal notice",
      body: `From: Vendor customer contracts
Subject: Your license renewal

Your license renews automatically in 60 days.
To cancel, send written notice at least 30 days before the renewal date.

New annual price: 38% higher than this year.
Optional add-on: monitoring dashboard (version alerts, sample accuracy checks), priced separately.

Support: to turn the tool off for a clinic, open a support ticket.`,
    },
  ],
  nodes: [
    {
      id: "risk_accept",
      type: "risk_accept",
      title: "Who is on the hook while it keeps running?",
      question:
        "Until someone reviews it properly, the tool keeps drafting notes wherever you leave it on. Who signs for that, in writing?",
      freeTextPrompt: "Who signs for it during the review? What would make them change course?",
      elders: ["steward"],
      options: [
        {
          id: "a",
          label: "“Leave it on everywhere, and send a note today: double-check labs until the review is done.”",
          hint: "All three clinics keep it. Clinicians do the checking until the review ends.",
          short: "Leave it on everywhere",
        },
        {
          id: "b",
          label: "“Keep it in medical oncology, the clinic we approved. Turn it off in GI and breast.”",
          hint: "GI and breast lose it Monday. Their notes take longer again.",
          short: "Med onc only",
        },
        {
          id: "c",
          label: "“Turn it off everywhere until the review is done.”",
          hint: "All three clinics lose it. Turning it off takes a vendor ticket.",
          short: "Off everywhere",
        },
        decline("Nothing changes. It keeps running in all three clinics."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: +2, dollars: 0, time: 0 },
        b: { goodwill: -2, risk: -1, dollars: 0, time: +1 },
        c: { goodwill: -3, risk: -2, dollars: 0, time: +2 },
        decline: { goodwill: 0, risk: +2, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Thursday",
          text: "The note goes out to all three clinics. The breast clinic's nurse manager replies to all, asking what “double-check labs” means in a 15-minute visit.",
        },
        b: {
          when: "Monday",
          text: "Digital Health turns it off for GI and breast. By noon the GI nurse manager has emailed to ask why the note template stopped filling in, and copied the chief nursing officer.",
        },
        c: {
          when: "Wednesday",
          text: "The vendor ticket closes 19 hours after it was opened. Without summaries, the medical oncology clinic is running about 40 minutes behind by 3 p.m.",
        },
        decline: {
          when: "Friday",
          text: "Nothing changes. The GI fellow's message is still in the service desk queue, marked “waiting on owner.”",
        },
      },
      owner: {
        when: "The next Monday",
        named:
          "The pharmacist who ran last month's spot check emails again, asking where to send her next one. She gets a name back within the hour: the person you named.",
        missing:
          "The pharmacist who ran last month's spot check emails again, asking where to send her next one. The email goes to the Workgroup mailbox. Nobody replies.",
      },
      later: {
        month: 3,
        named:
          "The annual safety audit asks for every AI tool in clinical use and who accepted its risk. The summary tool's entry has a name, a date, and the conditions they signed for.",
        missing:
          "The annual safety audit asks for every AI tool in clinical use and who accepted its risk. The summary tool's entry is blank, and the auditors list it in their findings.",
      },
    },
    {
      id: "stop",
      type: "stop",
      title: "Who can turn it off, and how fast?",
      question: "If a summary hurts someone tonight, who can turn the tool off, and how quickly?",
      freeTextPrompt: "Who can turn it off? What would make them do it? How fast can it happen?",
      elders: ["caretaker"],
      inject: (records) => {
        const c = choiceOf(records, "risk_accept");
        if (c === "b")
          return "Because you turned it off in GI and breast: on Wednesday a GI fellow copies the medical oncology note template into her own favorites. The tool is back on for her patients, and no alert goes to anyone.";
        if (c === "c")
          return "Because you turned it off everywhere: the vendor ticket took 19 hours to close. For that whole day, nobody in the building could turn it off any faster.";
        return "The pharmacist from last month's spot check asks the service desk: if a summary hurts someone tonight, who can turn this off, and how fast? The desk says they'd have to open a ticket with the vendor.";
      },
      options: [
        {
          id: "a",
          label: "“Use the contract. If it isn't working, we give notice and don't renew.”",
          hint: "Notice is due within 30 days. Until the renewal date, it stays on.",
          short: "The contract",
        },
        {
          id: "b",
          label: "“Let the review decide. If it finds a problem, it recommends switching it off.”",
          hint: "The review has no reviewer or start date yet.",
          short: "The review decides",
        },
        {
          id: "c",
          label: "“Get us a switch we control: Digital Health turns it off the same day it's called.”",
          hint: "Needs a contract change and about three weeks of IT work.",
          short: "Our own switch",
        },
        decline("Turning it off stays a vendor ticket."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
        b: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
        c: { goodwill: 0, risk: -2, dollars: +1, time: +1 },
        decline: { goodwill: 0, risk: +2, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 2",
          text: "Legal drafts the non-renewal notice and holds it for a decision. Until the renewal date, the only way to stop the tool early is a vendor ticket.",
        },
        b: {
          when: "Week 2",
          text: "The review goes on next month's AI Governance Workgroup agenda as a discussion item. It has no reviewer yet.",
        },
        c: {
          when: "Week 3",
          text: "The vendor agrees to a clinic-by-clinic on/off setting for a one-time fee. Digital Health tests it on a Friday afternoon; switching a clinic off takes four minutes.",
        },
        decline: {
          when: "Week 2",
          text: "The service desk adds an entry to its knowledge base: “Summary tool problems — open a vendor ticket.”",
        },
      },
      owner: {
        when: "Week 4",
        named:
          "A breast clinic nurse practitioner finds a summary listing a stopped medication as current and files a safety report. It reaches the person you named that afternoon, who decides the same day whether to pull the tool in that clinic.",
        missing:
          "A breast clinic nurse practitioner finds a summary listing a stopped medication as current and files a safety report. It goes from Quality to Digital Health and back to the clinic over nine days.",
      },
      later: {
        month: 7,
        named:
          "Version 4.1 starts dropping recent lab trends from summaries. The person holding the switch has it off in all three clinics within a day, and back on once the vendor's fix is checked.",
        missing:
          "Version 4.1 starts dropping recent lab trends from summaries. It keeps running for six days while people work out who is allowed to ask for it to be turned off.",
      },
    },
    {
      id: "tier",
      type: "tier",
      title: "What risk level is it, and who sets it?",
      question:
        "The approval never gave the tool a risk level, and two clinics started using it on their own. What level is it, and who decides that?",
      freeTextPrompt: "Who sets the risk level? Does it cover the tool everywhere, or each clinic's use separately?",
      elders: ["steward"],
      inject: () =>
        "The AI Governance Workgroup coordinator asks what risk level to file the review under. Information Security sends its own risk form the same morning. The approval email says “not assigned.”",
      options: [
        {
          id: "a",
          label: "“Rate each clinic's use separately, starting with medical oncology.”",
          hint: "Three reviews of about two weeks each. New clinics wait for theirs.",
          short: "Rate each use",
        },
        {
          id: "b",
          label: "“Rate the tool once. The same level applies wherever it's turned on.”",
          hint: "One review. GI and breast get the level set for medical oncology.",
          short: "Rate it once",
        },
        {
          id: "c",
          label: "“Use the vendor's risk rating. It's already done.”",
          hint: "Available today. It's the vendor's own assessment.",
          short: "Vendor's rating",
        },
        decline("It stays unrated. Each clinic uses it its own way."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -1, dollars: 0, time: +2 },
        b: { goodwill: 0, risk: +1, dollars: 0, time: 0 },
        c: { goodwill: 0, risk: +2, dollars: 0, time: -1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 2",
          text: "Medical oncology's review is booked. The GI and breast clinic managers each get a form asking what they use the summaries for; the breast clinic's answer includes goals-of-care notes.",
        },
        b: {
          when: "Friday",
          text: "The Workgroup files one risk level for the tool. The form has no field for which clinics or which kinds of notes.",
        },
        c: {
          when: "Friday",
          text: "The vendor's rating arrives: low risk. A footnote says it was assessed for administrative summaries.",
        },
        decline: {
          when: "Friday",
          text: "The coordinator files the review under “risk level: pending.”",
        },
      },
      owner: {
        when: "Week 5",
        named:
          "The palliative care team asks to use the tool for goals-of-care notes. The request goes to the person you named, who asks for a separate review before anything is turned on.",
        missing:
          "The palliative care team starts using the tool for goals-of-care notes by copying the template. Nobody outside the team hears about it.",
      },
      later: {
        month: 9,
        named:
          "Two more clinics ask to use the tool. One is approved within a week; the other, for pediatric patients, is turned down at the request stage.",
        missing:
          "The tool is in six clinics. The Workgroup's records show one review, for medical oncology.",
      },
    },
    {
      id: "decide",
      type: "decide",
      title: "Who decides whether it stays?",
      question:
        "Someone has to decide whether the tool stays, and on what terms. Who makes that call, who do they check with, and by when?",
      freeTextPrompt: "Who makes the call? Who do they check with first? By what date?",
      elders: ["cartographer"],
      inject: (records) => {
        const c = choiceOf(records, "tier");
        const base =
          "Monday's emails: the AI Governance Workgroup chair writes that the Workgroup reviews risk, and whether a tool stays in clinical use belongs to the Clinical Practice Council. The council chair replies that AI tools belong to the Workgroup.";
        if (c === null || c === "decline")
          return `${base} Because you left the risk level open, neither can point to a rule that says whose it is.`;
        return base;
      },
      options: [
        {
          id: "a",
          label: "“Put it to a vote at a joint meeting of the Workgroup and the council.”",
          hint: "Both groups own the result. The first date both can meet is five weeks out.",
          short: "Joint vote",
        },
        {
          id: "b",
          label: "“One person decides by the end of next month, advised by the AI Governance Workgroup.”",
          hint: "One name on the result. The Workgroup advises on risk but doesn't vote.",
          short: "One decider",
        },
        {
          id: "c",
          label: "“Send it up. Ask the executive sponsor for AI to pick who decides.”",
          hint: "The sponsor's office usually answers requests in about a week.",
          short: "Send it up",
        },
        decline("It stays on both groups' agendas."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: 0, dollars: 0, time: +2 },
        b: { goodwill: 0, risk: 0, dollars: 0, time: +1 },
        c: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 5",
          text: "The joint meeting runs out of time at item four of six. The tool moves to next month's agenda.",
        },
        b: {
          when: "Week 1",
          text: "The decider sets a date: the last Friday of next month. Both groups get a note saying they're advising.",
        },
        c: {
          when: "Week 2",
          text: "The sponsor's office replies with a question: who does this group recommend?",
        },
        decline: {
          when: "Week 4",
          text: "The tool appears on both groups' agendas under “old business.” Neither meeting gets to it.",
        },
      },
      owner: {
        when: "Week 6",
        named:
          "The GI medical director asks whether GI can keep the tool while the review runs. The question goes to the person you named and is answered in two days.",
        missing:
          "The GI medical director asks whether GI can keep the tool while the review runs. The Workgroup and the council each reply that the other should answer.",
      },
      later: {
        month: 6,
        named:
          "The decision lands on the date set, with conditions attached. Clinic managers now send their questions to one person instead of two groups.",
        missing:
          "The review ends with a recommendation to review further. The tool keeps running while that is scheduled.",
      },
    },
    {
      id: "proof",
      type: "proof",
      title: "What result keeps it running?",
      question:
        "The pharmacist found 3 misses in 41 summaries, and no harm. Nobody has said what rate is acceptable. What number keeps the tool running?",
      freeTextPrompt: "What number keeps it running (a rate or a ceiling)? Who checks it, and how often?",
      elders: ["decoupler", "recruiter"],
      inject: (records) => {
        const base =
          "Counting the GI fellow's catch, four misses are now known. The vendor says its own testing finds a missed lab trend in fewer than 1 in 100 summaries, measured on its test charts.";
        if (choiceOf(records, "decide") === "a")
          return `Because the decision is going to a joint vote, both groups have asked for a number they can vote on. ${base}`;
        return base;
      },
      options: [
        {
          id: "a",
          label: "“Let each clinic judge. If their doctors think it's good enough, they keep it.”",
          hint: "No new work. Each clinic sets its own standard.",
          short: "Clinics judge",
        },
        {
          id: "b",
          label: "“Fund a proper validation study before we set any number.”",
          hint: "Needs funding, a lead, and research review board (IRB) approval. Results in about four months.",
          short: "Validation study",
        },
        {
          id: "c",
          label: "“Set a ceiling now, say 1 miss in 50, and audit 40 charts a month.”",
          hint: "About six pharmacist hours a month, taken from other work.",
          short: "Ceiling and audit",
        },
        decline("No number. Each future check is judged on the day."),
      ],
      meterDeltas: {
        a: { goodwill: +1, risk: +2, dollars: 0, time: 0 },
        b: { goodwill: 0, risk: -1, dollars: +2, time: +2 },
        c: { goodwill: 0, risk: -2, dollars: +1, time: +1 },
        decline: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 2",
          text: "Medical oncology says the summaries are fine. GI says they're fine apart from labs. The breast clinic doesn't reply.",
        },
        b: {
          when: "Week 3",
          text: "The study proposal goes to the IRB, the research review board. The first review slot is in five weeks.",
        },
        c: {
          when: "Week 4",
          text: "The first 40-chart audit is done on time. It finds two misses, and the result goes into the decision file.",
        },
        decline: {
          when: "Week 4",
          text: "Nobody runs a chart check this month.",
        },
      },
      owner: {
        when: "Month 3",
        named:
          "Three months of results are in one file, kept by the person you named. Anyone who asks how accurate the summaries are is sent that file.",
        missing:
          "No monthly check has run. The only numbers anyone can quote are the pharmacist's, from last spring.",
      },
      later: {
        month: 4,
        named:
          "The miss rate goes over the agreed number. The tool is paused in GI for two weeks while the vendor looks into it.",
        missing:
          "A new Workgroup member asks how accurate the summaries are. The only answer is the pharmacist's 3 in 41.",
      },
    },
    {
      id: "retier",
      type: "retier",
      title: "What sends it back for review?",
      question:
        "Two updates went in without anyone noticing. What should automatically send the tool back for review, and who watches for it?",
      freeTextPrompt: "What sends it back for review? Who watches for those things?",
      elders: ["caretaker"],
      inject: () =>
        "The vendor emails: version 4.0 installs for all customers in 60 days. The email lands in the Digital Health vendor-notices mailbox, under two earlier release emails that were never opened.",
      options: [
        {
          id: "a",
          label: "“Any new version, new clinic, or new kind of note sends it back for review.”",
          hint: "Someone has to watch the vendor mailbox and the template list every week.",
          short: "Set triggers",
        },
        {
          id: "b",
          label: "“Review it once a year, on a fixed date.”",
          hint: "Easy to schedule. Version 4.0 arrives eight months before that date.",
          short: "Yearly review",
        },
        {
          id: "c",
          label: "“Change the contract: no version changes without our sign-off.”",
          hint: "The vendor offers this on its enterprise plan, at a higher price.",
          short: "Contract sign-off",
        },
        decline("Version 4.0 installs in 60 days either way."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: -2, dollars: 0, time: +2 },
        b: { goodwill: 0, risk: +1, dollars: 0, time: +1 },
        c: { goodwill: 0, risk: -1, dollars: +2, time: +1 },
        decline: { goodwill: 0, risk: +2, dollars: 0, time: +1 },
      },
      events: {
        a: {
          when: "Week 1",
          text: "Digital Health sets up an alert on the vendor mailbox and the note-template list. Version 4.0 is the first thing it catches, and the review starts that day.",
        },
        b: {
          when: "Week 1",
          text: "The yearly review is booked for next April. Version 4.0 installs in 60 days.",
        },
        c: {
          when: "Week 2",
          text: "The vendor sends enterprise-plan pricing. Contracting says the change can be made at renewal.",
        },
        decline: {
          when: "Day 60",
          text: "Version 4.0 installs overnight in every clinic using the template.",
        },
      },
      owner: {
        when: "Month 2",
        named:
          "The breast clinic adds the template to its survivorship visits. The person you named sees it on the weekly list and asks for a review before survivorship notes use it.",
        missing:
          "The breast clinic adds the template to its survivorship visits. Nobody outside the clinic notices.",
      },
      later: {
        month: 8,
        named:
          "Two things send the tool back for review this year: version 4.0 and a new clinic. Each review takes about a week.",
        missing:
          "Someone asks which version the Workgroup approved. It was 2.1. The clinics are on 4.1.",
      },
    },
    {
      id: "funding",
      type: "funding",
      title: "Who pays for it next year?",
      question:
        "The license renews in 60 days at a higher price, and the monitoring add-on costs extra. Whose budget pays for the tool and the checking?",
      freeTextPrompt: "Whose budget pays? What exactly does it cover: the license, the chart checks, the monitoring?",
      elders: ["ledger"],
      inject: (records) => {
        const base =
          "The renewal notice is on the table: 38% higher, the monitoring add-on extra, and notice to cancel due within 30 days.";
        if (choiceOf(records, "proof") === "c")
          return `Because you set up monthly audits, Quality asks which budget pays for the pharmacist's hours. ${base}`;
        return base;
      },
      options: [
        {
          id: "a",
          label: "“Split it: clinics pay the license, Quality pays for checks, IT pays for monitoring.”",
          hint: "Each share is smaller. Three sign-offs are needed before the notice date.",
          short: "Split three ways",
        },
        {
          id: "b",
          label: "“One owner pays for all of it — license, checks, and monitoring — as one line.”",
          hint: "The whole cost lands in one department's budget.",
          short: "One owner",
        },
        {
          id: "c",
          label: "“Pay from the Innovation Fund this year while it finds a permanent home.”",
          hint: "Covers up to 12 months. The fund is meant for pilots.",
          short: "Innovation Fund",
        },
        decline("Without written notice, it renews at the new price."),
      ],
      meterDeltas: {
        a: { goodwill: 0, risk: +1, dollars: +1, time: +1 },
        b: { goodwill: 0, risk: 0, dollars: +2, time: 0 },
        c: { goodwill: 0, risk: +1, dollars: +1, time: 0 },
        decline: { goodwill: 0, risk: +1, dollars: +1, time: +1 },
      },
      events: {
        a: {
          when: "Week 3",
          text: "Two of the three sign-offs come back. IT's budget cycle closes after the notice date.",
        },
        b: {
          when: "Week 2",
          text: "The owning department's budget line goes up by the full amount. Its finance partner asks for next year's usage estimate.",
        },
        c: {
          when: "Week 2",
          text: "The Innovation Fund approves it for 12 months. The approval letter asks for a permanent owner by next spring.",
        },
        decline: {
          when: "Day 60",
          text: "The license renews on the vendor's terms, 38% higher, without the monitoring add-on.",
        },
      },
      owner: {
        when: "Week 5",
        named:
          "The vendor offers 10% off for a two-year term. The person you named takes it to Finance and has an answer before the notice date.",
        missing:
          "The vendor offers 10% off for a two-year term. The offer goes to the pilot's original sponsor, who moved to another role last spring.",
      },
      later: {
        month: 11,
        named:
          "At budget planning the tool has one line, one owner, and a monitoring cost next to it. It is approved without discussion.",
        missing: "At budget planning nobody lists the tool. It renews automatically again.",
      },
    },
  ],
  // Villager beats: shown after the named node locks (PRD §7.2).
  villagers: {
    risk_accept: {
      archetype: "The One Who Signs",
      speaker: "The pilot's original sponsor",
      line: "I signed for the pilot fourteen months ago. I moved to another job in the spring. Nobody has asked me about the tool since.",
    },
    tier: {
      archetype: "The One Who Makes It Work Anyway",
      speaker: "A GI oncology nurse manager",
      line: "I copied the medical oncology template for GI in January. Our notes were running two hours past clinic. I didn't know there was a list to be on.",
    },
    stop: {
      archetype: "The Person in the Chair",
      speaker: "A GI oncology patient",
      line: "My summary said my kidneys were stable. The fellow caught it before my appointment. I didn't know a computer had written it until she told me.",
    },
    proof: {
      archetype: "The One Who Stopped Asking",
      speaker: "The oncology pharmacist who ran the spot check",
      line: "I sent my spot check to the Workgroup mailbox last spring. Now I check the labs in every summary myself before I sign off a medication reconciliation.",
    },
    funding: {
      archetype: "The Third Pilot This Year",
      speaker: "A breast oncology nurse manager",
      line: "This is my clinic's third AI pilot this year. The first two stopped when their funding ran out. I stopped training my nurses on new tools after the second one.",
    },
  },
  // Role cards with asymmetric information (PRD §6). Printed, dealt at setup.
  roleCards: {
    "The Doctor": {
      mandate: [
        "Your job: what the summaries do to clinical decisions in three clinics.",
        "You won't go along with: more clinics using it before someone has looked into the misses.",
        "You're judged on: patient outcomes, and whether clinicians trust the chart.",
      ],
      asymmetric: [
        {
          text: "Two of the known misses changed when treatment was given. There was no harm, but only because someone double-checked.",
          cue: "someone says no harm was found",
        },
        {
          text: "You've noticed medical oncology doctors read the full chart less since the summaries arrived. Nobody has measured it.",
          cue: "the room talks about what number is good enough",
        },
      ],
    },
    "The Security Guard": {
      mandate: [
        "Your job: a tool nobody reviewed is reading and writing clinical notes.",
        "You won't go along with: keeping it running with nobody signed up to answer for it.",
        "You're judged on: incidents, and how fast one can be stopped.",
      ],
      asymmetric: [
        {
          text: "Turning it off takes a vendor support ticket. The contract target is 24 hours; the fastest ticket so far took 19.",
          cue: "someone asks how fast it can be turned off",
        },
        {
          text: "The version 3.4 release notes mention “expanded training data sources.” Nobody has asked the vendor what that means.",
          cue: "updates or versions come up",
        },
      ],
    },
    "The Money Manager": {
      mandate: [
        "Your job: the renewal, the price increase, and the monitoring add-on.",
        "You won't go along with: letting it renew on the vendor's terms because nobody sent the notice.",
        "You're judged on: staying on budget, and licenses nobody owns.",
      ],
      asymmetric: [
        {
          text: "The license is priced per clinic, not per note. The 38% is a contract increase, not usage, so there's room to negotiate.",
          cue: "the renewal comes up",
        },
        {
          text: "The medical oncology budget that paid for the pilot moved with the old sponsor. Right now no budget line has the tool on it.",
          cue: "someone asks who is paying for it today",
        },
      ],
    },
    "The AI Guru": {
      mandate: [
        "Your job: what changed between version 2.1 and 3.4, and what 4.0 will change.",
        "You won't go along with: treating different versions as the same tool.",
        "You're judged on: whether the tool in use behaves like the tool that was approved.",
      ],
      asymmetric: [
        {
          text: "The lab-trend misses match a known problem in version 3.x that other customers discuss openly on the vendor's user forum.",
          cue: "the room discusses the misses",
        },
        {
          text: "The monitoring add-on would have flagged both version changes when they happened. It was part of the product until last year.",
          cue: "monitoring or its cost comes up",
        },
      ],
    },
    "The Competitive Marketing Leader": {
      mandate: [
        "Your job: what people outside hear about how we use AI.",
        "You won't go along with: describing the three-clinic use as planned when it wasn't.",
        "You're judged on: our credibility with peers, especially if we have to correct something.",
      ],
      asymmetric: [
        {
          text: "The vendor's website lists us as a customer with a “multi-clinic deployment.” Nobody here approved that wording.",
          cue: "the room decides who carries the risk",
        },
        {
          text: "At a conference last month, a colleague told another cancer center that the three-clinic rollout was intentional.",
          cue: "the room decides what happens in GI and breast",
        },
      ],
    },
  },
};
