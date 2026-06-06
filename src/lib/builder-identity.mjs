// Single source of truth for builder identity rules.
// Imported by: src/content.config.ts (build schema), scripts/validate-builders.mjs
// (CI gate), src/components/CohortBody.astro (render guard).
//
// Policy: name + github are REQUIRED and must be real (not template defaults).
// All other fields are optional — blank/placeholder values are trimmed/skipped.

// Substrings that mark a value as an unfilled template placeholder.
export const PLACEHOLDERS = [
  "your-github-username",
  "your-linkedin-username",
  "your-x-handle",
  "your-username",
  "your-project",
  "your-site.com",
  "your-handle",
  "your name",
  "yourname",
  "example.com",
];

export const isPlaceholder = (s) =>
  typeof s === "string" &&
  PLACEHOLDERS.some((p) => s.toLowerCase().includes(p));

// Trim; empty / null / placeholder -> undefined ("not provided").
export const cleanField = (v) => {
  if (typeof v !== "string") return v == null ? undefined : String(v);
  const t = v.trim();
  if (!t || isPlaceholder(t)) return undefined;
  return t;
};

// Normalize a github value (URL / @handle / [md](link)) to a bare handle.
export const normalizeGithub = (v) => {
  if (typeof v !== "string") return "";
  let t = v.trim();
  const link = t.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
  if (link) t = link[2] || link[1];
  t = t.replace(/^@/, "").replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  return t.replace(/\/+$/, "").split("/")[0] || "";
};

// A usable GitHub username: 1–39 chars, alphanumeric or hyphen, no edge hyphen.
export const isValidGithubHandle = (h) =>
  /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(h);

// Identity check used by the CI gate and render guard.
// Returns null if OK, else an array of human-readable problems.
export const identityProblems = (data) => {
  const out = [];
  const name = typeof data?.name === "string" ? data.name.trim() : "";
  const rawGithub = typeof data?.github === "string" ? data.github.trim() : "";
  const github = normalizeGithub(rawGithub);

  if (!name) out.push("'name' is required");
  else if (isPlaceholder(name))
    out.push(
      `'name' is still the template placeholder ("${name}") — put your real name`,
    );

  if (!rawGithub) out.push("'github' is required");
  else if (isPlaceholder(rawGithub))
    out.push(
      `'github' is still the template placeholder ("${rawGithub}") — put your GitHub username`,
    );
  else if (!isValidGithubHandle(github))
    out.push(
      `'github' is not a valid GitHub username ("${rawGithub}") — use letters, numbers, hyphens only`,
    );

  return out.length ? out : null;
};

// True if the entry should NOT be displayed (used by render guard).
export const isPlaceholderIdentity = (data) => identityProblems(data) !== null;

export const VALID_ROLES = ["builder", "mentor", "instructor"];
export const normalizeRole = (v) => {
  const t = typeof v === "string" ? v.trim().toLowerCase() : "";
  return VALID_ROLES.includes(t) ? t : "builder";
};
