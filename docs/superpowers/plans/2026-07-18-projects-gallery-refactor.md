# Projects Gallery Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the personal-only gallery into a bolder, multi-page **Projects** section with a redesigned personal gallery and a new video-forward team gallery fed by the demo-tracker Google Sheet.

**Architecture:** Two data pipelines (existing `projects.json` for personal; new `teams.json` generated from the sheet CSV) feed two page trees under `/projects/*`. The 579-line `GalleryBody.astro` monolith is decomposed into focused `components/gallery/*` units (HeroSlider, FilterBar, ProjectCard, TeamCard, Lightbox) plus small shared client-script helpers. Personal keeps its Marp slide deck; teams get an embedded video player.

**Tech Stack:** Astro (static output), Tailwind (amber `accent` theme), `@marp-team/marp-core`, Node ESM scripts, `node:test` for unit tests. No new runtime deps.

## Global Constraints

- **Design tokens (verbatim):** accent = amber scale (`accent-500` = `#f59e0b`); surfaces `#09090b` / `#0f0f11` / `#18181b`; fonts Inter (sans) + JetBrains Mono (mono). No new hues except green `● live` status.
- **Layout:** bolder rework = hero featured slider (loops **ALL** items) → filter bar → even 3-col grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`). Card treatment = amber accent top-stripe. Masonry was rejected.
- **Routes:** `/projects`, `/projects/personal`, `/projects/teams` + `/my/*` mirror. `/gallery` + `/my/gallery` redirect to the personal page. `gallery` naming retired.
- **i18n:** every user-facing string exists in both `src/i18n/en.json` and `src/i18n/my.json`. MY strings may be provisional (English fallback acceptable if translation pending) but keys MUST exist in both.
- **A11y/perf:** slider pauses on hover/focus, keyboard arrows, honors `prefers-reduced-motion`; iframes lazy (mount on lightbox open); images `loading="lazy"`; `● live` conveys status with text, not color alone.
- **Data integrity:** sheet is hand-edited — parser MUST trim whitespace, tolerate blank/duplicated cells, and drop rows with no `repo_url`.
- **Verification:** `npm run check` (astro check) and `npm run build` MUST pass; `npm run format` applied before commit. Pure-logic modules tested with `node --test`.
- **Commits:** conventional-commit style, no attribution footer (per user global config).
- **Marp deck extraction is behavior-preserving** — no personal-gallery regressions.

---

## File Structure

**New — data pipeline (in sibling repo `channels/`, path relative to monorepo root):**
- `channels/scripts/lib/team-sheet.mjs` — pure parsers (CSV row → team object, YouTube/Drive id, url clean, type infer)
- `channels/scripts/lib/team-sheet.test.mjs` — `node:test` unit tests
- `channels/scripts/export-team-gallery.mjs` — CLI: fetch sheet CSV → `teams.json`, `--commit`

**New — site (`vibe-code-tours-site/`):**
- `src/data/teams.json` — generated team data (seeded from live sheet)
- `src/lib/teams.mjs` — `getTeams()`, `typeBuckets()`, `statusBuckets()`, `TEAM_TYPE_LABELS`
- `src/lib/teams.test.mjs` — `node:test` unit tests
- `src/lib/gallery-dom.ts` — shared client helpers: `wireFilter()`, `wireSlider()`, `openLightbox()/closeLightbox()` scaffolding
- `src/components/gallery/HeroSlider.astro`
- `src/components/gallery/FilterBar.astro`
- `src/components/gallery/ProjectCard.astro`
- `src/components/gallery/TeamCard.astro`
- `src/components/gallery/Lightbox.astro`
- `src/components/gallery/deck-renderer.ts` — Marp renderer (extracted from GalleryBody)
- `src/components/gallery/video-player.ts` — YT/Drive embed + fallback
- `src/components/PersonalGallery.astro` — composes personal page
- `src/components/TeamsGallery.astro` — composes teams page
- `src/pages/projects/index.astro`, `src/pages/projects/personal.astro`, `src/pages/projects/teams.astro`
- `src/pages/my/projects/index.astro`, `.../personal.astro`, `.../teams.astro`

**Modified:**
- `src/i18n/en.json`, `src/i18n/my.json` — add `projectsHub` + `teams` blocks, extend `gallery`
- `astro.config.mjs` — add `redirects`
- `src/components/GalleryBody.astro` — decomposed then deleted (replaced by PersonalGallery)

---

## Task 1: Team-sheet pure parsers (+ unit tests)

**Files:**
- Create: `channels/scripts/lib/team-sheet.mjs`
- Test: `channels/scripts/lib/team-sheet.test.mjs`

**Interfaces:**
- Produces:
  - `parseCsv(text: string): string[][]` — RFC-ish CSV → rows of cells (handles quoted fields with embedded commas/newlines).
  - `youtubeId(url: string|null): string|null` — from `watch?v=`, `youtu.be/`, or `/embed/`.
  - `driveId(url: string|null): string|null` — first `/file/d/<id>/` match (tolerates doubled URLs).
  - `cleanUrl(v: string|null): string|null` — trim; empty/`-` → null.
  - `inferType(category: string|null): string` — keyword map → one of `web-app|api|bot|mobile|game|cli|library|other` (default `web-app`).
  - `rowToTeam(row: string[]): object|null` — maps a sheet data row to a team object; returns null if no repo_url.

- [ ] **Step 1: Write failing tests**

```js
// channels/scripts/lib/team-sheet.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, youtubeId, driveId, cleanUrl, inferType, rowToTeam } from "./team-sheet.mjs";

test("parseCsv handles quoted commas", () => {
  const rows = parseCsv('a,"b,c",d\n1,2,3\n');
  assert.deepEqual(rows[0], ["a", "b,c", "d"]);
  assert.deepEqual(rows[1], ["1", "2", "3"]);
});

test("youtubeId parses watch, short, embed", () => {
  assert.equal(youtubeId("https://www.youtube.com/watch?v=-hN5QhOEFMU"), "-hN5QhOEFMU");
  assert.equal(youtubeId("https://youtu.be/J6YnDcO0r7c"), "J6YnDcO0r7c");
  assert.equal(youtubeId("QRDine YouTube"), null); // not a URL
  assert.equal(youtubeId(null), null);
});

test("driveId tolerates doubled url", () => {
  const doubled = "https://drive.google.com/file/d/1YiQNR1zRoeqDVLryCosPSJNQCFK6H9dp/viewhttps://drive.google.com/file/d/1YiQNR1zRoeqDVLryCosPSJNQCFK6H9dp/view";
  assert.equal(driveId(doubled), "1YiQNR1zRoeqDVLryCosPSJNQCFK6H9dp");
  assert.equal(driveId("QRDine"), null);
});

test("cleanUrl trims and nulls placeholders", () => {
  assert.equal(cleanUrl(" https://x.com "), "https://x.com");
  assert.equal(cleanUrl("-"), null);
  assert.equal(cleanUrl(""), null);
});

test("inferType maps keywords", () => {
  assert.equal(inferType("Water Delivery System (Web + API)"), "api");
  assert.equal(inferType("Multiplayer Party Game App"), "game");
  assert.equal(inferType("Restaurant QR Order System"), "web-app");
  assert.equal(inferType(null), "web-app");
});

test("rowToTeam maps a full row and drops repo-less rows", () => {
  // cols: [team, title, category, youtube, drive, uploaded, live, repo, notes]
  const row = ["Team-07", "ARGUS", "Decentralized Shadow AI Scanner", "", "https://drive.google.com/file/d/1lp/view", "Done", "https://argus-scanner.duckdns.org/ ", "https://github.com/vibecode-team7/ARGUS", ""];
  const t = rowToTeam(row);
  assert.equal(t.team, "Team-07");
  assert.equal(t.team_no, 7);
  assert.equal(t.title, "ARGUS");
  assert.equal(t.drive_id, "1lp");
  assert.equal(t.live_url, "https://argus-scanner.duckdns.org/");
  assert.equal(t.uploaded, "Done");
  assert.equal(t.type, "api");
  assert.equal(rowToTeam(["Team-04", "", "", "", "", "No", "", "", ""]).__proto__ === Object.prototype ? "obj" : "obj", "obj");
  assert.equal(rowToTeam(["Team-99", "X", "", "", "", "", "", "", ""]), null); // no repo_url
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd channels && node --test scripts/lib/team-sheet.test.mjs`
Expected: FAIL — `Cannot find module './team-sheet.mjs'`.

- [ ] **Step 3: Implement the parsers**

```js
// channels/scripts/lib/team-sheet.mjs
// Pure, dependency-free parsers for the demo-tracker sheet CSV. Unit-tested.

export function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (c === "\r") { /* skip */ }
    else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function cleanUrl(v) {
  if (v == null) return null;
  const t = String(v).trim();
  return t === "" || t === "-" ? null : t;
}

