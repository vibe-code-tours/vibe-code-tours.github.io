// Verify Claude/Skilljar certificate codes in builder profiles are reachable.
// Run in CI after validate-builders. Network check:
//   - HTTP 404 (or 4xx)  -> FAIL  (fake / mistyped cert code)
//   - timeout / network  -> WARN  (don't block on flaky networks)
//   - 2xx / 3xx          -> OK
//
// Usage: node scripts/verify-certs.mjs
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { normalizeCerts, skilljarUrl } from "../src/lib/certs.mjs";

const dir = "src/content/builders";
const TIMEOUT_MS = 12000;
const CONCURRENCY = 6;

// Collect every (file, certId, code) across all builder profiles.
const jobs = [];
for (const f of fs
  .readdirSync(dir)
  .filter((x) => x.endsWith(".md") && !x.startsWith("_"))) {
  const src = fs.readFileSync(path.join(dir, f), "utf8").replace(/\r\n/g, "\n");
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) continue;
  let data;
  try {
    data = yaml.load(m[1]);
  } catch {
    continue;
  }
  const certs = normalizeCerts(data?.certs);
  if (!certs) continue;
  for (const [id, code] of Object.entries(certs)) {
    jobs.push({ file: f, id, code, url: skilljarUrl(code) });
  }
}

if (!jobs.length) {
  console.log("✓ No certs to verify.");
  process.exit(0);
}

async function check(job) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(job.url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
    });
    return { ...job, status: res.status };
  } catch (e) {
    return {
      ...job,
      status: 0,
      netError: e.name === "AbortError" ? "timeout" : e.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

const fails = [];
const warns = [];
const oks = [];

let idx = 0;
async function worker() {
  while (idx < jobs.length) {
    const job = jobs[idx++];
    const r = await check(job);
    if (r.status >= 200 && r.status < 400) oks.push(r);
    else if (r.status >= 400) fails.push(r);
    else warns.push(r);
    process.stdout.write(
      `\r  checked ${oks.length + fails.length + warns.length}/${jobs.length}`,
    );
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
process.stdout.write("\n");

for (const w of warns)
  console.warn(
    `  ⚠ ${w.file}: ${w.id} (${w.code}) unreachable — ${w.netError} (not blocking)`,
  );
for (const e of fails)
  console.error(
    `  ✖ ${e.file}: ${e.id} (${e.code}) → HTTP ${e.status} at ${e.url}`,
  );

console.log(
  `\nCerts: ${oks.length} verified, ${warns.length} unreachable (warn), ${fails.length} invalid (fail).`,
);
if (fails.length) {
  console.error(
    "\n✖ Cert verification failed — fix or remove the bad cert codes above.\n",
  );
  process.exit(1);
}
console.log("✓ All reachable certs verified.");
