import React, { useEffect, useRef, useState } from "react";

// Phase 0 vertical slice: one room, one node, the full beat.
// posed -> answer -> Steward challenge (streamed) -> revise or hold -> score -> lock -> consequence.

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
// Which direction is "cost" for each currency (goodwill going down is bad;
// the others going up is bad). Used only to color movement.
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
              {moved && (
                <em className="meter-delta">
                  {delta > 0 ? ` +${delta}` : ` ${delta}`}
                </em>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function AnswerForm({ node, initial, submitLabel, onSubmit }) {
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
        <span>{node.decidedByPrompt}</span>
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
            <button className="quiet" onClick={() => setOpen(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [npcText, setNpcText] = useState("");
  const [npcStatus, setNpcStatus] = useState("idle"); // idle | streaming | done | unavailable
  const [prevMeter, setPrevMeter] = useState(null);
  const npcStarted = useRef(false);

  useEffect(() => {
    api("state").then(setData);
  }, []);

  const state = data?.state;
  const { scenario, node } = data ?? {};

  // Kick off the Steward automatically when the first answer lands.
  useEffect(() => {
    if (!state || state.phase !== "challenge" || npcStarted.current) return;
    npcStarted.current = true;
    setNpcStatus("streaming");
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
          if (msg.type === "delta") setNpcText((t) => t + msg.text);
          if (msg.type === "done") setNpcStatus("done");
          if (msg.type === "unavailable") {
            setNpcText(msg.message);
            setNpcStatus("unavailable");
          }
        }
      }
      setData(await api("state"));
    })().catch(async () => {
      setNpcText("The Steward is unavailable — continue.");
      setNpcStatus("unavailable");
      setData(await api("state"));
    });
  }, [state?.phase]);

  if (!data) return <div className="shell loading">Loading…</div>;

  const refresh = (d) => {
    setData(d);
  };

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

      <main>
        {state.phase === "posed" && (
          <>
            <section className="brief">
              {scenario.brief.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <Evidence scenario={scenario} />
            </section>
            <section className="node">
              <span className="node-type">{node.type}</span>
              <h1>{node.title}</h1>
              <p className="question">{node.question}</p>
              <AnswerForm
                node={node}
                submitLabel="Commit the room's answer"
                onSubmit={async (a) => refresh(await api("answer", a))}
              />
            </section>
          </>
        )}

        {(state.phase === "challenge" || state.phase === "revise") && (
          <section className="challenge">
            <div className="committed">
              <span className="tag">The room committed</span>
              <p className="committed-choice">
                {node.options.find((o) => o.id === state.firstAnswer.choice).label}
              </p>
              <p className="committed-free">“{state.firstAnswer.freeText}”</p>
              <p className="committed-by">Final call: {state.firstAnswer.decidedBy}</p>
            </div>
            <div className={`npc ${npcStatus}`}>
              <span className="npc-name">The Steward</span>
              <span className="npc-seat">Security and risk</span>
              <p className="npc-text">
                {npcText}
                {npcStatus === "streaming" && <span className="cursor">▋</span>}
              </p>
            </div>
            {state.phase === "revise" && (
              <div className="revise">
                <h2>Revise, or hold your answer?</h2>
                <AnswerForm
                  node={node}
                  initial={state.firstAnswer}
                  submitLabel="Commit the revised answer"
                  onSubmit={async (a) => refresh(await api("answer", a))}
                />
                <button className="quiet" onClick={async () => refresh(await api("hold", {}))}>
                  Hold — the answer stands
                </button>
              </div>
            )}
          </section>
        )}

        {state.phase === "score" && (
          <section className="scoring">
            <h2>Facilitator: score this node</h2>
            <p className="rubric">
              <strong>Specific</strong> names a role or person plus a trigger or
              threshold · <strong>Generic</strong> names a function ·
              <strong> Absent</strong> declined or named no one
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
          </section>
        )}

        {state.phase === "locked" && (
          <section className="consequence">
            <span className="tag">Three months later</span>
            <p className="consequence-text">{state.consequence}</p>
            <p className="locked-meta">
              Locked · scored <strong>{state.score}</strong>
              {state.held ? " · held after challenge" : state.revisedAnswer ? " · revised after challenge" : ""}
            </p>
            <button
              className="quiet"
              onClick={async () => {
                npcStarted.current = false;
                setNpcText("");
                setNpcStatus("idle");
                setPrevMeter(null);
                refresh(await api("reset", {}));
              }}
            >
              Reset the slice
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
