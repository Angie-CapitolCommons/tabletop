// Challenge questions for the paper run: after the room records its answer,
// the facilitator presses for the missing piece in their own voice. There is
// no AI Council on paper. One set per decision; the facilitator asks the one
// branch that fits the room's written answer.
//
// Rules: press on the answer, never on a person. Ask, don't lecture. Use the
// case's own facts. When the answer is specific, say what's solid first; the
// question after it is optional and never an invented objection.
//
// Branches:
//   noName     no person or role named (a committee, a department, "leadership")
//   noTrigger  someone is named, but the trigger, number, date, or "leaves out" is missing
//   specific   a person or role, plus the trigger, number, or date
//   declined   the room chose "We can't answer this today"

export const challenges = {
  s1: {
    purpose: {
      noName: "Who signs off on this purpose? The charter already has one draft nobody approved.",
      noTrigger: "What does it leave out? Without that line, all three requests will say they fit.",
      specific: "That's a purpose you can rank the requests against, with someone to sign off. Does it get signed before the pick, or after?",
      declined: "Then how do the three requests get ranked, and what do you tell the two that don't get picked?",
    },
    tier: {
      noName: "Who actually sets the risk level? If it's “security” or “the Workgroup,” whose desk does it land on this week?",
      noTrigger: "Does the level follow the tool, or what it's used for? The trial-matching tool reads full charts.",
      specific: "That's clear: a named person rating each request by its use and its data. Is the rating written down before the ranking starts?",
      declined: "Then all three go forward unrated. What stops the trial-matching tool from starting in the department with full chart access?",
    },
    decide: {
      noName: "Who actually makes the pick? A committee vote won't be the one telling the triage nurses they didn't get it.",
      noTrigger: "By what date, and who tells the two that don't get picked? The lead researcher has said the department will start on its own if nobody answers.",
      specific: "A decider, a date, and someone to deliver the news. How do the triage nurses hear it?",
      declined: "Then what decides it? The vendor's 30-day offer and the grant's start date both have dates on them.",
    },
    proof: {
      noName: "Who checks the result at day 90? If it's “the team,” the winner grades its own work. And whose time does the checking come out of?",
      noTrigger: "What's the actual number? “Show value” at day 90 turns into a demo. And how many hours a week does the check take, and what comes off that person's plate?",
      specific: "A number, set before anyone knows who wins, and someone to check it. Is it written down today, and does their manager know the checking is part of the job?",
      declined: "Then what happens at day 90 with no bar? And who ends up checking it in their spare time?",
    },
    funding: {
      noName: "Whose budget line, specifically? “The organization pays” usually means nobody has been told.",
      noTrigger: "That covers the build. Who pays in year two, when the free pilot becomes a full-price renewal?",
      specific: "A named budget and a written rule for outside money. Do you have the vendor's renewal price in writing yet?",
      declined: "Then the money comes from whoever has it: the grant and the vendor. Has anyone read their terms?",
    },
    represent: {
      noName: "Who approves each statement? If sponsors approve their own, the vendor's press release goes out first.",
      noTrigger: "What has to be true before anything goes out? The abstract deadline won't wait for day 90.",
      specific: "One approver, and a result that has to come first. Who tells the lead researcher, before the abstract is written?",
      declined: "Then the vendor's press release tells the story. Who finds out what it says before it runs?",
    },
  },

  s2: {
    purpose: {
      noName: "Who confirms the question with both Dr. Renner and Dr. Vogel? If neither hears it from a person, each keeps arguing their own.",
      noTrigger: "What does the evaluation leave out, and when do both pathologists hear it? The sandbox ends in three weeks.",
      specific: "One question, and a named person confirming it. Dr. Vogel may disagree. Who tells Dr. Vogel directly?",
      declined: "Then whose question does the evaluation answer, and what does the other pathologist say about the result?",
    },
    proof: {
      noName: "Who judges the result? If it's “pathology,” Dr. Renner and Dr. Vogel will judge it differently.",
      noTrigger: "What's the pass mark, and by what date? The vendor says 96% and the other center got 89%. Where is our line?",
      specific: "A pass mark, our own slides, a judge, and an end date. Who shares the pass mark with the vendor? They've asked for it.",
      declined: "Then where is the finish line? Without one, the evaluation is still “pending” seven months from now.",
    },
    risk_accept: {
      noName: "Who signs for the testing risk? The Workgroup approved it “in principle,” and nobody has signed anything since.",
      noTrigger: "What would make them stop the testing? Residents are already studying with the sandbox.",
      specific: "A name, conditions, and a deadline for the vendor's answers. Do the residents keep using the sandbox until it's approved?",
      declined: "Then our slides stay in the vendor's sandbox and the residents keep studying with it. Who has agreed to that?",
    },
    retier: {
      noName: "Who watches for the vendor's updates? Right now the notices go to a shared inbox.",
      noTrigger: "When the version changes, what do they do: restart, carry on, or split the results?",
      specific: "A named person and a rule for updates. Will the vendor give notice before each update?",
      declined: "Then if an update lands mid-test, which version does the final number describe?",
    },
    decide: {
      noName: "Who makes the decision? “The Workgroup” already said yes in principle once, and that yes has lasted seven months. And if it's a yes, whose budget buys it?",
      noTrigger: "By what date, and held to what result? And if it's a yes, when does the money have to exist? Pilot pricing ends in three weeks.",
      specific: "One decider, a date, held to the pass mark. Does the Workgroup know it's advising, not deciding? And who sends Finance the price if it's a yes?",
      declined: "Then who picks up the result when it comes in, and where does the money come from if the answer is yes?",
    },
    represent: {
      noName: "Who approves what's said? Right now the vendor's website is saying it for us.",
      noTrigger: "What happens to the “evaluation partner” listing, and what do we tell the other center's pathology chair, who called?",
      specific: "One approved statement and a clear wait for results. Who calls the other center's chair back, and when?",
      declined: "Then the vendor keeps listing us as a partner. What does the other center hear, and from whom?",
    },
  },

  s3: {
    tier: {
      noName: "Who sets the rating? The old one assumed a charge nurse checks every prediction, and main campus doesn't have that.",
      noTrigger: "Does the rating follow the tool or each campus? A 90-bed campus with Marisol and a 380-bed campus without her aren't the same risk.",
      specific: "A named person rating each campus before go-live. Does the rating cover the 14 fields main campus maps differently?",
      declined: "Then main campus goes live on a rating written for a 90-bed campus where someone checked every prediction. Is that the rating you want?",
    },
    risk_accept: {
      noName: "Who signs, at main campus? The command center director wasn't in the planning, and she'll be the one living with it.",
      noTrigger: "What would make them pull it back? At the community campus, Marisol overrides about 30% of predictions.",
      specific: "A named person at each campus, signing before go-live. Has the command center director been invited to planning?",
      declined: "Then who's accepting the risk at main campus? At the community campus, it worked because Marisol was there.",
    },
    decide: {
      noName: "Who makes the go-live call at each campus? “The team” can't hold a date.",
      noTrigger: "What's on the checklist besides the date? The 14 fields at main campus should be on it.",
      specific: "A named readiness lead with a published checklist. If they hold the date, who backs them in writing?",
      declined: "Then June 2 decides, and that date was set before anyone looked at main campus's setup. Is that all right with the room?",
    },
    stop: {
      noName: "Who turns it off at each campus, at 6 a.m. when the huddle starts? A group can't answer the phone.",
      noTrigger: "What would make them turn it off? Overrides are logged only 12% of the time, so what signal will they actually see?",
      specific: "Named people and set triggers at each campus. Is the override reason required, so the trigger has data behind it?",
      declined: "Then it runs until it misleads a huddle badly enough that someone notices. Who's allowed to stop it then?",
    },
    represent: {
      noName: "Who approves the story? Communications has a headline, and nobody has checked it against the numbers.",
      noTrigger: "What can it claim, and what date can't it run before? Half a day, one campus, and no comparison site is a smaller story than the headline.",
      specific: "A named approver, an honest claim, and a date. Is Marisol's part in it?",
      declined: "Then the headline runs two weeks before main campus goes live. What happens if main campus has a rough start?",
    },
    funding: {
      noName: "Whose budget line, specifically? The grant ends in four months. And whose job becomes the huddle lead at each campus? Right now it's Marisol's notebook.",
      noTrigger: "What does the budget cover? Licenses are the smallest part; training and a huddle lead at each campus are where the money goes. How many hours a week is that role, and what comes off that person's job?",
      specific: "One owner covering licenses, training, and a funded huddle lead. Is it in next year's budget, and is the huddle lead written as a job, not an extra duty?",
      declined: "Then the grant ends in four months and the tool stops being paid for. And who does Marisol's job at the other campuses?",
    },
  },

  s4: {
    risk_accept: {
      noName: "Who signs for the risk, by name or role? “The clinics” or “the Workgroup” is how the tool ran fourteen months with nobody.",
      noTrigger: "What would make them change course? Another missed lab like this morning's?",
      specific: "A named person and a clear trigger. By when do they sign it, and does the service desk get a copy?",
      declined: "Then it keeps drafting notes in three clinics. If another creatinine is missed, who agreed to that risk?",
    },
    stop: {
      noName: "Who switches it off at 7 p.m. on a Friday? A committee can't open a vendor ticket.",
      noTrigger: "What makes them switch it off, and how fast? Right now it takes a vendor ticket, and the fastest one took 19 hours.",
      specific: "A named person, a trigger, and a same-day switch. Has anyone tested the switch?",
      declined: "Then turning it off stays a vendor ticket. How long does the next bad summary run?",
    },
    tier: {
      noName: "Who sets the risk level? The approval said “not assigned at this meeting,” and no meeting since has assigned it.",
      noTrigger: "Does the level cover the tool everywhere, or each clinic's use? GI and breast started using it without anyone rating what they use it for.",
      specific: "A named person rating each clinic's use. Which clinic gets rated first? This morning's miss was in GI.",
      declined: "Then the tool has no risk level fourteen months in. What about the next clinic that copies the template?",
    },
    decide: {
      noName: "Who decides, by name or role? A joint vote of the Workgroup and the council needs both to agree who's chairing, and they don't.",
      noTrigger: "By what date? The license renews automatically in 60 days, and notice is due in 30.",
      specific: "One decider, advised by the Workgroup, with a date. Does the date land before the 30-day notice deadline?",
      declined: "Then the renewal decides for you: it renews automatically in 60 days unless someone gives written notice. Who's watching that date?",
    },
    proof: {
      noName: "Who checks it? The pharmacist did the only check in fourteen months, on her own time, and her email got no reply. Whose job is the audit, so it doesn't land on whoever is most conscientious?",
      noTrigger: "What's the number? Three misses in 41 summaries might be fine or might not. And how many hours a month is the audit, and what comes off that person's plate?",
      specific: "A ceiling, a monthly audit, and a named checker with the time set aside. Does the pharmacist hear the result, and does the auditor's manager know it's part of the job?",
      declined: "Then what will the next spot check tell you about whether to keep it? And where does the next person who notices a miss send it?",
    },
    retier: {
      noName: "Who watches for the triggers? The last two updates went to a mailbox nobody reads.",
      noTrigger: "What exactly sends it back for review? Version 4.0 installs for everyone in 60 days. Does that count?",
      specific: "Clear triggers and a named watcher. Do the vendor's notices go to that person, or still to the shared mailbox?",
      declined: "Then version 4.0 installs in 60 days the way the last two updates did. Who will know?",
    },
    funding: {
      noName: "Whose budget line, by name? “The clinics” or “IT” means the renewal lands on whoever opens the invoice.",
      noTrigger: "What does it cover: the license, the monthly chart checks, the monitoring add-on? The price is going up 38%.",
      specific: "One owner covering the license, the checks, and the monitoring. Does the renewal notice go to them today?",
      declined: "Then it renews automatically at 38% more, with no money for the checking. Who chose to pay that?",
    },
  },
};
