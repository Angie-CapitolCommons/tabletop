import React, { useEffect, useRef, useState } from "react";

// Tabletop — "The Case File." Scenario 4 end to end, single room.
// Cover -> per node: pose (memo inject) -> answer -> Elder challenges ->
// revise/hold -> stamp -> consequence -> next. Then the after-action report.

async function api(path, body) {
  const res = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
  return res.json();
}

const METER_LABELS = {
  goodwill: "Clinician goodwill",
  risk: "Risk exposure",
  dollars: "Dollars committed",
  time: "Time to first value",
};
const COST_UP = { goodwill: false, risk: true, dollars: true, time: true };
const LETTERS = ["A", "B", "C", "D"];
const monogram = (name) =>
  name.replace(/^The /, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function Sidebar({ meter, prevMeter, scenario, elders, onOpenDoc }) {
  return (
    <aside className="sidebar">
      <div className="sidecard">
        <h3>The cost meter</h3>
        {Object.keys(METER_LABELS).map((k) => {
          const delta = prevMeter ? meter[k] - prevMeter[k] : 0;
          const moved = delta !== 0;
          const worse = COST_UP[k] ? delta > 0 : delta < 0;
          return (
            <div key={k} className={`gauge ${moved ? (worse ? "worse" : "better") : ""}`}>
              <span>{METER_LABELS[k]}</span>
              <span>
                <span className="gauge-value">{meter[k]}</span>
                {moved && (
                  <span className="gauge-delta">{delta > 0 ? `+${delta}` : delta}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="sidecard">
        <h3>Evidence folder</h3>
        {scenario.evidence.map((doc) => (
          <button key={doc.id} className="file" onClick={() => onOpenDoc(doc)}>
            <span className="icon">🗂</span>
            <span>{doc.title}</span>
          </button>
        ))}
      </div>
      {elders?.length > 0 && (
        <div className="sidecard">
          <h3>At this table</h3>
          <div className="elder-roster">
            {elders.map((e) => (
              <div key={e.id} className={`roster-row ${e.id}`}>
                <span className="avatar">{monogram(e.name)}</span>
                <span>
                  {e.name}
                  <span className="seat">{e.seat}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function AnswerForm({ node, decidedByPrompt, initial, submitLabel, onSubmit }) {
  const [choice, setChoice] = useState(initial?.choice ?? null);
  const [freeText, setFreeText] = useState(initial?.freeText ?? "");
  const [decidedBy, setDecidedBy] = useState(initial?.decidedBy ?? "");
  const [error, setError] = useState(null);
  const ready = choice && freeText.trim() && decidedBy.trim();

  return (
    <div>
      <div className="choices">
        {node.options.map((o, i) => (
          <button
            key={o.id}
            className={`choice ${choice === o.id ? "chosen" : ""} ${o.id === "decline" ? "decline-opt" : ""} ${o.id === "writein" ? "writein-opt" : ""}`}
            onClick={() => setChoice(o.id)}
          >
            <span className="letter">
              {o.id === "decline" ? "–" : o.id === "writein" ? "✎" : LETTERS[i]}
            </span>
            <span>
              <strong>{o.label}</strong>
              <small>{o.hint}</small>
            </span>
          </button>
        ))}
      </div>
      <div className="record-block">
        <div className="record-title">For the record</div>
        <label className="field">
          <span>
            {choice === "writein"
              ? "Write the room's answer: the path, the named owner, and the trigger. This text is the decision — it will be honored verbatim."
              : node.freeTextPrompt}
          </span>
          <textarea
            rows={choice === "writein" ? 3 : 2}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder={choice === "writein" ? "The room's own path, in full…" : "A name or role, and a trigger…"}
          />
        </label>
        <label className="field">
          <span>{decidedByPrompt}</span>
          <input
            value={decidedBy}
            onChange={(e) => setDecidedBy(e.target.value)}
            placeholder="e.g. The Security Guard · Dana · the group"
          />
        </label>
        {error && <p className="error">{error}</p>}
      </div>
      <button
        className="primary"
        disabled={!ready}
        onClick={async () => {
          try {
            setError(null);
            await onSubmit({ choice, freeText, decidedBy });
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        {submitLabel} <span className="arrow">→</span>
      </button>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [opened, setOpened] = useState(false); // cover -> table
  const [turns, setTurns] = useState([]);
  const [prevMeter, setPrevMeter] = useState(null);
  const [openDoc, setOpenDoc] = useState(null);
  const npcForNode = useRef(null);

  useEffect(() => {
    api("state").then((d) => {
      setData(d);
      // Rejoining mid-scenario skips the cover.
      if (d.state.phase !== "posed" || d.node?.index > 0) setOpened(true);
    });
  }, []);

  const state = data?.state;
  const { scenario, node, progress, decidedByPrompt } = data ?? {};

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
            if (msg.type === "elder-start")
              next.push({ elder: msg.elder, text: "", status: "streaming" });
            else if (msg.type === "delta" && next.length)
              next[next.length - 1] = {
                ...next[next.length - 1],
                text: next[next.length - 1].text + msg.text,
              };
            else if (msg.type === "elder-done" && next.length)
              next[next.length - 1] = { ...next[next.length - 1], status: "done" };
            else if (msg.type === "elder-unavailable" && next.length)
              next[next.length - 1] = {
                ...next[next.length - 1],
                text: msg.message,
                status: "unavailable",
              };
            return next;
          });
        }
      }
      setData(await api("state"));
    })().catch(async () => {
      setTurns((ts) =>
        ts.length
          ? ts.map((t) =>
              t.status === "streaming"
                ? { ...t, status: "unavailable", text: "The Elder is unavailable — continue." }
                : t,
            )
          : [
              {
                elder: { id: "npc", name: "The Elders", seat: "" },
                text: "The Elders are unavailable — continue.",
                status: "unavailable",
              },
            ],
      );
      setData(await api("state"));
    });
  }, [state?.phase, node?.id]);

  if (!data) return <div className="shell loading">Opening the case file…</div>;

  const refresh = (d) => setData(d);
  const record = state.record;
  const doneCount = progress.filter((p) => p.status !== "current" && p.status !== "upcoming").length;

  // ---------- cover ----------
  if (!opened) {
    return (
      <div>
        <header>
          <div className="shell topbar">
            <div className="brand">
              <span className="brandmark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
              tabletop <small>· Virtual Insights</small>
            </div>
            <span className="session-note"><span className="dot" /> breakout session</span>
          </div>
        </header>
        <div className="shell">
          <div className="scene cover" style={{ marginTop: 40 }}>
            <span className="folder-tab">Case file · scenario 4</span>
            <span className="stamp">14 months since approval</span>
            <div className="eyebrow" style={{ justifyContent: "center" }}>Enters the lifecycle at {scenario.entersAt}</div>
            <h1>{scenario.title}</h1>
            <p className="intro">
              {scenario.brief.split("\n\n")[0]}{" "}
              <span className="accent-line">The folder on this table has the rest.</span>
            </p>
            <div className="pills">
              <span className="pill">90 minutes</span>
              <span className="pill">{progress.length} decisions</span>
              <span className="pill">5 Elders at the table</span>
              <span className="pill">1 answer per room — yours</span>
            </div>
            <button className="primary" onClick={() => setOpened(true)}>
              Open the case <span className="arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- table ----------
  return (
    <div>
      <header>
        <div className="shell topbar">
          <div className="brand">
            <span className="brandmark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            tabletop <small>· {scenario.title}</small>
          </div>
          <span className="session-note"><span className="dot" /> enters at {scenario.entersAt}</span>
        </div>
      </header>
      <div className="shell">
        <div className="docket">
          {progress.map((p) => (
            <span key={p.id} className={`cycle ${p.status} ${p.score ?? ""}`} title={p.title}>
              {p.type}
            </span>
          ))}
        </div>
        <div className="progressbar">
          <div style={{ width: `${(doneCount / progress.length) * 100}%` }} />
        </div>

        <div className="gamegrid">
          <main>
            {state.phase === "epilogue" && (
              <section className="scene">
                <div className="result-hero">
                  <span className="result-tag">After-action report</span>
                  <h1>Twelve months later</h1>
                  <p className="question" style={{ maxWidth: 560, margin: "0 auto" }}>
                    The scenario ran forward on the decisions this room made. This is what
                    held, and what broke.
                  </p>
                </div>
                <div className="epi-grid">
                  {state.epilogue.parts.map((p) => (
                    <div key={p.nodeId} className={`epi-card ${p.held ? "held" : "broke"}`}>
                      <span className="node-tag">{p.type}</span>
                      <span className="stamp">{p.held ? "held" : "broke"}</span>
                      <p>{p.line}</p>
                    </div>
                  ))}
                </div>
                <p className="epi-meta">
                  Session ran {state.epilogue.minutes} minutes ·{" "}
                  <a href="/api/export" target="_blank" rel="noreferrer">export the record</a>
                </p>
                <div className="scene-foot" style={{ justifyContent: "center" }}>
                  <button
                    className="quiet"
                    onClick={async () => {
                      npcForNode.current = null;
                      setTurns([]);
                      setPrevMeter(null);
                      setOpened(false);
                      refresh(await api("reset", {}));
                    }}
                  >
                    Close the file and reset
                  </button>
                </div>
              </section>
            )}

            {state.phase === "posed" && node && (
              <section className="scene" key={node.id}>
                {node.inject && (
                  <div className="memo">
                    <div className="memo-head">Interdepartmental memo · received this morning</div>
                    <p>{node.inject}</p>
                  </div>
                )}
                <div className="eyebrow">
                  {node.type}
                  <span className="count">decision {node.index + 1} of {node.count}</span>
                </div>
                <h2>{node.title}</h2>
                <p className="question">{node.question}</p>
                <AnswerForm
                  node={node}
                  decidedByPrompt={decidedByPrompt}
                  submitLabel="Commit the room's answer"
                  onSubmit={async (a) => refresh(await api("answer", a))}
                />
                <div className="scene-foot">
                  <span />
                  <button className="skip" onClick={async () => refresh(await api("skip", {}))}>
                    facilitator: skip this decision
                  </button>
                </div>
              </section>
            )}

            {(state.phase === "challenge" || state.phase === "revise") && node && (
              <section className="scene">
                <div className="eyebrow">
                  {node.type}
                  <span className="count">the table responds</span>
                </div>
                <div className="committed">
                  <div className="record-title">On the record</div>
                  <p className="committed-choice">
                    {node.options.find((o) => o.id === record.firstAnswer.choice).label}
                  </p>
                  <p className="committed-free">“{record.firstAnswer.freeText}”</p>
                  <p className="committed-by">
                    Final call: <strong>{record.firstAnswer.decidedBy}</strong>
                  </p>
                </div>
                {turns.map((t, i) => (
                  <div key={i} className={`elder-turn ${t.elder.id} ${t.status}`}>
                    <span className="avatar">{monogram(t.elder.name)}</span>
                    <div>
                      <span className="elder-name">{t.elder.name}</span>
                      <span className="elder-seat">{t.elder.seat}</span>
                      <p className="elder-text">
                        {t.text}
                        {t.status === "streaming" && <span className="cursor">▋</span>}
                      </p>
                    </div>
                  </div>
                ))}
                {state.phase === "revise" && (
                  <>
                    <h3 className="revise-head">Revise, or hold your answer?</h3>
                    <AnswerForm
                      node={node}
                      decidedByPrompt={decidedByPrompt}
                      initial={record.firstAnswer}
                      submitLabel="Commit the revised answer"
                      onSubmit={async (a) => refresh(await api("answer", a))}
                    />
                    <div className="scene-foot">
                      <button className="quiet" onClick={async () => refresh(await api("hold", {}))}>
                        Hold — the answer stands
                      </button>
                      <button className="skip" onClick={async () => refresh(await api("skip", {}))}>
                        facilitator: skip this decision
                      </button>
                    </div>
                  </>
                )}
              </section>
            )}

            {state.phase === "score" && (
              <section className="scene">
                <div className="eyebrow">facilitator</div>
                <h2>Stamp the record</h2>
                <p className="rubric">
                  <strong>Specific</strong> names a role or person plus a trigger or threshold.{" "}
                  <strong>Generic</strong> names a function. <strong>Absent</strong> declined or
                  named no one. Specific is the only stamp that counts as an answer.
                </p>
                <div className="stamp-row">
                  {["specific", "generic", "absent"].map((s) => (
                    <button
                      key={s}
                      className={`stamp-btn ${s}`}
                      onClick={async () => {
                        setPrevMeter(state.meter);
                        refresh(await api("lock", { score: s }));
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {state.phase === "consequence" && (
              <section className="scene">
                <div className="eyebrow">what this sets in motion</div>
                <div className="consequence-card">
                  <p className="consequence-text">{record.consequence}</p>
                </div>
                <p className="locked-meta">
                  <span className={`stamp ${record.score}`}>{record.score}</span>
                  locked
                  {record.held
                    ? " · held after challenge"
                    : record.revisedAnswer
                      ? " · revised after challenge"
                      : ""}
                </p>
                <button
                  className="primary"
                  onClick={async () => {
                    npcForNode.current = null;
                    setTurns([]);
                    refresh(await api("advance", {}));
                  }}
                >
                  Continue <span className="arrow">→</span>
                </button>
              </section>
            )}
          </main>

          <Sidebar
            meter={state.meter}
            prevMeter={prevMeter}
            scenario={scenario}
            elders={node?.elders ? Object.values(
              // roster shows all elders seen so far this session plus this node's
              [...turns.map((t) => t.elder), ...node.elders].reduce((m, e) => {
                if (e.id !== "npc") m[e.id] = e;
                return m;
              }, {}),
            ) : []}
            onOpenDoc={setOpenDoc}
          />
        </div>

        <footer>
          <span>A fictional composite. No real cases, no patient data, first names only.</span>
          <span>Tabletop · Virtual Insights</span>
        </footer>
      </div>

      {openDoc && (
        <div className="evidence-modal" onClick={() => setOpenDoc(null)}>
          <div className="evidence-doc" onClick={(e) => e.stopPropagation()}>
            <div className="memo-head">From the case file</div>
            <h3>{openDoc.title}</h3>
            <pre>{openDoc.body}</pre>
            <button className="quiet" onClick={() => setOpenDoc(null)}>Return to the table</button>
          </div>
        </div>
      )}
    </div>
  );
}