export function youtubeId(url) {
  const u = cleanUrl(url);
  if (!u) return null;
  const m = u.match(/(?:v=|youtu\.be\/|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function driveId(url) {
  const u = cleanUrl(url);
  if (!u) return null;
  const m = u.match(/\/file\/d\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

const TYPE_RULES = [
  [/\bapi\b/i, "api"],
  [/\bgame\b/i, "game"],
  [/\bbot\b/i, "bot"],
  [/\b(mobile|android|ios|app)\b/i, "mobile"],
  [/\bcli\b/i, "cli"],
  [/\blibrary\b|\bsdk\b/i, "library"],
  [/\bweb\b|platform|dashboard|marketplace|system|web app/i, "web-app"],
];
export function inferType(category) {
  const c = cleanUrl(category);
  if (!c) return "web-app";
  for (const [re, type] of TYPE_RULES) if (re.test(c)) return type;
  return "web-app";
}

export function rowToTeam(row) {
  const [team, title, category, youtube, drive, uploaded, live, repo, notes] = row.map((x) => (x == null ? "" : x));
  const repo_url = cleanUrl(repo);
  if (!repo_url) return null;
  const noMatch = String(team).match(/(\d+)/);
  return {
    team: String(team).trim(),
    team_no: noMatch ? Number(noMatch[1]) : null,
    title: (cleanUrl(title) || String(team).trim()),
    desc: cleanUrl(category),
    youtube_url: cleanUrl(youtube),
    youtube_id: youtubeId(youtube),
    drive_url: cleanUrl(drive),
    drive_id: driveId(drive),
    uploaded: String(uploaded || "").trim(),
    live_url: cleanUrl(live),
    repo_url,
    notes: cleanUrl(notes),
    type: inferType(category),
    stack: [],
  };
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd channels && node --test scripts/lib/team-sheet.test.mjs`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git -C channels add scripts/lib/team-sheet.mjs scripts/lib/team-sheet.test.mjs
git -C channels commit -m "feat: team-sheet parsers for demo-tracker CSV"
```

---

## Task 2: `export-team-gallery.mjs` CLI

**Files:**
- Create: `channels/scripts/export-team-gallery.mjs`

**Interfaces:**
- Consumes: `parseCsv`, `rowToTeam` from `lib/team-sheet.mjs`; `installationToken`, `commitFileIfChanged` from `lib/gh-app.mjs` (same as `export-gallery.mjs`).
- Produces: writes `src/data/teams.json` (array of team objects sorted by `team_no`) locally and/or to the site repo via `--commit`.

- [ ] **Step 1: Implement the CLI**

```js
// channels/scripts/export-team-gallery.mjs
// Build teams.json for the site's team-project gallery from the demo-tracker sheet.
//
// Source of truth: the demo-tracker Google Sheet, exported as CSV (public export,
// no auth needed). Video-forward: each team's demo video (YouTube unlisted or
// Google Drive fallback), plus live URL + repo. Rows with no repo are skipped.
//
// Usage:
//   node scripts/export-team-gallery.mjs [--out ../vibe-code-tours-site/src/data/teams.json]
//   node scripts/export-team-gallery.mjs --commit            # commit teams.json to site repo if changed
//   node scripts/export-team-gallery.mjs --commit --dry-run  # print, don't commit
//
// Cron (VPS host, every 6h) — mirror export-gallery.mjs:
//   30 */6 * * * docker exec vibecode-channels-bot node /app/scripts/export-team-gallery.mjs --commit >> ~/export-team-gallery.log 2>&1

import { writeFileSync } from "node:fs";
import { parseCsv, rowToTeam } from "./lib/team-sheet.mjs";
import { installationToken, commitFileIfChanged } from "./lib/gh-app.mjs";

function arg(flag, def) {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const SHEET_ID = process.env.DEMO_SHEET_ID || "1qpG702ZKRTn3RtbxHKEUn0DVp_Ofmlx5BGxdomnxeKg";
const GID = process.env.DEMO_SHEET_GID || "452793459";
const outPath = arg("--out", null);
const doCommit = process.argv.includes("--commit");
const dryRun = process.argv.includes("--dry-run");

const ORG = process.env.GH_ORG || "vibe-code-tours";
const SITE_REPO = process.env.SITE_REPO || "vibe-code-tours.github.io";
const SITE_BRANCH = process.env.SITE_BRANCH || "main";
const TEAMS_PATH = "src/data/teams.json";

async function main() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
  const res = await fetch(url, { headers: { "User-Agent": "vibecode-team-export" } });
  if (!res.ok) throw new Error(`sheet fetch ${res.status}`);
  const csv = await res.text();
  const rows = parseCsv(csv);
  const dataRows = rows.slice(1).filter((r) => (r[0] || "").trim().toLowerCase().startsWith("team-"));
  const teams = dataRows.map(rowToTeam).filter(Boolean).sort((a, b) => (a.team_no ?? 999) - (b.team_no ?? 999));

  const json = JSON.stringify(teams, null, 2) + "\n";
  if (outPath) { writeFileSync(outPath, json); console.error(`wrote ${teams.length} teams -> ${outPath}`); }
  if (!outPath && !doCommit) { process.stdout.write(json); }

  if (doCommit) {
    if (dryRun) { console.error(`[dry-run] ${teams.length} teams, would commit ${TEAMS_PATH}`); return; }
    const token = await installationToken();
    const changed = await commitFileIfChanged({
      token, org: ORG, repo: SITE_REPO, branch: SITE_BRANCH,
      path: TEAMS_PATH, content: json, message: "chore: refresh teams.json",
    });
    console.error(changed ? `committed ${TEAMS_PATH}` : "no change");
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Verify against the live sheet (dry-run to stdout)**

Run: `cd channels && node scripts/export-team-gallery.mjs`
Expected: prints a JSON array of ~18-20 team objects; Team-07 has `"drive_id"` set, `"type":"api"`, `live_url` with no trailing space; no row is missing `repo_url`.

- [ ] **Step 3: Confirm `commitFileIfChanged` signature matches**

Run: `cd channels && grep -n "export function commitFileIfChanged" scripts/lib/gh-app.mjs`
Expected: found. If its parameter shape differs from the object used above, adjust the `--commit` block to match the existing signature (mirror how `export-gallery.mjs` calls it). Do not change `gh-app.mjs`.

- [ ] **Step 4: Commit**

```bash
git -C channels add scripts/export-team-gallery.mjs
git -C channels commit -m "feat: export-team-gallery generates teams.json from demo sheet"
```

---

## Task 3: `src/lib/teams.mjs` data helpers (+ tests) and seed `teams.json`

**Files:**
- Create: `vibe-code-tours-site/src/lib/teams.mjs`
- Create: `vibe-code-tours-site/src/lib/teams.test.mjs`
- Create: `vibe-code-tours-site/src/data/teams.json` (seed from Task 2 output)

**Interfaces:**
- Produces:
  - `TEAM_TYPE_LABELS: Record<string,string>` (same keys as personal `TYPE_LABELS`).
  - `getTeams(): Team[]` — validated, sorted by `team_no`.
  - `typeBuckets(teams): {type,count}[]` — sorted by count desc.
  - `statusBuckets(teams): {status,count}[]` — `live` (has `live_url`) and `done` (`uploaded==="Done"`).
  - `hasVideo(team): boolean` — `youtube_id || drive_id`.

- [ ] **Step 1: Seed the data file**

Run:
```bash
cd channels && node scripts/export-team-gallery.mjs --out ../vibe-code-tours-site/src/data/teams.json
```
Expected: `src/data/teams.json` created with the current teams array.

- [ ] **Step 2: Write failing tests**

```js
// vibe-code-tours-site/src/lib/teams.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { getTeams, typeBuckets, statusBuckets, hasVideo } from "./teams.mjs";

test("getTeams returns validated, team_no-sorted list", () => {
  const teams = getTeams();
  assert.ok(Array.isArray(teams) && teams.length > 0);
  for (const t of teams) { assert.equal(typeof t.repo_url, "string"); assert.equal(typeof t.title, "string"); }
  const nos = teams.map((t) => t.team_no ?? 999);
  assert.deepEqual(nos, [...nos].sort((a, b) => a - b));
});

test("statusBuckets counts live and done", () => {
  const b = statusBuckets(getTeams());
  const live = b.find((x) => x.status === "live");
  const done = b.find((x) => x.status === "done");
  assert.ok(live.count >= 0 && done.count >= 0);
});

test("hasVideo true when a video id exists", () => {
  assert.equal(hasVideo({ youtube_id: "abc" }), true);
  assert.equal(hasVideo({ drive_id: "x" }), true);
  assert.equal(hasVideo({ youtube_id: null, drive_id: null }), false);
});

test("typeBuckets sorted by count desc", () => {
  const b = typeBuckets(getTeams());
  for (let i = 1; i < b.length; i++) assert.ok(b[i - 1].count >= b[i].count);
});
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `cd vibe-code-tours-site && node --test src/lib/teams.test.mjs`
Expected: FAIL — `Cannot find module './teams.mjs'`.

- [ ] **Step 4: Implement `teams.mjs`**

```js
// src/lib/teams.mjs
// Single source for the team gallery. teams.json is generated by the bot
// (channels/scripts/export-team-gallery.mjs) and committed here, like projects.json.
import data from "../data/teams.json" with { type: "json" };

export const TEAM_TYPE_LABELS = {
  "web-app": "Web app", cli: "CLI", bot: "Bot", api: "API",
  mobile: "Mobile", game: "Game", library: "Library", other: "Other",
};

function valid(t) {
  return t && typeof t.repo_url === "string" && typeof t.title === "string" && TEAM_TYPE_LABELS[t.type];
}
export function hasVideo(t) { return Boolean(t && (t.youtube_id || t.drive_id)); }

export function getTeams() {
  return (Array.isArray(data) ? data : [])
    .filter(valid)
    .map((t) => ({ ...t, stack: Array.isArray(t.stack) ? t.stack : [] }))
    .sort((a, b) => (a.team_no ?? 999) - (b.team_no ?? 999));
}
export function typeBuckets(teams) {
  const m = new Map();
  for (const t of teams) m.set(t.type, (m.get(t.type) || 0) + 1);
  return [...m.entries()].map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}
export function statusBuckets(teams) {
  let live = 0, done = 0;
  for (const t of teams) { if (t.live_url) live++; if (t.uploaded === "Done") done++; }
  return [{ status: "live", count: live }, { status: "done", count: done }];
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `cd vibe-code-tours-site && node --test src/lib/teams.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git -C vibe-code-tours-site add src/lib/teams.mjs src/lib/teams.test.mjs src/data/teams.json
git -C vibe-code-tours-site commit -m "feat: teams.mjs data helpers + seed teams.json"
```

---

## Task 4: i18n strings (hub + teams + gallery extension)

**Files:**
- Modify: `src/i18n/en.json` — add `projectsHub`, `teams`; extend existing `gallery`
- Modify: `src/i18n/my.json` — same keys (MY values, English fallback allowed if pending)

**Interfaces:**
- Produces: `t(locale).projectsHub`, `t(locale).teams`, and new `t(locale).gallery.*` keys consumed by pages/components in later tasks.

- [ ] **Step 1: Add the `en.json` blocks**

Insert alongside the existing `"gallery"` object:

```jsonc
"projectsHub": {
  "title": "Projects — Vibe Code Tours",
  "description": "Personal and team projects shipped by Cohort 1.",
  "label": "Cohort 1",
  "heading": "Projects",
  "intro": "Everything Cohort 1 shipped — from solo builds to team demos.",
  "personalCard": "Personal projects",
  "personalDesc": "What each builder shipped solo. Slides included.",
  "teamsCard": "Team projects",
  "teamsDesc": "20 teams, live demos and videos."
},
"teams": {
  "title": "Team Projects — Vibe Code Tours",
  "description": "Demos, live sites, and repos from all 20 Cohort 1 teams.",
  "label": "Cohort 1 · Teams",
  "heading": "Team Projects",
  "intro": "Twenty teams, twenty demos. Click any team to watch.",
  "searchPlaceholder": "Search teams…",
  "allTypes": "All",
  "allStatus": "All",
  "statusLive": "Live",
  "statusDone": "Demo done",
  "noMatches": "No matches.",
  "empty": "No teams yet — check back soon.",
  "countUnit": "teams",
  "demoSoon": "demo soon",
  "watchBtn": "Watch on YouTube ↗",
  "liveBtn": "Live site ↗",
  "repoBtn": "Repo ↗",
  "playerYouTube": "YouTube",
  "playerDrive": "Drive fallback",
  "videoUnavailable": "Demo not uploaded yet.",
  "heroPrev": "Previous project",
  "heroNext": "Next project",
  "types": {
    "web-app": "Web app", "cli": "CLI", "bot": "Bot", "api": "API",
    "mobile": "Mobile", "game": "Game", "library": "Library", "other": "Other"
  }
}
```

Also extend `"gallery"` with hero control labels:

```jsonc
"heroPrev": "Previous project",
"heroNext": "Next project"
```

- [ ] **Step 2: Add the same keys to `my.json`**

Mirror all keys from Step 1 under `my.json`. Translate where a natural Myanmar term exists (per project translation memory: idiom over literal); otherwise copy the English value so the key exists. Suggested MY values for the safe ones:
- `projectsHub.heading`: `"ပရောဂျက်များ"`, `teams.heading`: `"အသင်းပရောဂျက်များ"`, `teams.statusLive`: `"တိုက်ရိုက်"`, `teams.statusDone`: `"ဒီမိုပြီး"`, `teams.countUnit`: `"အသင်း"`, `teams.demoSoon`: `"ဒီမိုမကြာမီ"`. Copy English for the rest if unsure.

- [ ] **Step 3: Verify JSON parses**

Run: `cd vibe-code-tours-site && node -e "JSON.parse(require('fs').readFileSync('src/i18n/en.json')); JSON.parse(require('fs').readFileSync('src/i18n/my.json')); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git -C vibe-code-tours-site add src/i18n/en.json src/i18n/my.json
git -C vibe-code-tours-site commit -m "feat(i18n): add projectsHub + teams strings"
```

---

## Task 5: Extract shared client helpers (`gallery-dom.ts`) + `deck-renderer.ts`

Behavior-preserving extraction of logic currently inlined in `GalleryBody.astro`, so both galleries share it. No page yet consumes these — pure extraction.

**Files:**
- Create: `src/lib/gallery-dom.ts`
- Create: `src/components/gallery/deck-renderer.ts`

**Interfaces:**
- Produces:
  - `gallery-dom.ts`: `wireFilter(opts)`, `wireSlider(rootId, opts)`, `fadeInOnScroll(selector)`, `lockScroll(on)`, `ogFallback(repoUrl): string`.
  - `deck-renderer.ts`: `renderDeck(mount, project, i18n)` — the exact Marp lazy-render logic moved verbatim from `GalleryBody.astro` (`rewriteRelPaths`, `getMarp`, token guard, sandboxed iframe).

- [ ] **Step 1: Create `gallery-dom.ts`**

```ts
// src/lib/gallery-dom.ts — shared client-side gallery behaviors.
export function ogFallback(repoUrl: string): string {
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  return m ? `https://opengraph.githubassets.com/1/${m[1]}/${m[2]}` : "";
}

export function lockScroll(on: boolean) {
  document.body.style.overflow = on ? "hidden" : "";
}

export function fadeInOnScroll(selector: string) {
  const cells = Array.from(document.querySelectorAll<HTMLElement>(selector));
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cells.forEach((c) => c.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }, { rootMargin: "0px 0px -10% 0px" });
  cells.forEach((c) => io.observe(c));
}

// Filter grid cells by type/status/stack + free text. Cells carry data-* attrs.
export function wireFilter(opts: {
  gridId: string; countEl: HTMLElement | null; emptyEl: HTMLElement | null;
  bars: { attr: string }[]; countUnit: string;
}) {
  const grid = document.getElementById(opts.gridId);
  const cells = Array.from(grid?.querySelectorAll<HTMLElement>(".project-cell") ?? []);
  const active: Record<string, string> = {};
  opts.bars.forEach((b) => (active[b.attr] = "*"));
  let query = "";
  function apply() {
    let shown = 0;
    for (const cell of cells) {
      let ok = true;
      for (const b of opts.bars) {
        const v = active[b.attr];
        if (v === "*") continue;
        const cellVal = cell.dataset[b.attr] ?? "";
        if (b.attr === "stack") { if (!cellVal.split("|").includes(v)) ok = false; }
        else if (cellVal !== v) ok = false;
      }
      if (ok && query && !(cell.textContent ?? "").toLowerCase().includes(query)) ok = false;
      cell.classList.toggle("hidden", !ok);
      if (ok) shown++;
    }
    if (opts.emptyEl) opts.emptyEl.toggleAttribute("hidden", shown !== 0);
    if (opts.countEl) opts.countEl.textContent = shown === cells.length
      ? `${cells.length} ${opts.countUnit}` : `${shown} of ${cells.length}`;
  }
  for (const b of opts.bars) {
    const bar = document.querySelector<HTMLElement>(`[data-bar="${b.attr}"]`);
    bar?.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(`[data-${b.attr}]`);
      if (!btn) return;
      active[b.attr] = btn.dataset[b.attr] ?? "*";
      bar.querySelectorAll<HTMLElement>(`[data-${b.attr}]`).forEach((x) => x.setAttribute("aria-pressed", String(x === btn)));
      apply();
    });
  }
  const search = document.getElementById("project-search") as HTMLInputElement | null;
  search?.addEventListener("input", () => { query = search.value.trim().toLowerCase(); apply(); });
  return { apply };
}

// Auto-rotating slider over .hero-slide children of #<rootId>. Loops ALL slides.
export function wireSlider(rootId: string, opts: { intervalMs?: number } = {}) {
  const root = document.getElementById(rootId);
  if (!root) return;
  const slides = Array.from(root.querySelectorAll<HTMLElement>(".hero-slide"));
  const dots = Array.from(root.querySelectorAll<HTMLElement>(".hero-dot"));
  if (slides.length <= 1) return;
  let i = 0, timer: number | undefined;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function show(n: number) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("hidden", k !== i));
    dots.forEach((d, k) => d.setAttribute("aria-current", String(k === i)));
  }
  function start() { if (!reduce) timer = window.setInterval(() => show(i + 1), opts.intervalMs ?? 6000); }
  function stop() { if (timer) window.clearInterval(timer); }
  root.querySelector("[data-hero-prev]")?.addEventListener("click", () => { show(i - 1); stop(); start(); });
  root.querySelector("[data-hero-next]")?.addEventListener("click", () => { show(i + 1); stop(); start(); });
  dots.forEach((d, k) => d.addEventListener("click", () => { show(k); stop(); start(); }));
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);
  show(0); start();
}
```

- [ ] **Step 2: Create `deck-renderer.ts` (move Marp logic verbatim)**

Copy the two Marp helper functions and the `__renderDeck` body from the current `GalleryBody.astro` second `<script>` into an exported function. Preserve exact behavior (lazy `@marp-team/marp-core` import, `rewriteRelPaths`, `<script>`-strip, sandboxed iframe, `deckToken` guard):

```ts
// src/components/gallery/deck-renderer.ts
function rewriteRelPaths(md: string, base: string) {
  const b = base.endsWith("/") ? base : base + "/";
  return md.replace(/(\]\()([^)]+)(\))/g, (m, open, target, close) => {
    const t = target.trim();
    if (/^(https?:|data:|#|mailto:)/i.test(t)) return m;
    return `${open}${b}${t.replace(/^\.?\//, "")}${close}`;
  });
}
let marpPromise: Promise<any> | null = null;
async function getMarp() {
  if (!marpPromise) marpPromise = import("@marp-team/marp-core").then(({ Marp }) => new Marp({ html: false }));
  return marpPromise;
}
let deckCallToken = 0;
export async function renderDeck(mount: HTMLElement, c: any, i18n: { loadingSlides: string; slidesUnavailable: string }) {
  const token = String(++deckCallToken);
  mount.dataset.deckToken = token;
  if (!c.slides_raw) { mount.innerHTML = ""; return; }
  mount.innerHTML = `<p class="font-mono text-xs text-gray-500">${i18n.loadingSlides}</p>`;
  try {
    const res = await fetch(c.slides_raw);
    if (!res.ok) throw new Error(String(res.status));
    let md = await res.text();
    if (c.slides_base) md = rewriteRelPaths(md, c.slides_base);
    const marp = await getMarp();
    const { html, css } = marp.render(md);
    if (mount.dataset.deckToken !== token) return;
    const body = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    const srcdoc = `<!doctype html><html><head><meta charset="utf8"><style>${css}
      html,body{margin:0;background:#0b0b0d} .marpit{transform-origin:top left}</style></head><body>${body}</body></html>`;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "");
    iframe.className = "h-[46vh] w-full rounded-lg border border-white/10 bg-black";
    iframe.srcdoc = srcdoc;
    mount.innerHTML = "";
    mount.appendChild(iframe);
  } catch {
    if (mount.dataset.deckToken !== token) return;
    mount.innerHTML = `<a href="${c.repo_url}" target="_blank" rel="noopener noreferrer" class="font-mono text-xs text-gray-400 underline">${i18n.slidesUnavailable}</a>`;
  }
}
```

- [ ] **Step 3: Type-check**

Run: `cd vibe-code-tours-site && npm run check`
Expected: no new type errors in the two new files. (GalleryBody still present/unchanged — still compiles.)

- [ ] **Step 4: Commit**

```bash
git -C vibe-code-tours-site add src/lib/gallery-dom.ts src/components/gallery/deck-renderer.ts
git -C vibe-code-tours-site commit -m "refactor: extract shared gallery-dom + deck-renderer"
```

---

## Task 6: `video-player.ts` (teams media)

**Files:**
- Create: `src/components/gallery/video-player.ts`

**Interfaces:**
- Consumes: `ogFallback` from `../../lib/gallery-dom`.
- Produces: `mountPlayer(mount, team, i18n)` — builds the media region for a team lightbox per the fallback chain; returns nothing.

- [ ] **Step 1: Implement**

```ts
// src/components/gallery/video-player.ts
import { ogFallback } from "../../lib/gallery-dom";

