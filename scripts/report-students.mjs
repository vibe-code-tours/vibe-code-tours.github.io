// Student report for the Vibe Code Tours cohort.
//
// Single source of truth = the public site data:
//   - src/content/builders/*.md   -> people + their third-party certs (frontmatter)
//   - src/data/levels.json        -> highest chapter PASSED, keyed by github login
//
// Reports: headcount (by role), cert totals (overall + per person), and the
// student distribution per chapter level. Read-only; prints a text report
// (add --json for machine-readable output).
//
// Usage:
//   node scripts/report-students.mjs            # pretty report
//   node scripts/report-students.mjs --json     # JSON
//   node scripts/report-students.mjs --top 20   # cert leaderboard size (default 10)

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse as parseYaml } from "yaml";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const BUILDERS_DIR = join(ROOT, "src/content/builders");
const LEVELS_FILE = join(ROOT, "src/data/levels.json");

const arg = (flag, def) => {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const JSON_OUT = process.argv.includes("--json");
const TOP = Number(arg("--top", "10"));

// ---- read builders ----
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  try {
    return parseYaml(m[1]) || {};
  } catch {
    return {};
  }
}

const files = existsSync(BUILDERS_DIR)
  ? readdirSync(BUILDERS_DIR).filter((f) => f.endsWith(".md"))
  : [];

const people = [];
for (const f of files) {
  const fm = frontmatter(readFileSync(join(BUILDERS_DIR, f), "utf8"));
  if (!fm) continue;
  const gh = String(fm.github || f.replace(/\.md$/, ""))
    .toLowerCase()
    .trim();
  const role = String(fm.role || "builder").trim();
  const certs =
    fm.certs && typeof fm.certs === "object" ? Object.keys(fm.certs) : [];
  people.push({ gh, name: fm.name || gh, role, certs });
}

// ---- levels ----
const levels = existsSync(LEVELS_FILE)
  ? JSON.parse(readFileSync(LEVELS_FILE, "utf8"))
  : {};

// ---- aggregate ----
const byRole = {};
for (const p of people) byRole[p.role] = (byRole[p.role] || 0) + 1;
const students = people.filter((p) => p.role === "builder");

// certs
const certByType = {};
let certTotal = 0;
let withCerts = 0;
for (const p of people) {
  if (p.certs.length) withCerts++;
  certTotal += p.certs.length;
  for (const c of p.certs) certByType[c] = (certByType[c] || 0) + 1;
}
const leaderboard = people
  .filter((p) => p.certs.length)
  .sort((a, b) => b.certs.length - a.certs.length || a.gh.localeCompare(b.gh))
  .slice(0, TOP);

// levels distribution (0..8)
const perLevel = {};
for (const v of Object.values(levels)) perLevel[v] = (perLevel[v] || 0) + 1;
const leveled = Object.keys(levels).length;
const cardsNoLevel = people.filter(
  (p) => p.role === "builder" && !(p.gh in levels),
).length;

const report = {
  people_total: people.length,
  by_role: byRole,
  students: students.length,
  certs: {
    total_awarded: certTotal,
    people_with_certs: withCerts,
    people_without_certs: people.length - withCerts,
    avg_per_person: people.length ? +(certTotal / people.length).toFixed(2) : 0,
    by_type: certByType,
  },
  levels: {
    leveled_in_levels_json: leveled,
    per_level: perLevel,
    builder_cards_with_no_level: cardsNoLevel,
  },
};

if (JSON_OUT) {
  console.log(JSON.stringify({ ...report, leaderboard }, null, 2));
  process.exit(0);
}

// ---- pretty print ----
const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);
const line = () => console.log("─".repeat(48));

console.log("Vibe Code Tours — Student Report");
line();
console.log(`people (cards):  ${report.people_total}`);
for (const [r, n] of Object.entries(byRole).sort((a, b) => b[1] - a[1]))
  console.log(`  ${pad(r, 12)} ${lpad(n, 4)}`);
console.log(`students:        ${report.students}`);

console.log("");
console.log("Certs");
line();
console.log(`total awarded:        ${report.certs.total_awarded}`);
console.log(`people with >=1 cert: ${report.certs.people_with_certs}`);
console.log(`people with 0 certs:  ${report.certs.people_without_certs}`);
console.log(`avg per person:       ${report.certs.avg_per_person}`);
console.log("by type:");
for (const [t, n] of Object.entries(certByType).sort((a, b) => b[1] - a[1]))
  console.log(`  ${pad(t, 22)} ${lpad(n, 4)}`);
console.log(`top ${TOP} (certs each):`);
for (const p of leaderboard)
  console.log(`  ${lpad(p.certs.length, 2)}  ${pad(p.gh, 24)} ${p.name}`);

console.log("");
console.log("Levels (Level = highest chapter passed + 1)");
line();
const maxL = Math.max(0, ...Object.keys(perLevel).map(Number));
for (let l = 0; l <= maxL; l++)
  console.log(`  Level ${l + 1}  (ch-${l})  ${lpad(perLevel[l] || 0, 4)}`);
console.log(`  ${pad("leveled total", 6)} ${lpad(leveled, 2)}`);
console.log(`  builder cards with no passed level: ${cardsNoLevel}`);
