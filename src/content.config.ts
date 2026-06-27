import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import {
  cleanField,
  normalizeGithub,
  normalizeRole,
} from "./lib/builder-identity.mjs";
import { normalizeCerts } from "./lib/certs.mjs";

// Builders = students. One Markdown file per builder in src/content/builders/.
// Files starting with `_` (e.g. _example.md) are ignored by the [^_] pattern.
// Students add themselves via fork -> add builders/<github>.md -> PR.
//
// Policy (single source of truth in src/lib/builder-identity.mjs):
//   - name + github are REQUIRED and must be real (CI validator rejects
//     placeholders/invalid handles before merge).
//   - every other field is optional and TOLERANT: blank / placeholder / invalid
//     values are cleaned to `undefined` so the site always builds.

// Optional free-text (x / linkedin). Markdown links -> inner text.
const optText = z.preprocess((v) => {
  const t = cleanField(v);
  if (t == null) return undefined;
  const link = t.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
  return link ? link[1] || link[2] : t;
}, z.string().optional());

// Optional URL (repo / website). Drop anything that isn't a real http(s) URL.
const optUrl = z.preprocess((v) => {
  let t = cleanField(v);
  if (t == null) return undefined;
  const link = t.match(/^\[[^\]]*\]\(([^)]*)\)$/);
  if (link) t = link[1];
  return /^https?:\/\//.test(t) ? t : undefined;
}, z.string().url().optional());

// github: required. Normalize URL / @handle / link -> bare handle.
const githubHandle = z.preprocess((v) => {
  const h = normalizeGithub(typeof v === "string" ? v : "");
  return h || v; // empty -> let required check fail clearly
}, z.string().min(1));

// skills: accept array, or comma/semicolon string, else drop.
const optSkills = z.preprocess((v) => {
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  if (typeof v === "string") {
    const parts = v
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts : undefined;
  }
  return undefined;
}, z.array(z.string()).optional());

// role: tolerant — normalize case/whitespace, fall back to "builder" on unknown.
const role = z.preprocess(
  normalizeRole,
  z.enum(["builder", "mentor", "instructor"]),
);

const builders = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/builders" }),
  schema: z.object({
    name: z.preprocess(cleanField, z.string().min(1)),
    github: githubHandle,
    cohort: z.coerce.number(),
    role,
    skills: optSkills,
    repo: optUrl, // personal / project repo
    x: optText, // X/Twitter handle or URL
    linkedin: optText, // LinkedIn handle or URL
    website: optUrl, // personal site
    certs: z.preprocess(
      normalizeCerts,
      z.record(z.string(), z.string()).optional(),
    ), // Skilljar certs map
  }),
});

export const collections = { builders };