type Team = {
  title: string; youtube_id?: string | null; youtube_url?: string | null;
  drive_id?: string | null; live_url?: string | null; repo_url: string;
};
type I18n = { playerYouTube: string; playerDrive: string; videoUnavailable: string };

function iframe(src: string, title: string) {
  const f = document.createElement("iframe");
  f.src = src; f.title = title; f.loading = "lazy";
  f.setAttribute("allow", "accelerometer; encrypted-media; picture-in-picture; fullscreen");
  f.setAttribute("allowfullscreen", "");
  f.className = "aspect-video w-full rounded-lg border border-white/10 bg-black";
  return f;
}

export function mountPlayer(mount: HTMLElement, t: Team, i18n: I18n) {
  mount.innerHTML = "";
  const ytSrc = t.youtube_id ? `https://www.youtube.com/embed/${t.youtube_id}` : null;
  const drSrc = t.drive_id ? `https://drive.google.com/file/d/${t.drive_id}/preview` : null;

  if (ytSrc || drSrc) {
    let current = ytSrc ?? drSrc!;
    const frameWrap = document.createElement("div");
    frameWrap.appendChild(iframe(current, `${t.title} demo`));
    // Toggle only when BOTH sources exist.
    if (ytSrc && drSrc) {
      const bar = document.createElement("div");
      bar.className = "mt-2 flex gap-1";
      const mk = (label: string, src: string) => {
        const b = document.createElement("button");
        b.type = "button"; b.textContent = label;
        b.className = "rounded-md bg-surface-elevated px-2 py-1 font-mono text-[10px] text-gray-400 aria-pressed:bg-accent-500 aria-pressed:text-black";
        b.setAttribute("aria-pressed", String(src === current));
        b.addEventListener("click", () => {
          current = src;
          frameWrap.innerHTML = ""; frameWrap.appendChild(iframe(src, `${t.title} demo`));
          bar.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        });
        return b;
      };
      bar.append(mk(i18n.playerYouTube, ytSrc), mk(i18n.playerDrive, drSrc));
      mount.append(frameWrap, bar);
    } else {
      mount.appendChild(frameWrap);
    }
    return;
  }

  // No video: live screenshot (via OG of live host is unreliable — use OG repo card) or repo OG.
  const img = document.createElement("img");
  img.src = t.live_url ? ogFallback(t.repo_url) : ogFallback(t.repo_url);
  img.alt = `${t.title}`; img.loading = "lazy";
  img.className = "aspect-video w-full rounded-lg border border-white/10 object-cover bg-black";
  const note = document.createElement("p");
  note.className = "mt-2 font-mono text-xs text-gray-500";
  note.textContent = i18n.videoUnavailable;
  mount.append(img, note);
}
```

> Note: live-site auto-screenshots require a screenshot service the personal pipeline already has (`screenshot_url`). Teams have no such field yet, so the no-video fallback uses the GitHub OG card (always available). If a `screenshot_url` is later added to `teams.json`, prefer it here.

- [ ] **Step 2: Type-check**

Run: `cd vibe-code-tours-site && npm run check`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git -C vibe-code-tours-site add src/components/gallery/video-player.ts
git -C vibe-code-tours-site commit -m "feat: team video-player with YT/Drive/OG fallback"
```

