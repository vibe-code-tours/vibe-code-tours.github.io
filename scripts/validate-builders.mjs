// CI gate for builder profiles. Fails the build for problems a student must fix:
// unparseable YAML, or invalid identity (name/github). Optional fields are left
// to the tolerant content schema. Identity rules live in src/lib/builder-identity.
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { identityProblems } from "../src/lib/builder-identity.mjs";

const dir = "src/content/builders";
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"));

const problems = [];
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
