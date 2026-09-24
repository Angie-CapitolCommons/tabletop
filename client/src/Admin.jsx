import React, { useEffect, useRef, useState } from "react";

// Lead facilitator dashboard (PRD §9): all four rooms consolidating live,
// the Class C matrix (computed where computable, answers side by side where
// judgment is needed), scenario claims, exports, and the full game reset.
// Polls every 2.5s — well inside the "within seconds" acceptance criterion.

import { MEASURES } from "./measures.js";

const CODE_KEY = "tt-admin-code";
const TYPE_LABELS = {
  purpose: "Purpose", tier: "Tier", risk_accept: "Risk", decide: "Decider",
  proof: "Proof", funding: "Funding", retier: "Re-review", stop: "Off switch",
  represent: "The story",
};
const METER_LABELS = { goodwill: "Goodwill", risk: "Risk", dollars: "Dollars", time: "Time" };

async function adminApi(path, body) {
  const res = await fetch(`/api/admin/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-code": localStorage.getItem(CODE_KEY) ?? "",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw Object.assign(new Error((await res.json()).error ?? res.statusText), { status: res.status });
  return res.json();
}

function download(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ScoreChip({ cell }) {
  if (!cell.present) return <span className="mx-chip none">—</span>;
  if (cell.skipped) return <span className="mx-chip skipped">skipped</span>;
  if (!cell.answered) return <span className="mx-chip pending">·</span>;
  if (cell.declined) return <span className="mx-chip absent">declined</span>;
  return <span className={`mx-chip ${cell.score}`}>{cell.score}</span>;
}

export default function Admin() {
  const [authed, setAuthed] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetText, setResetText] = useState("");
  const pollRef = useRef(null);

  const load = async () => {
    try {
      setData(await adminApi("overview"));
      setAuthed(true);
      setError(null);
    } catch (e) {
      if (e.status === 401) {
        setAuthed(false);
        clearInterval(pollRef.current);
      }
    }
  };

  useEffect(() => {
    if (localStorage.getItem(CODE_KEY)) load();
    else setAuthed(false);
  }, []);

  useEffect(() => {
    if (authed) {
      pollRef.current = setInterval(load, 2500);
      return () => clearInterval(pollRef.current);
    }
  }, [authed]);

  if (authed === null) return <div className="admin-shell"><p className="admin-loading">Opening…</p></div>;

  if (!authed)
    return (
      <div className="admin-shell login-center">
        <div className="login-card">
          <span className="eyebrow">Tabletop · lead facilitator</span>
          <h1>Admin dashboard</h1>
          <input
            className="code-input"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                localStorage.setItem(CODE_KEY, codeInput.trim());
                load();
              }
            }}
            placeholder="ADMIN CODE"
            autoFocus
          />
          {error && <p className="login-error">{error}</p>}
          <button
            className="fac-primary"
            onClick={() => {
              localStorage.setItem(CODE_KEY, codeInput.trim());
              load().then(() => setError("Invalid code")).catch(() => {});
            }}
          >
            Open the dashboard
          </button>
        </div>
      </div>
    );

  if (!data) return <div className="admin-shell"><p className="admin-loading">Loading…</p></div>;

  return (
    <div className="admin-shell">
      <header className="admin-bar">
        <div>
          <span className="admin-eyebrow">TABLETOP · LEAD FACILITATOR</span>
          <span className="admin-title">Consolidation</span>
        </div>
        <div className="admin-actions">
          <a className="fac-btn" href="/api/print" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            Worksheets &amp; role cards
          </a>
          <button
            className="fac-btn"
            onClick={async () => download(await adminApi("export"), `tabletop-export-${Date.now()}.json`)}
          >
            Export all rooms
          </button>
          <button className="fac-btn danger" onClick={() => setResetOpen(true)}>
            Full game reset
          </button>
        </div>
      </header>

      <div className="admin-body">
        <div className="rooms-strip">
          {data.rooms.map((r) => (
            <div key={r.roomNumber} className="room-card">
              <div className="room-head">
                <span className="room-name">Room {r.roomNumber}</span>
                <span className="room-code">{r.code}</span>
              </div>
              {r.scenario ? (
                <>
                  <div className="room-scenario">{r.scenario.title}</div>
                  <div className="room-phase">
                    {r.epilogue
                      ? `Finished · ${r.epilogue.minutes} min`
                      : r.currentNode
                        ? `${String(r.nodeIndex + 1).padStart(2, "0")} ${TYPE_LABELS[r.currentNode.type]} · ${r.phase}`
                        : r.phase}
                  </div>
                  <div className="room-rail">
                    {r.progress.map((p) => (
                      <span key={p.id} className={`room-dot ${p.status} ${p.score ?? ""}`} title={`${TYPE_LABELS[p.type]}${p.score ? ` · ${p.score}` : ""}`} />
                    ))}
                  </div>
                  <div className="room-meter">
                    {Object.keys(METER_LABELS).map((k) => (
                      <span key={k}>{METER_LABELS[k]} <b>{r.meter[k]}</b></span>
                    ))}
                  </div>
                  {Object.values(r.roleAssignments ?? {}).some(Boolean) && (
                    <div className="room-roster">
                      {Object.entries(r.roleAssignments)
                        .filter(([, v]) => v)
                        .map(([role, name]) => (
                          <span key={role} title={role}>
                            {role.replace(/^The /, "")} · <b>{name}</b>
                          </span>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="room-phase">Choosing a case…</div>
              )}
            </div>
          ))}
        </div>

        <section className="matrix-section">
          <h2>Decision matrix <span className="hint">aligned on node type · hover a cell for the room's written record</span></h2>
          <table className="matrix">
            <thead>
              <tr>
                <th>Node</th>
                {data.rooms.map((r) => (
                  <th key={r.roomNumber}>Room {r.roomNumber}</th>
                ))}
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((row) => (
                <tr key={row.type}>
                  <td className="mx-type" title={MEASURES[row.type].def}>
                    <span className="mx-mid">{MEASURES[row.type].id}</span> {MEASURES[row.type].name}
                    <span className="mx-def">{MEASURES[row.type].def}</span>
                  </td>
                  {row.cells.map((cell, i) => (
                    <td key={i} title={cell.freeText ? `“${cell.freeText}” — final call: ${cell.decidedBy}` : undefined}>
                      <ScoreChip cell={cell} />
                      {cell.answered && (
                        <div className="mx-detail">
                          <div className="mx-short">{cell.short}</div>
                          <div className="mx-by">{cell.decidedBy}</div>
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="mx-flags">
                    {row.alignment && <span className="flag align">ALIGNED</span>}
                    {row.friction && <span className="flag friction">FRICTION</span>}
                    {row.orphan && <span className="flag orphan">ORPHAN</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="deciders-section">
          <h2>Decider emergence <span className="hint">who made the final calls, per room</span></h2>
          <div className="deciders-grid">
            {data.deciders.map((d) => (
              <div key={d.roomNumber} className="decider-card">
                <span className="room-name">Room {d.roomNumber}</span>
                {Object.entries(d.tally).length === 0 ? (
                  <p className="hint">No calls yet</p>
                ) : (
                  Object.entries(d.tally)
                    .sort((a, b) => b[1] - a[1])
                    .map(([who, n]) => (
                      <div key={who} className="decider-row">
                        <span>{who}</span>
                        <b>{n}</b>
                      </div>
                    ))
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {resetOpen && (
        <div className="admin-overlay" onClick={() => setResetOpen(false)}>
          <div className="reset-panel" onClick={(e) => e.stopPropagation()}>
            <span className="eyebrow">Irreversible</span>
            <h2>Full game reset</h2>
            <p>
              Wipes all four rooms — answers, Elder memory, scenario claims, meters — back to
              pristine. Scenario content is kept. Export first.
            </p>
            <button
              className="fac-btn"
              onClick={async () => download(await adminApi("export"), `tabletop-export-before-reset-${Date.now()}.json`)}
            >
              Export all rooms first
            </button>
            <input
              className="code-input"
              value={resetText}
              onChange={(e) => setResetText(e.target.value.toUpperCase())}
              placeholder='Type RESET to confirm'
            />
            <div className="reset-actions">
              <button className="fac-btn" onClick={() => setResetOpen(false)}>Cancel</button>
              <button
                className="fac-primary danger"
                disabled={resetText !== "RESET"}
                onClick={async () => {
                  await adminApi("reset", { confirm: "RESET" });
                  setResetOpen(false);
                  setResetText("");
                  load();
                }}
              >
                Reset the game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
