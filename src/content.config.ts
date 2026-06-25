import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Builders = students. One Markdown file per builder in src/content/builders/.
// Files starting with `_` (e.g. _example.md) are ignored by the [^_] pattern.
// Students add themselves via fork -> add builders/<github>.md -> PR.
const builders = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/builders" }),
  schema: z.object({
    name: z.string(),
    github: z.string(),
    cohort: z.number(),
    role: z.enum(["builder", "mentor", "instructor"]).default("builder"),
    skills: z.array(z.string()).optional(), // e.g. ["Python", "React", "MCP"]
    repo: z.string().url().optional(), // personal / project repo
    x: z.string().optional(), // X/Twitter handle or URL
    linkedin: z.string().optional(), // LinkedIn handle or URL
    website: z.string().url().optional(), // personal site
    certs: z.record(z.string()).optional(), // {claude_101: "https://verify.skilljar.com/c/…"}
    // team: z.string().optional(),     // DEFERRED — teams not formed yet
    // project: z.string().optional(),  // DEFERRED — no projects yet
  }),
});

export const collections = { builders };
