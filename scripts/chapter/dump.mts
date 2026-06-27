// Run with tsx. Reads the curriculum source of truth and emits a flat JSON
// the render pipeline can consume from plain Node.
//   npx tsx scripts/chapter/dump.mts
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { chapters } from "../../src/data/chapters.ts";

const here = path.dirname(url.fileURLToPath(import.meta.url));

const out = chapters.map((c) => ({
  num: c.num,
  tag: c.tag ?? "",
  title: c.title,
  outcome: c.outcome,
  duration: c.duration,
  tiers: c.tiers,
  hero: Boolean(c.hero),
}));

fs.writeFileSync(
  path.join(here, "chapters.json"),
  JSON.stringify(out, null, 2),
);
console.log(`✓ chapters.json: ${out.length} chapters`);
