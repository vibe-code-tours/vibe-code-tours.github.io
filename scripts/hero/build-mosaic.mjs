// Build a single composite avatar-mosaic image for the homepage hero.
// One optimized WebP instead of a video or 155 live <img> — best LCP, always
// current (re-run when builders change), accessible (static by default).
//
//   node scripts/hero/build-mosaic.mjs
//   npm run hero:mosaic
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import yaml from "js-yaml";
import sharp from "sharp";

const here = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "../..");
const BUILDERS_DIR = path.join(ROOT, "src/content/builders");
const AVATAR_CACHE = path.join(here, "avatars");
const OUT = path.join(ROOT, "public/hero-mosaic.webp");

const TILE = 110; // px per avatar
const COLS = 20;
const GAP = 4;
const AV_SIZE = 120; // fetch size
const CONCURRENCY = 16;
const FETCH_TIMEOUT_MS = 8000;

// Deterministic shuffle (mulberry32) so the layout is stable between runs.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(arr, seed) {
  const rng = mulberry32(seed);
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function loadHandles() {
  const handles = [];
  for (const f of fs
    .readdirSync(BUILDERS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()) {
    const src = fs
      .readFileSync(path.join(BUILDERS_DIR, f), "utf8")
      .replace(/\r\n/g, "\n");
    const m = src.match(/^---\n([\s\S]*?)\n---/);
    if (!m) {
      console.warn(`skip ${f}: no frontmatter`);
      continue;
    }
    let data;
    try {
      data = yaml.load(m[1]);
    } catch {
      console.warn(`skip ${f}: bad YAML`);
      continue;
    }
    const h = String(data?.github ?? "").trim();
    if (/^[A-Za-z0-9-]+$/.test(h)) handles.push(h);
    else console.warn(`skip ${f}: invalid github handle "${h}"`);
  }
  return handles;
}

// Fetch (with timeout) into cache; returns a Buffer or null. Never throws.
async function avatarBuffer(handle) {
  const dest = path.join(AVATAR_CACHE, `${handle}.png`);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    try {
      return fs.readFileSync(dest);
    } catch {
      /* fall through to refetch */
    }
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://github.com/${encodeURIComponent(handle)}.png?size=${AV_SIZE}`,
      {
        redirect: "follow",
        signal: ctrl.signal,
      },
    );
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return null;
    fs.writeFileSync(dest, buf);
    return buf;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Bounded-concurrency map.
async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return out;
}

async function run() {
  const handles = shuffle(loadHandles(), 0xa11ce);
  if (handles.length === 0) {
    console.error("no valid builders found — aborting (mosaic unchanged)");
    process.exit(1);
  }
  fs.mkdirSync(AVATAR_CACHE, { recursive: true });

  const rows = Math.ceil(handles.length / COLS);
  const width = COLS * TILE;
  const height = rows * TILE;

  // amber-tinted fallback tile for missing/corrupt avatars
  const fallback = await sharp({
    create: {
      width: AV_SIZE,
      height: AV_SIZE,
      channels: 3,
      background: { r: 26, g: 18, b: 6 },
    },
  })
    .png()
    .toBuffer();

  const buffers = await pool(handles, CONCURRENCY, (h) => avatarBuffer(h));

  let ok = 0;
  const composites = await Promise.all(
    handles.map(async (h, i) => {
      let src = buffers[i];
      let tile;
      try {
        if (!src) throw new Error("no avatar");
        tile = await sharp(src)
          .resize(TILE - GAP, TILE - GAP, { fit: "cover" })
          .toBuffer();
        ok++;
      } catch {
        // corrupt or missing → fallback tile (drop stale cache so next run retries)
        try {
          const dest = path.join(AVATAR_CACHE, `${h}.png`);
          if (src && fs.existsSync(dest)) fs.unlinkSync(dest);
        } catch {
          /* ignore */
        }
        tile = await sharp(fallback)
          .resize(TILE - GAP, TILE - GAP, { fit: "cover" })
          .toBuffer();
      }
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      return {
        input: tile,
        left: col * TILE + GAP / 2,
        top: row * TILE + GAP / 2,
      };
    }),
  );

  await sharp({
    create: { width, height, channels: 3, background: { r: 9, g: 9, b: 11 } },
  })
    .composite(composites)
    .webp({ quality: 72 })
    .toFile(OUT);

  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(
    `✓ hero-mosaic.webp — ${handles.length} avatars (${ok} real), ${width}x${height}, ${kb} KB`,
  );
}

run().catch((e) => {
  console.error("mosaic build failed:", e.message);
  process.exit(1);
});
