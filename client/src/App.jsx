import React, { useEffect, useRef, useState } from "react";

// Tabletop room screen — Virtual Insights brand v2 (design handoff).
// Fixed 1280×800 stage scaled to fit. Server phases unchanged:
// posed → challenge → revise → score → consequence → … → epilogue.
// Client adds: briefing (role roster), recording/revising sub-states,
// evidence + AI Council available everywhere, score-at-lock in the
// facilitator bar, decision-path strip, segmented meters.

async function api(path, body) {
  const res = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

const METER_LABELS = { goodwill: "Goodwill", risk: "Risk", dollars: "Dollars", time: "Time to value" };
const METER_FULL = {
  goodwill: "Clinician goodwill",
  risk: "Risk exposure",
  dollars: "Dollars committed",
  time: "Time to first value",
};
const COST_UP = { goodwill: false, risk: true, dollars: true, time: true };
const RAIL_LABELS = {
  purpose: "Purpose", risk_accept: "Risk", stop: "Off switch", tier: "Tier",
  decide: "Decider", proof: "Proof", retier: "Re-review", funding: "Funding",
  represent: "The story",
};
const LONG_NAMES = {
  purpose: "Purpose", risk_accept: "Risk acceptance", stop: "The off switch",
  tier: "Tiering", decide: "The decider", proof: "Proof", retier: "Re-review",
  funding: "Funding", represent: "Representation",
};
const LETTERS = ["A", "B", "C"];
const optLetter = (o, i) => (o.id === "decline" ? "–" : o.id === "writein" ? "✎" : LETTERS[i]);
const nn = (i) => String(i + 1).padStart(2, "0");

// ---------- stage scaling ----------
function useStageScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / 1280, window.innerHeight / 800));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return scale;
}

// ---------- top bar ----------
function Meter({ id, value, prev }) {
  const delta = prev != null ? value - prev : 0;
  const worse = COST_UP[id] ? delta > 0 : delta < 0;
  const tone = worse ? "worse" : "better";
  const v = Math.min(value, 12);
  const pv = Math.min(prev ?? value, 12);
  return (
    <div className="meter">
      <span className="meter-label">{METER_LABELS[id]}</span>
      <div className="meter-valrow">
        <span className="meter-value">{value}</span>
        {delta !== 0 && (
          <span className={`meter-delta ${tone}`}>{delta > 0 ? `+${delta}` : `−${-delta}`}</span>
        )}
      </div>
      <div className="segbar">
        {Array.from({ length: 12 }, (_, i) => {
          let cls = "";
          if (i < Math.min(v, pv)) cls = "filled";
          else if (v > pv && i < v) cls = `gained ${tone}`;
          else if (v < pv && i < pv) cls = `lost ${tone}`;
          return <i key={i} className={cls} />;
        })}
      </div>
    </div>
  );
}

