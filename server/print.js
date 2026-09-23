// Printable deliverables (PRD Phase 2): per-scenario worksheets mirroring the
// node questions and options (the fallback if the app is unreachable), and
// role cards with asymmetric information (physical, dealt at setup).
// Plain server-rendered HTML with print CSS — open, Ctrl+P, done.

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const PRINT_CSS = `
  * { box-sizing: border-box; }
  body { font: 12pt/1.45 Georgia, serif; color: #111; margin: 0; padding: 24px 32px; }
  .mono { font-family: "Courier New", monospace; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.12em; color: #444; }
  h1 { font-size: 20pt; margin: 4px 0 2px; }
  h2 { font-size: 13pt; margin: 0 0 4px; }
  .tagline { font-style: italic; color: #444; margin: 0 0 14px; }
  .brief { border: 1px solid #999; padding: 10px 14px; margin-bottom: 16px; font-size: 10.5pt; }
  .node { border-top: 2px solid #111; padding-top: 8px; margin-top: 14px; page-break-inside: avoid; }
  .question { margin: 4px 0 8px; }
  .opt { margin: 4px 0; padding-left: 26px; position: relative; font-size: 10.5pt; }
  .opt .box { position: absolute; left: 0; top: 2px; width: 14px; height: 14px; border: 1.5px solid #111; }
  .opt small { display: block; color: #555; font-size: 9pt; }
  .lines { margin: 8px 0 2px; }
  .lines .lbl { font-size: 9pt; color: #444; margin-bottom: 2px; }
  .line { border-bottom: 1px solid #888; height: 22px; }
  .scorerow { margin-top: 8px; font-size: 10pt; }
  .scorerow span { display: inline-block; margin-right: 18px; }
  .scorerow .box { display: inline-block; width: 12px; height: 12px; border: 1.5px solid #111; margin-right: 5px; vertical-align: -1px; }
  .card { border: 1.5px solid #111; padding: 14px 18px; margin: 0 0 18px; page-break-inside: avoid; }
  .card h2 { font-size: 15pt; }
  .card .seat { font-size: 9.5pt; color: #444; margin-bottom: 8px; }
  .card ul { margin: 6px 0; padding-left: 18px; font-size: 10.5pt; }
  .secret { border-top: 1.5px dashed #666; margin-top: 10px; padding-top: 8px; }
  .secret .mono { color: #a33; }
  .footer { margin-top: 20px; font-size: 8.5pt; color: #666; border-top: 1px solid #ccc; padding-top: 6px; }
  a { color: #235; }
  @media print { .noprint { display: none; } body { padding: 0; } }
`;

const page = (title, body) =>
  `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${PRINT_CSS}</style></head><body>${body}</body></html>`;

const FOOTER =
  `<div class="footer">Tabletop &middot; Virtual Insights &middot; fictional composite — no real cases, no patient data, first names only.</div>`;

export function printIndexPage(scenarios) {
  const rows = Object.values(scenarios)
    .map(
      (s) =>
        `<div class="node"><h2>${esc(s.title)}</h2><p class="tagline">${esc(s.tagline)} (enters at ${esc(s.entersAt)})</p>
         <p><a href="/print/worksheet/${s.id}">Worksheet</a> &middot; <a href="/print/rolecards/${s.id}">Role cards</a></p></div>`,
    )
    .join("");
  return page(
    "Tabletop printables",
    `<span class="mono">Tabletop &middot; printables</span><h1>Worksheets and role cards</h1>
     <p class="tagline">Worksheets are the fallback if the app is unreachable. Role cards are dealt at setup — one set per room. Print one of each per scenario.</p>${rows}${FOOTER}`,
  );
}

export function worksheetPage(s) {
  const nodes = s.nodes
    .map(
      (n, i) => `
    <div class="node">
      <span class="mono">${String(i + 1).padStart(2, "0")} / ${esc(n.type)}</span>
      <h2>${esc(n.title)}</h2>
      <p class="question">${esc(n.question)}</p>
      ${n.options
        .map(
          (o) =>
            `<div class="opt"><span class="box"></span>${esc(o.label)}<small>${esc(o.hint)}</small></div>`,
        )
        .join("")}
      <div class="lines"><div class="lbl">${esc(n.freeTextPrompt)}</div><div class="line"></div><div class="line"></div></div>
      <div class="lines"><div class="lbl">Who at the table made that final decision?</div><div class="line"></div></div>
      <div class="scorerow mono">Facilitator score:
        <span><span class="box"></span>Specific</span>
        <span><span class="box"></span>Generic</span>
        <span><span class="box"></span>Absent</span>
        <span><span class="box"></span>Skipped</span>
      </div>
    </div>`,
    )
    .join("");
  return page(
    `Worksheet — ${s.title}`,
    `<span class="mono">Tabletop worksheet &middot; enters at ${esc(s.entersAt)}</span>
     <h1>${esc(s.title)}</h1><p class="tagline">${esc(s.tagline)}</p>
     <div class="brief">${s.brief.split("\n\n").map((p) => `<p>${esc(p)}</p>`).join("")}</div>
     ${nodes}${FOOTER}`,
  );
}

export function roleCardsPage(s, roles) {
  const cards = roles
    .map((role) => {
      const c = s.roleCards[role];
      if (!c) return "";
      return `
    <div class="card">
      <span class="mono">Role card &middot; ${esc(s.title)}</span>
      <h2>${esc(role)}</h2>
      <ul>${c.mandate.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
      <div class="secret">
        <span class="mono">Only you know this — bring it when it matters</span>
        <ul>${c.asymmetric.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>
      </div>
    </div>`;
    })
    .join("");
  return page(
    `Role cards — ${s.title}`,
    `<span class="mono">Tabletop role cards &middot; cut along card borders</span>
     <h1>${esc(s.title)}</h1>
     <p class="tagline">Five roles, full coverage: every person plays a role, every role is played. Share or double up as needed.</p>
     ${cards}${FOOTER}`,
  );
}
