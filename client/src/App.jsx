import React, { useEffect, useRef, useState } from "react";

// Tabletop room screen — Virtual Insights brand v2 (design handoff).
// Fixed 1280×800 stage scaled to fit. Server phases unchanged:
// posed → challenge → revise → score → consequence → … → epilogue.
// Client adds: briefing (role roster), a revising sub-state,
// evidence + AI Council available everywhere, score-at-lock in the
// facilitator bar, decision-path strip, segmented meters.

import { MEASURES } from "./measures.js";

const ROOM_CODE_KEY = "tt-room-code";

async function api(path, body) {
  const res = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      "x-room-code": localStorage.getItem(ROOM_CODE_KEY) ?? "",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw Object.assign(new Error((await res.json()).error ?? res.statusText), { status: res.status });
  }
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

  const missing = [
    !choice && "choose an answer",
    !freeText.trim() && "write the record",
    !decidedBy && "name who decided",
  ].filter(Boolean);

  return (
    <div className="record-panel">
      <span className="eyebrow">The room's answer</span>
      <div className="rp-choices">
        {node.options.map((o, i) => (
          <button
            key={o.id}
            className={`rp-choice ${choice === o.id ? "selected" : ""}`}
            onClick={() => setChoice(o.id)}
          >
            <span className="letter">{optLetter(o, i)}</span>
            <span>
              {o.label}
              <small className="rp-hint">{o.hint}</small>
            </span>
          </button>
        ))}
      </div>
      <div className="rp-field">
        <label>
          {choice === "writein"
            ? "Write the room's plan: what happens, who owns it, and what would make them act. It's recorded word for word."
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
      {missing.length > 0 && (
        <p className="rp-missing">Before the answer can be committed: {missing.join(" · ")}</p>
      )}
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

function RoomLogin({ onEnter }) {
  const scale = useStageScale();
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const tryEnter = async () => {
    localStorage.setItem(ROOM_CODE_KEY, code.trim());
    try {
      await api("state");
      onEnter();
    } catch (e) {
      localStorage.removeItem(ROOM_CODE_KEY);
      setError(e.status === 401
        ? "That code doesn't open a room. Check the card from the lead facilitator."
        : e.message || "Unable to open the room. Try again.");
    }
  };
  return (
    <div className="viewport">
      <div className="stage login-center" style={{ transform: `scale(${scale})` }}>
        <div className="login-card">
          <span className="eyebrow">Tabletop · breakout room</span>
          <h1>Enter the room code</h1>
          <input
            className="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && tryEnter()}
            placeholder="ROOM CODE"
            autoFocus
          />
          {error && <p className="login-error">{error}</p>}
          <button className="primary-dark" onClick={tryEnter}>Open the room</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const scale = useStageScale();
  const [data, setData] = useState(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [turns, setTurns] = useState([]);
  const [prevMeter, setPrevMeter] = useState(null);
  const [revising, setRevising] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(null);
  const [councilOpen, setCouncilOpen] = useState(false);
  const [council, setCouncil] = useState([]);
  const [skipArmed, setSkipArmed] = useState(false);
  const [commit, setCommit] = useState(null); // surfaced from RecordPanel
  const [roster, setRoster] = useState({});
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState(null);
  const [rosterEdit, setRosterEdit] = useState({});
  const [dmOpen, setDmOpen] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [elderError, setElderError] = useState(null);
  const [elderRetry, setElderRetry] = useState(0);
  const npcForNode = useRef(null);
  const recRef = useRef(null);
  const transcribingRef = useRef(false);

  // Live discussion transcription (facilitator-controlled). Browser speech
  // recognition: text only, no audio stored by the app, no speaker
  // attribution — the engine has no diarization at all.
  const stopTranscription = () => {
    transcribingRef.current = false;
    setTranscribing(false);
    try {
      recRef.current?.stop();
    } catch {}
    recRef.current = null;
  };

  const startTranscription = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setTranscribeError("Speech recognition needs Chrome on this laptop.");
      return;
    }
    setTranscribeError(null);
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          const text = e.results[i][0].transcript.trim();
          if (text) api("discussion", { text }).catch(() => {});
        }
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setTranscribeError("Microphone permission was denied.");
        stopTranscription();
      }
    };
    // The engine stops itself after silence; restart while the toggle is on.
    rec.onend = () => {
      if (transcribingRef.current && recRef.current === rec) {
        try {
          rec.start();
        } catch {}
      }
    };
    recRef.current = rec;
    transcribingRef.current = true;
    rec.start();
    setTranscribing(true);
  };

  useEffect(() => {
    api("state")
      .then(setData)
      .catch((e) => {
        if (e.status === 401) setNeedsLogin(true);
      });
    api("elders").then(setCouncil).catch(() => {});
  }, [needsLogin]);

  const state = data?.state;
  const { scenario, scenarios, node, progress, decidedByPrompt, villagerStandingLine, roles, roleAssignments, records } = data ?? {};

  // Elder turns stream automatically on entering challenge.
  useEffect(() => {
    if (!state || state.phase !== "challenge" || !node) return;
    const attempt = `${node.id}:${elderRetry}`;
    if (npcForNode.current === attempt) return;
    npcForNode.current = attempt;
    setElderError(null);
    setTurns([]);
    (async () => {
      const res = await fetch("/api/npc", {
        method: "POST",
        headers: { "x-room-code": localStorage.getItem(ROOM_CODE_KEY) ?? "" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Elder request failed (${res.status})`);
      }
      if (!res.body) throw new Error("Elder stream unavailable");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let completed = false;
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
          if (msg.type === "error") throw new Error(msg.message);
          if (msg.type === "done") completed = true;
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
      if (!completed) throw new Error("The Elder connection closed before completion.");
      setData(await api("state"));
    })().catch((error) => {
      setElderError(error.message || "Elder challenge failed. Try again.");
      setTurns((ts) => ts.map((turn) => turn.status === "streaming"
        ? { ...turn, status: "unavailable", text: "This response was interrupted." } : turn));
    });
  }, [state?.phase, node?.id, elderRetry]);

  useEffect(() => {
    setSkipArmed(false);
    setActionError(null);
  }, [state?.phase, node?.id]);

  // A discussion belongs to one decision: it ends when the node locks
  // (consequence), when the node changes, and with the scenario.
  useEffect(() => {
    if (["consequence", "epilogue"].includes(state?.phase) && transcribingRef.current) stopTranscription();
  }, [state?.phase]);
  useEffect(() => {
    if (transcribingRef.current) stopTranscription();
  }, [node?.id]);

  if (needsLogin) return <RoomLogin onEnter={() => setNeedsLogin(false)} />;

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

  // Every facilitator action runs guarded: a failure surfaces in the bar
  // instead of dying silently, and the state stays put so retry just works.
  const guard = (fn) => async (...args) => {
    try {
      setActionError(null);
      return await fn(...args);
    } catch (e) {
      setActionError(
        e.message === "Failed to fetch"
          ? "Couldn't reach the server — check the connection and press it again."
          : e.message,
      );
    }
  };

  const doSkip = guard(async () => {
    if (!skipArmed) return setSkipArmed(true);
    setSkipArmed(false);
    refresh(await api("skip", {}));
  });

  const advance = guard(async () => {
    npcForNode.current = null;
    setTurns([]);
    refresh(await api("advance", {}));
  });

  const reset = guard(async () => {
    stopTranscription();
    npcForNode.current = null;
    setTurns([]);
    setPrevMeter(null);
    setRevising(false);
    refresh(await api("reset", {}));
  });

  // The Decisionmakers drawer saves the roster. It opens with any unsaved
  // briefing edits folded in, and once saved those edits are cleared so the
  // briefing shows the saved names. Closes only on success, so a failed save
  // keeps what was typed.
  const saveRoster = guard(async () => {
    refresh(await api("roles", { assignments: rosterEdit }));
    setRoster({});
    setDmOpen(false);
  });

  const commitAnswer = guard(async (a) => {
    const d = await api("answer", a);
    setRevising(false);
    refresh(d);
  });

  const scoreBtns = ["specific", "generic", "absent"].map((s) => (
    <button
      key={s}
      className="fac-score"
      disabled={phase !== "score"}
      title="Specific names a role or person plus a trigger or threshold · Generic names a function · Absent declined or named no one"
      onClick={async () => {
        setPrevMeter(state.meter);
        await guard(async () => refresh(await api("lock", { score: s })))();
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
      <button
        className="fac-btn"
        onClick={() => {
          setRosterEdit({ ...roleAssignments, ...roster });
          setDmOpen(true);
        }}
      >
        The Decisionmakers
      </button>
      {briefed && node && ["posed", "challenge", "revise", "score"].includes(phase) && (
        <button
          className={`fac-btn ${transcribing ? "transcribe-on" : ""}`}
          title="Live-transcribes the room's discussion as text, attached to this decision. No audio is stored, no voices are attributed, and the transcript never reaches the AI — it goes to the record and the export only."
          onClick={() => (transcribing ? stopTranscription() : startTranscription())}
        >
          {transcribing ? "End discussion" : "Start discussion"}
        </button>
      )}
      {transcribing && (
        <span className="transcribe-chip">
          <i /> TRANSCRIBING · TEXT ONLY · NO AUDIO STORED · NO VOICES ATTRIBUTED
        </span>
      )}
      {transcribeError && <span className="transcribe-error">{transcribeError}</span>}
      {actionError && <span className="transcribe-error">{actionError}</span>}
    </>
  );
  const skipBtn = (
    <button className={`fac-btn ${skipArmed ? "armed" : ""}`} onClick={doSkip}>
      {skipArmed ? "Confirm skip?" : "Skip this decision"}
    </button>
  );

  // ---------- facilitator bar per phase ----------
  let facbar;
  if (phase === "select")
    facbar = (
      <>
        <span className="fac-label">FACILITATOR</span>
        <button className="fac-btn" onClick={() => setCouncilOpen(true)}>AI Council</button>
        <a className="fac-btn" href="/api/print" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
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
          onClick={guard(async () => refresh(await api("roles", { assignments: roster, start: true })))}
        >
          Start decision 1
        </button>
      </>
    );
  else if (phase === "posed")
    facbar = (
      <>
        {commonFacBtns}
        {skipBtn}
        <button className="fac-primary" disabled={!commit?.enabled} onClick={() => commit?.run()}>
          {commit?.label ?? "Commit the room's answer"}
        </button>
      </>
    );
  else if (phase === "revise" && revising)
    facbar = (
      <>
        {commonFacBtns}
        <button className="fac-btn" onClick={() => setRevising(false)}>
          Back to the challenge
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
        <span className="fac-score-label" title={`${MEASURES[node.type].id} ${MEASURES[node.type].name}: ${MEASURES[node.type].def}`}>
          SCORE AT LOCK
        </span>
        {scoreBtns}
      </>
    );
  else if (phase === "consequence")
    facbar = (
      <>
        {commonFacBtns}
        <button className="fac-primary" onClick={advance}>
          {node
            ? node.index + 2 > progress.length
              ? "Continue to the 12-month report"
              : `Continue to decision ${node.index + 2}`
            : "Continue"}
        </button>
      </>
    );
  else if (phase === "epilogue")
    facbar = (
      <>
        {commonFacBtns}
        <button
          className="fac-btn"
          onClick={async () => {
            const rec = await api("export");
            const blob = new Blob([JSON.stringify(rec, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tabletop-room-${rec.roomNumber}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export the record
        </button>
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
              className={`case-card ${s.claimedBy ? "claimed" : ""}`}
              disabled={!!s.claimedBy}
              onClick={guard(async () => refresh(await api("scenario", { id: s.id })))}
            >
              <span className="eyebrow" style={{ fontSize: 12 }}>
                {s.claimedBy ? `Claimed by Room ${s.claimedBy}` : `Enters at ${s.entersAt} · ${s.nodeCount} decisions`}
              </span>
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
          <div className="opening">
            {scenario.opening.map((o, i) =>
              o.from ? (
                <div key={i} className="op-msg">
                  <div className="op-meta">
                    {o.channel} · {o.when} · {o.from} → {o.to}
                  </div>
                  <p className="op-text">{o.text}</p>
                </div>
              ) : (
                <p key={i} className="op-narration">{o.text}</p>
              ),
            )}
          </div>
        </div>
        <div>
          <div className="roster-label">The table · first names only</div>
          <div className="roster">
            {roles.map((r) => (
              <div key={r} className="roster-row">
                <span className="role-name">{r}</span>
                <input
                  value={roster[r] ?? roleAssignments[r] ?? ""}
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
      <div className="discuss recording">
        <div className="d-left">
          {node.inject && (
            <div className="inject">
              <span className="eyebrow">Meanwhile</span>
              <p>{node.inject}</p>
            </div>
          )}
          <span className="eyebrow" style={{ fontSize: 15 }}>
            Decision {nn(node.index)} of {nn(node.count - 1)}
          </span>
          <h1 className="node-title">{node.title}</h1>
          <p className="node-question">{node.question}</p>
        </div>
        <RecordPanel
          key={node.id}
          node={node}
          decidedByPrompt={decidedByPrompt}
          roles={roles}
          roleAssignments={roleAssignments}
          initial={null}
          onCommit={commitAnswer}
          commitLabel="Commit the room's answer"
          setCommit={setCommit}
        />
      </div>
    );
  } else if ((phase === "challenge" || phase === "revise" || phase === "score") && node) {
    main = revising ? (
      <div className="discuss recording">
        <div className="d-left">
          <span className="eyebrow" style={{ fontSize: 15 }}>
            Decision {nn(node.index)} of {nn(node.count - 1)} · revising
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
          {node.elders.length === 0 && (
            <p className="no-elder">No Elder weighs in on this decision. The room's answer goes straight to scoring.</p>
          )}
          {phase === "challenge" && elderError && (
            <div className="elder-retry" role="alert">
              <p>{elderError}</p>
              <button className="panel-btn" onClick={() => setElderRetry((value) => value + 1)}>
                Retry Elders
              </button>
              <button className="panel-btn" onClick={guard(async () => refresh(await api("hold", {})))}>
                Hold the answer instead
              </button>
            </div>
          )}
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
              <button className="hr-cell" onClick={guard(async () => refresh(await api("hold", {})))}>
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
                {/* The framework's measure appears at scoring, not during the room's discussion. */}
                <span className="hr-sub">
                  Score it as {MEASURES[node.type].id} {MEASURES[node.type].name}: {MEASURES[node.type].def}.
                  Specific names a person or role plus a trigger or number. Stamp the score in the bar below.
                </span>
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
          <span className="eyebrow">What happens next</span>
          <div className="cq-events">
            {record.consequence.map((e, i) => (
              <div key={i} className="cq-event">
                <span className="cq-when">{e.when}</span>
                <p className="cq-text">{e.text}</p>
              </div>
            ))}
          </div>
          <p className="cq-meta">
            LOCKED · <span className="score">{record.score}</span>
            {record.held ? " · HELD AFTER CHALLENGE" : record.revisedAnswer ? " · REVISED AFTER CHALLENGE" : ""}
          </p>
        </div>
        <div className="cq-right">
          {record.villager && (
            <div className="villager">
              <span className="villager-name">{record.villager.name}</span>
              <p className="villager-line">“{record.villager.line}”</p>
              <span className="villager-standing">{villagerStandingLine}</span>
            </div>
          )}
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
        <div className="epi-rows" style={{ marginTop: 12 }}>
          {state.epilogue.parts.map((p) => (
            <div key={p.nodeId} className="epi-row">
              <span className="epi-month">Month {p.month}</span>
              <span className="pc-eyebrow">{RAIL_LABELS[p.type]}</span>
              <span className="epi-line">{p.text}</span>
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
            <div
              key={p.id}
              className={`step ${p.status} ${records[p.id]?.skipped ? "skipped" : ""}`}
              title={`${MEASURES[p.type].id} ${MEASURES[p.type].name} — ${MEASURES[p.type].def}`}
            >
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

        {dmOpen && (
          <>
            <div className="drawer-scrim" onClick={saveRoster} />
            <div className="drawer">
              <div className="drawer-head">
                <div>
                  <span className="eyebrow">At this table · first names only</span>
                  <h3>The Decisionmakers</h3>
                </div>
                <div className="drawer-actions">
                  <button className="panel-btn" onClick={saveRoster}>
                    Save and close
                  </button>
                </div>
              </div>
              <div className="dm-grid">
                {roles.map((r) => (
                  <div key={r} className="roster-row">
                    <span className="role-name">{r}</span>
                    <input
                      value={rosterEdit[r] ?? ""}
                      onChange={(e) => setRosterEdit({ ...rosterEdit, [r]: e.target.value })}
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
