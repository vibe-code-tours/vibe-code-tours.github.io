// CI gate for builder profiles. Fails the build for problems a student must fix:
// unparseable YAML, or invalid identity (name/github). Optional fields are left
// to the tolerant content schema. Identity rules live in src/lib/builder-identity.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { identityProblems } from "../src/lib/builder-identity.mjs";
import { CERT_CATALOG } from "../src/lib/certs.mjs";

// Schema-recognized top-level keys. Anything else is silently dropped by the
// tolerant content schema — we WARN (never fail) so contributors notice.
const SCHEMA_KEYS = new Set([
  "name",
  "github",
  "cohort",
  "role",
  "skills",
  "repo",
  "x",
  "linkedin",
  "website",
  "certs",
]);
// Curated near-miss aliases -> correct field (no fuzzy matching = no false positives).
const FIELD_ALIASES = {
  web: "website",
  site: "website",
  url: "website",
  homepage: "website",
  portfolio: "website",
  git: "github",
  gh: "github",
  twitter: "x",
  tw: "x",
  linkedln: "linkedin",
  "linked-in": "linkedin",
  skill: "skills",
  tags: "skills",
  repository: "repo",
  project: "repo",
  cert: "certs",
  certifications: "certs",
  certs_list: "certs",
};
const CERT_IDS = new Set(Object.keys(CERT_CATALOG));

const dir = "src/content/builders";
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"));

const problems = [];
const warnings = [];
const seenGithub = new Map();

for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), "utf8").replace(/\r\n/g, "\n");
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) {
    problems.push(`${f}: missing YAML frontmatter (--- block at top)`);
    continue;
  }
  let data;
  try {
    data = yaml.load(m[1]);
  } catch (e) {
    problems.push(
      `${f}: YAML syntax error — ${String(e.message).split("\n")[0]} ` +
        `(tip: keep values plain; don't use [text](link) in frontmatter)`,
    );
    continue;
  }
  if (!data || typeof data !== "object") {
    problems.push(`${f}: frontmatter is empty or not key: value pairs`);
    continue;
  }

  // Identity (name + github) — the only hard requirements.
  const idp = identityProblems(data);
  if (idp) for (const p of idp) problems.push(`${f}: ${p}`);

  if (data.cohort == null || Number.isNaN(Number(data.cohort)))
    problems.push(`${f}: 'cohort' must be a number (e.g. 1)`);

  // Duplicate-github advisory (case-insensitive).
  if (typeof data.github === "string") {
    const key = data.github.trim().toLowerCase();
    if (key && seenGithub.has(key))
      problems.push(
        `${f}: duplicate github '${data.github}' (also in ${seenGithub.get(key)})`,
      );
    else if (key) seenGithub.set(key, f);
  }

  // --- Non-fatal warnings: schema-valid but likely-misplaced data (silent-loss guard) ---
  for (const key of Object.keys(data)) {
    if (SCHEMA_KEYS.has(key)) continue;
    const lc = key.toLowerCase();
    if (CERT_IDS.has(key))
      warnings.push(
        `${f}: '${key}' is a Claude cert id at the TOP LEVEL — it won't show. ` +
          `Nest it under a 'certs:' block (certs: then indented '${key}: <code>').`,
      );
    else if (FIELD_ALIASES[lc])
      warnings.push(
        `${f}: unknown key '${key}' — did you mean '${FIELD_ALIASES[lc]}'? (ignored as written)`,
      );
    else
      warnings.push(`${f}: unrecognized key '${key}' — this field is ignored.`);
  }
  // certs present but a child id is not in the catalog → likely typo (still renders w/ default label)
  if (
    data.certs &&
    typeof data.certs === "object" &&
    !Array.isArray(data.certs)
  ) {
    for (const cid of Object.keys(data.certs))
      if (!CERT_IDS.has(cid))
        warnings.push(
          `${f}: cert id '${cid}' not in catalog — check spelling (renders with a default label).`,
        );
  }
}

if (warnings.length) {
  console.warn(
    `\n⚠ ${warnings.length} builder profile warning(s) — non-blocking, but this data may not display:\n`,
  );
  for (const w of warnings) console.warn("  - " + w);
  console.warn(
    `\nFix nesting/spelling if these fields were intended. The build still succeeds.\n`,
  );
}

if (problems.length) {
  console.error(
    `\n✖ Builder profile validation failed (${problems.length}):\n`,
  );
  for (const p of problems) console.error("  - " + p);
  console.error(
    `\nFix the file(s) above. Optional fields you don't use: delete the line.\n`,
  );
  process.exit(1);
}
console.log(`✓ ${files.length} builder profiles valid.`);