// ---------- record panel (2b, also used for revise) ----------
function RecordPanel({ node, decidedByPrompt, roles, roleAssignments, initial, onCommit, commitLabel, setCommit }) {
  const [choice, setChoice] = useState(initial?.choice ?? null);
  const [freeText, setFreeText] = useState(initial?.freeText ?? "");
  const chipLabels = roles.map((r) => (roleAssignments[r] ? `${r} · ${roleAssignments[r]}` : r));
  const allChips = [...chipLabels, "The group"];
  const initialIsChip = initial && allChips.includes(initial.decidedBy);
  const [chip, setChip] = useState(initialIsChip ? initial.decidedBy : initial?.decidedBy ? "__other" : null);
  const [other, setOther] = useState(initialIsChip ? "" : initial?.decidedBy ?? "");
  const decidedBy = chip === "__other" ? other.trim() : chip;
  const ready = choice && freeText.trim() && decidedBy;

  // Surface the commit action to the facilitator bar.
  useEffect(() => {
    setCommit({
      label: commitLabel,
      enabled: !!ready,
      run: () => onCommit({ choice, freeText, decidedBy }),
    });
    return () => setCommit(null);
  }, [choice, freeText, decidedBy, ready]);

  return (
    <div className="record-panel">
      <span className="eyebrow">Recording the room's answer</span>
      <div className="rp-choices">
        {node.options.map((o, i) => (
          <button
            key={o.id}
            className={`rp-choice ${choice === o.id ? "selected" : ""}`}
            onClick={() => setChoice(o.id)}
          >
            <span className="letter">{optLetter(o, i)}</span>
            <span>{o.label}</span>
          </button>
        ))}
      </div>
      <div className="rp-field">
        <label>
          {choice === "writein"
            ? "Write the room's answer: the path, the named owner, and the trigger. This text is the decision — honored verbatim."
            : node.freeTextPrompt}
        </label>
        <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} />
      </div>
      <div className="rp-field">
        <label>{decidedByPrompt}</label>
        <div className="chips">
          {allChips.map((c) => (
            <button key={c} className={`chip ${chip === c ? "selected" : ""}`} onClick={() => setChip(c)}>
              {c}
            </button>
          ))}
          <button className={`chip other ${chip === "__other" ? "selected" : ""}`} onClick={() => setChip("__other")}>
            Other…
          </button>
          {chip === "__other" && (
            <input
              className="chip-input"
              value={other}
              onChange={(e) => setOther(e.target.value)}
              placeholder="Who made the call…"
              autoFocus
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- decision path strip ----------
function PathStrip({ progress, records, currentIndex, epilogue }) {
  const lastLockedIdx = progress.reduce(
    (acc, p, i) => (records[p.id]?.answer && records[p.id]?.score ? i : acc),
    -1,
  );
  return (
    <div className="path-strip">
      <div className="path-label">DECISION PATH</div>
      <div className="path">
        {progress.map((p, i) => {
          const r = records[p.id];
          if (r?.skipped)
            return (
              <div key={p.id} className="path-cell skipped-cell">
                <span className="pc-eyebrow">{nn(i)} {RAIL_LABELS[p.type]} · skipped</span>
                <span className="pc-choice">Never asked</span>
              </div>
            );
          if (r?.answer && r?.score)
            return (
              <div key={p.id} className={`path-cell locked ${i === lastLockedIdx ? "latest" : ""}`}>
                <span className="pc-eyebrow">{nn(i)} {RAIL_LABELS[p.type]} · {r.score}</span>
                <span className="pc-choice">{r.answer.short}</span>
                <span className="pc-detail">{r.answer.freeText}</span>
              </div>
            );
          if (!epilogue && i === currentIndex + 1)
            return (
              <div key={p.id} className="path-cell next">
                <span className="pc-eyebrow">{nn(i)} · next</span>
                <span className="pc-choice">{RAIL_LABELS[p.type]}</span>
              </div>
            );
          return (
            <div key={p.id} className="path-cell pending">
              <span className="pc-eyebrow">{nn(i)}</span>
              <span className="pc-choice">{RAIL_LABELS[p.type]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const scale = useStageScale();
  const [data, setData] = useState(null);
  const [turns, setTurns] = useState([]);
  const [prevMeter, setPrevMeter] = useState(null);
  const [recording, setRecording] = useState(false);
  const [revising, setRevising] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(null);
  const [councilOpen, setCouncilOpen] = useState(false);
  const [council, setCouncil] = useState([]);
  const [skipArmed, setSkipArmed] = useState(false);
  const [commit, setCommit] = useState(null); // surfaced from RecordPanel
  const [roster, setRoster] = useState({});
  const npcForNode = useRef(null);

  useEffect(() => {
    api("state").then(setData);
    api("elders").then(setCouncil);
  }, []);

  const state = data?.state;
  const { scenario, scenarios, node, progress, decidedByPrompt, villagerStandingLine, roles, roleAssignments, records } = data ?? {};

  // Elder turns stream automatically on entering challenge.
  useEffect(() => {
    if (!state || state.phase !== "challenge" || !node) return;
    if (npcForNode.current === node.id) return;
    npcForNode.current = node.id;
    setTurns([]);
    (async () => {
      const res = await fetch("/api/npc", { method: "POST" });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split("\n\n");
        buf = events.pop();
        for (const ev of events) {
          const line = ev.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const msg = JSON.parse(line.slice(6));
          setTurns((ts) => {
            const next = [...ts];
            if (msg.type === "elder-start") next.push({ elder: msg.elder, text: "", status: "streaming" });
            else if (msg.type === "delta" && next.length)
              next[next.length - 1] = { ...next[next.length - 1], text: next[next.length - 1].text + msg.text };
            else if (msg.type === "elder-done" && next.length)
              next[next.length - 1] = { ...next[next.length - 1], status: "done" };
            else if (msg.type === "elder-unavailable" && next.length)
              next[next.length - 1] = { ...next[next.length - 1], text: msg.message, status: "unavailable" };
            return next;
          });
        }
      }
      setData(await api("state"));
    })().catch(async () => {
      setTurns((ts) =>
        ts.length
          ? ts.map((t) => (t.status === "streaming" ? { ...t, status: "unavailable", text: "The Elder is unavailable — continue." } : t))
          : [{ elder: { id: "npc", name: "The Elders", seat: "" }, text: "The Elders are unavailable — continue.", status: "unavailable" }],
      );
      setData(await api("state"));
    });
  }, [state?.phase, node?.id]);

  useEffect(() => setSkipArmed(false), [state?.phase, node?.id]);

  if (!data)
    return (
      <div className="viewport">
        <span className="loading">Opening the case file…</span>
      </div>
    );

  const refresh = (d) => setData(d);
  const record = state.record;
  const phase = state.phase;
  const briefed = phase === "select" ? false : state.briefed || phase !== "posed" || node?.index > 0;

  const doSkip = async () => {
    if (!skipArmed) return setSkipArmed(true);
    setSkipArmed(false);
    refresh(await api("skip", {}));
  };

  const advance = async () => {
    npcForNode.current = null;
    setTurns([]);
    refresh(await api("advance", {}));
  };

  const reset = async () => {
    npcForNode.current = null;
    setTurns([]);
    setPrevMeter(null);
    setRecording(false);
    setRevising(false);
    refresh(await api("reset", {}));
  };

  const commitAnswer = async (a) => {
    const d = await api("answer", a);
    setRecording(false);
    setRevising(false);
    refresh(d);
  };

  const scoreBtns = ["specific", "generic", "absent"].map((s) => (
    <button
      key={s}
      className="fac-score"
      disabled={phase !== "score"}
      title="Specific names a role or person plus a trigger or threshold · Generic names a function · Absent declined or named no one"
      onClick={async () => {
        setPrevMeter(state.meter);
        refresh(await api("lock", { score: s }));
      }}
    >
      {s[0].toUpperCase() + s.slice(1)}
    </button>
  ));

  const commonFacBtns = (
    <>
      <span className="fac-label">FACILITATOR</span>
      <button className="fac-btn" onClick={() => setEvidenceOpen("menu")}>Evidence</button>
      <button className="fac-btn" onClick={() => setCouncilOpen(true)}>AI Council</button>
    </>
  );
  const skipBtn = (
    <button className={`fac-btn ${skipArmed ? "armed" : ""}`} onClick={doSkip}>
      {skipArmed ? "Confirm skip?" : "Skip node"}
    </button>
  );

  // ---------- facilitator bar per phase ----------
  let facbar;
  if (phase === "select")
    facbar = (
      <>
        <span className="fac-label">FACILITATOR</span>
        <button className="fac-btn" onClick={() => setCouncilOpen(true)}>AI Council</button>
        <a className="fac-btn" href="/print" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
          Printables
        </a>
        <span className="fac-score-label">THE GROUP CHOOSES THE CASE</span>
      </>
    );
  else if (!briefed)
    facbar = (
      <>
        {commonFacBtns}
        <button
          className="fac-primary"
          onClick={async () => refresh(await api("roles", { assignments: roster }))}
        >
          Start node 1
        </button>
      </>
    );
  else if (phase === "posed" && !recording)
    facbar = (
      <>
        {commonFacBtns}
        {skipBtn}
        <button className="fac-primary" onClick={() => setRecording(true)}>
          Record the room's answer
        </button>
      </>
    );
  else if ((phase === "posed" && recording) || (phase === "revise" && revising))
    facbar = (
      <>
        {commonFacBtns}
        <button
          className="fac-btn"
          onClick={() => {
            setRecording(false);
            setRevising(false);
          }}
        >
          Back to discussion
        </button>
        <button className="fac-primary" disabled={!commit?.enabled} onClick={() => commit?.run()}>
          {commit?.label ?? "Commit"}
        </button>
      </>
    );
  else if (phase === "challenge" || phase === "revise" || phase === "score")
    facbar = (
      <>
        {commonFacBtns}
        {phase !== "score" && skipBtn}
        <span className="fac-score-label">SCORE AT LOCK</span>
        {scoreBtns}
      </>
    );
  else if (phase === "consequence")
    facbar = (
      <>
        {commonFacBtns}
        <button className="fac-primary" onClick={advance}>
          {node ? `Continue to node ${node.index + 2 > progress.length ? "— report" : node.index + 2}` : "Continue"}
        </button>
      </>
    );
  else if (phase === "epilogue")
    facbar = (
      <>
        {commonFacBtns}
        <a className="fac-btn" href="/api/export" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
          Export the record
        </a>
        <button className="fac-primary" onClick={reset}>Close the file and reset</button>
      </>
    );

  // ---------- main content per phase ----------
  let main;
  if (phase === "select") {
    main = (
      <div className="select-screen">
        <span className="eyebrow" style={{ fontSize: 15 }}>Four cases · one room · the group decides</span>
        <h1 className="b-title">Choose the case</h1>
        <div className="case-grid">
          {scenarios.map((s) => (
            <button
              key={s.id}
              className="case-card"
              onClick={async () => refresh(await api("scenario", { id: s.id }))}
            >
              <span className="eyebrow" style={{ fontSize: 12 }}>Enters at {s.entersAt} · {s.nodeCount} decisions</span>
              <span className="case-title">{s.title}</span>
              <span className="case-tagline">{s.tagline}</span>
            </button>
          ))}
        </div>
      </div>
    );
  } else if (!briefed) {
    main = (
      <div className="briefing">
        <div>
          <span className="eyebrow" style={{ fontSize: 15 }}>Case file · enters at {scenario.entersAt}</span>
          <h1 className="b-title">{scenario.title}</h1>
          {scenario.brief.split("\n\n").map((p, i) => (
            <p key={i} className="b-para">{p}</p>
          ))}
        </div>
        <div>
          <div className="roster-label">The table · first names only</div>
          <div className="roster">
            {roles.map((r) => (
              <div key={r} className="roster-row">
                <span className="role-name">{r}</span>
                <input
                  value={roster[r] ?? ""}
                  onChange={(e) => setRoster({ ...roster, [r]: e.target.value })}
                  placeholder="First name(s)"
                />
              </div>
            ))}
          </div>
          <p className="roster-note">
            Every person plays a role and every role is played — share or double up as needed.
            Names stay here; they never reach the model or the reports.
          </p>
        </div>
      </div>
    );
  } else if (phase === "posed" && node) {
    main = (
      <div className={`discuss ${recording ? "recording" : ""}`}>
        <div className="d-left">
          {node.inject && (
            <div className="inject">
              <span className="eyebrow">Meanwhile</span>
              <p>{node.inject}</p>
            </div>
          )}
          <span className="eyebrow" style={{ fontSize: 15 }}>
            {nn(node.index)} / {LONG_NAMES[node.type]}
          </span>
          <h1 className="node-title">{node.title}</h1>
          <p className="node-question">{node.question}</p>
        </div>
        {recording ? (
          <RecordPanel
            node={node}
            decidedByPrompt={decidedByPrompt}
            roles={roles}
            roleAssignments={roleAssignments}
            initial={null}
            onCommit={commitAnswer}
            commitLabel="Commit the room's answer"
            setCommit={setCommit}
          />
        ) : (
          <div className="options-col">
            <div className="opt-stack">
              {node.options.filter((o) => o.id !== "decline" && o.id !== "writein").map((o, i) => (
                <div key={o.id} className="opt">
                  <span className="letter">{LETTERS[i]}</span>
                  <span>
                    <span className="opt-label">{o.label}</span>
                    <span className="opt-hint">{o.hint}</span>
                  </span>
                </div>
              ))}
            </div>
            {node.options.filter((o) => o.id === "writein" || o.id === "decline").map((o) => (
              <div key={o.id} className={`opt special ${o.id}-opt`}>
                <span className="letter">{o.id === "writein" ? "✎" : "–"}</span>
                <span>
                  <span className="opt-label">{o.label}</span>
                  <span className="opt-hint">{o.hint}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } else if ((phase === "challenge" || phase === "revise" || phase === "score") && node) {
    main = revising ? (
      <div className="discuss recording">
        <div className="d-left">
          <span className="eyebrow" style={{ fontSize: 15 }}>
            {nn(node.index)} / {LONG_NAMES[node.type]}
          </span>
          <h1 className="node-title">{node.title}</h1>
          <p className="node-question">{node.question}</p>
        </div>
        <RecordPanel
          node={node}
          decidedByPrompt={decidedByPrompt}
          roles={roles}
          roleAssignments={roleAssignments}
          initial={record.firstAnswer}
          onCommit={commitAnswer}
          commitLabel="Commit the revised answer"
          setCommit={setCommit}
        />
      </div>
    ) : (
      <div className="challenge">
        <div>
          <div className="committed-label">THE ROOM COMMITTED</div>
          <div className="committed-card">
            <div className="cc-choice">
              <span className="letter">
                {optLetter(
                  node.options.find((o) => o.id === record.firstAnswer.choice),
                  node.options.findIndex((o) => o.id === record.firstAnswer.choice),
                )}
              </span>
              <span className="cc-label">
                {node.options.find((o) => o.id === record.firstAnswer.choice).label}
              </span>
            </div>
            <p className="cc-quote">“{record.firstAnswer.freeText}”</p>
            <div className="cc-rule">
              <div className="cc-final-label">FINAL CALL</div>
              <div className="cc-final">{record.firstAnswer.decidedBy}</div>
            </div>
          </div>
        </div>
        <div className="elder-col">
          {turns.map((t, i) => (
            <div key={i} className={`elder ${i > 0 ? "secondary" : ""} ${t.status}`}>
              <div className="elder-head">
                <span className="elder-mark">{t.elder.name.replace(/^The /, "")[0]}</span>
                <div>
                  <div className="elder-name">{t.elder.name}</div>
                  <div className="elder-seat">ELDER · {t.elder.seat}</div>
                </div>
              </div>
              <p className="elder-text">
                {t.text}
                {t.status === "streaming" && <span className="cursor">▋</span>}
              </p>
            </div>
          ))}
          {phase === "revise" && (
            <div className="hold-revise">
              <button className="hr-cell" onClick={async () => refresh(await api("hold", {}))}>
                <span className="hr-title">Hold</span>
                <span className="hr-sub">The first answer locks as written.</span>
              </button>
              <button className="hr-cell" onClick={() => setRevising(true)}>
                <span className="hr-title">Revise</span>
                <span className="hr-sub">Reopens the record, pre-filled. Both are kept.</span>
              </button>
            </div>
          )}
          {phase === "score" && (
            <div className="hold-revise">
              <div className="hr-cell" style={{ gridColumn: "1 / -1" }}>
                <span className="hr-title">Ready to lock</span>
                <span className="hr-sub">Facilitator: stamp the score in the bar below.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } else if (phase === "consequence" && node) {
    const answer = record.revisedAnswer ?? record.firstAnswer;
    main = (
      <div className="consequence">
        <div className="cq-left">
          <span className="eyebrow">What this sets in motion</span>
          <p className="cq-text">{record.consequence}</p>
          <p className="cq-meta">
            LOCKED · <span className="score">{record.score}</span>
            {record.held ? " · HELD AFTER CHALLENGE" : record.revisedAnswer ? " · REVISED AFTER CHALLENGE" : ""}
          </p>
          {record.villager && (
            <div className="villager">
              <span className="villager-name">{record.villager.name}</span>
              <p className="villager-line">“{record.villager.line}”</p>
              <span className="villager-standing">{villagerStandingLine}</span>
            </div>
          )}
        </div>
        <div>
          <div className="moved-label">WHAT MOVED</div>
          {Object.keys(METER_FULL).map((k) => {
            const before = prevMeter?.[k] ?? state.meter[k];
            const after = state.meter[k];
            const delta = after - before;
            const worse = COST_UP[k] ? delta > 0 : delta < 0;
            return (
              <div key={k} className="moved-row">
                <span className="moved-name">
                  {METER_FULL[k]}
                  <span className="moved-dir">{COST_UP[k] ? "Lower is better" : "Higher is better"}</span>
                </span>
                <span className="moved-vals">{before} → {after}</span>
                <span className={`moved-delta ${delta === 0 ? "same" : worse ? "worse" : "better"}`}>
                  {delta === 0 ? "—" : delta > 0 ? `+${delta}` : `−${-delta}`}
                </span>
              </div>
            );
          })}
        </div>
        <PathStrip
          progress={progress}
          records={{ ...records, [node.id]: { score: record.score, skipped: false, answer: { ...answer, short: node.options.find((o) => o.id === answer.choice).short } } }}
          currentIndex={node.index}
        />
      </div>
    );
  } else if (phase === "epilogue") {
    main = (
      <div className="epilogue">
        <span className="eyebrow" style={{ fontSize: 14 }}>After-action report · {state.epilogue.minutes} minutes</span>
        <h1 className="epi-head-title">Twelve months later</h1>
        <PathStrip progress={progress} records={records} currentIndex={-1} epilogue />
        <div className="epi-rows" style={{ marginTop: 20 }}>
          {state.epilogue.parts.map((p) => (
            <div key={p.nodeId} className="epi-row">
              <span className="pc-eyebrow">{RAIL_LABELS[p.type]}</span>
              <span className={`epi-verdict ${p.held ? "held" : "broke"}`}>{p.held ? "HELD" : "BROKE"}</span>
              <span className="epi-line">{p.line}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="viewport">
      <div className="stage" style={{ transform: `scale(${scale})` }}>
        <div className="topbar">
          <div>
            <div className="eyebrow">
              TABLETOP{scenario ? ` · ENTERS AT ${scenario.entersAt.toUpperCase()}` : " · BREAKOUT SESSION"}
            </div>
            <div className="title">{scenario ? scenario.title : "Choose the case"}</div>
          </div>
          <div className="meters">
            {Object.keys(METER_LABELS).map((k) => (
              <Meter key={k} id={k} value={state.meter[k]} prev={prevMeter?.[k]} />
            ))}
          </div>
        </div>
        <div className="steprail">
          {progress.map((p, i) => (
            <div key={p.id} className={`step ${p.status} ${records[p.id]?.skipped ? "skipped" : ""}`}>
              <span className="num">{nn(i)}</span>
              {RAIL_LABELS[p.type]}
            </div>
          ))}
          {progress.length === 0 && <div className="step">The docket fills when a case is chosen</div>}
        </div>
        <div className="main">{main}</div>
        <div className="facbar">{facbar}</div>

        {evidenceOpen && (
          <>
            <div className="drawer-scrim" onClick={() => setEvidenceOpen(null)} />
            <div className="drawer">
              <div className="drawer-head">
                <div>
                  <span className="eyebrow">From the case file</span>
                  <h3>{evidenceOpen === "menu" ? "Evidence folder" : evidenceOpen.title}</h3>
                </div>
                <div className="drawer-actions">
                  {evidenceOpen !== "menu" && (
                    <button className="panel-btn" onClick={() => setEvidenceOpen("menu")}>
                      All documents
                    </button>
                  )}
                  <button className="panel-btn" onClick={() => setEvidenceOpen(null)}>Close</button>
                </div>
              </div>
              {evidenceOpen === "menu" ? (
                <div className="drawer-grid">
                  {scenario.evidence.map((doc) => (
                    <button key={doc.id} className="evidence-cell" onClick={() => setEvidenceOpen(doc)}>
                      {doc.title}
                    </button>
                  ))}
                </div>
              ) : (
                <pre className="drawer-doc">{evidenceOpen.body}</pre>
              )}
            </div>
          </>
        )}

        {councilOpen && (
          <>
            <div className="drawer-scrim" onClick={() => setCouncilOpen(false)} />
            <div className="drawer">
              <div className="drawer-head">
                <div>
                  <span className="eyebrow">At this table</span>
                  <h3>The AI Council</h3>
                </div>
                <div className="drawer-actions">
                  <button className="panel-btn" onClick={() => setCouncilOpen(false)}>Close</button>
                </div>
              </div>
              <div className="council-grid">
                {council.map((e) => (
                  <div key={e.id} className="council-row">
                    <div className="council-name">{e.name}</div>
                    <div className="council-seat">ELDER · {e.seat}</div>
                    <div className="council-fires">Fires on: {e.firesOn}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