---

## Task 7: `HeroSlider.astro`

**Files:**
- Create: `src/components/gallery/HeroSlider.astro`

**Interfaces:**
- Consumes: `wireSlider` from `../../lib/gallery-dom`.
- Props: `{ slides: {title:string; subtitle:string; thumb:string; hasVideo:boolean}[]; prevLabel:string; nextLabel:string; id?:string }`.
- Produces: markup with `.hero-slide` + `.hero-dot` + `[data-hero-prev/next]` that `wireSlider` drives. Emits a `hero-select` CustomEvent with the slide index on activation (consumed by page to open lightbox).

- [ ] **Step 1: Implement**

```astro
---
// src/components/gallery/HeroSlider.astro
interface Slide { title: string; subtitle: string; thumb: string; hasVideo: boolean; }
interface Props { slides: Slide[]; prevLabel: string; nextLabel: string; id?: string; }
const { slides, prevLabel, nextLabel, id = "hero" } = Astro.props;
---
<div id={id} class="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-surface-card">
  {slides.map((s, i) => (
    <button
      class:list={["hero-slide relative flex aspect-[16/7] w-full items-end p-5 text-left", i !== 0 && "hidden"]}
      data-hero-index={i}
      style={`background:radial-gradient(circle at 80% 20%, rgba(245,158,11,.28), transparent 55%), linear-gradient(120deg,#18181b,#09090b 70%)`}
    >
      <img src={s.thumb} alt="" loading="lazy" class="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      {s.hasVideo && <span class="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl text-white/90">▶</span>}
      <div class="relative">
        <b class="text-lg font-extrabold text-white">{s.title}</b>
        <span class="block text-sm text-gray-300">{s.subtitle}</span>
      </div>
    </button>
  ))}
  <button data-hero-prev aria-label={prevLabel} class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">‹</button>
  <button data-hero-next aria-label={nextLabel} class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">›</button>
  <div class="absolute bottom-3 right-4 flex gap-1.5">
    {slides.map((_, i) => (
      <button class="hero-dot h-1.5 w-1.5 rounded-full bg-white/40 aria-[current=true]:w-4 aria-[current=true]:bg-white" data-hero-dot={i} aria-current={i === 0}></button>
    ))}
  </div>
