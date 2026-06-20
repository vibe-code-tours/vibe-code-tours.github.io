// Sets up self-hosted Myanmar Unicode fonts in public/fonts/.
// Self-hosting (vs a third-party CDN) means no external request on page load,
// it works offline, and there is no privacy/availability dependency on jsDelivr.
// src/styles/global.css references these local files via @font-face.
//
// Primary body face: Pyidaungsu (Regular + Bold), shipped as .woff2 in
// public/fonts/pyidaungsu/ — the standard, most-legible Myanmar Unicode font.
// Optional display faces (saturngod collection, https://font.saturngod.net/)
// are fetched as .ttf on demand with --display.
//
// Run:
//   node scripts/setup-fonts.mjs            verify Pyidaungsu woff2 is present
//   node scripts/setup-fonts.mjs --display  also download the 3 display faces
//   node scripts/setup-fonts.mjs --force    re-download even if present
//
// Requires Node 18+ (uses global fetch). Cross-platform (pure node: APIs).
import { mkdir, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_DIR = join(__dirname, "..", "public", "fonts");

const CDN =
  "https://cdn.jsdelivr.net/gh/saturngod/myanmar-unicode-fonts@master/docs";
const MIN_BYTES = 1024; // a real font is far larger; guards against error pages.

// Primary body font: must already exist as woff2 (web-optimized, has Bold).
const REQUIRED = [
  { name: "Pyidaungsu Regular", file: "pyidaungsu/Pyidaungsu-Regular.woff2" },
  { name: "Pyidaungsu Bold", file: "pyidaungsu/Pyidaungsu-Bold.woff2" },
];

// Optional display/heading faces (only fetched with --display). .ttf is heavier
// than woff2; use these sparingly (headings/logo), not body text.
const DISPLAY = [
  {
    family: "MyanmarSquareLight",
    url: `${CDN}/unknown/MyanmarSquareLight.ttf`,
    file: "MyanmarSquareLight.ttf",
  },
  {
    family: "ThitSarShweSi",
    url: `${CDN}/PhoenixDigitalArt/ThitSarShweSi.ttf`,
    file: "ThitSarShweSi.ttf",
  },
  {
    family: "OneTypeChiangMai",
    url: `${CDN}/OneType/OneTypeChiangMai.ttf`,
    file: "OneTypeChiangMai.ttf",
  },
];

const FORCE = process.argv.includes("--force");
const WITH_DISPLAY = process.argv.includes("--display");

// Valid TrueType/OpenType + WOFF2 magic numbers (first 4 bytes).
const FONT_MAGICS = new Set([
  "00010000", // TrueType
  "74727565", // 'true'
  "4f54544f", // 'OTTO' (CFF/OpenType)
  "74746366", // 'ttcf' (collection)
  "774f4632", // 'wOF2' (WOFF2)
]);

function isValidFont(buf) {
  if (buf.length < MIN_BYTES) return false;
  return FONT_MAGICS.has(buf.subarray(0, 4).toString("hex"));
}

async function exists(p) {
  try {
    const s = await stat(p);
    return s.isFile() && s.size >= MIN_BYTES;
  } catch {
    return false;
  }
}

async function download(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  await mkdir(join(FONT_DIR, "pyidaungsu"), { recursive: true });

  let missing = 0;
  for (const { name, file } of REQUIRED) {
    if (await exists(join(FONT_DIR, file))) {
      console.log(`ok     ${name} (public/fonts/${file})`);
    } else {
      console.error(`MISSING ${name} -> public/fonts/${file}`);
      missing++;
    }
  }
  if (missing > 0) {
    console.error(
      `\n${missing} required Pyidaungsu woff2 file(s) missing. ` +
        `Place them in public/fonts/pyidaungsu/ (Pyidaungsu-Regular.woff2, Pyidaungsu-Bold.woff2).`,
    );
    process.exit(1);
  }

  if (WITH_DISPLAY) {
    let got = 0;
    let skipped = 0;
    let failed = 0;
    for (const { family, url, file } of DISPLAY) {
      const dest = join(FONT_DIR, file);
      if (!FORCE && (await exists(dest))) {
        console.log(`skip   ${family} (already present)`);
        skipped++;
        continue;
      }
      try {
        const buf = await download(url);
        if (!isValidFont(buf))
          throw new Error(`not a valid font (${buf.length} bytes)`);
        await writeFile(dest, buf);
        console.log(
          `ok     ${family} -> public/fonts/${file} (${(buf.length / 1024).toFixed(0)} KB)`,
        );
        got++;
      } catch (err) {
        console.error(`FAIL   ${family}: ${err.message}`);
        failed++;
      }
    }
    console.log(
      `\nDisplay fonts: ${got} downloaded, ${skipped} skipped, ${failed} failed.`,
    );
    if (failed > 0) process.exit(1);
  } else {
    console.log(
      "\nPyidaungsu ready. Run with --display to also fetch the display faces.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
