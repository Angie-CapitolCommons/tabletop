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

function downloadText(text, filename, type = "text/plain") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// A section transcript or a room's debrief, as a plain-text file.
function transcriptText(t) {
  if (t.kind === "debrief")
    return `Room ${t.roomNumber} · Debrief — how could it have gone differently?\nScenario: ${t.scenario}\n\n${t.fragments
      .map((f) => `${f.section ? `[${f.section}] ` : ""}${f.text}`)
      .join("\n")}\n`;
  return `Room ${t.roomNumber} · ${t.section} — ${t.title}\nScenario: ${t.scenario}\n\nBefore the answer:\n${t.beforeAnswer || "(nothing transcribed)"}\n\nAfter the Elders' challenge:\n${t.afterChallenge || "(nothing transcribed)"}\n`;
}

// The themes result as a Markdown brief for the plenary.
function themesMarkdown(t) {
  const r = t.result;
  const lines = [
    "# Themes across rooms",
    "",
    `Generated ${new Date(t.finishedAt).toLocaleString()} from rooms ${t.rooms.join(", ")}${t.includeTranscripts ? ", including discussion transcripts" : ""}.`,
    "",
    r.overview,
    "",
    "## Themes",
  ];
  for (const th of r.themes) {
    lines.push("", `### ${th.title}`, "", th.summary, "", `Rooms ${th.rooms.join(", ")} · ${th.sections.join(", ")}`, "");
    for (const e of th.evidence) lines.push(`- ${e}`);
  }
  lines.push("", "## Suggested next steps", "");
  r.next_steps.forEach((s, i) => lines.push(`${i + 1}. **${s.step}** — ${s.owner}, ${s.timing}. ${s.why}`));
  return lines.join("\n") + "\n";
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
  const [transcriptView, setTranscriptView] = useState(null);
  const [includeTranscripts, setIncludeTranscripts] = useState(false);
  const [themesError, setThemesError] = useState(null);
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

  const openTranscript = async (roomNumber, nodeId) => {
    try {
      setTranscriptView({ kind: "section", ...(await adminApi(`transcript/${roomNumber}/${nodeId}`)) });
    } catch (e) {
      setError(e.message);
    }
  };
  const openDebrief = async (roomNumber) => {
    try {
      setTranscriptView({ kind: "debrief", ...(await adminApi(`debrief/${roomNumber}`)) });
    } catch (e) {
      setError(e.message);
    }
  };
  const themes = data.themes;
  const { started, finished } = themes.readiness;
  const allIn = finished.length > 0 && finished.length === started.length;
  const runThemes = async (force) => {
    setThemesError(null);
    try {
      await adminApi("themes", { includeTranscripts, force });
      load();
    } catch (e) {
      setThemesError(e.message);
    }
  };

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
                  {r.epilogue?.debriefFragments > 0 && (
                    <button className="admin-link" onClick={() => openDebrief(r.roomNumber)}>
                      Debrief transcript
                    </button>
                  )}
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

        <section className="themes-section">
          <h2>
            Themes across rooms{" "}
            <span className="hint">Claude reads every finished room and suggests themes and next steps toward resolution</span>
          </h2>
          <div className="themes-controls">
            <span className="themes-ready">
              {started.length === 0
                ? "No rooms have started yet"
                : `${finished.length} of ${started.length} rooms finished`}
            </span>
            <label className="themes-opt">
              <input
                type="checkbox"
                checked={includeTranscripts}
                onChange={(e) => setIncludeTranscripts(e.target.checked)}
              />
              Include discussion transcripts
            </label>
            <button
              className="admin-primary"
              disabled={!allIn || themes.status === "running"}
              onClick={() => runThemes(false)}
            >
              {themes.status === "done" ? "Generate again" : "Generate themes"}
            </button>
            {!allIn && finished.length > 0 && themes.status !== "running" && (
              <button
                className="admin-btn"
                onClick={() => {
                  if (window.confirm(`Only ${finished.length} of ${started.length} rooms have finished. Generate from those rooms now?`))
                    runThemes(true);
                }}
              >
                Use the finished rooms so far
              </button>
            )}
          </div>
          {themesError && <p className="themes-error">{themesError}</p>}
          {themes.status === "running" && (
            <p className="themes-status">
              Generating themes from rooms {themes.rooms.join(", ")}… this usually takes a minute or two.
            </p>
          )}
          {themes.status === "error" && <p className="themes-error">{themes.error}</p>}
          {themes.status === "done" && themes.result && (
            <div className="themes-result">
              <div className="themes-meta">
                <span>
                  From rooms {themes.rooms.join(", ")}
                  {themes.includeTranscripts ? ", including discussion transcripts" : ""} ·{" "}
                  {new Date(themes.finishedAt).toLocaleTimeString()}
                </span>
                <span className="themes-downloads">
                  <button className="admin-btn" onClick={() => downloadText(themesMarkdown(themes), `tabletop-themes-${Date.now()}.md`, "text/markdown")}>
                    Download (.md)
                  </button>
                  <button className="admin-btn" onClick={() => download(themes, `tabletop-themes-${Date.now()}.json`)}>
                    Download (.json)
                  </button>
                </span>
              </div>
              <p className="themes-overview">{themes.result.overview}</p>
              <div className="themes-grid">
                <div>
                  <h3>Themes</h3>
                  {themes.result.themes.map((th) => (
                    <div key={th.title} className="theme-card">
                      <div className="theme-title">{th.title}</div>
                      <div className="theme-tags">
                        Rooms {th.rooms.join(", ")} · {th.sections.join(", ")}
                      </div>
                      <p>{th.summary}</p>
                      <ul>
                        {th.evidence.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div>
                  <h3>Suggested next steps</h3>
                  <ol className="next-steps">
                    {themes.result.next_steps.map((s) => (
                      <li key={s.step}>
                        <b>{s.step}</b>
                        <span className="step-meta">
                          {s.owner} · {s.timing}
                        </span>
                        <span className="step-why">{s.why}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}
        </section>

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
                      {cell.transcript && (
                        <button className="admin-link" onClick={() => openTranscript(data.rooms[i].roomNumber, cell.nodeId)}>
                          Transcript · {cell.transcript.words} words
                        </button>
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

      {transcriptView && (
        <div className="admin-overlay" onClick={() => setTranscriptView(null)}>
          <div className="transcript-panel" onClick={(e) => e.stopPropagation()}>
            <span className="eyebrow">
              Room {transcriptView.roomNumber} · {transcriptView.scenario}
            </span>
            <h2>
              {transcriptView.kind === "debrief"
                ? "Debrief — how could it have gone differently?"
                : `${transcriptView.section} — ${transcriptView.title}`}
            </h2>
            <div className="transcript-body">
              {transcriptView.kind === "debrief" ? (
                transcriptView.fragments.map((f, i) => (
                  <p key={i}>
                    {f.section && <span className="transcript-tag">{f.section}</span>}
                    {f.text}
                  </p>
                ))
              ) : (
                <>
                  <h3>Before the answer</h3>
                  <p>{transcriptView.beforeAnswer || "Nothing transcribed."}</p>
                  <h3>After the Elders' challenge</h3>
                  <p>{transcriptView.afterChallenge || "Nothing transcribed."}</p>
                </>
              )}
            </div>
            <p className="hint" style={{ marginLeft: 0 }}>
              Text only · no audio stored · no voices attributed
            </p>
            <div className="reset-actions">
              <button
                className="admin-btn"
                onClick={() =>
                  downloadText(
                    transcriptText(transcriptView),
                    `tabletop-room-${transcriptView.roomNumber}-${transcriptView.kind === "debrief" ? "debrief" : transcriptView.section.toLowerCase().replace(/\s+/g, "-")}.txt`,
                  )
                }
              >
                Download (.txt)
              </button>
              <button className="admin-btn" onClick={() => setTranscriptView(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