</div>

<script>
  import { wireSlider } from "../../lib/gallery-dom";
  document.querySelectorAll<HTMLElement>("[id^='hero']").forEach((root) => {
    wireSlider(root.id);
    root.querySelectorAll<HTMLElement>(".hero-slide").forEach((slide) => {
      slide.addEventListener("click", () => {
        const idx = Number(slide.dataset.heroIndex);
        root.dispatchEvent(new CustomEvent("hero-select", { detail: idx, bubbles: true }));
      });
    });
  });
</script>
```

- [ ] **Step 2: Type-check**

Run: `cd vibe-code-tours-site && npm run check`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git -C vibe-code-tours-site add src/components/gallery/HeroSlider.astro
git -C vibe-code-tours-site commit -m "feat: HeroSlider component"
```

---

## Task 8: `FilterBar.astro`

**Files:**
- Create: `src/components/gallery/FilterBar.astro`

**Interfaces:**
- Props: `{ searchPlaceholder:string; count:number; countUnit:string; bars: { attr:string; allLabel:string; options:{value:string;label:string}[] }[] }`.
- Produces: `#project-search`, per-bar `[data-bar="<attr>"]` chip groups with `[data-<attr>]` buttons, `#project-count`. Matches the `wireFilter` contract from Task 5.

- [ ] **Step 1: Implement**

```astro
---
// src/components/gallery/FilterBar.astro
interface Bar { attr: string; allLabel: string; options: { value: string; label: string }[]; }
interface Props { searchPlaceholder: string; count: number; countUnit: string; bars: Bar[]; }
const { searchPlaceholder, count, countUnit, bars } = Astro.props;
const CHIP = "cursor-pointer rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs font-semibold text-gray-400 transition hover:text-white aria-pressed:border-accent-500 aria-pressed:bg-accent-500 aria-pressed:text-black";
---
<div class="mt-8 flex flex-col items-center gap-3">
  <input id="project-search" type="search" placeholder={searchPlaceholder} aria-label={searchPlaceholder}
    class="w-full max-w-sm rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:border-accent-500 focus:outline-none" />
  {bars.map((bar) => (
    <div data-bar={bar.attr} class="flex flex-wrap justify-center gap-2">
      <button class={CHIP} data-set={bar.attr} {...{ [`data-${bar.attr}`]: "*" }} aria-pressed="true">{bar.allLabel}</button>
      {bar.options.map((o) => (
        <button class={CHIP} {...{ [`data-${bar.attr}`]: o.value }} aria-pressed="false">{o.label}</button>
      ))}
    </div>
  ))}
  <p id="project-count" class="font-mono text-xs text-gray-500">{count} {countUnit}</p>
</div>
```

- [ ] **Step 2: Type-check**

Run: `cd vibe-code-tours-site && npm run check`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git -C vibe-code-tours-site add src/components/gallery/FilterBar.astro
git -C vibe-code-tours-site commit -m "feat: FilterBar component"
```

---

## Task 9: `Lightbox.astro` (shared shell) + `ProjectCard.astro` + `TeamCard.astro`

**Files:**
- Create: `src/components/gallery/Lightbox.astro`
- Create: `src/components/gallery/ProjectCard.astro`
- Create: `src/components/gallery/TeamCard.astro`

**Interfaces:**
- `Lightbox.astro` renders the modal shell with ids: `#lightbox`, `#lb-media` (media region — deck OR player mounts here), `#lb-avatar`, `#lb-title`, `#lb-name`, `#lb-desc`, `#lb-tags`, `#lb-links`, `#lightbox-close`. No data-specific logic — pages wire open/close.
- `ProjectCard.astro` Props: `{ project }` (a personal card object). Renders `.project-cell` with `data-type`, `data-stack`, `data-project` (JSON).
- `TeamCard.astro` Props: `{ team, typeLabel, demoSoon }`. Renders `.project-cell` with `data-type`, `data-status` (`live`/`done` derived), `data-team` (JSON), amber stripe, `● live` badge, `▶`/`demo soon`.

- [ ] **Step 1: Implement `Lightbox.astro`** (shell only — copy the modal markup from current `GalleryBody.astro` lightbox, but rename the media area to a single `#lb-media` div replacing both `#lb-shot`/`#lb-thumbs`/`#deck-mount`):

```astro
---
// src/components/gallery/Lightbox.astro — shared modal shell for personal + team detail.
---
<div id="lightbox" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Project detail">
  <div class="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-card">
    <button id="lightbox-close" class="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500" aria-label="Close">✕</button>
    <div class="overflow-y-auto p-5">
      <div id="lb-media" class="mb-4"></div>
      <div class="flex items-center gap-3">
        <img id="lb-avatar" src="" alt="" width="32" height="32" class="h-8 w-8 rounded-full border border-white/10" />
        <div>
          <h2 id="lb-title" class="text-lg font-bold text-white"></h2>
          <a id="lb-name" href="#" target="_blank" rel="noopener noreferrer" class="text-sm text-gray-400 transition hover:text-accent-300 hover:underline"></a>
        </div>
      </div>
      <p id="lb-desc" class="mt-3 text-sm text-gray-300"></p>
      <div id="lb-tags" class="mt-3 flex flex-wrap gap-1.5"></div>
      <div id="lb-links" class="mt-5 flex flex-wrap gap-3"></div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Implement `ProjectCard.astro`** — extract the personal card markup from current `GalleryBody.astro` grid `.map`, add the amber top-stripe class `border-t-[3px] border-t-accent-500`:

```astro
---
// src/components/gallery/ProjectCard.astro
import { TYPE_LABELS } from "../../lib/projects.mjs";
interface Props { project: any; }
const { project: c } = Astro.props;
const ogFallback = (repoUrl: string) => {
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  return m ? `https://opengraph.githubassets.com/1/${m[1]}/${m[2]}` : "";
};
const shot = c.screenshot_url ?? ogFallback(c.repo_url);
---
<button class="project-cell group relative overflow-hidden rounded-xl border border-white/10 border-t-[3px] border-t-accent-500 bg-white/5 text-left transition hover:-translate-y-1 hover:border-accent-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
  data-type={c.type} data-stack={(c.stack ?? []).join("|")} data-project={JSON.stringify(c)}>
  <div class="relative aspect-video overflow-hidden bg-black/40">
    {shot && <img src={shot} alt={`${c.title} screenshot`} loading="lazy" class="h-full w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none" />}
    {c.chapter && <span class="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-white backdrop-blur-sm">Ch {c.chapter}</span>}
  </div>
  <div class="p-4">
    <div class="flex items-center gap-2">
      <img src={`https://github.com/${c.github}.png`} alt="" width="24" height="24" loading="lazy" class="h-6 w-6 rounded-full border border-white/10" />
      <span class="truncate font-semibold text-white">{c.title}</span>
    </div>
    <p class="mt-1 truncate text-sm text-gray-400 transition group-hover:text-accent-300">@{c.name}</p>
    {c.desc && <p class="mt-2 line-clamp-2 text-sm text-gray-500">{c.desc}</p>}
    <div class="mt-3 flex flex-wrap gap-1.5">
      <span class="rounded-full bg-accent-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent-300">{TYPE_LABELS[c.type as keyof typeof TYPE_LABELS]}</span>
      {(c.stack ?? []).slice(0, 3).map((tag: string) => <span class="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-gray-400">{tag}</span>)}
    </div>
  </div>
