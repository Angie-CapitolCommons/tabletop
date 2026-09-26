import React, { Fragment, useEffect, useRef, useState } from "react";

// Tabletop room screen — Virtual Insights brand v2 (design handoff).
// Fixed 1280×800 stage scaled to fit. Server phases unchanged:
// posed → challenge → revise → score → consequence → … → epilogue.
// Client adds: briefing (role roster), a revising sub-state,
// evidence + AI Council available everywhere, score-at-lock in the
// facilitator bar, decision-path strip, segmented meters.

import { SCORING, GENERIC_ABSENT } from "./measures.js";

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
const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : "0");
// When the answer check moved a meter, the row shows both parts of the change,
// so a net of zero (say, choice +1 and answer check −1) isn't a mystery.
const splitNote = (total, adj) => (adj ? `choice ${signed(total - adj)} · answer check ${signed(adj)}` : null);

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
        <p className="rp-missing">Before the answer can be submitted: {missing.join(" · ")}</p>
      )}
    </div>
  );
}

// ---------- decision path strip ----------
// Hovering (or focusing) a finished step shows what the room answered;
// clicking one that's behind the room opens the full read-only review.
function PathStrip({ progress, records, currentIndex, epilogue, onReview }) {
  const lastLockedIdx = progress.reduce(
    (acc, p, i) => (records[p.id]?.answer && records[p.id]?.score ? i : acc),
    -1,
  );
  const lookBack = (p) =>
    onReview && (p.status === "done" || p.status === "skipped")
      ? { role: "button", onClick: () => onReview(p.id), onKeyDown: (e) => e.key === "Enter" && onReview(p.id) }
      : {};
  // Popups open below the strip on the 12-month report and above it on the
  // consequence screen; the last two open leftward so they stay on the stage.
  const popClass = (i) => `pc-pop ${epilogue ? "below" : "above"} ${i >= progress.length - 2 ? "rightward" : ""}`;
  return (
    <div className="path-strip">
      <div className="path-label">DECISION PATH</div>
      <div className="path">
        {progress.map((p, i) => {
          const r = records[p.id];
          if (r?.skipped)
            return (
              <div key={p.id} className="path-cell skipped-cell has-pop" tabIndex={0} {...lookBack(p)}>
                <span className="pc-eyebrow">{nn(i)} {RAIL_LABELS[p.type]} · skipped</span>
                <span className="pc-choice">Never asked</span>
                <div className={popClass(i)} role="tooltip">
                  <span className="pop-eyebrow">{nn(i)} {RAIL_LABELS[p.type]}</span>
                  <p className="pop-free">The room skipped this decision.</p>
                </div>
              </div>
            );
          if (r?.answer && r?.score)
            return (
              <div
                key={p.id}
                className={`path-cell locked has-pop ${i === lastLockedIdx ? "latest" : ""}`}
                tabIndex={0}
                {...lookBack(p)}
              >
                <span className="pc-eyebrow">{nn(i)} {RAIL_LABELS[p.type]} · {r.score}</span>
                <span className="pc-choice">{r.answer.short}</span>
                <span className="pc-detail">{r.answer.freeText}</span>
                <div className={popClass(i)} role="tooltip">
                  <span className="pop-eyebrow">
                    {nn(i)} {RAIL_LABELS[p.type]} · <span className="pop-score">{r.score}</span>
                    {r.revised ? " · revised after the challenge" : ""}
                  </span>
                  <p className="pop-choice">{r.answer.label ?? r.answer.short}</p>
                  {r.answer.freeText && <p className="pop-free">“{r.answer.freeText}”</p>}
                  <p className="pop-by">Final call: {r.answer.decidedBy || "not recorded"}</p>
                </div>
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
  // Read-only look back at a finished decision, opened from the step rail.
  const [review, setReview] = useState(null);
  const [councilOpen, setCouncilOpen] = useState(false);
  const [council, setCouncil] = useState([]);
  const [skipArmed, setSkipArmed] = useState(false);
  const [commit, setCommit] = useState(null); // surfaced from RecordPanel
  const [roster, setRoster] = useState({});
  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState(null);
  const [rosterEdit, setRosterEdit] = useState({});
  const [dmOpen, setDmOpen] = useState(false);
  // After the 12-month report: talk through how it could have gone differently.
  const [debriefOpen, setDebriefOpen] = useState(false);
  // Each decision opens behind a "Start discussion" pop-up; this is the
  // decision whose discussion the facilitator has started.
  const [discussionFor, setDiscussionFor] = useState(null);
  const [debriefFocus, setDebriefFocus] = useState(null);
  const focusRef = useRef(null);
  const [actionError, setActionError] = useState(null);
  const [elderError, setElderError] = useState(null);
  const [elderRetry, setElderRetry] = useState(0);
  // A Council round is streaming (the first one, or "Ask the AI Council again").
  const [councilBusy, setCouncilBusy] = useState(false);
  const councilScroll = useRef(null);
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
    if (transcribingRef.current) return; // already listening
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setTranscribeError("unsupported");
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
          if (text) api("discussion", { text, focus: focusRef.current }).catch(() => {});
        }
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setTranscribeError("blocked");
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
  const { scenario, scenarios, node, progress, decidedByPrompt, roles, roleAssignments, records } = data ?? {};

  // One AI Council round on the room's answer, streamed as it's written. The
  // first round runs automatically on entering challenge; `again` is the
  // facilitator asking the Council again about the same answer. Once saved,
  // the replies come from the room state (they survive a reload).
  const runCouncil = async (again) => {
    setElderError(null);
    setCouncilBusy(true);
    setTurns([]);
    try {
      const res = await fetch("/api/npc", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-room-code": localStorage.getItem(ROOM_CODE_KEY) ?? "" },
        body: JSON.stringify({ again }),
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
      setTurns([]);
    } catch (error) {
      setElderError(error.message || "Elder challenge failed. Try again.");
      setTurns((ts) => ts.map((turn) => turn.status === "streaming"
        ? { ...turn, status: "unavailable", text: "This response was interrupted." } : turn));
    } finally {
      setCouncilBusy(false);
    }
  };

  // The first round streams automatically on entering challenge.
  useEffect(() => {
    if (!state || state.phase !== "challenge" || !node) return;
    // Each committed answer — the first and every revision — gets its own Elder round.
    const attempt = `${node.id}:${state.record?.revisedAnswer?.at ?? "first"}:${elderRetry}`;
    if (npcForNode.current === attempt) return;
    npcForNode.current = attempt;
    runCouncil(false);
  }, [state?.phase, node?.id, elderRetry, state?.record?.revisedAnswer?.at]);

  // Keep the newest Council round in view as it streams.
  useEffect(() => {
    const el = councilScroll.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, state?.council?.length]);

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

  const openReview = guard(async (nodeId) => setReview(await api(`review/${nodeId}`)));

  const advance = guard(async () => {
    npcForNode.current = null;
    setTurns([]);
    refresh(await api("advance", {}));
  });

  const reset = guard(async () => {
    stopTranscription();
    setDebriefOpen(false);
    setDebriefFocus(null);
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

  // Back from scoring: reopen the answer for editing; the edit is kept as the
  // revised answer, alongside the first.
  const reopenAnswer = guard(async () => {
    refresh(await api("reopen", {}));
    setRevising(true);
    startTranscription();
  });

  // Undo the score just stamped: the meters roll back and the decision
  // returns to scoring. Only while its consequence is on screen.
  const undoLock = guard(async () => refresh(await api("unlock", {})));

  const commitAnswer = guard(async (a) => {
    const wasTranscribing = transcribingRef.current;
    stopTranscription(); // the discussion ends when the answer is submitted
    let d;
    try {
      d = await api("answer", a);
    } catch (e) {
      if (wasTranscribing) startTranscription(); // not saved: the room is still talking
      throw e;
    }
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
      {((node && phase === "posed" && discussionFor === node.id) ||
        (phase === "revise" && revising) ||
        (phase === "epilogue" && debriefOpen)) &&
        transcribeError !== "unsupported" && (
          <button
            className={`fac-btn ${transcribing ? "transcribe-on" : ""}`}
            title={
              transcribing
                ? "Transcribing the discussion as text: no audio stored, no voices attributed, and the transcript never reaches the AI. It stops when the room submits its answer; click to stop it sooner."
                : transcribeError === "blocked"
                  ? "The browser blocked the microphone. Allow it from the address bar, then click to try again."
                  : "Live-transcribes the room's discussion as text, attached to this decision. No audio is stored, no voices are attributed, and the transcript never reaches the AI — it goes to the record and the export only."
            }
            onClick={() => (transcribing ? stopTranscription() : startTranscription())}
          >
            {transcribing ? (
              <>
                <i className="rec-dot" />
                Transcribing
              </>
            ) : (
              "Start discussion"
            )}
          </button>
        )}
      {actionError && <span className="action-error" title={actionError}>{actionError}</span>}
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
          {commit?.label ?? "Submit the room's answer"}
        </button>
      </>
    );
  else if (phase === "revise" && revising)
    facbar = (
      <>
        {commonFacBtns}
        <button
          className="fac-btn"
          onClick={() => {
            stopTranscription();
            setRevising(false);
          }}
        >
          Back to the challenge
        </button>
        <button className="fac-primary" disabled={!commit?.enabled} onClick={() => commit?.run()}>
          {commit?.label ?? "Submit"}
        </button>
      </>
    );
  else if (phase === "challenge" || phase === "revise" || phase === "score")
    facbar = (
      <>
        {commonFacBtns}
        {phase !== "score" && skipBtn}
        {phase === "score" && (
          <button className="fac-btn" onClick={reopenAnswer}>
            Edit the answer
          </button>
        )}
        <span className="fac-score-label">SCORE AT LOCK</span>
        {scoreBtns}
      </>
    );
  else if (phase === "consequence")
    facbar = (
      <>
        {commonFacBtns}
        <button className="fac-btn" onClick={undoLock}>
          Undo this score
        </button>
        <button className="fac-primary" onClick={advance}>
          {node
            ? node.index + 2 > progress.length
              ? "Continue to the 12-month report"
              : `Continue to decision ${node.index + 2}`
            : "Continue"}
        </button>
      </>
    );
  else if (phase === "epilogue" && debriefOpen)
    facbar = (
      <>
        {commonFacBtns}
        <button
          className="fac-primary"
          onClick={() => {
            stopTranscription();
            setDebriefOpen(false);
          }}
        >
          Back to the 12-month report
        </button>
      </>
    );
  else if (phase === "epilogue")
    facbar = (
      <>
        {commonFacBtns}
        <button className="fac-btn" onClick={() => setDebriefOpen(true)}>
          Talk it through
        </button>
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
          commitLabel="Submit the room's answer"
          setCommit={setCommit}
        />
      </div>
    );
  } else if ((phase === "challenge" || phase === "revise" || phase === "score") && node) {
    // Show (and score) the room's latest answer, not only its first.
    const shown = record.revisedAnswer ?? record.firstAnswer;
    // Saved rounds for this answer, then the round streaming now; the latest
    // round stays prominent and earlier ones shrink.
    const saved = state.council ?? [];
    const lastSaved = saved.length ? saved[saved.length - 1].round : 0;
    const councilTurns = [
      ...saved.map((t) => ({ ...t, status: "done", earlier: turns.length > 0 || t.round < lastSaved })),
      ...turns.map((t) => ({ ...t, round: lastSaved + 1 })),
    ];
    const rounds = new Set(councilTurns.map((t) => t.round)).size;
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
          initial={shown}
          onCommit={commitAnswer}
          commitLabel="Submit the revised answer"
          setCommit={setCommit}
        />
      </div>
    ) : (
      <div className="challenge">
        <div>
          <div className="committed-label">{record.revisedAnswer ? "THE ROOM REVISED" : "THE ROOM SUBMITTED"}</div>
          <div className="committed-card">
            <div className="cc-choice">
              <span className="letter">
                {optLetter(
                  node.options.find((o) => o.id === shown.choice),
                  node.options.findIndex((o) => o.id === shown.choice),
                )}
              </span>
              <span className="cc-label">
                {node.options.find((o) => o.id === shown.choice).label}
              </span>
            </div>
            <p className="cc-quote">“{shown.freeText}”</p>
            <div className="cc-rule">
              <div className="cc-final-label">FINAL CALL</div>
              <div className="cc-final">{shown.decidedBy}</div>
            </div>
          </div>
        </div>
        <div className="elder-col">
          <div className="elder-turns" ref={councilScroll}>
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
            {councilTurns.map((t, i) => (
              <Fragment key={i}>
                {rounds > 1 && (i === 0 || councilTurns[i - 1].round !== t.round) && (
                  <div className="council-round">{t.round === 1 ? "First response" : `Asked again · round ${t.round}`}</div>
                )}
                <div className={`elder ${t.earlier ? "earlier" : ""} ${t.status}`}>
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
              </Fragment>
            ))}
            {phase === "revise" && elderError && (
              <div className="elder-retry" role="alert">
                <p>{elderError}</p>
                <button className="panel-btn" onClick={() => runCouncil(true)}>
                  Try again
                </button>
              </div>
            )}
          </div>
          {phase === "revise" && (
            <div className="hold-revise">
              <button
                className="hr-cell"
                disabled={councilBusy}
                onClick={guard(async () => refresh(await api("hold", {})))}
              >
                <span className="hr-title">Hold</span>
                <span className="hr-sub">The answer locks as written.</span>
              </button>
              <button
                className="hr-cell"
                disabled={councilBusy}
                onClick={() => {
                  setRevising(true);
                  startTranscription(); // the discussion restarts for the revision
                }}
              >
                <span className="hr-title">Revise</span>
                <span className="hr-sub">Reopens the record, pre-filled. Both are kept.</span>
              </button>
              <button className="hr-cell hr-again" disabled={councilBusy} onClick={() => runCouncil(true)}>
                <span className="hr-title">{councilBusy ? "The AI Council is responding…" : "Ask the AI Council again"}</span>
                <span className="hr-sub">New responses to the same answer. Earlier ones stay above.</span>
              </button>
            </div>
          )}
          {phase === "score" && (
            <div className="hold-revise">
              <div className="hr-cell" style={{ gridColumn: "1 / -1" }}>
                <span className="hr-title">Ready to lock</span>
                {/* What counts as Specific for this measure, shown at scoring, not during discussion. */}
                <span className="hr-sub">
                  Specific: {SCORING[node.type]}. {GENERIC_ABSENT} Stamp the score in the bar below.
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
            {record.revisedAnswer ? " · REVISED AFTER CHALLENGE" : record.held ? " · HELD AFTER CHALLENGE" : ""}
          </p>
        </div>
        <div className="cq-right">
          <div className="moved-label">WHAT MOVED</div>
          {Object.keys(METER_FULL).map((k) => {
            const before = record.meterBefore?.[k] ?? prevMeter?.[k] ?? state.meter[k];
            const after = state.meter[k];
            const delta = after - before;
            const worse = COST_UP[k] ? delta > 0 : delta < 0;
            const split = splitNote(delta, record.adjustment?.[k] ?? 0);
            return (
              <div key={k} className="moved-row">
                <span className="moved-name">
                  {METER_FULL[k]}
                  <span className={`moved-dir ${split ? "split" : ""}`}>
                    {split ?? (COST_UP[k] ? "Lower is better" : "Higher is better")}
                  </span>
                </span>
                <span className="moved-vals">{before} → {after}</span>
                <span className={`moved-delta ${delta === 0 ? "same" : worse ? "worse" : "better"}`}>
                  {delta === 0 ? "—" : delta > 0 ? `+${delta}` : `−${-delta}`}
                </span>
              </div>
            );
          })}
          {/* Beyond the option's own cost: goodwill lost to work this answer puts on
              clinicians, and time added by the process the answer writes in. */}
          {record.checkSkipped && (
            <div className="moved-notes quiet">
              <p>The answer check didn't run, so the meters moved by the chosen option only.</p>
            </div>
          )}
          {record.adjustment && (
            <div className="moved-notes">
              {record.adjustment.goodwill < 0 && (
                <p>
                  <b>Goodwill −{-record.adjustment.goodwill}</b>{" "}
                  {record.adjustment.note || "for work this answer puts on clinicians."}
                </p>
              )}
              {record.adjustment.time > 0 && (
                <p>
                  <b>Time +{record.adjustment.time}</b>{" "}
                  {record.adjustment.timeNote || "for the meetings and approvals this answer adds."}
                </p>
              )}
            </div>
          )}
          {/* The Villager: a voice from the people who live with the decision. */}
          {record.villager && (
            <div className="villager">
              <span className="villager-eyebrow">Who lives with this decision</span>
              <div className="villager-bubble">
                <p className="villager-line">“{record.villager.line}”</p>
              </div>
              <div className="villager-speaker">{record.villager.speaker}</div>
            </div>
          )}
        </div>
        <PathStrip
          progress={progress}
          records={{
            ...records,
            [node.id]: {
              score: record.score,
              skipped: false,
              revised: !!record.revisedAnswer,
              answer: {
                ...answer,
                short: node.options.find((o) => o.id === answer.choice).short,
                label: node.options.find((o) => o.id === answer.choice).label,
              },
            },
          }}
          currentIndex={node.index}
          onReview={openReview}
        />
      </div>
    );
  } else if (phase === "epilogue" && debriefOpen) {
    // Decisions in the order the room played them; start on the first one
    // that had no clear owner.
    const parts = progress.map((p) => state.epilogue.parts.find((e) => e.nodeId === p.id)).filter(Boolean);
    const focusId = debriefFocus ?? (parts.find((p) => !p.named) ?? parts[0])?.nodeId;
    focusRef.current = focusId ?? null;
    const focus = parts.find((p) => p.nodeId === focusId);
    const rec = records[focusId];
    main = (
      <div className="debrief">
        <div className="db-head">
          <span className="eyebrow" style={{ fontSize: 14 }}>Talking it through</span>
          <h1 className="db-title">How could it have gone differently?</h1>
          <p className="db-prompt">
            Pick a decision. What would the room have needed to write, and who would have had to own it, to get the
            other outcome?
          </p>
        </div>
        <div className="db-body">
          <div className="db-list">
            {parts.map((p, i) => (
              <button
                key={p.nodeId}
                className={`db-item ${p.nodeId === focusId ? "active" : ""} ${p.named ? "owned" : "unowned"}`}
                onClick={() => setDebriefFocus(p.nodeId)}
              >
                <span className="db-item-label">
                  {nn(i)} {RAIL_LABELS[p.type]}
                </span>
                <span className="db-item-state">
                  {p.named ? "Had an owner" : records[p.nodeId]?.skipped ? "Skipped" : "No clear owner"}
                </span>
              </button>
            ))}
          </div>
          {focus && (
            <div className="db-detail">
              <div className="db-block">
                <span className="db-label">What the room wrote</span>
                <p>
                  {rec?.skipped || !rec?.answer
                    ? "Skipped. The room never answered it."
                    : `${rec.answer.short}: “${rec.answer.freeText}”`}
                </p>
              </div>
              <div className="db-block">
                <span className="db-label">What a Specific answer needed</span>
                <p>{SCORING[focus.type]}.</p>
              </div>
              <div className="db-block happened">
                <span className="db-label">Month {focus.month}: what happened</span>
                <p>{focus.text}</p>
              </div>
              <div className="db-block other">
                <span className="db-label">{focus.named ? "If nobody had owned it" : "If someone had owned it"}</span>
                <p>{focus.alt}</p>
              </div>
              {focus.elders?.length > 0 && (
                <div className="db-block wide">
                  <span className="db-label">What the Elders said</span>
                  {focus.elders.map((e) => (
                    <p key={e.name}>
                      <b>{e.name}:</b> {e.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  } else if (phase === "epilogue") {
    main = (
      <div className="epilogue">
        <span className="eyebrow" style={{ fontSize: 14 }}>After-action report · {state.epilogue.minutes} minutes</span>
        <h1 className="epi-head-title">Twelve months later</h1>
        <PathStrip progress={progress} records={records} currentIndex={-1} epilogue onReview={openReview} />
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
              {/* Unmarked on purpose: leaves this room for the room-code screen (for switching rooms
                  while testing). The room itself is saved on the server; its code reopens it. */}
              <span
                onClick={() => {
                  stopTranscription();
                  localStorage.removeItem(ROOM_CODE_KEY);
                  window.location.reload();
                }}
              >
                TABLETOP
              </span>
              {scenario ? ` · ENTERS AT ${scenario.entersAt.toUpperCase()}` : " · BREAKOUT SESSION"}
            </div>
            <div className="title">{scenario ? scenario.title : "Choose the case"}</div>
          </div>
          <div className="meters">
            {Object.keys(METER_LABELS).map((k) => (
              <Meter
                key={k}
                id={k}
                value={state.meter[k]}
                prev={(phase === "consequence" ? state.record?.meterBefore?.[k] : undefined) ?? prevMeter?.[k]}
              />
            ))}
          </div>
        </div>
        <div className="steprail">
          {progress.map((p, i) =>
            // Finished or skipped decisions open a read-only review; nothing restarts.
            p.status === "done" || p.status === "skipped" ? (
              <button
                key={p.id}
                className={`step ${p.status} ${records[p.id]?.skipped ? "skipped" : ""} reviewable`}
                title="Review what the room decided here"
                onClick={() => openReview(p.id)}
              >
                <span className="num">{nn(i)}</span>
                {RAIL_LABELS[p.type]}
              </button>
            ) : (
              <div key={p.id} className={`step ${p.status}`} title={`Specific: ${SCORING[p.type]}`}>
                <span className="num">{nn(i)}</span>
                {RAIL_LABELS[p.type]}
              </div>
            ),
          )}
          {progress.length === 0 && <div className="step">The docket fills when a case is chosen</div>}
        </div>
        <div className="main">{main}</div>
        <div className="facbar">{facbar}</div>

        {briefed && node && phase === "posed" && discussionFor !== node.id && (
          <div className="gate-scrim">
            <div className="gate-card" role="dialog" aria-label="Start discussion">
              <span className="eyebrow">
                Decision {nn(node.index)} of {nn(node.count - 1)} · {RAIL_LABELS[node.type]}
              </span>
              <h2 className="gate-title">{node.title}</h2>
              <p className="gate-note">
                Starting the discussion turns on live transcription for this decision: text only, no audio stored, no
                voices attributed. It stops when the room submits its answer.
              </p>
              <button
                className="gate-btn"
                onClick={() => {
                  setDiscussionFor(node.id);
                  startTranscription();
                }}
              >
                Start discussion
              </button>
            </div>
          </div>
        )}

        {review && (
          <>
            <div className="drawer-scrim" onClick={() => setReview(null)} />
            <div className="drawer review-drawer" role="dialog" aria-label="Review a decision">
              <div className="drawer-head">
                <div>
                  <span className="eyebrow">
                    Looking back · decision {nn(review.index)} of {nn(review.count - 1)} · {RAIL_LABELS[review.type]}
                  </span>
                  <h3>{review.title}</h3>
                </div>
                <div className="drawer-actions">
                  <button className="panel-btn" onClick={() => setReview(null)}>
                    Close
                  </button>
                </div>
              </div>
              <div className="rv-grid">
                <div>
                  <p className="rv-question">{review.question}</p>
                  {review.skipped ? (
                    <p className="rv-skipped">The room skipped this decision. Nothing was locked and nothing moved.</p>
                  ) : (
                    <>
                      <span className="rv-label">
                        The room's answer · <span className="rv-score">{review.score}</span>
                        {review.firstAnswer ? " · revised after the challenge" : review.held ? " · held after the challenge" : ""}
                      </span>
                      <div className="rv-answer">
                        <p className="rv-choice">{review.answer.choice}</p>
                        {review.answer.freeText && <p className="rv-free">“{review.answer.freeText}”</p>}
                        <p className="rv-by">Final call: {review.answer.decidedBy || "not recorded"}</p>
                      </div>
                      {review.firstAnswer && (
                        <div className="rv-first">
                          <span className="rv-label">Before the challenge</span>
                          <p>
                            {review.firstAnswer.choice}
                            {review.firstAnswer.freeText ? ` “${review.firstAnswer.freeText}”` : ""}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {review.elders.length > 0 && (
                    <>
                      <span className="rv-label">What the AI Council said</span>
                      {review.elders.map((e) => (
                        <p key={e.name} className="rv-elder">
                          <b>{e.name}</b> {e.text}
                        </p>
                      ))}
                    </>
                  )}
                </div>
                <div>
                  {review.consequence.length > 0 && (
                    <>
                      <span className="rv-label">What happened next</span>
                      {review.consequence.map((e, i) => (
                        <div key={i} className="rv-event">
                          <span className="cq-when">{e.when}</span>
                          <p>{e.text}</p>
                        </div>
                      ))}
                    </>
                  )}
                  {review.moved && (
                    <>
                      <span className="rv-label">What moved</span>
                      <div className="rv-moved">
                        {Object.keys(METER_FULL).map((k) => {
                          const d = review.moved[k] ?? 0;
                          const worse = COST_UP[k] ? d > 0 : d < 0;
                          const split = splitNote(d, review.adjustment?.[k] ?? 0);
                          return (
                            <span key={k} className={`rv-chip ${d === 0 ? "same" : worse ? "worse" : "better"}`}>
                              {METER_FULL[k]} {d === 0 ? "—" : d > 0 ? `+${d}` : `−${-d}`}
                              {split && <span className="rv-split"> ({split})</span>}
                            </span>
                          );
                        })}
                      </div>
                      {review.checkSkipped && (
                        <div className="moved-notes quiet">
                          <p>The answer check didn't run, so the meters moved by the chosen option only.</p>
                        </div>
                      )}
                      {review.adjustment && (
                        <div className="moved-notes">
                          {review.adjustment.goodwill < 0 && (
                            <p>
                              <b>Goodwill −{-review.adjustment.goodwill}</b>{" "}
                              {review.adjustment.note || "for work this answer puts on clinicians."}
                            </p>
                          )}
                          {review.adjustment.time > 0 && (
                            <p>
                              <b>Time +{review.adjustment.time}</b>{" "}
                              {review.adjustment.timeNote || "for the meetings and approvals this answer adds."}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {review.villager && (
                    <div className="villager">
                      <span className="villager-eyebrow">Who lives with this decision</span>
                      <div className="villager-bubble">
                        <p className="villager-line">“{review.villager.line}”</p>
                      </div>
                      <div className="villager-speaker">{review.villager.speaker}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

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
