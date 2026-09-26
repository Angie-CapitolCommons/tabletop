// First names are recorded against role assignments and nowhere else; they
// never reach the model (PRD §4, §13). These helpers make text model-safe by
// replacing any roster first name with its role before a prompt is built.
// Matching is by whole word, as the name was typed; a name spelled
// differently in speech or free text won't be caught.

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function rosterNames(roleAssignments = {}) {
  const names = [];
  for (const [role, value] of Object.entries(roleAssignments)) {
    for (const name of String(value ?? "").split(/,|&|\/|\band\b/)) {
      const n = name.trim();
      if (n.length >= 2 && /^\p{L}/u.test(n)) names.push([n, role]);
    }
  }
  // Longest first, so "Mary Ann" is replaced before "Mary".
  return names.sort((a, b) => b[0].length - a[0].length);
}

export function scrubNames(text, roleAssignments) {
  let out = String(text ?? "");
  for (const [name, role] of rosterNames(roleAssignments)) {
    out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(name)}(?![\\p{L}\\p{N}])`, "gu"), `[${role}]`);
  }
  return out;
}

// "Who made the final call" is usually a roster chip, "The Executive Sponsor · Sam":
// keep the role, drop the name. Anything typed in is scrubbed as text.
export function scrubDecidedBy(value, roleAssignments) {
  const v = String(value ?? "");
  const chip = /^(The [^·]+?) · /.exec(v);
  if (chip && Object.prototype.hasOwnProperty.call(roleAssignments ?? {}, chip[1])) return chip[1];
  return scrubNames(v, roleAssignments);
}