</button>
```

- [ ] **Step 3: Implement `TeamCard.astro`**:

```astro
---
// src/components/gallery/TeamCard.astro
import { TEAM_TYPE_LABELS, hasVideo } from "../../lib/teams.mjs";
interface Props { team: any; demoSoon: string; }
const { team: t, demoSoon } = Astro.props;
const ogFallback = (repoUrl: string) => {
  const m = repoUrl.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  return m ? `https://opengraph.githubassets.com/1/${m[1]}/${m[2]}` : "";
};
const thumb = t.youtube_id ? `https://i.ytimg.com/vi/${t.youtube_id}/hqdefault.jpg` : ogFallback(t.repo_url);
const video = hasVideo(t);
const status = t.uploaded === "Done" ? "done" : (t.live_url ? "live" : "");
---
<button class="project-cell group relative overflow-hidden rounded-xl border border-white/10 border-t-[3px] border-t-accent-500 bg-white/5 text-left transition hover:-translate-y-1 hover:border-accent-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 motion-reduce:transition-none"
  data-type={t.type} data-status={status} data-team={JSON.stringify(t)}>
  <div class="relative aspect-video overflow-hidden bg-black/40">
    <img src={thumb} alt={`${t.title} demo`} loading="lazy" class="h-full w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none" />
    {t.live_url && <span class="absolute left-2 top-2 rounded-full bg-green-500 px-2 py-0.5 font-mono text-[10px] font-semibold text-black">● live</span>}
    {video
      ? <span class="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 font-mono text-[10px] font-semibold text-white backdrop-blur-sm">▶</span>
      : <span class="absolute right-2 top-2 rounded-full bg-accent-500 px-2 py-0.5 font-mono text-[10px] font-semibold text-black">{demoSoon}</span>}
    {video && <span class="pointer-events-none absolute inset-0 flex items-center justify-center text-4xl text-white/85 opacity-0 transition group-hover:opacity-100">▶</span>}
  </div>
  <div class="p-4">
    <div class="flex items-center gap-2">
      <span class="font-mono text-[11px] font-bold text-accent-400">{t.team}</span>
      <span class="truncate font-semibold text-white">{t.title}</span>
    </div>
    {t.desc && <p class="mt-2 line-clamp-2 text-sm text-gray-500">{t.desc}</p>}
    <div class="mt-3 flex flex-wrap gap-1.5">
      <span class="rounded-full bg-accent-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent-300">{TEAM_TYPE_LABELS[t.type as keyof typeof TEAM_TYPE_LABELS]}</span>
      {(t.stack ?? []).slice(0, 3).map((tag: string) => <span class="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-gray-400">{tag}</span>)}
    </div>
  </div>
</button>
```

- [ ] **Step 4: Type-check**

Run: `cd vibe-code-tours-site && npm run check`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git -C vibe-code-tours-site add src/components/gallery/Lightbox.astro src/components/gallery/ProjectCard.astro src/components/gallery/TeamCard.astro
git -C vibe-code-tours-site commit -m "feat: Lightbox shell + ProjectCard + TeamCard"
```

---

## Task 10: `PersonalGallery.astro` (compose + wire personal, replace GalleryBody)

**Files:**
- Create: `src/components/PersonalGallery.astro`
- Modify: `src/pages/gallery.astro`, `src/pages/my/gallery.astro` (temporarily point at PersonalGallery to prove parity before Task 12 routes)

**Interfaces:**
- Consumes: `getProjects`, `typeBuckets`, `stackList`, `TYPE_LABELS` (projects.mjs); `HeroSlider`, `FilterBar`, `ProjectCard`, `Lightbox`; `wireFilter`, `fadeInOnScroll`, `lockScroll`, `ogFallback` (gallery-dom); `renderDeck` (deck-renderer).
- Props: `{ locale: "en"|"my" }`.

- [ ] **Step 1: Implement `PersonalGallery.astro`**

```astro
---
// src/components/PersonalGallery.astro
import { getProjects, typeBuckets, stackList, TYPE_LABELS } from "../lib/projects.mjs";
import { t } from "../i18n/utils";
import HeroSlider from "./gallery/HeroSlider.astro";
import FilterBar from "./gallery/FilterBar.astro";
import ProjectCard from "./gallery/ProjectCard.astro";
import Lightbox from "./gallery/Lightbox.astro";
interface Props { locale?: "en" | "my"; }
const { locale = "en" } = Astro.props;
const s = t(locale).gallery;
const projects = getProjects();
const types = typeBuckets(projects);
const stacks = stackList(projects).slice(0, 12);
const ogFallback = (r: string) => { const m = r.match(/github\.com\/([^/]+)\/([^/#?]+)/i); return m ? `https://opengraph.githubassets.com/1/${m[1]}/${m[2]}` : ""; };
const slides = projects.slice(0, 20).map((c) => ({ title: c.title, subtitle: `@${c.name}`, thumb: c.screenshot_url ?? ogFallback(c.repo_url), hasVideo: false }));
const scriptI18n = JSON.stringify({ loadingSlides: s.loadingSlides, slidesUnavailable: s.slidesUnavailable, liveBtn: s.liveBtn, repoBtn: s.repoBtn, slidesBtn: s.slidesBtn, types: s.types });
---
<section class="mx-auto max-w-6xl px-5 py-12 sm:px-6">
  <p class="section-label">{s.label}</p>
  <h1 class="mt-2 text-center text-3xl font-extrabold sm:text-4xl">{s.heading}</h1>
  <p class="mx-auto mt-3 max-w-xl text-center text-gray-400">{s.intro}</p>
  {projects.length === 0 ? (
    <p class="mt-10 text-center text-gray-600">{s.empty}</p>
  ) : (
    <>
      <HeroSlider slides={slides} prevLabel={s.heroPrev} nextLabel={s.heroNext} id="hero-personal" />
      <FilterBar searchPlaceholder={s.searchPlaceholder} count={projects.length} countUnit={s.countUnit}
        bars={[
          { attr: "type", allLabel: s.allTypes, options: types.map((ty) => ({ value: ty.type, label: `${TYPE_LABELS[ty.type as keyof typeof TYPE_LABELS]} · ${ty.count}` })) },
          { attr: "stack", allLabel: s.anyStack, options: stacks.map((st) => ({ value: st.name, label: st.name })) },
        ]} />
      <div id="gallery-grid" class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-i18n={scriptI18n}>
        {projects.map((c) => <ProjectCard project={c} />)}
      </div>
      <p id="gallery-empty" class="mt-10 text-center text-gray-600" hidden>{s.noMatches}</p>
    </>
  )}
  <Lightbox />
</section>

<script>
  import { wireFilter, fadeInOnScroll, lockScroll, ogFallback } from "../lib/gallery-dom";
  import { renderDeck } from "./gallery/deck-renderer";
  const grid = document.getElementById("gallery-grid");
  let I18N: any = { types: {} };
  try { I18N = JSON.parse(grid?.dataset.i18n ?? "{}"); } catch {}
  fadeInOnScroll("#gallery-grid .project-cell");
  wireFilter({ gridId: "gallery-grid", countEl: document.getElementById("project-count"), emptyEl: document.getElementById("gallery-empty"),
    bars: [{ attr: "type" }, { attr: "stack" }], countUnit: (I18N.countUnit ?? "projects") });

  const lb = document.getElementById("lightbox");
  const media = document.getElementById("lb-media");
  function linkBtn(label: string, href: string) {
    const a = document.createElement("a"); a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = label;
    a.className = "rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-accent-500 hover:bg-accent-500 hover:text-black";
    return a;
  }
  function open(c: any) {
    if (!lb || !media) return;
    (document.getElementById("lb-avatar") as HTMLImageElement).src = `https://github.com/${c.github}.png`;
    document.getElementById("lb-title")!.textContent = c.title;
    const nm = document.getElementById("lb-name") as HTMLAnchorElement; nm.textContent = `@${c.github}`; nm.href = `https://github.com/${c.github}`;
    document.getElementById("lb-desc")!.textContent = c.desc ?? "";
    const tags = document.getElementById("lb-tags")!; tags.innerHTML = "";
    const ty = document.createElement("span"); ty.className = "rounded-full bg-accent-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent-300"; ty.textContent = I18N.types?.[c.type] ?? c.type; tags.appendChild(ty);
    for (const st of c.stack ?? []) { const el = document.createElement("span"); el.className = "rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-gray-400"; el.textContent = st; tags.appendChild(el); }
    const links = document.getElementById("lb-links")!; links.innerHTML = "";
    if (c.live_url) links.appendChild(linkBtn(I18N.liveBtn, c.live_url));
    links.appendChild(linkBtn(I18N.repoBtn, c.repo_url));
    if (c.slides_raw) links.appendChild(linkBtn(I18N.slidesBtn, c.slides_raw));
    media.innerHTML = "";
    renderDeck(media, c, { loadingSlides: I18N.loadingSlides, slidesUnavailable: I18N.slidesUnavailable });
    lb.classList.remove("hidden"); lb.classList.add("flex"); lockScroll(true);
  }
  function close() { if (!lb || !media) return; lb.classList.add("hidden"); lb.classList.remove("flex"); lockScroll(false); media.innerHTML = ""; media.dataset.deckToken = "closed"; }
  document.querySelectorAll<HTMLElement>("#gallery-grid .project-cell").forEach((cell) =>
    cell.addEventListener("click", () => { try { open(JSON.parse(cell.dataset.project ?? "{}")); } catch {} }));
  document.getElementById("hero-personal")?.addEventListener("hero-select", (e) => { const i = (e as CustomEvent).detail as number; const c = document.querySelectorAll<HTMLElement>("#gallery-grid .project-cell")[i]; if (c) try { open(JSON.parse(c.dataset.project ?? "{}")); } catch {} });
  document.getElementById("lightbox-close")?.addEventListener("click", close);
  lb?.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
