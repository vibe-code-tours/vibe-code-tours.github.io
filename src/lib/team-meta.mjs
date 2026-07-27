// Build-time reader for metadata/team-NN.yaml — the file each team PRs to own its
// identity (tagline, links, logo). teams.json stays the bot-generated base; a
// non-empty yaml field wins over it. See metadata/README.md.
//
// This module touches the filesystem, so it must only ever be imported from
// Astro frontmatter or a node script — never from a client-side <script>.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import yaml from "js-yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const META_DIR = resolve(ROOT, "metadata");
const LOGO_DIR = resolve(ROOT, "public/logos");

// Above this, an "svg" is a traced raster, not a mark — team-06 ships 1.8 MB.
// Never hand one of those to a 24px card badge; fall through to the pngs.
export const MAX_SVG_BYTES = 40 * 1024;

const SIZES = { small: "64x64", medium: "128x128", large: "256x256" };
// Fallback chain per requested size: vector first, then nearest available raster.
const ORDER = {
  small: ["svg", "small", "medium", "large"],
  medium: ["svg", "medium", "large", "small"],
  large: ["svg", "large", "medium", "small"],
};

const pad = (no) => String(no).padStart(2, "0");

const isBlank = (v) =>
  v == null || v === "" || (Array.isArray(v) && v.length === 0);

/** Google Drive share links carry the file id in the path. */
export function driveId(url) {
  const m = typeof url === "string" && url.match(/\/d\/([^/?#]+)/);
  return m ? m[1] : null;
}

/**
 * Public URLs for the logo files a team actually shipped, by tier.
 * The yaml stubs claim all three png sizes whether or not they exist, so the
 * disk — not the yaml — decides. Missing tiers come back null.
 */
export function logoVariants(no, dir = LOGO_DIR) {
  const file = (name) =>
    existsSync(resolve(dir, name)) ? `/logos/${name}` : null;
  const svgName = `team-${pad(no)}.svg`;
  const svgPath = resolve(dir, svgName);
  const svg =
    existsSync(svgPath) && statSync(svgPath).size <= MAX_SVG_BYTES
      ? `/logos/${svgName}`
      : null;
  return {
    svg,
    small: file(`team-${pad(no)}-${SIZES.small}.png`),
    medium: file(`team-${pad(no)}-${SIZES.medium}.png`),
    large: file(`team-${pad(no)}-${SIZES.large}.png`),
  };
}

/** Best available file for a slot, or null when the team shipped nothing. */
export function pickLogo(variants, size = "small") {
  if (!variants) return null;
  for (const key of ORDER[size] ?? ORDER.small) {
    if (variants[key]) return variants[key];
  }
  return null;
}

/** Re-root every variant on the configured Astro `base`. */
export function prefixLogo(logo, base) {
  if (!logo) return null;
  const b = (base || "").replace(/\/$/, "");
  const out = {};
  for (const [k, v] of Object.entries(logo)) out[k] = v ? `${b}${v}` : v;
  return out;
}

/** One metadata/team-NN.yaml, flattened to the shape teams.json uses. */
export function normalizeMeta(raw, logoDir = LOGO_DIR) {
  const video = raw.video || {};
  const fields = {
    team: raw.team,
    title: raw.title || raw.name,
    desc: raw.desc,
    tagline: raw.tagline,
    type: raw.type,
    stack: raw.stack,
    live_url: raw.live_url,
    repo_url: raw.repo_url,
    youtube_id: video.youtube_id,
    youtube_url: video.youtube_url,
    drive_url: video.drive_url,
    drive_id: driveId(video.drive_url),
  };
  const out = { team_no: raw.team_no };
  for (const [k, v] of Object.entries(fields)) if (!isBlank(v)) out[k] = v;
  out.logo = logoVariants(raw.team_no, logoDir);
  return out;
}

/** team_no -> normalized metadata, for every yaml in metadata/. */
export function loadTeamMeta(metaDir = META_DIR, logoDir = LOGO_DIR) {
  const byNo = new Map();
  if (!existsSync(metaDir)) return byNo;
  for (const f of readdirSync(metaDir).filter((n) =>
    /^team-\d+\.yaml$/.test(n),
  )) {
    const raw = yaml.load(readFileSync(resolve(metaDir, f), "utf8"));
    if (!raw || raw.team_no == null) {
      throw new Error(`metadata/${f}: missing team_no`);
    }
    byNo.set(raw.team_no, normalizeMeta(raw, logoDir));
  }
  return byNo;
}

/**
 * Overlay metadata on the teams.json rows. Only non-empty yaml fields win, so a
 * team that has not filled its stub cannot blank out bot-harvested data.
 * A yaml with no matching teams.json row is ignored — teams.json owns the roster.
 *
 * @template T
 * @param {T[]} teams
 * @param {Map<number, Record<string, any>>} [meta]
 * @returns {(T & { logo: Record<string, string | null> | null, tagline?: string })[]}
 */
export function mergeTeamMeta(teams, meta = loadTeamMeta()) {
  return teams.map((t) => {
    const m = meta.get(t.team_no);
    return m ? { ...t, ...m, logo: m.logo ?? null } : { ...t, logo: null };
  });
}
