// Scripted Elder responses for the paper run. The facilitator reads the one
// branch that fits the room's written answer. Same rules as the live Elders
// (server/content/common.js): brief, kind, start with what's solid, ask for
// the one thing missing, plain hospital words, no closing one-liners.
//
// Branches:
//   noName     no person or role named (a committee, a department, "leadership")
//   noTrigger  someone is named, but the trigger, number, date, or "not for" is missing
//   specific   a person or role, plus the trigger, number, or date
//   declined   the room chose "We can't answer this today"

export const elderCards = {
  s1: {
    purpose: {
      cartographer: {
        noName:
          "Good to see a purpose on paper at last. Who signs off on it? The charter already has one draft nobody approved, and a second one would end up in the same folder.",
        noTrigger:
          "You've named who confirms it, which is the hard part. What is it not for? Without that line, all three requests will say they fit.",
        specific:
          "That's a purpose you can rank against, with someone to confirm it. I'd add one condition: the AI Leader confirms it before the pick, not after.",
        declined:
          "Then the three requests get ranked on who asks the loudest. Whoever wins, the next request will ask why.",
      },
    },
    tier: {
      steward: {
        noName:
          "Rating them before the pick is the right order. Who actually sets the level? If it's “security” or “the Workgroup,” nobody knows whose desk it lands on this week.",
        noTrigger:
          "Good, you've named who rates them. Does the level follow the tool, or what it's used for? The trial-matching tool reads full charts, and that changes things.",
        specific:
          "That's clear: a named person rating each request by its use and its data. I can support that, as long as the rating is written down before the ranking starts.",
        declined:
          "Then all three go forward unrated. The trial-matching tool may start in the department anyway, with full chart access and no level at all.",
      },
    },
    decide: {
      adoption_realist: {
        noName:
          "You've picked a way to decide, which is progress. Who actually makes the pick? A committee vote won't be the one telling the triage nurses they didn't get it.",
        noTrigger:
          "Good, one person owns the pick. By what date, and who tells the two that don't get it? The lead researcher has said the department will start on its own if nobody answers.",
        specific:
          "A named decider, a date, and someone to deliver the news. I'd make sure the triage nurses hear it in person. They asked for help after two late callbacks.",
        declined:
          "Then nobody picks, and the calendar decides. The vendor's 30-day offer and the grant's start date will choose for you.",
      },
    },
    proof: {
      decoupler: {
        noName:
          "Setting a target at all puts you ahead of most pilots. Who checks it at day 90? If it's “the team,” the winner ends up grading its own work.",
        noTrigger:
          "You've named who checks it. What's the actual number? “Show value” at day 90 turns into a demo, and demos always go well.",
        specific:
          "A number, set before anyone knows who wins, and someone to check it. That's solid. I'd write it down today so nobody can adjust it later.",
        declined:
          "Then day 90 arrives with no bar, and whichever tool is running keeps running because stopping feels like failing.",
      },
      recruiter: {
        noName:
          "A clear day-90 test helps everyone. Whose time does the checking come out of? There's half of one analyst for evaluation, and they're already stretched.",
        noTrigger:
          "Good, someone owns the check. How many hours will it take them each week, and what comes off their plate to make room?",
        specific:
          "That works, and you've named who does the checking. Please tell their manager this week, so it becomes part of the job and not extra.",
        declined:
          "Then someone will end up checking it in their spare time. That's how the triage nurses got here in the first place.",
      },
    },
    funding: {
      ledger: {
        noName:
          "Good that you've picked a rule. Whose budget line, specifically? “The organization pays” usually means nobody has been told.",
        noTrigger:
          "You've named who pays for the build. What about year two? A free pilot usually shows up the next year as a full-price renewal.",
        specific:
          "A named budget and a written rule for outside money. That's what I needed. I'd also get the vendor's renewal price in writing before any pilot starts.",
        declined:
          "Then the money comes from whoever has it. The grant and the vendor both have it, and each comes with terms you haven't read yet.",
      },
    },
    represent: {
      beacon: {
        noName:
          "Having a rule helps. Who approves each statement? If sponsors do it themselves, the vendor's press release goes out first.",
        noTrigger:
          "Communications approving it is right. What has to be true before anything goes out? The abstract deadline won't wait for day 90 on its own.",
        specific:
          "Clear: one approver, and a result that has to come first. I can support that. Tell the lead researcher now, before the abstract is written.",
        declined:
          "Then the vendor's press release sets the story, and we find out what we said about ourselves when we read it.",
      },
    },
  },

  s2: {
    purpose: {
      adoption_realist: {
        noName:
          "Picking one question is progress. Who confirms it with both Dr. Renner and Dr. Vogel? If neither hears it from a person, they'll each keep arguing their own question.",
        noTrigger:
          "Good, someone is confirming it. When do both pathologists hear it? The sandbox ends in three weeks, and the evaluation needs its question before then.",
        specific:
          "One question, confirmed with both pathologists by a named person. Dr. Vogel may disagree, and that's fine as long as Dr. Vogel hears it directly.",
        declined:
          "Then the evaluation answers whichever question the loudest pathologist asks, and the other one calls the result unfair.",
      },
    },
    proof: {
      decoupler: {
        noName:
          "Testing on our own slides is the right instinct. Who judges the result? If it's “pathology,” Dr. Renner and Dr. Vogel will judge it differently.",
        noTrigger:
          "Good, someone is judging it. What's the pass mark, and by what date? The vendor says 96% and the other center got 89%. Where is our line?",
        specific:
          "A pass mark, our own slides, a judge, and an end date. That's an evaluation that can finish. Share the pass mark with the vendor; they've asked for it.",
        declined:
          "Then the evaluation has no finish line. Seven months in, it's still “pending,” and the sandbox is on its third extension.",
      },
    },
    risk_accept: {
      steward: {
        noName:
          "Good to take the testing risk seriously. Who signs for it? The Workgroup approved it “in principle,” and nobody has signed anything since.",
        noTrigger:
          "You've named someone to sign. What would make them stop the testing? The residents already studying with it is the first thing I'd put on that list.",
        specific:
          "A name, conditions, and a deadline for the vendor's answers. I can support that. I'd add one: the residents stop using the sandbox until it's approved.",
        declined:
          "Then our slides stay in the vendor's sandbox, the residents keep studying with it, and nobody has agreed to either.",
      },
    },
    retier: {
      caretaker: {
        noName:
          "Tracking versions at all puts you ahead. Who watches for updates? The vendor's notices go to a shared inbox, and shared inboxes don't get read.",
        noTrigger:
          "Good, someone is watching. What do they do when the version changes: restart, carry on, or split the results? Decide now, before the next update arrives.",
        specific:
          "A named person, and a rule for what happens on an update. That keeps the result meaningful. I'd ask the vendor for a week's notice before each update.",
        declined:
          "Then the next update lands mid-test, and nobody can say which version the final number describes.",
      },
    },
    decide: {
      cartographer: {
        noName:
          "Good that you want a real decision this time. Who makes it? “The Workgroup” already said yes in principle once, and that yes has lasted seven months.",
        noTrigger:
          "You've named the decider. By what date, and held to what result? Without both, the report goes to a meeting and comes back as another “pending.”",
        specific:
          "One decider, a date, held to the pass mark. That's a decision that will actually happen. Tell the Workgroup it's advising, not deciding.",
        declined:
          "Then the result goes to whoever feels like picking it up, and “in principle” stays the only answer we've ever given.",
      },
      ledger: {
        noName:
          "A clear decision helps me plan. If it's a yes, whose budget buys it? There's no purchase money anywhere right now.",
        noTrigger:
          "Good, someone decides. If the answer is yes, when does the money need to exist? Pilot pricing ends in three weeks, and the standard price is higher.",
        specific:
          "A named decider with a date lets me plan. If it's a yes, send me the price the same week so it makes next year's budget.",
        declined:
          "Then a yes, if it comes, arrives with no money behind it, and the tool waits another budget cycle.",
      },
    },
    represent: {
      beacon: {
        noName:
          "Good that you want to control what's said. Who approves it? Right now the vendor's website is saying it for us.",
        noTrigger:
          "Communications approving it is right. What happens to the “evaluation partner” listing, and what do we tell the other center's pathology chair who called?",
        specific:
          "One approved statement and a clear wait for results. That's honest. Call the other center's chair back this week; they asked in good faith.",
        declined:
          "Then the vendor keeps listing us as a partner, and the other center hears whatever the vendor tells them.",
      },
    },
  },

  s3: {
    tier: {
      steward: {
        noName:
          "Taking another look at the rating is right. Who sets it? The old rating assumed a charge nurse checks every prediction, and main campus doesn't have that.",
        noTrigger:
          "Good, someone owns the rating. Does it follow the tool or each campus? A 90-bed campus with Marisol and a 380-bed campus without her aren't the same risk.",
        specific:
          "A named person rating each campus before go-live. That's right. I'd add the 14 fields mapped differently at main campus to what they check.",
        declined:
          "Then main campus goes live on a rating written for a 90-bed campus where someone checked every prediction by hand.",
      },
    },
    risk_accept: {
      adoption_realist: {
        noName:
          "Good that someone will sign. Who, at main campus? The command center director wasn't in the planning, and she'll be the one living with it.",
        noTrigger:
          "You've named who signs. What would make them pull it back? At the community campus, Marisol overrides about 30% of predictions, and that tells you something.",
        specific:
          "A named person at each campus, signing before go-live. That's how tools stick. Please invite the command center director to planning first.",
        declined:
          "Then main campus runs the tool the way the community campus did: nobody signed, and it works only as long as someone like Marisol is there.",
      },
    },
    decide: {
      cartographer: {
        noName:
          "Separating the schedule from the go-live call is smart. Who makes the call at each campus? “The team” can't hold a date.",
        noTrigger:
          "Good, someone decides. What's on the checklist besides the date? The 14 fields at main campus should be the first line.",
        specific:
          "A named readiness lead with a published checklist. That's clear. If they hold the date, The Executive Sponsor should back them in writing.",
        declined:
          "Then June 2 decides. The date was set before anyone looked at main campus's setup.",
      },
    },
    stop: {
      caretaker: {
        noName:
          "Good that there's a way to switch it off. Who does it at each campus, at 6 a.m. when the huddle starts? A group can't answer the phone.",
        noTrigger:
          "You've named who can turn it off. What would make them do it? Overrides are logged only 12% of the time, so you'll need a signal you can actually see.",
        specific:
          "Named people and set triggers at each campus. That's what I needed. Make the override reason required, so the trigger has data behind it.",
        declined:
          "Then the tool runs at every campus until it misleads a huddle badly enough that someone notices, and nobody knows who's allowed to stop it.",
      },
    },
    represent: {
      beacon: {
        noName:
          "Good that you're shaping the story. Who approves it? Right now Communications has a headline, and nobody has checked it against the numbers.",
        noTrigger:
          "You've named an approver. What can it claim, and what date can't it run before? Half a day, one campus, no comparison site is a smaller story than the headline.",
        specific:
          "A named approver, an honest claim, and a date. That protects the rollout if main campus has a rough start. Marisol's part should be in it.",
        declined:
          "Then the headline runs two weeks before main campus goes live, and every problem after that gets measured against it.",
      },
    },
    funding: {
      ledger: {
        noName:
          "Good to name who pays. Whose budget line, specifically? The grant ends in four months, and the vendor's price assumes all four campuses.",
        noTrigger:
          "You've named the budget. What does it cover? Licenses are the smallest part; training and a huddle lead at each campus are where the money goes.",
        specific:
          "One owner covering licenses, training, and the huddle lead. That's the real cost, written down. I'd get it into next year's budget now.",
        declined:
          "Then the grant ends in four months, and the community campus's tool stops being paid for, whether it's working or not.",
      },
      recruiter: {
        noName:
          "Good to plan for people, not just licenses. Whose job becomes the huddle lead at each campus? Right now it's Marisol's notebook.",
        noTrigger:
          "You've named who pays. How many hours a week is the huddle lead role, and what comes off that person's job to make room?",
        specific:
          "A funded huddle lead at each campus. That's the part that made the community campus work. Please write it as a job, not an extra duty.",
        declined:
          "Then each campus will need its own Marisol and won't have one. She's doing this on top of her charge nurse job today.",
      },
    },
  },

  s4: {
    risk_accept: {
      steward: {
        noName:
          "Good that you're facing it this morning. Who signs for it, by name or role? “The clinics” or “the Workgroup” is how the tool ran fourteen months with nobody.",
        noTrigger:
          "You've named who signs. What would make them change course? One more missed lab like this morning's should be the first thing on that list.",
        specific:
          "A named person and a clear trigger. I can support that. I'd ask them to sign by the end of the week and send it to the service desk.",
        declined:
          "Then it keeps drafting notes in three clinics, and if another creatinine is missed, nobody will have agreed to that risk.",
      },
    },
    stop: {
      caretaker: {
        noName:
          "Good to want a faster off switch. Who pulls it at 7 p.m. on a Friday? A committee can't open a vendor ticket.",
        noTrigger:
          "You've named who can switch it off. What makes them do it, and how fast? Right now it takes a vendor ticket, and the fastest one took 19 hours.",
        specific:
          "A named person, a trigger, and a same-day switch. That's what I needed. Test it once before you rely on it.",
        declined:
          "Then turning it off stays a vendor ticket, and the next bad summary runs for however long the ticket takes.",
      },
    },
    tier: {
      steward: {
        noName:
          "Good to finally give it a risk level. Who sets it? The approval said “not assigned at this meeting,” and no meeting since has assigned it.",
        noTrigger:
          "You've named who sets it. Does it cover the tool everywhere, or each clinic's use? GI and breast started using it without anyone rating what they use it for.",
        specific:
          "A named person rating each clinic's use. That fits what happened here. I'd rate GI first, since that's where this morning's miss was.",
        declined:
          "Then the tool has no risk level fourteen months in, and the next clinic that copies the template won't have one either.",
      },
    },
    decide: {
      cartographer: {
        noName:
          "Good that someone will decide. Who, by name or role? A joint vote of the Workgroup and the council needs both to agree who's chairing, and they don't.",
        noTrigger:
          "You've named the decider. By what date? The license renews automatically in 60 days, and notice is due in 30.",
        specific:
          "One decider, advised by the Workgroup, with a date. That's clear. Make sure the date lands before the 30-day notice deadline.",
        declined:
          "Then the renewal decides for you. It renews automatically in 60 days unless someone gives written notice.",
      },
    },
    proof: {
      decoupler: {
        noName:
          "Picking a standard is progress. Who checks it? The pharmacist did the only check in fourteen months, on her own time, and her email got no reply.",
        noTrigger:
          "You've named who checks it. What's the number? Three misses in 41 might be fine or might not; right now nobody can say.",
        specific:
          "A ceiling, a monthly audit, and a named checker. That's what was missing from the start. Send the pharmacist the result; she's earned it.",
        declined:
          "Then every future spot check will sound reassuring, and none will tell you whether to keep it.",
      },
      recruiter: {
        noName:
          "A regular audit is right. Whose job is it? “Quality” or “pharmacy” means it lands on whoever is most conscientious, and that's how the pharmacist ended up doing it.",
        noTrigger:
          "You've named who audits. How many hours a month is 40 charts, and what comes off their plate to make room?",
        specific:
          "A named auditor, with the time set aside. Please tell their manager, so it's part of the job and not something they do after hours.",
        declined:
          "Then the checking stays unpaid and optional, and the next person who notices a miss will wonder where to send it.",
      },
    },
    retier: {
      caretaker: {
        noName:
          "Good to set a rule. Who watches for the triggers? The last two updates went to a mailbox nobody reads.",
        noTrigger:
          "You've named who watches. What exactly sends it back? Version 4.0 installs for everyone in 60 days; decide now whether that counts.",
        specific:
          "Clear triggers and a named watcher. Point the vendor's notices at that person, not the shared mailbox.",
        declined:
          "Then version 4.0 installs in 60 days the way the last two updates did, and nobody will know.",
      },
    },
    funding: {
      ledger: {
        noName:
          "Good to pick a way to pay. Whose budget line, by name? “The clinics” or “IT” means the renewal lands on whoever opens the invoice.",
        noTrigger:
          "You've named who pays. What does it cover: the license, the monthly chart checks, the monitoring add-on? The price is going up 38%.",
        specific:
          "One owner covering the license, the checks, and the monitoring. That's the real cost in one place. Send the renewal notice to them today.",
        declined:
          "Then it renews automatically at 38% more, with no money for the checking and nobody who chose to pay it.",
      },
    },
  },
};