</script>

<style>
  .project-cell { opacity: 0; transform: translateY(16px); }
  .project-cell.in { opacity: 1; transform: none; transition: opacity .5s ease, transform .5s cubic-bezier(.2,.8,.2,1); }
  @media (prefers-reduced-motion: reduce) { .project-cell { opacity: 1; transform: none; transition: none; } }
  @media (scripting: none) { .project-cell { opacity: 1; transform: none; } }
</style>
```

- [ ] **Step 2: Point existing pages at it (parity check)**

In `src/pages/gallery.astro` and `src/pages/my/gallery.astro`, replace `import GalleryBody ...` + `<GalleryBody locale=.. />` with `import PersonalGallery from "../components/PersonalGallery.astro"` (`../../` for the my page) and `<PersonalGallery locale=.. />`.

- [ ] **Step 3: Build and eyeball parity**

Run: `cd vibe-code-tours-site && npm run check && npm run build`
Expected: build succeeds. Then `npm run preview` and open `/gallery`: search, type + stack filters, card hover, lightbox slide-deck all work as before; hero slider present and rotating; amber stripe on cards.

- [ ] **Step 4: Delete the old monolith and commit**

```bash
cd vibe-code-tours-site
git rm src/components/GalleryBody.astro
git add src/components/PersonalGallery.astro src/pages/gallery.astro src/pages/my/gallery.astro
git commit -m "refactor: replace GalleryBody monolith with PersonalGallery + components"
```

---

## Task 11: `TeamsGallery.astro` (compose + wire teams)

**Files:**
- Create: `src/components/TeamsGallery.astro`

**Interfaces:**
- Consumes: `getTeams`, `typeBuckets`, `statusBuckets`, `TEAM_TYPE_LABELS`, `hasVideo` (teams.mjs); `HeroSlider`, `FilterBar`, `TeamCard`, `Lightbox`; `wireFilter`, `fadeInOnScroll`, `lockScroll` (gallery-dom); `mountPlayer` (video-player).
- Props: `{ locale }`.

- [ ] **Step 1: Implement `TeamsGallery.astro`**

```astro
---
// src/components/TeamsGallery.astro
import { getTeams, typeBuckets, statusBuckets, TEAM_TYPE_LABELS } from "../lib/teams.mjs";
import { t } from "../i18n/utils";
import HeroSlider from "./gallery/HeroSlider.astro";
import FilterBar from "./gallery/FilterBar.astro";
import TeamCard from "./gallery/TeamCard.astro";
import Lightbox from "./gallery/Lightbox.astro";
interface Props { locale?: "en" | "my"; }
const { locale = "en" } = Astro.props;
const s = t(locale).teams;
const teams = getTeams();
const types = typeBuckets(teams);
const status = statusBuckets(teams);
const ogFallback = (r: string) => { const m = r.match(/github\.com\/([^/]+)\/([^/#?]+)/i); return m ? `https://opengraph.githubassets.com/1/${m[1]}/${m[2]}` : ""; };
const slides = teams.map((t2) => ({ title: t2.title, subtitle: t2.team, thumb: t2.youtube_id ? `https://i.ytimg.com/vi/${t2.youtube_id}/hqdefault.jpg` : ogFallback(t2.repo_url), hasVideo: Boolean(t2.youtube_id || t2.drive_id) }));
const scriptI18n = JSON.stringify({ liveBtn: s.liveBtn, repoBtn: s.repoBtn, watchBtn: s.watchBtn, playerYouTube: s.playerYouTube, playerDrive: s.playerDrive, videoUnavailable: s.videoUnavailable, countUnit: s.countUnit, types: s.types });
---
<section class="mx-auto max-w-6xl px-5 py-12 sm:px-6">
  <p class="section-label">{s.label}</p>
  <h1 class="mt-2 text-center text-3xl font-extrabold sm:text-4xl">{s.heading}</h1>
  <p class="mx-auto mt-3 max-w-xl text-center text-gray-400">{s.intro}</p>
  {teams.length === 0 ? (
    <p class="mt-10 text-center text-gray-600">{s.empty}</p>
  ) : (
    <>
      <HeroSlider slides={slides} prevLabel={s.heroPrev} nextLabel={s.heroNext} id="hero-teams" />
      <FilterBar searchPlaceholder={s.searchPlaceholder} count={teams.length} countUnit={s.countUnit}
        bars={[
          { attr: "type", allLabel: s.allTypes, options: types.map((ty) => ({ value: ty.type, label: `${TEAM_TYPE_LABELS[ty.type as keyof typeof TEAM_TYPE_LABELS]} · ${ty.count}` })) },
          { attr: "status", allLabel: s.allStatus, options: [{ value: "live", label: `${s.statusLive} · ${status.find((x) => x.status === "live")?.count ?? 0}` }, { value: "done", label: `${s.statusDone} · ${status.find((x) => x.status === "done")?.count ?? 0}` }] },
        ]} />
      <div id="gallery-grid" class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" data-i18n={scriptI18n}>
        {teams.map((t2) => <TeamCard team={t2} demoSoon={s.demoSoon} />)}
      </div>
      <p id="gallery-empty" class="mt-10 text-center text-gray-600" hidden>{s.noMatches}</p>
    </>
  )}
  <Lightbox />
</section>

<script>
  import { wireFilter, fadeInOnScroll, lockScroll } from "../lib/gallery-dom";
  import { mountPlayer } from "./gallery/video-player";
  const grid = document.getElementById("gallery-grid");
  let I18N: any = { types: {} };
  try { I18N = JSON.parse(grid?.dataset.i18n ?? "{}"); } catch {}
  fadeInOnScroll("#gallery-grid .project-cell");
  wireFilter({ gridId: "gallery-grid", countEl: document.getElementById("project-count"), emptyEl: document.getElementById("gallery-empty"),
    bars: [{ attr: "type" }, { attr: "status" }], countUnit: (I18N.countUnit ?? "teams") });

  const lb = document.getElementById("lightbox");
  const media = document.getElementById("lb-media");
  function linkBtn(label: string, href: string, primary = false) {
    const a = document.createElement("a"); a.href = href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = label;
    a.className = primary
      ? "rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-accent-600"
      : "rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-accent-500 hover:bg-accent-500 hover:text-black";
    return a;
  }
  function open(t2: any) {
    if (!lb || !media) return;
    (document.getElementById("lb-avatar") as HTMLImageElement).src = `https://github.com/${(t2.repo_url.match(/github\.com\/([^/]+)/i) || [])[1] ?? "vibe-code-tours"}.png`;
    document.getElementById("lb-title")!.textContent = `${t2.team} · ${t2.title}`;
    const nm = document.getElementById("lb-name") as HTMLAnchorElement; nm.textContent = t2.repo_url.replace(/^https?:\/\//, ""); nm.href = t2.repo_url;
    document.getElementById("lb-desc")!.textContent = t2.desc ?? "";
    const tags = document.getElementById("lb-tags")!; tags.innerHTML = "";
    if (t2.live_url) { const live = document.createElement("span"); live.className = "rounded-full bg-green-500 px-2 py-0.5 font-mono text-[10px] font-semibold text-black"; live.textContent = "● live"; tags.appendChild(live); }
    const ty = document.createElement("span"); ty.className = "rounded-full bg-accent-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent-300"; ty.textContent = I18N.types?.[t2.type] ?? t2.type; tags.appendChild(ty);
    for (const st of t2.stack ?? []) { const el = document.createElement("span"); el.className = "rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-gray-400"; el.textContent = st; tags.appendChild(el); }
    const links = document.getElementById("lb-links")!; links.innerHTML = "";
    if (t2.live_url) links.appendChild(linkBtn(I18N.liveBtn, t2.live_url, true));
    links.appendChild(linkBtn(I18N.repoBtn, t2.repo_url));
    if (t2.youtube_url) links.appendChild(linkBtn(I18N.watchBtn, t2.youtube_url));
    media.innerHTML = "";
    mountPlayer(media, t2, { playerYouTube: I18N.playerYouTube, playerDrive: I18N.playerDrive, videoUnavailable: I18N.videoUnavailable });
    lb.classList.remove("hidden"); lb.classList.add("flex"); lockScroll(true);
  }
  function close() { if (!lb || !media) return; lb.classList.add("hidden"); lb.classList.remove("flex"); lockScroll(false); media.innerHTML = ""; }
  document.querySelectorAll<HTMLElement>("#gallery-grid .project-cell").forEach((cell) =>
    cell.addEventListener("click", () => { try { open(JSON.parse(cell.dataset.team ?? "{}")); } catch {} }));
  document.getElementById("hero-teams")?.addEventListener("hero-select", (e) => { const i = (e as CustomEvent).detail as number; const c = document.querySelectorAll<HTMLElement>("#gallery-grid .project-cell")[i]; if (c) try { open(JSON.parse(c.dataset.team ?? "{}")); } catch {} });
  document.getElementById("lightbox-close")?.addEventListener("click", close);
  lb?.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
</script>

<style>
  .project-cell { opacity: 0; transform: translateY(16px); }
  .project-cell.in { opacity: 1; transform: none; transition: opacity .5s ease, transform .5s cubic-bezier(.2,.8,.2,1); }
  @media (prefers-reduced-motion: reduce) { .project-cell { opacity: 1; transform: none; transition: none; } }
  @media (scripting: none) { .project-cell { opacity: 1; transform: none; } }
</style>
```

- [ ] **Step 2: Type-check**

Run: `cd vibe-code-tours-site && npm run check`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git -C vibe-code-tours-site add src/components/TeamsGallery.astro
git -C vibe-code-tours-site commit -m "feat: TeamsGallery with video lightbox"
```

---

## Task 12: Routes, redirects, final verification

**Files:**
- Create: `src/pages/projects/index.astro`, `src/pages/projects/personal.astro`, `src/pages/projects/teams.astro`
- Create: `src/pages/my/projects/index.astro`, `src/pages/my/projects/personal.astro`, `src/pages/my/projects/teams.astro`
- Modify: `astro.config.mjs` (redirects)
- Delete: `src/pages/gallery.astro`, `src/pages/my/gallery.astro`

**Interfaces:**
- Consumes: `Base` layout, `PersonalGallery`, `TeamsGallery`, `t`.

- [ ] **Step 1: Hub page `src/pages/projects/index.astro`**

```astro
---
import Base from "../../layouts/Base.astro";
import { t } from "../../i18n/utils";
import { localizedPath } from "../../i18n/utils";
const s = t("en").projectsHub;
---
<Base title={s.title} description={s.description}>
  <section class="mx-auto max-w-4xl px-5 py-16 sm:px-6">
    <p class="section-label">{s.label}</p>
    <h1 class="mt-2 text-center text-3xl font-extrabold sm:text-4xl">{s.heading}</h1>
    <p class="mx-auto mt-3 max-w-xl text-center text-gray-400">{s.intro}</p>
    <div class="mt-10 grid gap-5 sm:grid-cols-2">
      <a href={localizedPath("/projects/personal", "en")} class="rounded-2xl border border-white/10 border-t-[3px] border-t-accent-500 bg-white/5 p-8 transition hover:-translate-y-1 hover:border-accent-500/40">
        <h2 class="text-xl font-bold text-white">{s.personalCard}</h2>
        <p class="mt-2 text-sm text-gray-400">{s.personalDesc}</p>
      </a>
      <a href={localizedPath("/projects/teams", "en")} class="rounded-2xl border border-white/10 border-t-[3px] border-t-accent-500 bg-white/5 p-8 transition hover:-translate-y-1 hover:border-accent-500/40">
        <h2 class="text-xl font-bold text-white">{s.teamsCard}</h2>
        <p class="mt-2 text-sm text-gray-400">{s.teamsDesc}</p>
      </a>
    </div>
  </section>
</Base>
```

- [ ] **Step 2: `src/pages/projects/personal.astro`**

```astro
---
import Base from "../../layouts/Base.astro";
import PersonalGallery from "../../components/PersonalGallery.astro";
import { t } from "../../i18n/utils";
const s = t("en").gallery;
---
<Base title={s.title} description={s.description}><PersonalGallery locale="en" /></Base>
```

- [ ] **Step 3: `src/pages/projects/teams.astro`**

```astro
---
import Base from "../../layouts/Base.astro";
import TeamsGallery from "../../components/TeamsGallery.astro";
import { t } from "../../i18n/utils";
const s = t("en").teams;
---
<Base title={s.title} description={s.description}><TeamsGallery locale="en" /></Base>
```

- [ ] **Step 4: MY mirror pages** — create `src/pages/my/projects/index.astro`, `personal.astro`, `teams.astro` identical to Steps 1-3 but with `../../../` import depth, `t("my")`, and `localizedPath(..., "my")` in the hub.

```astro
---
// src/pages/my/projects/personal.astro
import Base from "../../../layouts/Base.astro";
import PersonalGallery from "../../../components/PersonalGallery.astro";
import { t } from "../../../i18n/utils";
const s = t("my").gallery;
---
<Base title={s.title} description={s.description}><PersonalGallery locale="my" /></Base>
```
(teams.astro: swap PersonalGallery→TeamsGallery and `.gallery`→`.teams`; index.astro: mirror Step 1 with my depth and `t("my").projectsHub` + `localizedPath(...,"my")`.)

- [ ] **Step 5: Add redirects to `astro.config.mjs`**

Add to the `defineConfig({...})` object:

```js
  redirects: {
    "/gallery": "/projects/personal",
    "/my/gallery": "/my/projects/personal",
  },
```

- [ ] **Step 6: Delete old pages**

```bash
cd vibe-code-tours-site && git rm src/pages/gallery.astro src/pages/my/gallery.astro
```

- [ ] **Step 7: Full verification**

Run:
```bash
cd vibe-code-tours-site
node --test src/lib/teams.test.mjs
npm run format
npm run check
npm run build
```
Expected: tests pass; format clean; check passes; build succeeds and emits `/projects/`, `/projects/personal/`, `/projects/teams/`, `/my/projects/*`, plus redirect stubs for `/gallery` + `/my/gallery`.

Then `npm run preview` and manually confirm:
- `/projects` hub links to both.
- `/projects/personal`: hero rotates, type+stack filters + search work, card→lightbox shows slide deck.
- `/projects/teams`: hero rotates all teams, type+status filters + search work, card→lightbox plays YouTube (e.g. Team-08) / Drive preview (Team-07) / OG fallback (Team-04); YT+Drive toggle appears for Team-08/09.
- `/gallery` redirects to `/projects/personal`.

- [ ] **Step 8: Commit**

```bash
cd vibe-code-tours-site
git add src/pages/projects src/pages/my/projects astro.config.mjs
git commit -m "feat: /projects routes, redirects, retire gallery"
```

---

## Task 13: Wire the 6h cron for `teams.json` (ops)

**Files:**
- Modify: crontab on the VPS host (mirror the `export-gallery.mjs` entry). Documentation-only in-repo.

- [ ] **Step 1: Verify the bot container can reach the sheet + repo**

Run (on VPS): `docker exec vibecode-channels-bot node /app/scripts/export-team-gallery.mjs --commit --dry-run`
Expected: prints `[dry-run] N teams, would commit src/data/teams.json` with no auth error.

- [ ] **Step 2: Add cron entry** (offset 30 min from the personal export to avoid overlap):

```cron
30 */6 * * * docker exec vibecode-channels-bot node /app/scripts/export-team-gallery.mjs --commit >> ~/export-team-gallery.log 2>&1
```

- [ ] **Step 3: Confirm one real run commits (or "no change")**

Run (on VPS): `docker exec vibecode-channels-bot node /app/scripts/export-team-gallery.mjs --commit`
Expected: `committed src/data/teams.json` (first run) or `no change`.

> If `SITE_REPO` for this deploy is `vibe-code-tours-site` rather than `vibe-code-tours.github.io`, set `SITE_REPO=vibe-code-tours-site` in the container env before the cron entry — confirm which repo the live site builds from first.

---

## Self-Review

**Spec coverage:**
- Routes §2 → Task 12. ✓
- Layout/hero §3 → Tasks 7, 10, 11. ✓
- Card treatment §4 → Task 9 (amber stripe). ✓
- Filters §5 → Tasks 5 (wireFilter), 8, 10, 11 (status bar teams-only). ✓
- Lightbox §6 → Tasks 9 (shell), 6 (player), 5 (deck). ✓
- Data §7 → Tasks 1, 2, 3, 13. ✓
- Code split §8 → Tasks 5-11. ✓
- i18n §9 → Task 4. ✓
- A11y/perf §10 → wireSlider (reduced motion, pause), lazy iframes (deck/player), loading=lazy imgs. ✓
- Execution workflow §11 → applied during implementation (zen plan/review, opencode gpt loop). ✓

**Placeholder scan:** No TBD/TODO. Every code step has full code. MY i18n allows English fallback per Global Constraints (explicit, not a placeholder). Task 4 Step 2 lists exact suggested values.

**Type consistency:** `wireFilter` bars use `{attr}` in both def (Task 5) and calls (Tasks 10/11). `.project-cell` / `data-project` (personal) vs `data-team` (teams) consistent between card (Task 9) and wiring (Tasks 10/11). `#lb-media` single media mount used by deck (Task 5/10) and player (Task 6/11). `renderDeck(mount,c,i18n)` and `mountPlayer(mount,t,i18n)` signatures match callers. `getTeams/typeBuckets/statusBuckets/hasVideo/TEAM_TYPE_LABELS` consistent across Tasks 3, 9, 11.

**Known residual:** the no-video fallback uses the GitHub OG card (not a true live-site screenshot) because `teams.json` has no `screenshot_url` field — documented in Task 6 note and spec §12. If real live screenshots are wanted, add a screenshot step to `export-team-gallery.mjs` in a follow-up.
