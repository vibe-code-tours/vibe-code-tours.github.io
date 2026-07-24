// Render chapter intro clips.
//   node scripts/chapter/render.mjs <num>    → one chapter
//   node scripts/chapter/render.mjs --all     → all chapters
//   node scripts/chapter/render.mjs --all --high
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const here = path.dirname(url.fileURLToPath(import.meta.url));
const COMP_DIR = path.join(here, "comp");
const OUT_DIR = path.join(here, "out");
const DATA = path.join(here, "chapters.json");

if (!fs.existsSync(DATA)) {
  console.error(
    "chapters.json missing — run: npx tsx scripts/chapter/dump.mts",
  );
  process.exit(1);
}
const chapters = JSON.parse(fs.readFileSync(DATA, "utf8"));

const args = process.argv.slice(2);
const all = args.includes("--all");
const quality = args.includes("--high") ? "high" : "draft";
const single = args.find((a) => !a.startsWith("--"));

let targets;
if (all) {
  targets = chapters;
} else if (single !== undefined) {
  targets = chapters.filter((c) => String(c.num) === single);
  if (!targets.length) {
    console.error(
      `No chapter ${single}. Valid: ${chapters.map((c) => c.num).join(", ")}`,
    );
    process.exit(1);
  }
} else {
  console.error("Usage: render.mjs <num> | --all [--high]");
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (let i = 0; i < targets.length; i++) {
  const c = targets[i];
  const vars = {
    num: c.num,
    tag: c.tag || "",
    title: c.title,
    outcome: c.outcome,
    duration: c.duration,
    tiers: (c.tiers || []).join(", "),
  };
  const out = path.join(OUT_DIR, `chapter-${c.num}.mp4`);
  process.stdout.write(`[${i + 1}/${targets.length}] ch${c.num} ${c.title} … `);
  execFileSync(
    "npx",
    [
      "hyperframes",
      "render",
      "--quality",
      quality,
      "--browser-timeout",
      "180",
      "--variables",
      JSON.stringify(vars),
      "--output",
      out,
      "--quiet",
    ],
    { cwd: COMP_DIR, stdio: ["ignore", "ignore", "inherit"] },
  );
  console.log(`✓ ${path.relative(process.cwd(), out)}`);
}
console.log(
  `Done — ${targets.length} clip(s) in ${path.relative(process.cwd(), OUT_DIR)}/`,
);
