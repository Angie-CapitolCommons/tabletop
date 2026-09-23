import React, { useEffect, useRef, useState } from "react";

// Phase 1: Scenario 4 end to end, single room.
// Per node: pose (with caused inject) -> answer -> Elder challenges (streamed,
// up to two, with memory) -> revise or hold -> facilitator scores -> lock ->
// consequence -> next node. After the last node: the twelve-month epilogue.

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

function Meter({ meter, prev }) {
  return (
    <div className="meter">
      {Object.keys(METER_LABELS).map((k) => {
        const delta = prev ? meter[k] - prev[k] : 0;
        const moved = delta !== 0;
        const worse = COST_UP[k] ? delta > 0 : delta < 0;
        return (
          <div key={k} className={`meter-item ${moved ? (worse ? "worse" : "better") : ""}`}>
            <span className="meter-label">{METER_LABELS[k]}</span>
            <span className="meter-value">
              {meter[k]}
              {moved && <em className="meter-delta">{delta > 0 ? ` +${delta}` : ` ${delta}`}</em>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Progress({ progress }) {
  return (
    <div className="progress">
      {progress.map((p) => (
        <div key={p.id} className={`prog-node ${p.status} ${p.score ?? ""}`} title={p.title}>
          <span className="prog-type">{p.type}</span>
        </div>
      ))}
    </div>
  );
}

function AnswerForm({ node, decidedByPrompt, initial, submitLabel, onSubmit }) {
  const [choice, setChoice] = useState(initial?.choice ?? null);
  const [freeText, setFreeText] = useState(initial?.freeText ?? "");
  const [decidedBy, setDecidedBy] = useState(initial?.decidedBy ?? "");
  const [error, setError] = useState(null);
  const ready = choice && freeText.trim() && decidedBy.trim();

  return (
    <div className="answer-form">
      <div className="options">
        {node.options.map((o) => (
          <button
            key={o.id}
            className={`option ${choice === o.id ? "selected" : ""} ${o.id === "decline" ? "decline" : ""}`}
            onClick={() => setChoice(o.id)}
          >
            <span className="option-label">{o.label}</span>
            <span className="option-hint">{o.hint}</span>
          </button>
        ))}
      </div>
      <label className="field">
        <span>{node.freeTextPrompt}</span>
        <textarea
          rows={2}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          placeholder="A name or role, and a trigger…"
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
        {submitLabel}
      </button>
    </div>
  );
}

function Evidence({ scenario }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="evidence">
      <span className="evidence-title">Evidence folder</span>
      {scenario.evidence.map((doc) => (
        <button key={doc.id} className="evidence-tab" onClick={() => setOpen(doc)}>
          {doc.title}
        </button>
      ))}
      {open && (
        <div className="evidence-modal" onClick={() => setOpen(null)}>
          <div className="evidence-doc" onClick={(e) => e.stopPropagation()}>
            <h3>{open.title}</h3>
            <pre>{open.body}</pre>
            <button className="quiet" onClick={() => setOpen(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Epilogue({ epilogue, onReset }) {
  return (
    <section className="epilogue">
      <span className="tag">Twelve months later</span>
      <h1>What held, and what broke</h1>
      <div className="epilogue-parts">
        {epilogue.parts.map((p) => (
          <div key={p.nodeId} className={`epi-part ${p.held ? "held" : "broke"}`}>
            <div className="epi-head">
              <span className="node-type">{p.type}</span>
              <span className={`epi-verdict ${p.held ? "held" : "broke"}`}>
                {p.held ? "held" : "broke"}
              </span>
            </div>
            <p>{p.line}</p>
          </div>
        ))}
      </div>
      <p className="epi-meta">
        Session ran {epilogue.minutes} minutes ·{" "}
        <a href="/api/export" target="_blank" rel="noreferrer">export JSON</a>
      </p>
      <button className="quiet" onClick={onReset}>Reset the scenario</button>
    </section>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [turns, setTurns] = useState([]); // [{elder, text, status: streaming|done|unavailable}]
  const [prevMeter, setPrevMeter] = useState(null);
  const npcForNode = useRef(null);

  useEffect(() => {
    api("state").then(setData);
  }, []);

  const state = data?.state;
  const { scenario, node, progress, decidedByPrompt } = data ?? {};

  // Kick off the Elders automatically when the first answer lands on a node.
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
          ? ts.map((t) => (t.status === "streaming" ? { ...t, status: "unavailable", text: "The Elder is unavailable — continue." } : t))
          : [{ elder: { id: "npc", name: "The Elders", seat: "" }, text: "The Elders are unavailable — continue.", status: "unavailable" }],
      );
      setData(await api("state"));
    });
  }, [state?.phase, node?.id]);

  if (!data) return <div className="shell loading">Loading…</div>;

  const refresh = (d) => setData(d);
  const record = state.record;

  const skipButton =
    !state.epilogue && ["posed", "challenge", "revise", "score"].includes(state.phase) ? (
      <button
        className="quiet skip"
        onClick={async () => refresh(await api("skip", {}))}
        title="Facilitator: skip this node under time pressure (recorded as skipped, distinct from declined)"
      >
        Skip this node
      </button>
    ) : null;

  return (
    <div className="shell">
      <header>
        <div>
          <span className="brand">Tabletop</span>
          <span className="scenario-title">{scenario.title}</span>
          <span className="enters">enters at {scenario.entersAt}</span>
        </div>
        <Meter meter={state.meter} prev={prevMeter} />
      </header>
      <Progress progress={progress} />

      <main>
        {state.phase === "epilogue" && (
          <Epilogue
            epilogue={state.epilogue}
            onReset={async () => {
              npcForNode.current = null;
              setTurns([]);
              setPrevMeter(null);
              refresh(await api("reset", {}));
            }}
          />
        )}

        {state.phase === "posed" && node && (
          <>
            {node.index === 0 && (
              <section className="brief">
                {scenario.brief.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </section>
            )}
            {node.inject && (
              <div className="inject">
                <span className="tag">Meanwhile</span>
                <p>{node.inject}</p>
              </div>
            )}
            <section className="node">
              <div className="node-head">
                <span className="node-type">{node.type}</span>
                <span className="node-count">
                  node {node.index + 1} of {node.count}
                </span>
              </div>
              <h1>{node.title}</h1>
              <p className="question">{node.question}</p>
              <Evidence scenario={scenario} />
              <AnswerForm
                node={node}
                decidedByPrompt={decidedByPrompt}
                submitLabel="Commit the room's answer"
                onSubmit={async (a) => refresh(await api("answer", a))}
              />
              {skipButton}
            </section>
          </>
        )}

        {(state.phase === "challenge" || state.phase === "revise") && node && (
          <section className="challenge">
            <div className="committed">
              <span className="tag">The room committed</span>
              <p className="committed-choice">
                {node.options.find((o) => o.id === record.firstAnswer.choice).label}
              </p>
              <p className="committed-free">“{record.firstAnswer.freeText}”</p>
              <p className="committed-by">Final call: {record.firstAnswer.decidedBy}</p>
            </div>
            {turns.map((t, i) => (
              <div key={i} className={`npc ${t.elder.id} ${t.status}`}>
                <span className="npc-name">{t.elder.name}</span>
                <span className="npc-seat">{t.elder.seat}</span>
                <p className="npc-text">
                  {t.text}
                  {t.status === "streaming" && <span className="cursor">▋</span>}
                </p>
              </div>
            ))}
            {state.phase === "revise" && (
              <div className="revise">
                <h2>Revise, or hold your answer?</h2>
                <AnswerForm
                  node={node}
                  decidedByPrompt={decidedByPrompt}
                  initial={record.firstAnswer}
                  submitLabel="Commit the revised answer"
                  onSubmit={async (a) => refresh(await api("answer", a))}
                />
                <button className="quiet" onClick={async () => refresh(await api("hold", {}))}>
                  Hold — the answer stands
                </button>
              </div>
            )}
            {skipButton}
          </section>
        )}

        {state.phase === "score" && (
          <section className="scoring">
            <h2>Facilitator: score this node</h2>
            <p className="rubric">
              <strong>Specific</strong> names a role or person plus a trigger or threshold ·{" "}
              <strong>Generic</strong> names a function · <strong>Absent</strong> declined or
              named no one
            </p>
            <div className="score-buttons">
              {["specific", "generic", "absent"].map((s) => (
                <button
                  key={s}
                  className={`score ${s}`}
                  onClick={async () => {
                    setPrevMeter(state.meter);
                    refresh(await api("lock", { score: s }));
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            {skipButton}
          </section>
        )}

        {state.phase === "consequence" && (
          <section className="consequence">
            <span className="tag">What this sets in motion</span>
            <p className="consequence-text">{record.consequence}</p>
            <p className="locked-meta">
              Locked · scored <strong>{record.score}</strong>
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
              Continue
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
