// Generates src/i18n/my.json from en.json by wrapping translatable strings
// with a "[MY] " marker so translators can find + replace them.
// Run: node scripts/gen-my.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "src", "i18n");

const en = JSON.parse(readFileSync(join(root, "en.json"), "utf8"));

// Keys whose string values are NOT translatable text (URLs, emails, codes,
// language metadata, handles). Matched by exact key name anywhere in the tree.
const SKIP_KEYS = new Set([
  "lang",
  "langLabel",
  "altLangLabel",
  "githubUrl",
  "xUrl",
  "email",
  "applicantsEmail",
  "sponsorshipEmail",
  "privacyEmail",
  "cocEmail",
  "githubHandle",
  "xHandle",
  "githubLabel",
]);

// Values that look like a bare URL or email are never wrapped.
const isLiteral = (v) =>
  /^https?:\/\//.test(v) ||
  /@[\w.-]+\.\w+$/.test(v.trim()) ||
  /^@[\w-]+$/.test(v.trim());

function transform(node, key) {
  if (typeof node === "string") {
    if (SKIP_KEYS.has(key) || isLiteral(node)) return node;
    return "[MY] " + node;
  }
  if (Array.isArray(node)) return node.map((item) => transform(item, key));
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = transform(v, k);
    return out;
  }
  return node;
}

const my = transform(en, "");
my.meta = { lang: "my", langLabel: "မြန်မာ", altLangLabel: "EN" };

writeFileSync(join(root, "my.json"), JSON.stringify(my, null, 2) + "\n");
console.log("Wrote src/i18n/my.json");
