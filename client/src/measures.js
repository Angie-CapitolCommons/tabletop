// The nine measures (Class A), verbatim from the measurement framework.
// Surfaced on node screens, step-rail tooltips, and the admin matrix.
export const MEASURES = {
  purpose: { id: "A1", name: "Purpose boundary", def: "what the environment is for, and one thing it is explicitly not for" },
  tier: { id: "A2", name: "Tier assignment", def: "the tier, who sets it, and whether it covers the tool or the use" },
  retier: { id: "A3", name: "Re-tier trigger", def: "the named condition that forces re-review" },
  decide: { id: "A4", name: "Decision rights", def: "who decides, who is consulted, and which body it goes to" },
  risk_accept: { id: "A5", name: "Risk acceptance", def: "who accepts a residual risk when disclosure is incomplete" },
  proof: { id: "A6", name: "Burden of proof", def: "the threshold that advances it, set before the pilot runs" },
  stop: { id: "A7", name: "Stop condition", def: "what ends it, and who can turn it off" },
  funding: { id: "A8", name: "Funding carry", def: "whose budget at build, at scale, and at renewal" },
  represent: { id: "A9", name: "External representation", def: "what may be said about it outside, at what readiness" },
};

// What a Specific answer contains, per measure, in the room's own words.
// Shown to the facilitator at scoring; the A-codes above stay on the dashboard.
export const SCORING = {
  purpose: "the purpose in one sentence, one thing it's not for, and who signs off on it",
  tier: "who sets the risk level, and whether it covers the tool everywhere or each use",
  retier: "the events that send it back for review, and who watches for them",
  decide: "one person or role who decides, who they check with, and a date",
  risk_accept: "a person or role who signs for the risk, and what would make them revisit it",
  proof: "a number to hit, who measures it, and by when",
  stop: "who can turn it off, and what would make them do it",
  funding: "whose budget pays, and for what: the build, running it, the renewal",
  represent: "who approves what's said outside, and what has to be true first",
};
export const GENERIC_ABSENT =
  "Generic: a committee or department instead of a person or role, or no trigger. Absent: no one named.";
