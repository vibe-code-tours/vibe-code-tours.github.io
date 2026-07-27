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
  mcp_intro: { label: "Intro to MCP", level: "beginner", order: 5 },
  agent_skills_intro: {
    label: "Intro to Agent Skills",
    level: "intermediate",
    order: 3,
  },
  subagents_intro: {
    label: "Intro to Subagents",
    level: "intermediate",
    order: 4,
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
  claude_platform_101: {
    label: "Claude Platform 101",
    level: "beginner",
    order: 8,
  },
  claude_cowork: {
    label: "Intro to Claude Cowork",
    level: "beginner",
    order: 9,
  },
  mcp_advanced: {
    label: "MCP: Advanced Topics",
    level: "advanced",
    order: 10,
  },
  claude_bedrock: {
    label: "Claude with Amazon Bedrock",
    level: "intermediate",
    order: 11,
  },
  claude_vertex: {
    label: "Claude with Vertex AI",
    level: "intermediate",
    order: 12,
  },
  ai_fluency: {
    label: "AI Fluency: Foundations",
    level: "beginner",
    order: 13,
  },
  ai_fluency_for_educators: {
    label: "AI Fluency for Educators",
    level: "beginner",
    order: 14,
  },
  // Non-Skilljar: GitHub Foundations (official GitHub credential, verified on Credly).
  github_foundations: {
    label: "GitHub Foundations",
    level: "intermediate",
    order: 15,
  },
  // Non-Skilljar: LinkedIn Learning (git fundamentals — Ch-1 of the Tour).
  git_essential_training: {
    label: "Git Essential Training",
    level: "beginner",
    order: 16,
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
  // Claude Platform 101 — layered stack
  claude_platform_101:
    '<path d="M12 3l9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4"/>',
  // Intro to Claude Cowork — two people
  claude_cowork:
    '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.2"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15.5 20c0-2 1.8-3.3 3.5-3.3"/>',
  // MCP Advanced — plug with a plus
  mcp_advanced:
    '<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5"/><path d="M17.5 18h3.5M19.25 16.25v3.5"/>',
  // Claude with Amazon Bedrock — cloud
  claude_bedrock:
    '<path d="M7 18h9a4 4 0 0 0 0-8 5 5 0 0 0-9.6-1.5A3.5 3.5 0 0 0 7 18z"/>',
  // Claude with Vertex AI — triangle (vertex)
  claude_vertex: '<path d="M12 3l9 16H3z"/>',
  // AI Fluency — open book
  ai_fluency:
    '<path d="M4 5a2 2 0 0 1 2-2h6v16H6a2 2 0 0 0-2 2zM20 5a2 2 0 0 0-2-2h-6v16h6a2 2 0 0 1 2 2z"/>',
  // AI Fluency for Educators — graduation cap
  ai_fluency_for_educators:
    '<path d="M2 8l10-4 10 4-10 4z"/><path d="M6 10.5V16c0 1.8 2.7 3 6 3s6-1.2 6-3v-5.5M21 8v6"/>',
  // GitHub Foundations — git branch / merge
  github_foundations:
    '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="17" cy="8" r="2.5"/><path d="M6 8.5v7M17 10.5c0 3.6-5 2.4-11 4.5"/>',
  // Git Essential Training — git commit node on a line
  git_essential_training:
    '<circle cx="12" cy="12" r="3.2"/><path d="M3 12h5.8M15.2 12H21"/>',
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

// Template leftovers (XXXXXXXX, YYYYYYYY, 00000000) satisfy CODE_RE but 404 on
// Skilljar — and an unearned cert that renders as "verified" is worse than one
// that doesn't render at all. Drop any code that is one repeated character.
const PLACEHOLDER_RE = /^([A-Za-z0-9])\1{5,}$/;

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
  return CODE_RE.test(t) && !PLACEHOLDER_RE.test(t) ? t : "";
}

export const skilljarUrl = (code) => SKILLJAR_VERIFY_BASE + code;

// Some certs (e.g. GitHub Foundations) verify off-Skilljar. Their stored value is
// the full https URL; build the link as-is. Skilljar codes still expand normally.
export const certUrl = (code) =>
  /^https?:\/\//.test(String(code))
    ? String(code)
    : SKILLJAR_VERIFY_BASE + code;

// Extract a full http(s) URL from a value or a [md](url) link, else "".
function extractUrl(v) {
  if (v == null) return "";
  let t = String(v).trim();
  const link = t.match(/^\[[^\]]*\]\(([^)]*)\)$/);
  if (link) t = link[1].trim();
  // Skilljar URLs belong to normalizeSkilljar — if it rejected the code, this
  // must not resurrect the URL as a "non-Skilljar cert".
  if (/skilljar\.com/i.test(t)) return "";
  return /^https?:\/\/\S+$/.test(t) ? t : "";
}

