// Single source of truth for Anthropic Skilljar certifications.
// Imported by: src/content.config.ts (schema), src/components/BuilderCard.astro
// (render), scripts/verify-certs.mjs (CI reachability), scripts/validate-builders.mjs.
//
// Builders declare earned certs as a `certs:` map in frontmatter:
//   certs:
//     claude_101:      293x3v9qydhx
//     claude_code_101: https://verify.skilljar.com/c/sbdx5cwzjhec
// Value may be the bare Skilljar code OR the full verify URL — both normalize
// to the bare code. Unknown cert ids still render (with a default label/level).

export const SKILLJAR_VERIFY_BASE = "https://verify.skilljar.com/c/";

// Catalog of certs relevant to THIS bootcamp (the Claude Code / MCP / agents
// developer path) — not the full Anthropic Skilljar catalog. id = snake_case slug.
// level drives the badge color. order controls left-to-right display.
// Unknown ids a builder adds still render (default label/level) — see certMeta().
export const CERT_CATALOG = {
  claude_101: { label: "Claude 101", level: "beginner", order: 1 },
  claude_code_101: { label: "Claude Code 101", level: "beginner", order: 2 },
  mcp_intro: { label: "Intro to MCP", level: "beginner", order: 3 },
  agent_skills_intro: {
    label: "Intro to Agent Skills",
    level: "intermediate",
    order: 4,
  },
  subagents_intro: {
    label: "Intro to Subagents",
    level: "intermediate",
    order: 5,
  },
  claude_code_in_action: {
    label: "Claude Code in Action",
    level: "intermediate",
    order: 6,
  },
  building_claude_api: {
    label: "Building with the Claude API",
    level: "advanced",
    order: 7,
  },
};

// Always-shown core slots (rendered grey when not earned).
export const CORE_CERTS = ["claude_101", "claude_code_101"];

// Distinct line-icon per cert (inner SVG markup, 24x24 viewBox, stroke style).
// Rendered with stroke=currentColor so the level color tints each icon.
export const CERT_ICONS = {
  // Claude 101 — sparkle/asterisk (the Claude spark)
  claude_101:
    '<path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>',
  // Claude Code 101 — code chevrons </>
  claude_code_101: '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>',
  // Intro to MCP — plug / connector
  mcp_intro: '<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5"/>',
  // Agent Skills — lightning bolt
  agent_skills_intro: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  // Subagents — branch / fan-out
  subagents_intro:
    '<circle cx="6" cy="5" r="1.8"/><circle cx="6" cy="19" r="1.8"/><circle cx="18" cy="12" r="1.8"/><path d="M6 7v10M7.6 6.4l8.8 4.8M7.6 17.6l8.8-4.8"/>',
  // Claude Code in Action — play
  claude_code_in_action: '<path d="M7 4l12 8-12 8z"/>',
  // Building with the Claude API — braces
  building_claude_api:
    '<path d="M8 3c-2 0-2.5 1.5-2.5 4S5 13 3 13c2 0 2.5 1.5 2.5 4S6 21 8 21M16 3c2 0 2.5 1.5 2.5 4S19 13 21 13c-2 0-2.5 1.5-2.5 4S18 21 16 21"/>',
};
// Fallback — medal/seal for any unknown cert id.
export const DEFAULT_ICON =
  '<circle cx="12" cy="9" r="6"/><path d="M8.5 14l-2 7 5.5-3 5.5 3-2-7"/>';

export const certIcon = (id) => CERT_ICONS[id] || DEFAULT_ICON;

// Earned certs are brand amber; unearned are grey. (One color — no level ramp.)
export const CERT_AMBER = "#f59e0b";
export const CERT_GREY = "#3f3f46";

// Skilljar verification codes seen so far are ~12 lowercase alphanumerics.
// Be tolerant: 6–24 alphanumerics.
const CODE_RE = /^[A-Za-z0-9]{6,24}$/;

// Extract the bare verification code from a code, a verify URL, or a [md](url).
export function normalizeSkilljar(v) {
  if (v == null) return "";
  let t = String(v).trim();
  if (!t) return "";
  const link = t.match(/^\[[^\]]*\]\(([^)]*)\)$/); // [text](url)
  if (link) t = link[1].trim();
  const m = t.match(/skilljar\.com\/c\/([A-Za-z0-9]+)/i); // full verify URL
  if (m) t = m[1];
  t = t.replace(/\/+$/, "");
  return CODE_RE.test(t) ? t : "";
}

export const skilljarUrl = (code) => SKILLJAR_VERIFY_BASE + code;

export function certMeta(id) {
  return (
    CERT_CATALOG[id] || {
      label: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      level: "beginner",
      order: 99,
    }
  );
}

// Normalize a raw `certs` frontmatter value into { id: code } with valid codes only.
export function normalizeCerts(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out = {};
  for (const [id, val] of Object.entries(raw)) {
    const code = normalizeSkilljar(val);
    if (code) out[String(id).trim()] = code;
  }
  return Object.keys(out).length ? out : undefined;
}

// Progression ladder: every earned cert (amber) PLUS the next `lookahead`
// not-yet-earned catalog certs (grey, inactive) as upcoming targets.
// 0 earned -> first 2 catalog certs grey. N earned -> earned + next 2 grey.
// Combined and sorted by catalog order so it reads as one continuous path.
export function certProgressList(certs, lookahead = 2) {
  const earned = certs && typeof certs === "object" ? certs : {};
  const byOrder = (a, b) => certMeta(a).order - certMeta(b).order;
  const catalog = Object.keys(CERT_CATALOG).sort(byOrder);

  const earnedCatalog = catalog.filter((id) => earned[id]);
  const earnedExtras = Object.keys(earned).filter((id) => !CERT_CATALOG[id]);
  const nextGrey = catalog.filter((id) => !earned[id]).slice(0, lookahead);

  const showIds = [
    ...new Set([...earnedCatalog, ...earnedExtras, ...nextGrey]),
  ].sort(byOrder);
  return showIds.map((id) => {
    const meta = certMeta(id);
    const code = earned[id];
    return {
      id,
      label: meta.label,
      level: meta.level,
      earned: !!code,
      code: code || null,
      color: code ? CERT_AMBER : CERT_GREY,
      url: code ? skilljarUrl(code) : null,
      icon: certIcon(id),
    };
  });
}

// Ordered display list: core certs first (earned or grey), then any extra earned.
// Returns [{ id, label, level, color, code, url, earned }].
export function certDisplayList(certs) {
  const earned = certs && typeof certs === "object" ? certs : {};
  const ids = [...CORE_CERTS];
  for (const id of Object.keys(earned)) if (!ids.includes(id)) ids.push(id);
  // keep extras in catalog order
  const extras = ids
    .slice(CORE_CERTS.length)
    .sort((a, b) => certMeta(a).order - certMeta(b).order);
  const ordered = [...CORE_CERTS, ...extras];
  return ordered.map((id) => {
    const meta = certMeta(id);
    const code = earned[id];
    return {
      id,
      label: meta.label,
      level: meta.level,
      earned: !!code,
      code: code || null,
      color: code ? CERT_AMBER : CERT_GREY,
      url: code ? skilljarUrl(code) : null,
      icon: certIcon(id),
    };
  });
}