// --- Cert id canonicalization ---------------------------------------------
// Builders copy the id off the Skilljar course title, so every shape shows up:
//   "Introduction to agent skills"  "introduction-to-agent-skills"
//   "introduction_to_Model_Context_Protocol"  "AI_fluency_framework_&_foundations"
// Three layers map those onto a catalog id. Anything still unresolved is kept
// as-is (renders with a default label) and validate-builders warns about it.

// 1. Shape — lowercase, every non-alphanumeric run becomes a single "_".
export function slugifyCertId(v) {
  return String(v ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// 2. Wording — course-title phrasings that differ from the short id.
// Keys must already be slugified. Case/spacing/punctuation variants need no
// entry here; layer 1 folds them away first.
export const CERT_ALIASES = {
  // Intro to Agent Skills
  agent_skills: "agent_skills_intro",
  agentskills_intro: "agent_skills_intro",
  introduction_to_agent_skills: "agent_skills_intro",
  // Intro to Subagents
  subagents: "subagents_intro",
  introduction_to_subagents: "subagents_intro",
  // Intro to MCP
  mcp: "mcp_intro",
  model_context_protocol: "mcp_intro",
  introduction_to_mcp: "mcp_intro",
  introduction_to_model_context_protocol: "mcp_intro",
  introduction_to_model_context_protocol_mcp: "mcp_intro",
  intro_to_model_context_protocol: "mcp_intro",
  // MCP: Advanced Topics
  advanced_mcp: "mcp_advanced",
  mcp_advanced_topics: "mcp_advanced",
  // AI Fluency: Foundations
  ai_fluency_framework: "ai_fluency",
  ai_fluency_framework_foundations: "ai_fluency",
  ai_fluency_framework_and_foundations: "ai_fluency",
  // AI Fluency for Educators
  ai_fluency_educators: "ai_fluency_for_educators",
  // Building with the Claude API
  building_with_claude_api: "building_claude_api",
  claude_api: "building_claude_api",
  // Claude with Amazon Bedrock / Vertex AI
  claude_on_amazon_bedrock: "claude_bedrock",
  amazon_bedrock: "claude_bedrock",
  claude_with_google_vertex_ai: "claude_vertex",
  claude_on_vertex_ai: "claude_vertex",
  vertex_ai: "claude_vertex",
  // Intro to Claude Cowork
  cowork: "claude_cowork",
  claude_cowork_intro: "claude_cowork",
  introduction_to_claude_cowork: "claude_cowork",
  // Claude Platform 101
  claude_platform: "claude_platform_101",
  // GitHub Foundations
  github_foundation: "github_foundations",
  github_foundations_certification: "github_foundations",
  // Git Essential Training (LinkedIn Learning)
  git_essentials: "git_essential_training",
  git_essentials_training: "git_essential_training",
  git_essential: "git_essential_training",
};

// 3. Catalog label — auto-derived, so a renamed label keeps resolving.
//    "Intro to MCP" -> intro_to_mcp, "Claude Code in Action" -> claude_code_in_action.
const LABEL_SLUGS = Object.fromEntries(
  Object.entries(CERT_CATALOG).map(([id, meta]) => [
    slugifyCertId(meta.label),
    id,
  ]),
);

// Resolve any builder-written cert key to a catalog id. Returns the slugified
// input unchanged when nothing matches (unknown certs still render).
export function canonicalCertId(raw) {
  const slug = slugifyCertId(raw);
  if (!slug || CERT_CATALOG[slug]) return slug;
  return CERT_ALIASES[slug] || LABEL_SLUGS[slug] || slug;
}

export function certMeta(id) {
  return (
    CERT_CATALOG[id] || {
      label: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      level: "beginner",
      order: 99,
    }
  );
}

// Normalize a raw `certs` frontmatter value into { canonicalId: code }, keeping
// only entries whose value is a usable Skilljar code or a non-Skilljar verify URL.
export function normalizeCerts(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;

  const entries = [];
  for (const [rawId, val] of Object.entries(raw)) {
    // Skilljar code (or verify URL) first; else a non-Skilljar URL (e.g. Credly).
    const code = normalizeSkilljar(val) || extractUrl(val);
    const id = canonicalCertId(rawId);
    if (code && id) {
      entries.push({ id, code, exact: slugifyCertId(rawId) === id });
    }
  }

  // A builder can list the same cert twice (short id + course title). The
  // canonical spelling wins; otherwise first one listed wins.
  const out = {};
  for (const e of entries) if (e.exact && !(e.id in out)) out[e.id] = e.code;
  for (const e of entries) if (!(e.id in out)) out[e.id] = e.code;
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
      url: code ? certUrl(code) : null,
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
      url: code ? certUrl(code) : null,
      icon: certIcon(id),
    };
  });
}
